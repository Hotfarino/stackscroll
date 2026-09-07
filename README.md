# Stackscroll

A responsive learning feed for IT professionals. The initial content set covers networking, CompTIA concepts, CCNA concepts, cloud networking, software development, programming languages, machine learning, coding agents, and AI workflows.

## First version

- 31 original learning cards: short lessons, single-answer quizzes with explanations, and recall flashcards.
- Four curated career pathways with topic and difficulty filters.
- New and due flashcard review queue, with 10-minute, one-day, and longer review intervals based on recall ratings.
- Saved cards, quiz answers, daily activity, and learning preferences stored on the current device in localStorage. No cross-device sync or app-owned account database.
- GitHub Changelog and AWS What's New RSS headlines from a server endpoint. Requests are bounded and cached; a visibly dated two-article snapshot is used when feeds are unavailable.
- News is linked to publishers, not presented as an AI-verified reporting service. Lesson sources are linked. Quiz items are independent practice, not official exam material or a complete certification syllabus.

## Application

- `app/stackscroll.tsx`: feed, pathways, recall, bookmarks, and responsive navigation.
- `app/content.ts`: original content and pathways.
- `app/learning.ts`: state validation, local-day activity, recall scheduling, and scoring.
- `app/news.ts` and `app/api/news/route.ts`: source-restricted RSS parsing and retrieval.
- `app/globals.css`: theme and layouts.

Uses the bundled Vinext/React stack and installed Shadcn primitives. `.openai/hosting.json` identifies the private Site. Sites owns builds and publishing through its lifecycle helpers. Preserve its project ID on future edits.

## Validation

`node --test tests/learning.test.mjs` checks content consistency, review due dates, scoring, saved-state validation, and RSS source restrictions. The built Worker rendering check in `tests/rendered-html.test.mjs` verifies the application title and initial surface.

## Content maintenance

Add original cards with stable IDs and primary-source links. Recheck version-sensitive information against the relevant vendor. Use publication dates for news and keep fallback snapshots labeled. This version teaches AI development; it does not execute coding agents or run user code.
