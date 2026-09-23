# Discovery and search update — September 23, 2026

Baseline checked: clean `codex/video-playback-v39` at `2fadb40f787c829373e547f2983f63878e35a4a9`, matching the private GitHub branch and saved/deployed Sites version 55. GitHub main is a separate older revision. No historical upload report was used as current provenance.

## Delivered

- 16 additional exact-work, rights-reviewed local images with original image-specific lessons: 27 reviewed visual cards total. Topics include accessibility, mobile hardware, authentication, networking, operations, storage, manufacturing and scientific imaging.
- Six original practical lessons and six knowledge checks across Cybersecurity, Data engineering, DevOps, Web & accessibility, Mobile development and Robotics & IoT. Base inventory: 1,113 cards, excluding visual/editorial/runtime media and live news.
- Keyword and phrase aliases, accents/punctuation normalization, plural handling, long-word single-edit typo tolerance, relevance ordering, and suggested searches. Titles rank above metadata and body mentions; all meaningful query concepts must match. Short acronyms and programming-language tokens remain distinct.
- Shared matching for guided stacks; shared relevance ranking for the repository browser while retaining repository-owner search. Search stays local to available inventory; no query is sent to a new service.
- Empty query preserves input order. Existing topic/format/level constraints, feed memory, save handling, image lazy loading and prewarming are preserved.
- Images use responsive cover crops or full-frame contain presentation where cropping would obscure the subject. Credits, source and license links remain visible; old publisher images/excerpts remain withheld.

## Validation

40 focused tests passed: search, 16 top-three retrieval cases, exact-work image safeguards, image decoding/uniqueness, attribution rendering, repository rendering, continuous prewarming, saved-prefix stability, rights, topic balance and engagement regression checks. TypeScript and production Vinext build passed. The standard wrapper requires GNU timeout (not installed here), so the established direct build fallback was used. Existing bundle-size warning remains.

Local HTTP checks: root and all 16 new WebP assets returned 200. Assets are at most 1,200px without enlargement; each is below 550KB. The 10,000-item feed stress check and 30-refresh no-immediate-repeat simulation passed. These are code/server checks, not a new browser interaction, tablet, network-throttle or user-satisfaction study. No claim that the entire historical test suite passed.

## Still needed for a defensible 9/10 production rating

This materially improves curated discovery but does not establish a measured 9/10 user experience. The library still contains many outbound resource cards, image additions are curated rather than automatically replenished, and search is keyword-based rather than open-web or semantic retrieval. Real desktop/tablet sessions, slow-network checks and a repeatable freshness/image-coverage audit remain useful before assigning that rating.

Per-image rights and transformations: `public/media/licensed/DISCOVERY-RIGHTS.json`. ShareAlike applies to the relevant image adaptations, not the private application code. NASA/EPA imagery is factual editorial use without endorsement. No NC/ND images or copied article bodies were added.
