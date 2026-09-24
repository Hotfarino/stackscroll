# StackScroll private classroom pilot — tonight

This is the release checklist for a private Per Scholas classroom pilot. It is not a public-launch checklist.

## Completed

- [x] Preserve the September 7 source on `codex/archive-main-sept7-aaace630`.
- [x] Promote the current application source to `main` and keep the working branch at `codex/video-playback-v39`.
- [x] Keep the GitHub repository and Sites deployment private.
- [x] Create Supabase tables for profiles, user state, and personal stacks.
- [x] Enable row-level security and owner-only policies; remove anonymous table access.
- [x] Make avatar storage private and return short-lived signed image URLs.
- [x] Move profile text and avatar persistence behind the authenticated server route.
- [x] Add durable, per-user API rate limits for the private pilot.
- [x] Create, verify, and deploy a replacement Supabase server key.

## Must finish before classmates test

- [x] Delete the obsolete Supabase server key after final confirmation.
- [ ] Run the full build, lint, and test suite after the security-test additions.
- [ ] Perform a two-account isolation test: user A must not read or overwrite user B's profile, avatar, stacks, likes, saves, or progress.
- [ ] Add only the intended classmates to the private deployment allowlist.
- [ ] Smoke-test sign-in, profile save, avatar upload/removal, feed loading, video playback, likes, saves, stacks, and refresh persistence on phone and desktop.
- [ ] Review the short privacy notice shown to testers: what is stored, why, retention, and how to request deletion.

## Data work after the first pilot session

- [ ] Move remaining account-scoped state (likes, saves, stack progress, preferences, and playlists) from D1/device storage to the Supabase user tables, one feature at a time.
- [ ] Add deployed integration tests for those migrations before removing their old storage paths.
- [ ] Add edge/IP throttling and abuse alerting before any broader or public rollout. The current authenticated-user limiter is appropriate for the small private pilot, not public internet abuse.

## Tonight's exit criteria

The pilot is ready when the obsolete key is gone, automated checks pass, two distinct permitted accounts pass the isolation test, and the private allowlist contains only the intended testers. Do not publish the site or repository publicly.
