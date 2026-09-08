# Stackscroll launch collection

Exactly **1,000 new entries**, in addition to the existing library, approved players,
original explainers, guided Stacks, and separate certification practice sets.

| Format | Entries | Delivery |
| --- | ---: | --- |
| Recall cards | 60 | Original, interactive, on device |
| Scenario questions | 20 | Original, interactive, on device |
| Tech humor | 40 | Original fictional text memes |
| Video discoveries | 50 | StatQuest creator links; no copied media |
| Podcast discoveries | 69 | Publisher episode pages; no copied audio |
| Engineering articles | 51 | Publisher pages |
| Guides, references, and repositories | 710 | Publisher/project pages |

120 in-app originals; 880 distinct outbound source previews. The catalog is not
1,000 independently fact-checked lessons or 1,000 licensed video clips. Titles
and short quotations introduce the external work; that work remains at its source.
Publisher headlines from the existing news endpoint refresh separately and are
not included in this launch count. Dates remain visible in source details.

`launch-1000.json` is the selected release. `app/catalog-records.ts` is its client
and server representation. `source-checks.json` records per-item check evidence;
`launch-report.json` records counts and exclusions. Original text lives in
`originals.json`. Stable IDs identify editions and saved cards.

Checks cover unique identities, distinct external URLs, safe HTTPS destinations,
reachable publisher pages (or creator-listed links confirmed by public oEmbed),
usable metadata, valid dates, original answer consistency, and source attribution.
Independent claim-by-claim factual review is **pending**. Reading, opening, or
watching never counts as quiz performance, later recall, or earned access.

Source pages were collected on September 8, 2026. A live page is not proof that
every claim is true, that every command fits the reader's version, or that media
can be redistributed. No publisher partnership is claimed. The original humor
uses fictional situations, with a separate link to the underlying technical idea.
It does not contain copied meme images, celebrity likenesses, or third-party GIFs.

## Adding the next supply

The collection commands only write **candidates**. They never edit or deploy the
shipped release. They require Python 3 and its standard library, with public
network access. Cache successful pages for at most a day and failures for 15
minutes; use a fresh cache for an immediate recheck. Downloads are size-bounded,
timed out, and restricted to safe same-host redirects. Changed hosts require
review of the source registry. Failures are recorded, not silently passed.

```sh
python scripts/catalog/collect.py --cache /tmp/stackscroll-source-cache --out /tmp/stackscroll-candidates.json
python scripts/catalog/collect.py --sources scripts/catalog/additional-sources.json --cache /tmp/stackscroll-source-cache --out /tmp/stackscroll-additional.json
python scripts/catalog/collect-special.py --cache /tmp/stackscroll-source-cache --out /tmp/stackscroll-special.json
python scripts/catalog/check-originals.py --cache /tmp/stackscroll-source-cache --out /tmp/stackscroll-reference-checks.json
```

Review source identity, topic, date/version, actual learning value, technical
claims, and permitted presentation before choosing new entries. The special
collector uses the creator's own index and verifies creator identity through
public oEmbed; it never fetches video files or installs third-party players.

For reproducing the launch format after reviewing candidate changes:

```sh
python scripts/catalog/release.py --candidates /tmp/stackscroll-candidates.json /tmp/stackscroll-additional.json /tmp/stackscroll-special.json --original-checks /tmp/stackscroll-reference-checks.json --cache /tmp/stackscroll-source-cache
```

This is an explicit **release operation**: it replaces the selected launch file
and regenerates the client catalog. Inspect its diff, run the catalog and Stack
checks, build, and publish through the existing private Sites workflow. Do not
schedule this release script. Keep IDs and records used by existing Stack editions
available when introducing later editions; the current script is a launch builder,
not an archival version manager.

For an ongoing service, the next work is a persistent candidate queue with
idempotent source updates, stale/deleted-source handling, review assignments,
corrections, and explicit publication. Background scheduling and automatic
publication are not enabled. The existing on-demand news feed remains separate.
Do not add Instagram scraping, The Rundown's full newsletter, exam dumps, or a
GIF API without resolving that source's identity, access, and reuse requirements.
