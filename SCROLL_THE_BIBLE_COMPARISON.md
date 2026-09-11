# Stackscroll × Scroll The Bible — product notes

Research date: September 8, 2026. Likely identification based on the user's description; other Bible scrolling apps exist. Desk research, not hands-on testing. Features below are publisher claims or explicitly identified user reports, not independently measured outcomes.

## Observed comparison

Source: [Scroll The Bible's App Store listing](https://apps.apple.com/us/app/scroll-the-bible/id6756558351).

| Published feature / reported issue | Stackscroll comparison | Design decision |
| --- | --- | --- |
| Full-screen vertical verse feed | Mixed media plus an optional focus layout | Keep one clear idea per card; preserve readable long explanations. |
| Tap for context, simpler explanations, original-language detail, related passages | Sources, explanations and guided stacks already exist | Make discovery-to-practice transitions more consistent. |
| Separate random Discover feed and ordered Bible reading | Discovery mix and ordered guided stacks | Keep exploration and purposeful sequences distinct. Video playlists extend the latter. |
| Basic and advanced study modes | Difficulty filters and topic preferences | A future “Explain simply / Go deeper” action should preserve the same concept and sources. |
| Reviews praise small chunks; another reports context loss and awkward text overflow | Technical snippets can also lose prerequisites and caveats | Treat reviews as anecdotal signals. Preserve source context and test enlarged text before a broader release. |

These descriptions do not establish learning gains, retention, or the app's internal recommendation algorithm. Ratings and promotional statements are not evidence of effectiveness.

## Stackscroll recommendations — our interpretation

1. Use a three-layer path: discover an idea → inspect its explanation/source → try a related task. Keep the first card light, with depth available immediately.
2. Playlists should have a name, visible order, direct controls, and a finish. A sequence about network troubleshooting should not silently drift into unrelated content.
3. Preserve quiz performance and later recall as distinct from consumption. Finishing a clip does not show understanding.
4. Future experiment: offer a related question at the end of a playlist. Compare voluntary return and later recall before claiming an improvement. No new analytics were added in this pass.
5. Keep the IT scope. Gaming is still a separate future decision.

## Implemented playlist scope

One customizable playlist per browser: add creator clips or original explainers, rename, reorder, remove, clear, and play in sequence. Up to 100 unique IDs; no arbitrary media URLs. Names and order persist locally; playback consent and position do not. Edits to order are disabled while playing; the running sequence is a snapshot. It stops at the end rather than looping or adding recommendations.

Starting a playlist is explicit consent for this continuous session. Every external item gets a fresh catalog check. Removed, changed, expired, or blocked items stop for a manual Next/Stop decision. Closing the panel aborts pending requests and destroys the player. Only one playlist item plays at a time; opening the panel unloads feed players.

The official [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) supplies ended events and reports browser autoplay blocks. Stackscroll uses those events to advance; native explainers use the HTML video ended event. Browser restrictions may require a tap. No clips are downloaded, edited, or rehosted; podcasts remain official outbound links.

Validation: TypeScript, production build, SSR and automated data checks. Live browser playback was not tested in this pass, so cross-browser autoplay and provider availability remain unverified. Source-backed content still needs independent editorial review.
