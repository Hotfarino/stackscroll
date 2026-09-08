# Stackscroll

A mixed-media learning feed for IT professionals. The initial content set covers networking, CompTIA concepts, CCNA concepts, cloud networking, software development, programming languages, machine learning, coding agents, and AI workflows.

## Mixed-media discovery

The default Feed mixes creator clips, sourced quotes, AI-authored animation videos, news, lessons, questions, and flashcards. Format tabs expose Mix, Clips, Quotes, AI videos, News, and Stacks. Guided learning remains available through Stacks and a compact unfinished-stack shortcut.

- Eight added official creator uploads: Dion Training, NetworkChuck, Fireship, David Bombal, and Jeff Geerling. Six are original YouTube Shorts; two are compact full videos. Two existing AWS/Google Cloud videos are retained. Runtimes and publication dates were checked against public YouTube metadata.
- Four short quotes checked against primary sources, with attribution, context, and original practical prompts.
- Two actual H264 MP4 explainers (DNS 28 seconds; agent feedback loop 32 seconds), authored with AI. Both are original silent animations, captioned on screen, with VTT and transcripts. They use local assets, native controls, and no autoplay.
- Three dated primary-publisher news picks, plus retained live GitHub/AWS RSS headlines. The source parser rejects future publication timestamps. Older clips keep their original dates.
- Explicit topic preferences rank within a rotation of formats. Recent dated video and news items break equal-score ties. Viewing does not train the feed or award learning credit.

See `MEDIA_CONTENT.md` for provenance and limits.

## Learning experience

- 31 original learning cards: short lessons, single-answer quizzes with explanations, and recall flashcards.
- Four curated career pathways with topic and difficulty filters.
- New and due flashcard review queue, with 10-minute, one-day, and longer review intervals based on recall ratings.
- Seven guided stacks use a situation → explanation → question → reasoning → recap sequence. D1 stores account-scoped positions, answers, recall schedules, bookmarks, and explicit recommendation feedback.
- Individual card-library bookmarks, quiz answers, and flashcard schedules retain their existing device-local storage.
- GitHub Changelog and AWS What's New RSS headlines from a server endpoint. Requests are bounded and cached; a visibly dated three-article snapshot is used when feeds are unavailable.
- News is linked to publishers, not presented as an AI-verified reporting service. Lesson sources are linked. Quiz items are independent practice, not official exam material or a complete certification syllabus.

## Customizable interface

- Stream shows a finite group of library cards with explicit load-more; Focus presents one card with previous/next controls; Index opens learning cards from a compact topic list.
- Signal (white/ink), Midnight (ink/ice), and Daylight (soft white/cobalt) themes cover the interface and settings dialog. Illustrations and code examples retain their semantic colors.
- Three text sizes, two spacing options, optional stack outline and separate read/attempted/recall counts, reduced motion, and expanded reference details.
- Pinned topics contribute to explainable stack recommendations without hiding other topics from Explore.
- Display preferences use `stackscroll-display-v1`, separately from learning progress. Reset display restores only display preferences. Storage failures keep changes available for the session.
- Reference links are always accessible on open cards. Expanded details distinguish a linked reference from completed independent claim review.

## Application files

- `app/stackscroll.tsx`: Feed, Explore, Practice, Saved, and responsive navigation.
- `app/stacks.ts`, `app/stack-session.tsx`, `app/use-stacks.ts`, and `app/api/stacks/route.ts`: guided content, progression, account persistence, and explicit recommendation controls.
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

## UI framework

Signal now opens with a minimalist white/ink interface and the provisional Stackscroll mark. Utility icons and buttons follow shared brand rules. Midnight remains the dark option; Daylight offers a quieter light palette. Saved theme IDs and learning data are retained.

See `UI_FRAMEWORK.md` for the shared visual rules and the tokens used by new components.

The top-left Stackscroll identity appears on desktop and mobile. `app/brand.tsx` centralizes its mark, wordmark, and shared Button wrapper. Free UI kit research and license sources are recorded in `UI_KIT_RESEARCH.md`; the installed shadcn/Radix and Lucide foundation is retained.

## Video privacy and permissions

The Videos feed now uses curated official embeds with explicit click-to-load controls, no viewing-history tracking or view-based rewards, separate permission and factual-review records, and device privacy controls. D1 stores general creator-video reports and moderator hide/restore state; existing individual card learning data remains device-local; guided-stack progress is account-scoped in D1. `/content-review` is restricted server-side to the private workspace owner. `/privacy` and `/terms` describe the actual current behavior.

See `VIDEO_SAFEGUARDS.md` for source evidence, the October 8, 2026 source recheck, moderation operation, and the remaining legal/creator steps before native clips or public uploads.

## Guided-stack implementation

See `UX_IMPLEMENTATION.md` for the new navigation, finite learning flow, persistence boundaries, content evidence, and verification scope.

## Stories, podcasts, and feed quality

The Feed now includes two source-backed historical incident stories and three official podcast episode links. Stories distinguish the original incident account from practical interpretation; podcasts play on the publisher's site. Stories and Podcasts tabs and bookmarks are available. Each feed card has an explanation and More/Less controls. Candidate validation, external-link deduplication, topic/publisher diversity and an explicit Update mix action strengthen the original ranking without adding watch tracking. See `CONTENT_AND_FEED.md` for sources, exact weights, permissions boundaries and validation. Gaming remains deferred.
