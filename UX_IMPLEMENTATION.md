# Stackscroll guided learning update

## Implemented

- Feed opens on a practical five-step stack: situation, explanation, question, reasoning, wrap-up. Seven stacks cover DNS, route selection, cloud boundaries, Git, agent briefs, model evaluation, and SSD terminology.
- Explore contains career directions, guided stacks, and the full original card/video/news library. A single Filters sheet contains format, topic, and difficulty. Existing Stream, Focus, and Index choices apply to the library; Stream uses explicit load-more.
- Practice includes optional next-day alternate questions plus the existing flashcard queue. Timing is an initial product rule, not a validated optimal spacing schedule. No push notification is implied.
- Saved shows bookmarked and unfinished account stacks, followed by device-local saved cards. Backing to the first step keeps started stacks resumable.
- Wrap-up separates explanation read, original-question attempt, and later recall. Skips are unattempted. Reading and completion never imply mastery. Recall counts represent each stack’s most recent result, not cumulative attempts.
- Why this stack explains path/pin/feedback/resume signals. More/less/easier/harder is one explicit preference per topic, using a simple deterministic ranking. It does not infer interests from video playback or hide other subjects. Small inventory can limit the visible effect of a preference.
- Existing themes, reading size, spacing, reduced motion, source expansion, top-left branding, and video controls remain available.

## Data and safety

`stack_sessions` stores the site-specific authenticated user ID, stack ID, validated session JSON, revision, and update timestamp. `topic_feedback` stores explicit choices. All reads/writes are scoped server-side by the dispatcher-provided user ID. Same-origin JSON writes, bounded payload parsing, and compare-and-swap revisions prevent forged state submissions and stale-tab overwrites. Server actions compute transitions; failures keep the current step and report a retryable error. Migration 0001 adds these tables without changing already-applied migration 0000.

Account data can be deleted from Privacy. Browser data and account data are described separately. Existing unreadable device data is preserved rather than overwritten. No video watch-history recording, auto-loading, native clip ingestion, or new analytics was added. Source moderation, fresh playback checks, explicit player consent, and takedown behavior are preserved.

## Content evidence

The DNS diagnostic copy was checked against [Microsoft DNS client troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues). The Windows command and timeout interpretation follow [Microsoft nslookup documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup). IP reachability plus failed resolution is a clue, not proof that the DNS server itself is broken. A timeout does not establish that a record is missing.

Other stacks reuse the linked original collection with alternate questions. Route recall uses /12 and /16 consistently. All learning material remains labeled source-linked with independent review pending; this pass does not establish an editorial review program, full syllabus coverage, or third-party certification affiliation.

## Verification and remaining research

Type checking, production compilation, built-Worker initial rendering, SQLite-backed account/progression tests, and retained video tests cover this implementation. Tests exercise skip semantics, resumption after Back, reasoning progression, delayed recall, source/answer completeness, account isolation, same-origin writes, stale revisions, deletion, and storage failure. Component rendering checks that skipped practice is not scored and rescheduled recall does not expose the previous answer.

No browser or assistive-technology testing, usability interviews, production identity-session walkthrough, or retention experiment was performed. Test with IT learners across experience levels and the intended age range before making engagement or learning-effectiveness claims. Future content review, public-launch policy, and creator licensing work remain separate product requirements.
