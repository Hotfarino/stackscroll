# YouTube: first integration

The first batch uses the ten editorially selected IDs in `app/video-catalog.ts`.
It does not discover new uploads or automatically publish new channels. The
Rundown is a separate next source, with its own access and reuse rules.

## Runtime

- `/api/videos` reads moderation state, refreshes each approved video's public
  YouTube oEmbed metadata when its six-hour cache expires, and returns current
  titles, creator names, creator URLs and first-party thumbnail URLs.
- Source responses are validated and size bounded. HTML returned by oEmbed is
  discarded. The app constructs its existing privacy-enhanced player URL from
  the curated video ID; it never executes provider HTML.
- Metadata uses an in-memory cache plus the Workers edge cache when available.
  Refresh happens on the first request after expiry, not on a background timer.
  Concurrent requests in an isolate share the same pending lookup. Failed checks
  back off for one minute; expired data is not served as current.
- `/api/videos/thumbnail?id=...` accepts only IDs in the curated catalog. It checks
  moderation and source freshness, retrieves the unchanged thumbnail from the
  validated `i.ytimg.com` URL, and caches it at the edge for up to six hours.
  Thumbnail responses to the browser use `private, no-store` so takedowns are
  checked on subsequent requests. No account headers, cookies, IP forwarding
  headers or referrer are sent upstream. Remote redirects are rejected.
- The feed preserves the thumbnail's proportions and identifies YouTube and the
  creator. An unavailable image gets a clearly labeled fallback. Privacy blocking
  hides previews and prevents loading the external player.
- Playback remains click-to-load, with a fresh moderation check. Playlist order,
  the stop-at-end behavior, and learning/recall scoring remain independent.

## Editorial and operational limits

A successful oEmbed lookup establishes current public embed metadata, not a clip
license, universal playback availability, or factual correctness. Regional,
account, age and device restrictions can still prevent playback. Users retain an
original-source link. Source rechecks never advance factual-review status.
Descriptions, topic/level assignments, and existing duration/publication labels
are editorial catalog fields; oEmbed does not supply or refresh those fields.

To add a video, select its topic and source context, confirm its official YouTube
ID and source, and add it to the curated catalog. Keep factual review pending
until a separate review is recorded. Moderation can hide a video immediately.

This phase needs no YouTube Data API key and adds no paid ingestion service.
Normal hosting, request and bandwidth usage still apply. It uses no Google user
OAuth and retrieves no private YouTube account data.

For ongoing new-upload discovery, the next YouTube step is the official Data API:
approved channel upload playlists, private API credentials, bounded collection,
video status checks (including Made for Kids), and an editorial candidate queue.
That step is not enabled in this release.

References checked September 9, 2026:

- [YouTube embedding guidance](https://support.google.com/youtube/answer/171780)
- [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies)
- [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos)
