"""Build the explicitly selected launch edition from checked discovery candidates.

This is a release operation, separate from collection. It enforces the launch
count, deduplicates URLs, excludes non-content pages, and emits an audit manifest.
It does not assert independent factual review or permission to redistribute media.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from collect import safe_url

ROOT = Path(__file__).resolve().parents[2]
FORMAT_NAMES = {"resource": "guides and tools", "video": "video links", "story": "engineering articles", "podcast": "podcast episodes", "quiz": "scenario questions", "flashcard": "recall cards", "humor": "original humor"}
SOURCE_TAGS = {"python": ["Python", "standard library"], "rust": ["Rust", "systems programming"], "typescript": ["TypeScript"], "javascript": ["JavaScript", "web development"], "postgres": ["PostgreSQL", "SQL", "databases"], "docker": ["Docker", "containers"], "kubernetes": ["Kubernetes", "infrastructure"], "k8s-blog": ["Kubernetes", "engineering"], "git": ["Git", "version control"], "langgraph": ["LangGraph", "LangChain", "AI agents"], "sklearn": ["scikit-learn", "Python"], "pytorch": ["PyTorch", "deep learning"], "statquest": ["StatQuest", "Josh Starmer", "video"], "nvidia-dgx": ["NVIDIA", "DGX", "GPU infrastructure"], "nvidia-blog": ["NVIDIA", "GPU"], "sre-book": ["SRE", "reliability", "Google"], "sre-workbook": ["SRE", "operations", "Google"], "changelog": ["Changelog", "podcast"], "changelog-friends": ["Changelog", "developer culture", "podcast"], "security-now": ["TWiT", "Security Now", "cybersecurity", "podcast"]}

# Editorial connection prompts are questions, not claims about a source's results.
CONNECTIONS = [
 (r"\bagent|langgraph|langchain|autogen|smolagents", "AI agents", "Agentic AI", "Choose one task for an agent. What input, tool boundary, and observable finish would let you judge whether it did the job?"),
 (r"interrupt|human.in.the.loop|approval", "human review", "AI workflows", "Where should this workflow pause for an authorized decision, and what evidence should the reviewer see?"),
 (r"checkpoint|persistence|durable|replay", "state and recovery", "AI workflows", "If execution stops halfway through, what state must survive? Which external effects would be unsafe to repeat?"),
 (r"mcp|tool.call|structured.output", "tool interfaces", "Agentic AI", "What does this interface guarantee about a request, and what validation or authorization must your application still perform?"),
 (r"network|\bdns\b|ingress|gateway|ipv[46]|endpoint|routing|ip address|packet", "networking", "Networking", "Trace one request from a client to this component. Which address, route, name lookup, and policy decisions determine whether it arrives?"),
 (r"gpu|dgx|dcgm|redfish|openbmc|netbox|onie|saturation", "infrastructure operations", "Data centers", "Which hardware or service signal would you monitor here? What would distinguish busy infrastructure from useful application work?"),
 (r"secret|authenticat|credential|permission|rbac", "access control", None, "Name the identity, resource, and action involved. What access is necessary, and how would you verify that broader access is denied?"),
 (r"backup|restore|replicat|failover", "recovery", None, "What failure is this recovery mechanism meant to handle? How would you test restoration and data consistency in a disposable environment?"),
 (r"monitor|observ|logging|telemetry|tracing|alert", "observability", None, "What would tell you that a real user is affected? Choose one signal and explain what an alert on it would ask a responder to do."),
 (r"incident|postmortem|on.call|cascading", "incident response", None, "Separate the initial trigger from the conditions that made it worse. Which prevention or recovery change could you actually test?"),
 (r"canary|deploy|rollout|release", "delivery", None, "What is the smallest useful rollout? Define the signal for continuing and the condition for rolling back before making a production change."),
 (r"cross.valid|split|leakage|holdout", "evaluation design", "Machine learning", "Which observations must stay out of training? Check time, shared subjects, and preprocessing before trusting the evaluation score."),
 (r"precision|recall|confusion|metric|accuracy|roc|auc", "model evaluation", "Machine learning", "Which type of error is more costly in your use case? Work through a small set of predictions and compare what each metric reveals."),
 (r"transformer|attention|token|embedding|language model|llm", "language models", "Machine learning", "Follow one input through the model or representation. What changes at each step, and what assumption would you test with a tiny example?"),
 (r"regression|classif|decision.tree|random.forest|xgboost|naive.bayes|svm", "predictive models", "Machine learning", "Define the target, a simple baseline, and an untouched test split. What evidence would justify this model’s added complexity?"),
 (r"cluster|\bpca\b|decomposition|dimensional", "data structure", "Machine learning", "Try a small dataset with known structure. Which patterns does the method preserve, and which interpretations would need more evidence?"),
 (r"gradient|backprop|optim|autograd|neural|train", "model training", "Machine learning", "Identify the model parameters, the loss, and the update rule. How could a tiny experiment reveal whether an update moves in the intended direction?"),
 (r"sql|join|postgres|query|aggregate|window", "databases", None, "Build a tiny table with a normal case, a missing value, and a duplicate. Predict the result before running the query in a local database."),
 (r"\bgit\b|commit|branch|merge|rebase|stash|reflog", "version control", "Development", "Try this operation in a disposable repository. Inspect the working tree, index, and history before and after so you can explain what changed."),
 (r"ownership|borrow|lifetime|pointer|memory|\brc\b|refcell", "memory and ownership", None, "Draw which object owns or references each value. What change would make the compiler reject the program, or leave data unexpectedly shared?"),
 (r"async|concurr|thread|future|parallel|\bsync\b", "concurrency", None, "Identify the work that can overlap and the state it shares. What happens if one task is slow, fails, or is cancelled?"),
 (r"test|debug|bisect|assert", "verification", None, "Turn one claim into an observable check. Include an ordinary input and an edge case, then state what a passing result does and does not establish."),
 (r"file|path|directory|archive|compression", "files and data", None, "Use temporary files to try the operation. What happens with an empty input, a missing path, or a name containing spaces?"),
 (r"http|api|request|response|client|server", "service interfaces", None, "Sketch one request and response. Which timeout, error, and repeated-request cases should the caller and server handle explicitly?"),
 (r"container|docker|image|volume|pod|kubernetes", "containers", None, "Separate the application, its configuration, and its persistent data. What would survive if this container or Pod were replaced?"),
 (r"function|type|class|trait|enum|generic|closure|module", "programming concepts", None, "Write a tiny example of this language feature. Predict its result, then try a boundary case that challenges your initial understanding."),
]

def connection(item):
    text = item["title"] + " " + item["source"]
    base = SOURCE_TAGS.get(item["sourceId"], ["Hugging Face", "LLM course"] if item["sourceId"].startswith("hf-") else [item["sourceName"]])
    matches = [row for row in CONNECTIONS if re.search(row[0], text, re.I)]
    # An explicit editorial subject starts with the source's topic. Keyword tags
    # provide discovery connections without automatically relabeling every page.
    tags = list(dict.fromkeys(base + [row[1] for row in matches[:3]]))
    prompt = matches[0][3] if matches else "Choose one idea from this source that you could investigate in a small lab. Write down the expected behavior and the evidence that would change your mind."
    topic = item["topic"]
    if item["sourceId"] in ("kubernetes", "k8s-blog", "docker", "nvidia-blog") and matches:
        targeted = next((row for row in matches if row[2] in ("Networking", "Data centers", "Agentic AI", "AI workflows")), None)
        if targeted: topic = targeted[2]
    if item["sourceId"] == "langgraph" and re.search("interrupt|persistence|durable|streaming|structured", text, re.I): topic = "AI workflows"
    return topic, tags, prompt

def rejection(item):
    title, url = item["title"], item["source"]
    if not safe_url(url): return "unsafe source URL"
    if len(title.split()) > 25: return "headline exceeds preview quote budget"
    if re.search(r"^Part [IVX]+[. ]|^Preface$|^Foreword|^Conclusion$|^Bibliography$|^Colophon$|^How can we help\?$|automated traffic|^llms|^Manuals$|^Guides$|^Reference documentation$|^Educational resources$|^Learn$|^Intro$|^Summary$|^End.of.chapter quiz$|^Exam Time!|Bug Reporting Guidelines", title, re.I): return "navigation, recap, or non-specific discovery entry"
    if url.endswith(".txt") or "/bot-detection/" in url: return "index or automated-traffic page"
    if re.search(r"chapter0/|unit0/|/intro\.html$", url): return "course onboarding rather than a specific idea"
    if item["sourceId"] == "pytorch" and title.lower().startswith(("introduction", "learn the basics", "deep learning with pytorch: a 60", "distributed data parallel in pytorch - video")): return "course index rather than individual tutorial"
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", nargs="+", type=Path, required=True)
    parser.add_argument("--original-checks", type=Path, required=True)
    parser.add_argument("--cache", type=Path, required=True)
    args = parser.parse_args()
    originals = json.loads((ROOT / "data/catalog/originals.json").read_text())
    checks = {r["url"]: r for r in json.loads(args.original_checks.read_text())}
    records, evidence, rejected = [], [], []
    for card in originals:
        check = checks.get(card["source"])
        if not check or check.get("status") != 200 or "error" in check: raise ValueError("Unchecked original reference: " + card["id"])
        card = dict(card)
        meta = {"edition": "launch-1000", "delivery": "native", "format": "humor" if card["kind"] == "humor" else "practice", "checkedAt": check["checkedAt"], "review": "original-humor" if card["kind"] == "humor" else "original-review-pending", "rights": "original", "tags": [card["topic"], "memes", "tech humor"] if card["kind"] == "humor" else [card["topic"], "recall" if card["kind"] == "flashcard" else "scenario"]}
        if "prompt" in card: meta["prompt"] = card.pop("prompt")
        card["catalog"] = meta
        records.append(card)
        evidence.append({"id": card["id"], "source": card["source"], "checkedAt": check["checkedAt"], "evidence": "reference-page", "sha256": check["sha256"]})
    candidates, seen = [], set()
    for path in args.candidates:
        for item in json.loads(path.read_text())["items"]:
            reason = rejection(item)
            if item["source"] in seen: reason = "duplicate canonical URL"
            if reason:
                rejected.append({"url": item["source"], "reason": reason}); continue
            seen.add(item["source"])
            candidates.append(item)
    # Keep scarce formats. Distribute the remaining guide slots among sources,
    # rather than letting one long documentation index fill the release.
    chosen = [item for item in candidates if item["kind"] != "resource" or item["format"] == "repository"]
    pools = defaultdict(list)
    for item in candidates:
        if item not in chosen: pools[item["sourceId"]].append(item)
    for pool in pools.values(): pool.sort(key=lambda item: hashlib.sha256(item["source"].encode()).hexdigest())
    remaining = 1000 - len(records) - len(chosen)
    while remaining > 0 and any(pools.values()):
        for key in sorted(pools):
            if pools[key] and remaining > 0:
                chosen.append(pools[key].pop(0)); remaining -= 1
    if remaining: raise ValueError(f"Not enough eligible distinct content: short by {remaining}")
    for pool in pools.values():
        rejected.extend({"url": item["source"], "reason": "held for a later edition to balance the launch mix"} for item in pool)
    for item in chosen:
        topic, tags, prompt = connection(item)
        title = item["title"]
        # Add authored context to otherwise ambiguous labels; publisher words
        # remain bounded by the original headline+excerpt budget.
        if title in ("Introduction", "Overview", "Models", "Tools", "Test", "Getting Started", "Installation", "Memory overview"):
            title = f"{title} · {tags[0]}"
        level = item["level"]
        if item["sourceId"] == "rust" and re.search("unsafe|trait object|advanced|async|concurrency|lifetime", title, re.I): level = "Intermediate"
        excerpt = item.get("excerpt", "")
        if re.search(r"get your tickets|this fall|documentation index|\|\||on a journey to advance", excerpt, re.I): excerpt = ""
        identifier = "catalog-source-" + hashlib.sha256(item["source"].encode()).hexdigest()[:16]
        meta = {"edition": "launch-1000", "delivery": "source", "format": item["format"], "checkedAt": item["checkedAt"], "review": "publisher-linked", "rights": "link-only", "tags": tags, "prompt": prompt}
        if excerpt: meta["excerpt"] = excerpt
        record = {"id": identifier, "kind": item["kind"], "topic": topic, "level": level, "title": title, "source": item["source"], "sourceName": item["sourceName"], "catalog": meta}
        if item.get("date"): record["date"] = item["date"]
        if item.get("body"): record["body"] = item["body"]
        records.append(record)
        cached = args.cache / (hashlib.sha256(item["source"].encode()).hexdigest() + ".json")
        entry = {"id": identifier, "source": item["source"], "checkedAt": item["checkedAt"], "evidence": "creator-index-and-oembed" if item.get("listing") else "publisher-page", "discoveredVia": item.get("listing", item["sourceId"])}
        if cached.exists(): entry["sha256"] = hashlib.sha256(json.loads(cached.read_text()).get("body", "").encode()).hexdigest()
        evidence.append(entry)
    if len(records) != 1000 or len({r["id"] for r in records}) != 1000: raise ValueError("Release count or identity invariant failed")
    report = {"edition": "launch-1000", "count": len(records), "native": len(originals), "sourcePreviews": len(chosen), "byKind": dict(Counter(r["kind"] for r in records)), "byTopic": dict(Counter(r["topic"] for r in records)), "byPublisher": dict(Counter(r["sourceName"] for r in records)), "review": "Source identity, reachability, metadata, original answer consistency, and release structure checked. Independent factual review remains pending.", "mediaRights": "External works remain at the publisher. No third-party video, audio, image, or GIF files are redistributed.", "supply": "Manual candidate collection and explicit release. No scheduled auto-publication.", "excluded": rejected}
    destination = ROOT / "data/catalog"
    (destination / "launch-1000.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (destination / "source-checks.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n")
    (destination / "launch-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "app/catalog-records.ts").write_text('import type { Card } from "./content";\n// Selected launch edition. Source checks are not independent factual review.\nexport const catalogCards: Card[] = ' + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ';\n')
    print(json.dumps({key: report[key] for key in ("count", "native", "sourcePreviews", "byKind", "byTopic")}, indent=2))

if __name__ == "__main__": main()
