# Stackscroll media expansion — September 8, 2026

## Experience

The main Feed now mixes formats instead of opening exclusively on guided stacks. Direct format tabs expose creator Clips, Quotes, AI videos, News, and Stacks. Explore retains the full content library; Saved resolves quote and original-video bookmarks through the current authored catalog. New bookmark types extend the existing explicitly device-local card collection and preserve old data. The account stack schema is unchanged.

The mixer rotates video, quote, original explainer, news, lesson, quiz, and flashcard. Explicit path, pin, and topic feedback ranks within each format; publication dates break video/news ties. This is deterministic curation, not a learned watch-time recommender. No viewing analytics, points, automatic playback, synthetic people, or cloned voices were added.

## Quotes

Exact short text, attribution, context, checked date, and links live in `app/media-content.ts`. Each quote is no more than 25 words.

- Tim Berners-Lee: [W3C Web anniversary message](https://www.w3.org/webat25/news/tbl-web25-welcome).
- Martin Fowler: [Refactoring book page](https://martinfowler.com/books/refactoring.html).
- Tim Peters: [PEP 20](https://peps.python.org/pep-0020/).
- Donald Knuth: [Stanford FAQ](https://cs.stanford.edu/~knuth/faq.html).

Wording verification is not a claim that an author's opinions are universal truths. Practical prompts are original Stackscroll copy.

## Creator uploads

Each added record was checked through official YouTube oEmbed for title/creator and public watch-page metadata for duration and publication timestamp. Exact metadata and original context summaries live in `app/video-catalog.ts`.

| Creator | Upload ID | Actual duration | Format |
| --- | --- | --- | --- |
| Dion Training | fEb_qBelUeo | 44s | OSI Short |
| Dion Training | XlHUZ2_LzEo | 35s | Router/switch Short |
| NetworkChuck | g-Ss2AEEP58 | 78s | Virtual machine Short |
| Fireship | Gjnup-PuquQ | 127s | Docker full video |
| David Bombal | h6qibCd6YQQ | 111s | CCNA readiness Short |
| Jeff Geerling | WYWKFeXrYe4 | 57s | Raspberry Pi 5 Short |
| Dion Training | 43Ypc-sFjDg | 43s | Network+ study Short |
| Fireship | PziYflu8cB8 | 126s | Kubernetes full video |

The official full uploads are embedded; no source files were downloaded, cropped, dubbed, or rehosted. Titles advertising '100 seconds' retain their actual total runtime. Original publication dates remain visible. Catalog availability fails closed when source records expire or moderation is unavailable. Existing fresh-before-play checks and server moderation remain intact. The source recheck date is October 8, 2026.

Metadata availability does not prove universal playback availability, rights to make derivative clips, creator endorsement, or factual correctness. Independent factual review is pending, and the UI says so. No browser playback QA or creator outreach was performed.

## Original AI-authored videos

- `dns-in-motion.mp4`: 28 seconds, simplified DNS lookup and troubleshooting clue.
- `agent-feedback-loop.mp4`: 32 seconds, bounded coding task, tool action, evidence, revision, finish and authorization boundary.

Both are original scripts and programmatic technical animations authored with AI, not footage from a generative-video model. They have no audio stream, presenter likeness, cloned voice, or copied source diagram. Delivery is H264/yuv420p, 720×900, 20 fps, faststart. Total MP4 payload is roughly 0.5 MB. Scripts reference Microsoft DNS troubleshooting/nslookup and Anthropic's agent engineering guidance. The DNS diagram explicitly simplifies local cache/Hosts handling and other protocol details; full scope notes accompany the transcript.

Assets live under `public/media`, including poster, WebVTT and scene JSON. The reproducible authoring script is `scripts/generate_explainers.py`; run it with an output directory argument. Regeneration requires Pillow, ffmpeg, ffprobe and DejaVu fonts. Keep QA intermediates outside deployed assets. Full video decoding and sampled-frame legibility were checked; app-browser playback was not tested.

Native players use `preload=none`, controls and no autoplay. Selecting another player stops the prior one. External YouTube permission does not transfer between videos or visits. Local originals use the Site host and do not contact YouTube. Privacy and content notices describe the distinction.

## News

Curated fallback posts were checked on primary publisher pages:

- [Amazon Linux 2027 public preview](https://aws.amazon.com/about-aws/whats-new/2026/09/announcing-amazon-linux-2027/), September 3.
- [Bedrock connector sync scheduling](https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-automatic-sync-scheduling-data-source-connectors/), September 4.
- [Cloudflare cache compression experiment](https://blog.cloudflare.com/cache-transcoding/), September 1.

The Linux release is a preview; Cloudflare's results are a limited experiment. Headlines are publisher reports, not independently verified news. Existing GitHub/AWS RSS refresh remains bounded, source-restricted and cached; the fallback stays dated.

## Verification

Type checking, production compilation, built-Worker rendering and retained progression/video safeguards are the gates. Added media checks cover actual local assets, VTT and transcript presence, no autoplay/external iframe in original players, format coverage, explicit preference ranking, quote lengths, backward-compatible bookmark validation, and current-catalog resolution of saved originals. Full editorial review and app-browser/usability testing remain outstanding.
