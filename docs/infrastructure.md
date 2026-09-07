# Stackscroll infrastructure

Inventory inspected September 7, 2026.

| Area | Current implementation |
| --- | --- |
| Source | Private `Hotfarino/stackscroll` repository, `main` branch, GitHub remote named `github` |
| Hosting | Sites manages the published app; `origin` points to its separate source repository |
| Frontend | React 19, TypeScript, Vinext, Vite, Tailwind, existing Shadcn primitives |
| Server | Cloudflare Worker entry with app routing and an RSS endpoint at `/api/news` |
| Content | 31 study cards in `app/content.ts`, plus humor, philosophy, and facts in `app/culture.ts`; editing source is currently required |
| News | GitHub Changelog and AWS What's New RSS, allowlisted hosts, seven-second fetch timeout, response size cap, per-worker memory cache, dated fallback articles |
| User data | Browser localStorage for bookmarks, quiz answers, reviews, activity, and display settings; no cross-device synchronization |
| Database | Drizzle/D1 starter files exist, but schema is empty and D1 binding is disabled |
| Media storage | R2 binding is disabled; current static assets are in the repository |
| Identity | Sites controls access. ChatGPT identity helper exists but the application page does not call it; workspace name/avatar are currently fixed UI text |
| Validation | Node tests for learning state, content, preferences, RSS, components, and built Worker HTML |
| Delivery automation | No GitHub Actions workflow or automatic GitHub-to-Sites deployment configured |

## Current update path

1. Edit the existing checkout, preserving `.openai/hosting.json` and the Sites `origin`.
2. Validate the changed behavior and production build.
3. Commit and push to GitHub using `git push github main`; preserve shared history.
4. Publish separately through Sites when requested. A GitHub push alone does not change the live app.

On macOS, the original `install:ci` and `build` shell helpers expect Linux utilities such as `flock` and GNU `timeout`. The underlying commands are `npm ci`, `node_modules/.bin/vinext build`, and `node --test tests/*.test.mjs`. Use the declared Node version and lockfile. A plain TypeScript check also needs Cloudflare runtime declarations; the original checkout does not include these declarations.

Validation of the initial culture-content update: production build and all 14 Node tests pass. The existing feed component reports five lint errors and five warnings on both the original and updated source (React purity/effect rules and unused imports); these require separate cleanup before treating lint as a release gate. Standalone type checking reports missing Cloudflare declarations in the unchanged database/Worker starter files.

## Proposed next infrastructure work

These are options, not provisioned services:

1. **Automated checks:** build and run tests on GitHub pushes and pull requests; keep production publishing an explicit release step.
2. **Content editing:** if source-based publishing becomes inconvenient, enable D1 and build an authenticated editor with draft/published states, source references, review dates, and revisions.
3. **Account persistence:** connect the authenticated identity to a database before promising cross-device progress. Plan migration of existing local progress and bookmarks.
4. **News reliability:** move beyond an isolate-local cache if traffic or feed volume warrants it, and add operational visibility before automated ingestion expands.

The current content additions need no new hosted service, secret, database, or subscription.
