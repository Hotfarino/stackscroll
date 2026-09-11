# Stackscroll topic artwork

Three original images generated with the built-in image generation tool on September 8, 2026 for the feed card redesign. They illustrate broad subjects, not factual technical diagrams, actual incidents, real creators, publisher thumbnails, or podcast cover art. The UI labels them **AI topic artwork**. Source content, permissions, and source-review status remain separate.

The 1536 × 1024 landscape originals were encoded to WebP at quality 84 with Sharp without changing their composition. The UI crops them using `object-fit: cover`. Images load from the site's own origin with explicit dimensions, lazy loading, and asynchronous decoding. No external image requests or publisher logos are used.

| File | Generation brief |
| --- | --- |
| infrastructure.webp | Slender graphite server blades and chassis, curved cyan/lime fiber cables, machined metal and optical glass, bright ice-blue studio, sculptural editorial product photography, centered wide-crop composition, no text or logos. |
| agentic-systems.webp | Thin exploded translucent circuit substrates above a precision processor, luminous signals connecting distinct tool modules, fine traces, cobalt/cyan/lime glass and metal, pale sky-blue studio, centered editorial 3D illustration, no text, logos, or UI. |
| tech-break.webp | Weary off-white maintenance robot with dark visor tangled in a comically long blue network cable, holding a plug, mature witty editorial illustration, cool-blue setting, clean silhouette, no captions, logos, or UI. |

`app/card-art.tsx` maps hardware and infrastructure topics to the first image, software and AI topics to the second, and original humor to the third. Layouts differ for featured stories, compact references, videos, podcasts, and humor. Decorative artwork uses empty alt text; the visible artwork label communicates its origin. Outbound image links have accessible source labels. Quotes use typography without invented portraits; existing educational diagrams and original video posters are preserved.

Hover motion respects both system reduced-motion preferences and the in-app setting. Card colors adapt to Signal, Daylight, and Midnight; compact density reduces artwork height. No consumption, quiz, ranking, playlist, or recall behavior changed.
