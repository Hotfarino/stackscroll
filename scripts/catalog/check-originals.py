"""Record reachability evidence for the original cards' reference pages."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
from collect import fetch

parser = argparse.ArgumentParser()
parser.add_argument("--cache", type=Path, required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
args.cache.mkdir(parents=True, exist_ok=True)
originals = json.loads((Path(__file__).resolve().parents[2] / "data/catalog/originals.json").read_text())
urls = sorted({card["source"] for card in originals})
checks = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    jobs = {pool.submit(fetch, url, args.cache): url for url in urls}
    for job in concurrent.futures.as_completed(jobs):
        result = job.result()
        entry = {"url": jobs[job], "resolvedUrl": result["url"], "status": result.get("status"), "checkedAt": result["checkedAt"]}
        if "body" in result: entry["sha256"] = hashlib.sha256(result["body"].encode()).hexdigest()
        if "error" in result: entry["error"] = result["error"]
        checks.append(entry)
args.out.parent.mkdir(parents=True, exist_ok=True)
args.out.write_text(json.dumps(sorted(checks, key=lambda item: item["url"]), indent=2) + "\n")
print(f"{sum(c.get('status') == 200 for c in checks)}/{len(checks)} references reachable. Factual review is separate.")
