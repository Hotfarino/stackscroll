# Stack-driven continuous feed: execution baseline

Customer sign-in expansion, invitations and cohort rollout come last. Preserve current private access and the locked graphite/cyan UI.

## Implemented in this pass

- Discover selects the latest activated personal Stack by default; the user can choose another active Stack or All tech. Saved drafts do not affect ranking.
- Layer emphasis adds relevance weight; excluded IDs stay excluded. Existing format/publisher diversity and occasional outside-interest discovery remain. The UI names the driving Stack and Why this explains topic matches.
- New eligible source arrivals append to the active session without reordering existing cards. More cards reveal through the existing scroll sentinel. Provider checks run every two minutes while the page is visible; upstream cache windows still apply. Changing Stack or explicitly refreshing starts a new mix.
- Existing named playlists and frozen Stack editions remain finite. If no eligible unseen material remains, the UI tells the truth and offers explicitly labeled revisits rather than inventing new content.
- Temporary video request failure preserves the loaded inventory; playback still revalidates eligibility and moderation. Recent news can survive provider failure/cold starts through a shared edge cache, with stale status and unchanged publication dates. Edge cache is best effort, not a database or guaranteed durable queue.
- Thumbnails use configured YouTube API metadata first, then validated oEmbed fallback. Lookups coalesce and cache; explicit revoked/unavailable items fail closed. Metadata-failure backoff and automatic UI retry now align. A proxy failure can expose a current moderation-checked direct image URL only after server approval; browser-to-Google loading requires an explicit click.

## Next infrastructure work, before external rollout

1. Verify live thumbnail results from the actual application on the owner's devices. Current local upstream timeouts prevent claiming a production success rate. Track metadata/DB/image failures separately; preserve privacy blocking and takedowns.
2. Add scheduled server ingestion and a database-backed inventory with source cursors, versioned records, error/backoff state, last-good timestamps and a health view. The current active-session polling is not an always-running ingestion service.
3. Expand vetted sources for agentic coding, AI systems, data centers and networking. Increase reviewed, relevant content; avoid generating filler to simulate novelty.
4. Measure feed relevance, duplicate exposure, image success, response time and interruption behavior. Keep consumption separate from quiz performance and later recall. Do not add behavioral analytics silently.
5. Review pilot content and operational readiness; only then implement customer access and cohort rollout.

## Verification gates

- Activated Stack emphasis changes early rank; outside-interest exploration survives and IDs stay unique.
- Background arrivals do not reset the viewport or shuffle existing session IDs.
- Transient refresh failure retains recent content and reports its freshness accurately.
- Thumbnail API requests do not expose keys, follow redirects or bypass moderation; identical requests coalesce.
- Production delivery is a separate gate from passing mocked tests/builds.
