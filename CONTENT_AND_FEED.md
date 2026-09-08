# Content and feed baseline — September 8, 2026

Stackscroll remains an IT/tech discovery and career-learning product. Gaming sessions are deferred. The existing quizzes, flashcards, creator clips, quotes, original videos and guided stacks remain available.

## New editorial content

Two original short incident stories draw on primary organizational accounts:

- GitHub’s October 21, 2018 incident: https://github.blog/news-insights/company-news/oct21-post-incident-analysis/
- Cloudflare’s July 2, 2019 incident: https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/

Each card separates historical incident date, source-account summary, Stackscroll’s practical interpretation, and a reflection question. These are accounts from the affected organizations, not independently adjudicated histories. No invented dialogue, employee identities or firsthand claims are used. Full independent editorial review remains pending.

Three official podcast episode pages were checked for identity and subject:

- Heavy Networking 785, first steps into network automation (2025-06-13): https://packetpushers.net/podcasts/heavy-networking/hn785-how-to-take-your-first-steps-into-network-automation/
- Heavy Networking 809, EVPN (2026-01-09): https://packetpushers.net/podcasts/heavy-networking/hn809-evpn-all-the-things/
- Security Now 1094, AI patching (2026-09-01): https://twit.tv/shows/security-now/episodes/1094

Podcast cards use short original topic descriptions and listening prompts. They open the original publisher’s page. There is no podcast iframe, direct audio fetch, copied excerpt, transcript import or rehosted audio. No redistribution/editing/partnership permission is asserted. Embedding or hosting podcast audio is not enabled by this pass. Statements made in episodes remain unreviewed publisher/guest claims.

## Recommendation implementation

The current algorithm is explicit, deterministic curation. It is not an ML recommender and its weights have not been validated through engagement or learning-outcome studies.

1. Eligibility: known tech topic and format, nonempty ID/title, credential-free HTTPS reference, and a valid nonfuture date when supplied. Video availability and moderation still come from the existing fail-closed server catalog. An eligible link does not establish factual accuracy.
2. Deduplication: stable IDs and duplicate external content links; remove fragments and UTM tracking parameters for comparison. Different original questions can share a documentation source.
3. Topic ranking: career path +5, pinned topic +3, explicit more +8 / less −12. Difficulty preferences give a matching tier +5 and a nonmatching tier −5.
4. Diversity: among the previous three picks, each matching topic costs 4; a matching publisher costs 5. These are soft penalties so sparse topics remain usable.
5. Format rotation: video, quote, story, explainer, news, lesson, quiz, podcast, flashcard. Empty pools are skipped. Newer publication dates break score ties for news, videos and podcasts; age does not masquerade as factual reliability.
6. Explainability: each main-feed card includes Why this? and explicit More/Less controls using the existing account feedback endpoint. No watch duration, autoplay loop, listening behavior or demographic inference is used.
7. Stable reading: saved topic feedback waits for Update mix before reordering the card feed. Guided-stack suggestions update separately. Reset interests and account-data deletion also clear the applied in-memory choices.

One preference per topic is retained from the existing API; more/less and difficulty currently replace each other. Session progress, original answers and later recall remain separate from scrolling. The algorithm does not infer mastery, maximize watch time or claim learning gains.

## Storage and validation

No database migration is required. Story and podcast bookmarks extend the explicitly device-local card state. Saved editorial items resolve from the current catalog rather than trusting previously saved URLs/content. New types remain backward-compatible with existing saved records.

Automated checks cover eligibility, future dates, deduplication, relevance/difficulty effects, repetition penalties, bookmark resolution and outbound-only podcast rendering. Existing progression, source, video consent, moderation and rendering gates remain in place. Browser playback/usability testing and measured recommendation quality remain outstanding.

Next editorial work should add reviewed topic coverage and version-sensitive rechecks before volume. Do not silently replace sourced fact with AI summaries or call linked material independently verified.
