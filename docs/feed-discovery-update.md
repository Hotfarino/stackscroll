# Feed discovery and image pass — September 23, 2026

- Removed blanket reuse of three AI topic covers in stream previews, source cards, stories and lessons. A missing reviewed thumbnail remains a text card, not an unrelated photograph.
- Added individually reviewed technology photographs to the existing visual series. Visible exact-work attribution, license links and crop notices are shared between compact and full cards. See `public/media/licensed/TECHNOLOGY-RIGHTS.md`.
- Source diversity groups publisher aliases by hostname, while shared platforms retain creator identity. Repeated publishers accumulate a six-card penalty. Topic and format balance, explicit preferences, discovery slots and seen-card cooldowns remain.
- Visual-series cards receive a small ranking lift when there has not been one in the last four cards. This does not add extra format slots or override explicit “less” preferences.
- Saving/unsaving or disabling save-based personalization retunes only the unread queue, preserving the entire prefix through the last rendered card. No viewing-time engagement scoring was added.
- The next six cards are revealed ahead of the boundary through a non-urgent React update. At most three reviewed local images are warmed per batch; data-saving/2G connections skip preloading, and tab visibility is respected. Existing manual loading and end-of-mix controls remain.

Validation uses targeted ranking, permission, prefix-stability, loading-budget and component-render tests plus TypeScript and production compilation. No browser motion or visual-interaction test is implied.
