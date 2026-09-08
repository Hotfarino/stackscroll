# Stackscroll: free UI kit and icon research

Reviewed September 8, 2026. Scope: a minimalist, recognizable interface for a React learning app. The name, typography, and final palette remain provisional.

## Shortlist

| Project | License in the reviewed repository | Best use for Stackscroll | Decision |
| --- | --- | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | [MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) | Source-owned buttons, sheets, tabs and input controls | Retain the installed components; compose branded wrappers and styles |
| [Radix Primitives](https://github.com/radix-ui/primitives) | [MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE) | Keyboard behavior, focus management and interaction primitives | Retain beneath the existing UI |
| [Lucide](https://github.com/lucide-icons/lucide) | [ISC, with MIT notices for Feather-derived icons](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | Consistent utility and navigation icons | Use the installed set with a shared stroke weight and deliberate icon selection |
| [Phosphor React](https://github.com/phosphor-icons/react) | [MIT](https://github.com/phosphor-icons/react/blob/master/LICENSE) | A more expressive family, including six weights and duotone options | Keep as a candidate if a later brand direction needs a different icon voice |
| [Tabler Icons](https://github.com/tabler/tabler-icons) | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE) | Consistent outline icons with adjustable size, color and stroke | Alternative to Lucide, not another set to mix into the current utility icons |
| [Base UI](https://github.com/mui/base-ui) | [MIT](https://github.com/mui/base-ui/blob/master/LICENSE) | Unstyled components for a new foundation | No replacement needed for functioning Radix controls |

The license findings apply to these repositories, not unrelated paid templates or services carrying similar names. Preserve the licenses and notices with redistributed code. This pass installs no paid kit and adds no new dependency.

## Why this direction

[shadcn's documentation](https://ui.shadcn.com/docs) describes source ownership and customization. [Radix's styling guidance](https://www.radix-ui.com/primitives/docs/guides/styling) documents its unstyled primitives. This makes the current foundation suitable for an original presentation without replacing its interaction behavior.

[Lucide's React styling documentation](https://lucide.dev/guide/react/advanced/global-styling) supports shared color, size and stroke settings. Stackscroll uses a 1.7 stroke baseline, with stronger selected navigation states. [Accessible icon guidance](https://lucide.dev/guide/react/advanced/accessibility) supports putting the accessible name on an icon-only button, while decorative icons remain hidden from assistive technology.

[Phosphor's usage documentation](https://github.com/phosphor-icons/react#usage) and [Tabler's React documentation](https://docs.tabler.io/icons/libraries/react) provide alternatives if their geometry better suits the final identity. [Base UI's quick start](https://base-ui.com/react/overview/quick-start) confirms it can also support custom styling, but changing foundations would not by itself create a brand.

## Applied to this pass

- A provisional original three-bar stack mark and a Stackscroll wordmark, centralized in `app/brand.tsx`.
- Top-left identity on desktop and mobile; the mark also appears as the favicon.
- A shared `StackButton` wrapper using the installed shadcn Button with primary, secondary and quiet treatments.
- One consistent utility icon family; updated Feed, Paths and Review icons retain text labels.
- Fewer colored containers, no decorative hard shadows, quieter topic metadata, and shorter page headings.
- Existing themes, custom layouts, source links and learning state retained.
- Brand name, font role, colors and control radius remain independently changeable. No final trademark or font selection is implied.
