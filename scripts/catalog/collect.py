"""Collect source-linked discovery candidates. Never writes the shipped catalog.

Usage: python scripts/catalog/collect.py --cache /absolute/cache --out /absolute/candidates.json
The separate release file is an editorial decision, not a side effect of ingestion.
Only public publisher pages are fetched; no video/audio files or authenticated pages.
"""
import argparse
import concurrent.futures
import datetime as dt
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.request
from urllib.parse import urljoin, urlsplit, urlunsplit
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

ROOT = Path(__file__).resolve().parent
NOW = dt.datetime.now(dt.timezone.utc)
CHECKED = NOW.isoformat(timespec="seconds")

def clean(value):
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.links, self.paragraphs, self.headings = [], [], []
        self.title, self.description, self.canonical = "", "", ""
        self.capture, self.buffer, self.anchor, self.skip = None, [], None, 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript", "svg"):
            self.skip += 1
        if tag == "meta" and a.get("name", a.get("property")) in ("description", "og:description"):
            self.description = a.get("content", self.description)
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href", "")
        if tag == "a":
            self.anchor = [a.get("href", ""), []]
        if tag in ("p", "h1", "title") and not self.skip:
            self.capture, self.buffer = tag, []

    def handle_data(self, data):
        if not self.skip:
            if self.capture:
                self.buffer.append(data)
            if self.anchor is not None:
                self.anchor[1].append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg"):
            self.skip = max(0, self.skip - 1)
        if tag == "a" and self.anchor is not None:
            self.links.append((self.anchor[0], clean("".join(self.anchor[1]))))
            self.anchor = None
        if tag == self.capture:
            text = clean("".join(self.buffer))
            if tag == "p": self.paragraphs.append(text)
            elif tag == "h1": self.headings.append(text)
            else: self.title = text
            self.capture, self.buffer = None, []

def plain(value):
    page = Page("<p>" + (value or "") + "</p>")
    return clean(" ".join(page.paragraphs))

def safe_url(url, hosts=None):
    try:
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.port:
            return None
        if hosts and parsed.hostname not in hosts: return None
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
    except ValueError:
        return None

class RestrictedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not safe_url(newurl, {urlsplit(req.full_url).hostname}):
            raise ValueError("Cross-host or unsafe redirect requires source review")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url, cache):
    key = hashlib.sha256(url.encode()).hexdigest()
    file = cache / (key + ".json")
    if file.exists():
        cached = json.loads(file.read_text())
        age = (NOW - dt.datetime.fromisoformat(cached["checkedAt"])).total_seconds()
        if 0 <= age < (900 if "error" in cached else 86400): return cached
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StackscrollCatalog/1.0 (public source metadata)", "Accept": "text/html,application/xml,application/rss+xml"})
        with urllib.request.build_opener(RestrictedRedirect).open(req, timeout=14) as response:
            body = response.read(4_000_001)
            if len(body) > 4_000_000: raise ValueError("Response exceeds metadata limit")
            result = {"url": response.url, "status": response.status, "checkedAt": CHECKED, "body": body.decode("utf-8", "replace")}
    except Exception as error:
        result = {"url": url, "error": str(error), "checkedAt": CHECKED}
    file.write_text(json.dumps(result))
    return result

def from_index(source, result):
    if "error" in result: return []
    page = Page(result["body"])
    found, seen = [], set()
    forbidden = re.compile(r"(?:/|^)(?:index|genindex|search|release|changelog|license|copyright|about|contribut|what.?snew|versions?|community|download|print|foreword|appendix|appendices|acknowledg|glossary|faq)", re.I)
    for href, title in page.links:
        url = safe_url(urljoin(result["url"], href))
        if not url or not url.startswith(source["prefix"]) or url == source["url"] or url in seen:
            continue
        relative = url.removeprefix(source["prefix"])
        if forbidden.search(relative) or not title or len(title) < 4 or len(title) > 200 or url.endswith((".pdf", ".png", ".svg")):
            continue
        if source["id"] == "sklearn" and not relative.startswith(("modules/", "computing/", "model_persistence", "common_pitfalls", "metadata_routing", "dispatching", "data_transforms", "datasets/")):
            continue
        seen.add(url)
        found.append({"sourceId": source["id"], "source": url, "title": title})
    return found[:source["cap"]]

def from_feed(source, result):
    if "error" in result: return []
    try: root = ET.fromstring(result["body"])
    except ET.ParseError: return []
    found, seen = [], set()
    hosts = {urlsplit(source["url"]).hostname, *(source.get("hosts", []))}
    atom = "{http://www.w3.org/2005/Atom}"
    for item in [*root.findall(".//item"), *root.findall(atom + "entry")]:
        is_atom = item.tag.startswith(atom)
        title = clean(item.findtext(atom + "title" if is_atom else "title"))
        link = next((link.get("href") for link in item.findall(atom + "link") if link.get("rel", "alternate") == "alternate"), "") if is_atom else item.findtext("link")
        url = safe_url(clean(link), hosts)
        if not title or not url or url in seen: continue
        raw_date = item.findtext(atom + "published") or item.findtext(atom + "updated") if is_atom else item.findtext("pubDate")
        try:
            date = (dt.datetime.fromisoformat(raw_date.replace("Z", "+00:00")) if is_atom else parsedate_to_datetime(raw_date)).astimezone(dt.timezone.utc)
            if date > NOW: continue
        except (ValueError, TypeError, AttributeError): continue
        seen.add(url)
        found.append({"sourceId": source["id"], "source": url, "title": title, "date": date.isoformat(), "feedDescription": plain(item.findtext(atom + "summary" if is_atom else "description"))})
    return found[:source["cap"]]

def validate(candidate, sources, cache):
    source = sources[candidate["sourceId"]]
    result = fetch(candidate["source"], cache)
    if "error" in result: return {**candidate, "error": result["error"]}
    page = Page(result["body"])
    title = candidate["title"] if source.get("feed") else (next(iter(reversed(page.headings)), "") or page.title or candidate["title"])
    if source["id"] == "rust": title = page.title.removesuffix(" - The Rust Programming Language")
    if source["id"] == "postgres": title = re.sub(r"^PostgreSQL: Documentation: [\d.]+: (?:Chapter \d+\. )?", "", page.title)
    if source["id"] == "git": title = re.sub(r"^Git - | Documentation$", "", page.title)
    title = re.sub(r"[¶#]$", "", clean(title)).strip()
    title = re.sub(r"^\d+(?:\.\d+)*[.\s]+", "", title)
    if not title or re.search(r"^(?:Page not found|404|Access denied|Just a moment|Sign in)", title, re.I):
        return {**candidate, "error": "Non-content page"}
    # A short quoted preview. Title + preview together never exceed 25 words per page.
    description = candidate.get("feedDescription") or page.description
    if source["id"].startswith("hf-") or source["id"] in ("postgres", "pytorch"): description = ""
    unwanted = r"cookie|copyright|license|table of contents|navigation|javascript (?:enabled|disabled)|please enable|get your tickets|created on:|last updated:|last verified:|press .+ to |documentation index|exploring further|augmented documentation|learn the basics \|"
    if not description or len(description.split()) < 8:
        description = next((p for p in page.paragraphs if len(p.split()) >= 14 and not re.search(unwanted, p, re.I)), "")
    if re.search(unwanted, description, re.I): description = ""
    description = plain(description)
    budget = max(0, 25 - len(title.split()))
    excerpt = " ".join(description.split()[:budget])
    if excerpt and len(description.split()) > budget: excerpt += "…"
    return {"sourceId": source["id"], "source": result["url"], "sourceName": source["publisher"], "title": title, "topic": source["topic"], "kind": source["kind"], "format": source["format"], "level": source["level"], "checkedAt": result["checkedAt"], "excerpt": excerpt, **({"date": candidate["date"]} if candidate.get("date") else {})}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--sources", type=Path, default=ROOT / "sources.json")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    sources = json.loads(args.sources.read_text())
    by_id = {source["id"]: source for source in sources}
    candidates, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        jobs = {pool.submit(fetch, source["url"], args.cache): source for source in sources}
        for job in concurrent.futures.as_completed(jobs):
            source, result = jobs[job], job.result()
            entries = (from_feed if source.get("feed") else from_index)(source, result)
            print(f"{source['id']}: {len(entries)} candidates" + (" · " + result["error"] if "error" in result else ""), flush=True)
            candidates.extend(entries)
            if "error" in result: failures.append({"sourceId": source["id"], "error": result["error"]})
        unique = {item["source"]: item for item in candidates}
        accepted = []
        jobs = [pool.submit(validate, candidate, by_id, args.cache) for candidate in unique.values()]
        for index, job in enumerate(concurrent.futures.as_completed(jobs), 1):
            entry = job.result()
            (failures if "error" in entry else accepted).append(entry)
            if index % 100 == 0: print(f"Checked {index}/{len(jobs)} pages · {len(accepted)} reachable", flush=True)
    accepted.sort(key=lambda item: (item["sourceId"], item["source"]))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps({"collectedAt": CHECKED, "state": "candidate-review", "items": accepted, "failures": failures}, ensure_ascii=False, indent=2) + "\n")
    print(f"Saved {len(accepted)} candidates and {len(failures)} failures to {args.out}. No release changed.", flush=True)

if __name__ == "__main__": main()
