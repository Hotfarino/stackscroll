# Stackscroll UI framework

A minimalist technical workspace with a provisional Stackscroll identity. The primary Feed is a mixed-media collection. Guided stacks remain a focused learning mode alongside creator clips, quotes, original AI animations, and news.

## Foundations

- **Signal, default:** white and light gray surfaces with ink controls. This is a provisional neutral palette, not a final brand-color decision.
- **Midnight:** dark blue surfaces with ice blue controls. Uses the same layout and semantic roles.
- **Daylight:** softer neutral light surfaces and restrained cobalt accents.
- Color roles live at the top of `app/globals.css`. Components consume semantic variables; theme-specific values belong in the root theme blocks.
- Display typography uses the system Avenir Next / Segoe UI / Arial stack. Monospace is reserved for network addresses, counts, compact section labels, and code.
- Main learning copy is 1rem with generous line height. Regular controls are at least .875rem; secondary metadata is .75rem. Compact mode changes spacing without reducing text size.
- Surfaces use restrained corners and light borders. Avoid decorative hard shadows, oversized promotional panels, ornamental gradients and fake status indicators. The offset three-bar mark anchors the provisional identity.

## Semantic roles

| Role | Variables | Use |
| --- | --- | --- |
| Primary action | `--primary`, `--primary-foreground` | Main buttons, selected navigation, focus outlines |
| Reading surface | `--card`, `--foreground`, `--copy`, `--soft` | Cards, main text, explanations, metadata |
| Network | `--network`, `--network-bg`, `--network-edge` | Networking, cloud, CCNA, packet diagrams |
| Code | `--code`, `--code-bg`, `--code-edge` | Languages, software development, flashcard interactions |
| AI | `--ai`, `--ai-bg`, `--ai-edge` | Agentic AI, machine learning, workflows |
| Certification | `--cert`, `--cert-bg`, `--cert-edge` | CompTIA and IT foundations |
| Quiz | `--quiz`, `--quiz-bg`, `--quiz-edge` | Knowledge-check format metadata |
| Feedback | `--positive-*`, `--negative-*`, `--notice-*` | Answer outcomes and explanations |

Topic roles remain available through `data-topic` for technical diagrams and future extensions. Main card headers and career routes use quieter neutral styling. Color supplements labels and icons, never replaces them.

## Components and interaction

- Preserve the installed Sidebar, Tabs, Sheet, Select, RadioGroup, Checkbox, Switch, Accordion, Progress, Empty, and Toaster primitives.
- Use `StackButton` from `app/brand.tsx` for primary, secondary and quiet actions. It wraps the installed Button primitive. Reuse `.icon-button`, `.chip`, and the shared card classes for matching controls.
- Source links remain accessible on every open learning card. Expanded reference details distinguish linked sources from completed independent claim review.
- Stream, Focus, and Index use the same learning card and saved state.
- A visible keyboard focus outline is required. Radio and checkbox choice cards expose focus on their containing label.
- Success and error states include explicit text or icons alongside color.
- Mobile navigation stays reachable above the safe area. The right rail yields space to learning content on narrower screens.
- Both the operating system reduced-motion preference and the in-app override stop transitions and interface animations.

## Implementation boundaries

The current flow adds seven guided stacks, account-scoped progress, and explicit rule-based recommendation controls. It preserves the official click-to-load video integration and existing device-local card state. It does not add public uploads, age verification, or a completed independent content-review process. Preserve content provenance and learning state when extending the framework.

## Validation

The production build and existing learning/rendering checks are the implementation gates. Token contrast checks cover primary reading and interaction pairs in the default and dark palettes. These checks do not substitute for browser or assistive-technology testing, which has not been performed for this pass.

## Provisional identity

`app/brand.tsx` owns the wordmark, original stack mark and button wrapper. `--brand-font`, `--icon-stroke` and `--control-radius` separate brand choices from layout. The mobile header shows the full Stackscroll lockup without requiring the navigation drawer to be opened. Final font and color choices remain open.

See `UI_KIT_RESEARCH.md` for the repository comparison, license sources and reasons for retaining the installed UI foundation.

## Guided stacks

The Stacks tab has one reading surface, a five-step ruler, a source reference, and one primary progression action. Career paths and the card library sit under Explore. One Filters sheet holds topic, format, and level. Stream has explicit load-more; no automatic endless loading. Wrap-up offers a deliberate finish, optional next-day recall, and a related stack without auto-starting it. The right rail shows the current outline and separates read, attempted, and later-recall activity. Main stack copy uses 1–1.0625rem and controls retain 44px targets where composed here.

## Media formats

Mix / Clips / Quotes / AI videos / News / Stacks use the existing accessible Tabs primitive. Source quotes get a typographic blockquote, precise attribution, and a practical reflection. Creator clips retain official player branding, actual runtime, original publication date, and explicit click-to-load consent. No third-party thumbnail is fetched before consent. Local original animations have visible AI authorship, native controls, burned-in captions, a VTT track, transcript, and source links. They do not autoplay. Starting another player or changing the browsing context stops the active video. Posters and videos reuse the three-bar Stackscroll identity.
