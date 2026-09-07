# Stackscroll

A responsive learning feed for IT professionals. The initial content set covers networking, CompTIA concepts, CCNA concepts, cloud networking, software development, programming languages, machine learning, coding agents, and AI workflows.

## First version

- 31 original learning cards: short lessons, single-answer quizzes with explanations, and recall flashcards.
- Four curated career pathways with topic and difficulty filters.
- New and due flashcard review queue, with 10-minute, one-day, and longer review intervals based on recall ratings.
- Saved cards, quiz answers, daily activity, and learning preferences stored on the current device in localStorage. No cross-device sync or app-owned account database.
- GitHub Changelog and AWS What's New RSS headlines from a server endpoint. Requests are bounded and cached; a visibly dated two-article snapshot is used when feeds are unavailable.
- News is linked to publishers, not presented as an AI-verified reporting service. Lesson sources are linked. Quiz items are independent practice, not official exam material or a complete certification syllabus.

## Customizable interface

- Stream preserves the continuous feed; Focus presents one card with previous/next controls; Index opens learning cards from a compact topic list.
- Signal (charcoal/lime), Midnight (ink/ice), and Daylight (white/cobalt) themes cover the interface and settings dialog. Illustrations and code examples retain their semantic colors.
- Three text sizes, two spacing options, optional learning sidebar and daily activity, reduced motion, and expanded reference details.
- Pinned topics appear first in navigation and filters without hiding other topics.
- Display preferences use `stackscroll-display-v1`, separately from learning progress. Reset display restores only display preferences. Storage failures keep changes available for the session.
- Reference links are always accessible on open cards. Expanded details distinguish a linked reference from completed independent claim review.

## Application files

- `app/stackscroll.tsx`: feed, pathways, recall, bookmarks, and responsive navigation.
- `app/content.ts`: original content and pathways.
- `app/learning.ts`: state validation, local-day activity, recall scheduling, and scoring.
- `app/preferences.ts` and `app/customizer.tsx`: validated display settings, persistence, and customization controls.
- `app/news.ts` and `app/api/news/route.ts`: source-restricted RSS parsing and retrieval.
- `app/globals.css`: theme and layouts.

Uses the bundled Vinext/React stack and installed Shadcn primitives. `.openai/hosting.json` identifies the private Site. Sites owns builds and publishing through its lifecycle helpers. Preserve its project ID on future edits.

## Validation

`node --test tests/learning.test.mjs` checks content consistency, review due dates, scoring, saved-state validation, RSS source restrictions, preference recovery, and pinned topic coverage. The built Worker rendering check in `tests/rendered-html.test.mjs` verifies the application title and initial surface.

## Content maintenance

Add original cards with stable IDs and primary-source links. Recheck version-sensitive information against the relevant vendor. Use publication dates for news and keep fallback snapshots labeled. This version teaches AI development; it does not execute coding agents or run user code.

## Humor, philosophy, and IT facts

`app/culture.ts` contains nine starter cards: three original IT jokes, three philosophy anecdotes combining wit with practical wisdom, and three sourced IT facts. `app/content.ts` mixes one culture card after every three study cards. Dedicated format filters, bookmarking, completion, and Stream/Focus/Index layouts support all three types. The 31 study cards and certification pathway totals remain unchanged.

Keep joke authorship explicit. For philosopher anecdotes, name the ancient text, distinguish literary accounts from verified history, and label modern IT analogies as our interpretation. Facts and anecdotes include a source review date. All new cards include a visible context note and a source link; humor references explain the technical background and are not attributed as authors of the joke. Existing local learning and display data retain their storage keys.

For each new entry, use a stable ID and one of `humor`, `anecdote`, or `fact`; supply the topic, title, body, takeaway, source, source name, and context note. Include `reviewedAt` for facts and anecdotes. Add content to the existing collection; do not modify IDs already used in saved progress.

## Infrastructure and updates

See [the infrastructure inventory](docs/infrastructure.md) for the current runtime, persistence, release workflow, and next steps. GitHub stores source history; pushing there does not publish the Site.
