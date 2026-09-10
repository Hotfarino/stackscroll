# Stackscroll UI bible

The user-supplied reference in `docs/design/stackscroll-ui-bible.jpeg` is the visual authority for Stackscroll. Preserve this direction when adding screens; extend the existing tokens and components instead of introducing another visual system.

## Identity and color

Use the outlined interlocking stack mark, the STACKSCROLL wordmark and the small “TECH FEED. NO NOISE.” tagline. The native mark lives in `app/brand.tsx`, with matching exports in `public/brand/stackscroll-mark.svg` and `public/favicon.svg`. Keep these versions synchronized. The mark is a code-native interpretation of the reference; the supplied image remains the visual authority.

| Role | Signal color |
| --- | --- |
| Graphite / canvas | #0B0D10 |
| Charcoal / cards | #111418 |
| Panel | #1A1F24 |
| Raised surface | #252B31 |
| Main text | #E8EAED |
| Cyan interaction accent | #00D9FF |
| Lime positive accent | #C6FF3A |
| Alert red | #FF535C |

Graphite dominates. Cyan identifies links, focus and selection. Lime is a small positive signal; red indicates errors. Keep secondary copy legible with the neutral copy tokens. Carbon and Daylight remain optional display preferences within the same geometry and typography; Signal is the default dark appearance. Never rename storage keys merely to rename a visible theme.

## Type and material

Inter is self-hosted at `public/fonts/InterVariable.woff2`; its OFL license is adjacent. Use 600 for primary headings, 500 for labels and 400 for body text. Tracked uppercase belongs in compact metadata and navigation, not paragraphs. Main reading text stays at least 16px. Small secondary labels must never carry the only actionable meaning.

Use nearly solid reading surfaces and subtle glass on navigation. Small corner radii, a quiet upper bevel and occasional cut-corner accents are appropriate. Avoid large cutouts on every card, heavy raised slabs, excessive bloom, spinning decorative elements and a different neon color for every topic. Native SVG line icons use light bevel-like reflections, without boxed plates around every glyph.

Controls have at least 44px targets. Hover and pressed changes last roughly 180ms. Preserve visible keyboard focus, reduced motion, reduced transparency and forced-color support. Never animate the whole scrolling feed or load media just for an effect.

## Layout and behavior

Mobile is the primary experience: one column, compact brand and controls, accessible search immediately below them, and fixed bottom navigation. Account for the bottom safe area. Keep all five working destinations: Feed, Radar, Stacks, Lab, Saved. Sidebar navigation may show descriptive subtitles on desktop. Do not invent a Profile page to reproduce the reference.

The featured banner is desktop-only so it does not push the first feed card below the mobile viewport.

Desktop uses a restrained left sidebar, inset header search, an image-led featured source and a feed with a complementary right rail. Stream-layout source previews can use text with a right thumbnail. Native quizzes, explanations, flashcards, video controls and source details retain the room their interactions require. Focus and Index remain usable display choices.

The Tech radar is a topic selector, not a measure of popularity. Its positions are navigation geometry. Topic buttons use the existing feed filter and explicit selected state. The feature banner links to a real source and labels conceptual AI artwork; it must not imply that artwork is a publisher thumbnail.

## Content and trust

The reference's likes, comments, trending ranks, notification dots and live/official badges are illustrative. Display them only when backed by implemented, truthful state. Do not fabricate activity to fill the design. Source health describes fetch availability, not correctness. Keep source links, dates, original/AI labels and review status visible or immediately accessible.

Preserve feed mixing, refresh and pull-to-refresh, playlists, stack customization, saved items and Lab practice. Studying, answering a question and recalling it later remain distinct from watching or scrolling. Original CompTIA practice is independent practice, never a claim to reproduce real exam questions.

## Implementation

Semantic tokens are in `app/globals.css`. Shared material foundations are in `app/glass-interface.css`; the final bible-specific rules are in `app/signal-interface.css`. The last file deliberately uses scoped selectors to override older component styles. Avoid adding competing hardcoded light backgrounds to components. Use `StackButton`, `StackMark` and the existing accessible controls.

Inter source: https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.woff2
License source: https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt
