# Stackscroll UI framework

A bright technical workspace for learning throughout an IT career. The learning card and its controls remain the primary activity.

## Foundations

- **Signal, default:** cool light background, white cards, electric blue actions, cyan structural accents. The existing `signal` preference now selects this updated appearance.
- **Midnight:** dark blue surfaces with ice blue controls. Uses the same layout and semantic roles.
- **Daylight:** softer neutral light surfaces and restrained cobalt accents.
- Color roles live at the top of `app/globals.css`. Components consume semantic variables; theme-specific values belong in the root theme blocks.
- Display typography uses the system Avenir Next / Segoe UI / Arial stack. Monospace is reserved for network addresses, counts, compact section labels, and code.
- Main learning copy is 1rem with generous line height. Regular controls are at least .875rem; secondary metadata is .75rem. Compact mode changes spacing without reducing text size.
- Surfaces use 5–10px corners, clear borders, and restrained hard shadows. Cyan edges distinguish the brand. Avoid ornamental gradients and fake status indicators.

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

Card topic roles are assigned through `data-topic`; career paths consume those same roles. Color supplements labels and icons, never replaces them.

## Components and interaction

- Preserve the installed Sidebar, Tabs, Sheet, Select, RadioGroup, Checkbox, Switch, Accordion, Progress, Empty, and Toaster primitives.
- Use `.primary-button`, `.secondary-button`, `.icon-button`, `.chip`, and the shared card classes for new matching controls.
- Source links remain accessible on every open learning card. Expanded reference details distinguish linked sources from completed independent claim review.
- Stream, Focus, and Index use the same learning card and saved state.
- A visible keyboard focus outline is required. Radio and checkbox choice cards expose focus on their containing label.
- Success and error states include explicit text or icons alongside color.
- Mobile navigation stays reachable above the safe area. The right rail yields space to learning content on narrower screens.
- Both the operating system reduced-motion preference and the in-app override stop transitions and interface animations.

## Implementation boundaries

This pass changes presentation, shared styling, and theme descriptions. It does not add creator clips, recommendations, accounts, age verification, or a completed content-review process. Preserve existing content provenance and learning state when extending the framework.

## Validation

The production build and existing learning/rendering checks are the implementation gates. Token contrast checks cover primary reading and interaction pairs in the default and dark palettes. These checks do not substitute for browser or assistive-technology testing, which has not been performed for this pass.
