# YouTube discovery experiment — connection pending

The importer is implemented but has not been verified against the live Data API:
`YOUTUBE_API_KEY` is absent from the production runtime. Do not label discovery
live or the continuous source experiment complete until an authenticated real
request imports eligible uploads and the user can see their images.

## Activate

1. In the owner's Google Cloud project, enable **YouTube Data API v3**.
2. Create an API key restricted to **YouTube Data API v3**. This is a server-side
   integration; a key restricted to browser HTTP referrers will not work here.
3. Store it in the Site's production environment as secret `YOUTUBE_API_KEY`,
   then deploy the saved version to apply the environment revision. Do not put
   the key in the browser, a URL, source control, or an ordinary chat message.
4. Refresh the feed. Confirm a successful Data API status and real current uploads.
   Verify thumbnails and playback separately. An API error is never proof of a
   successful refresh.

## What runs once connected

- Resolve the approved handles DionTraining, Fireship and statquest using
  `channels.list`, then read up to twelve recent uploads per channel using
  `playlistItems.list`. Include the original ten selected videos in the status check.
- Deduplicate video IDs and call `videos.list` for current title, creator, image,
  publication date, duration and playback status. Use only public, embeddable,
  non-live videos explicitly marked not Made for Kids; omit region-restricted
  and age-restricted records in this first experiment.
- Each channel's topics and levels are Stackscroll labels. Source discovery is
  automatic, but independent factual review stays pending. No claims of creator
  partnership, clip licensing or exam-provider endorsement are made.
- Responses are cached for fifteen minutes. Manual refresh requests an upstream
  recheck after a one-minute minimum interval. Requests within the guard reuse
  existing results; refresh does not guarantee a creator has uploaded anything new.
- Checks run while the app is used, not on a scheduled background worker. This is
  a rolling recent-upload window, not an indefinitely archived video catalog.
  Scroll reveals more currently available cards; only source ingestion supplies
  newly published content. Refresh messages distinguish those operations.
- The browser reports how many video identifiers are new to its current feed.
  Playback history and watch time are not used. Stacks, practice, bookmarks and
  playlist order retain their existing behavior.

## Images and failures

The first-party thumbnail endpoint accepts only current curated/discovered records,
checks moderation, validates the provider image host and path, and never forwards
user headers upstream. Images keep their aspect ratio. A failed proxy request offers
an explicit direct-image choice, which discloses the connection to Google first.
External-video blocking disables both preview paths. Image permission is session-only.
The official player still requires a separate click or a started playlist session.

When no API key is configured, the original ten-video oEmbed path can still supply
available starter records. It cannot discover uploads. Empty failed source checks now
return HTTP 503 plus explicit setup/failure status, rather than a misleading successful
empty catalog. Server diagnostics log the curated ID and upstream HTTP status, never
credentials, request headers or user data.

Tests cover new-upload discovery with simulated API responses, refresh caching,
credential absence and API errors, playback exclusions, source/thumbnail validation,
moderation, and privacy. These are behavioral tests, not evidence that live credentials
or image delivery have been verified.

References checked September 9, 2026:
- [Getting started](https://developers.google.com/youtube/v3/getting-started)
- [Channels](https://developers.google.com/youtube/v3/docs/channels/list)
- [Upload playlists](https://developers.google.com/youtube/v3/docs/playlistItems/list)
- [Videos](https://developers.google.com/youtube/v3/docs/videos)
- [Developer policies](https://developers.google.com/youtube/terms/developer-policies)
