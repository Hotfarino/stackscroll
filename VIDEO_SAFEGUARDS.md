# Stackscroll video safeguards

Implemented September 8, 2026. These are product controls for the private workspace, not a legal-compliance certification.

## Current sharing model

Only curated official YouTube embeds are supported. There is no upload endpoint, copied clip, native hosted video, licensing claim, or creator partnership. The videos endpoint rejects POST requests. The server catalog is the authority; browser-saved video metadata never authorizes playback.

The initial videos are AWS's “What is Cloud Computing? | Amazon Web Services” (`mxT233EdY5c`) and Google Cloud Tech's “What is Kubernetes?” (`cC46cg5FFAM`). On September 8, 2026, public YouTube oEmbed responses returned HTTP 200, matching creator/title metadata and iframe markup for both. Actual playback, geography-specific availability, and full factual accuracy were not independently verified. These limitations are separate from permission to use an official embed.

Records in `app/video-catalog.ts` contain source URL, publisher context, embed evidence, checked date, next review date, expiry slot, rights restrictions, and a separate factual-review record. No record grants downloading, editing, or charging for embedded access. Recheck sources by October 8, 2026: overdue, malformed, pending, revoked, or expired records fail closed. Do not extend a date without checking the source. No automatic re-verification is claimed.

## Playback and viewer privacy

- No third-party player, thumbnail, preconnect, player API script, or tracking SDK is loaded before the explicit “Load YouTube player” action.
- The player uses `youtube-nocookie.com`, no autoplay, normal controls/branding, and `strict-origin-when-cross-origin` referrer policy. The referrer must not be eliminated because YouTube requires embed client identification.
- Explain Google data sharing before loading. This choice is per player and is not persisted as blanket consent.
- Only one player can be active. Leaving the feed, changing its filters/layout, unloading the player, or blocking embedded video revokes the active player. Player removal cannot undo past disclosures or delete Google's data.
- No watch history, view-based learning credit, watch-duration analytics, or view-to-advertiser events are collected. Independent original learning cards retain their existing device-local progress features.
- Privacy controls clear learning history, video bookmarks, and chosen interests. Deletion failure is shown honestly.
- Saved video bookmarks resolve through the current server catalog. The server rechecks moderation before every load; feeds refresh availability every 30 seconds and on window focus. Storage failure disables video availability instead of bypassing a takedown.

## Reporting and moderation

D1 `DB` stores reports and video moderation state. New schema is in `drizzle/0000_hesitant_xorn.sql`. Reports record the authenticated site-specific user identifier, video identifier, category, description, timestamps and status; they do not collect email/IP/viewing history. Reports remain until the moderator deletes them. Describe this accurately in `/privacy`.

Reports require platform-authenticated identity, same-origin JSON requests, known video IDs, bounded descriptions and payloads, and an atomic maximum of 10 reports per user per hour. Account identity is supplied by the trusted Sites dispatcher; do not expose the Worker through a second path that trusts arbitrary caller-supplied identity headers.

`/content-review` and `/api/moderation` provide the owner-only queue. The server-only email allowlist in `app/video-server.ts` matches the existing private workspace owner. Change it explicitly when editorial ownership changes. Users cannot gain moderator access from a client setting. The queue can hide/restore videos, resolve reports, and permanently delete report data. Restoring cannot override expired/revoked source permission. Hiding blocks new playback checks immediately; existing feeds normally unload the player at their next 30-second refresh. Existing third-party sessions cannot be retroactively erased.

A privacy-request form remains reachable at `/privacy` even when every video is unavailable. Moderators can compare account references before fulfilling requests involving an earlier report. The general reporting form is not a formal DMCA notice or counter-notice workflow. It must not be advertised as one.

## Before native clips or public uploads

Do not enable native files until a reviewed agreement covers the actual rights holder, source files, excerpts, cropping/captions, commercial use, attribution, platforms, territory, duration/expiry, payment, removal, and third-party material. Obtain appropriate presenter/privacy releases for the intended use. Keep private agreements out of browser bundles. Creator identity is not proof of rights in every included asset or factual correctness.

Before public uploads: complete the actual designated-agent registration and public contact information, notice/counter-notice operation, repeat-infringer policy, appeals process, and legal review of eligibility. No registration or safe-harbor status has been asserted or performed. Review privacy/consent across launch markets, VPPA applicability and any new analytics, presenter rights, age policy, and agreements with qualified counsel. An educational label, attribution, or a short duration is not automatic reuse permission.

## Primary policy references

- https://www.youtube.com/t/terms
- https://developers.google.com/youtube/terms/developer-policies
- https://support.google.com/youtube/answer/171780
- https://policies.google.com/technologies/partner-sites
- https://www.copyright.gov/help/faq/faq-fairuse.html
- https://www.copyright.gov/512/
- https://www.govinfo.gov/link/uscode/18/2710

## Verification

`tests/video-safeguards.test.mjs` runs permission and saved-record gates plus API handlers against the real generated SQL schema in SQLite, exercising authentication, authorization, CSRF, payload limits, rate limiting, persistence, hide/restore/resolve/delete and storage failures. The video component rendering test checks pre-consent markup, the official privacy-enhanced iframe, and blocked/revoked playback. Browser interaction and actual YouTube playback have not been tested in this pass.
