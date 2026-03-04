---
review_id: code-review-337
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-047
domain: capture
commits_reviewed:
  - 38e637ad
  - c4783211
  - 2f65132a
files_reviewed:
  - app/server/api/capture/attempt.post.ts
  - app/server/services/intercept.service.ts
  - app/prisma/schema.prisma
  - app/server/utils/serializers.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/services/entity-builder.service.ts
  - app/components/pokemon/PokemonStatsTab.vue
  - artifacts/tickets/resolved/bug/bug-047.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-04T22:30:00Z
follows_up: null
---

## Review Scope

Bug-047 reported that `app/server/api/capture/attempt.post.ts` used `loyalty ?? 2` as a fallback for the Friend Ball post-capture loyalty bonus, while the Prisma schema declares `loyalty Int @default(3)`. The developer fixed this and performed a full codebase audit of all `loyalty ??` patterns per Lesson #2 compliance, discovering and fixing a second instance in `intercept.service.ts` (`?? 0`).

Three commits reviewed:
1. `38e637ad` -- Fix Friend Ball loyalty fallback from `?? 2` to `?? 3` (1 file, 1 line)
2. `c4783211` -- Fix intercept loyalty fallback from `?? 0` to `?? 3` (1 file, 1 line)
3. `2f65132a` -- Update ticket with resolution log and codebase audit table (1 file)

No decrees are violated. Decree-013, 014, 015, and 042 (all capture-domain) concern capture rate calculation and Poke Ball accuracy, not loyalty fallbacks. No new ambiguities discovered.

## Issues

### MEDIUM

**MED-001: Ticket resolution log references stale commit hashes**

The resolution log in `artifacts/tickets/resolved/bug/bug-047.md` references commit hashes `e4137af1` and `f06f0dca`, but the actual commits on master are `38e637ad` and `c4783211`. These hashes do not exist in any branch. This makes the ticket unreliable for future traceability (e.g., `git log --grep` or bisecting).

File: `artifacts/tickets/resolved/bug/bug-047.md`, lines 39-40.

Fix: Update the resolution log to reference the correct commit hashes.

**MED-002: Ticket affected_files missing intercept.service.ts**

The ticket frontmatter `affected_files` only lists `app/server/api/capture/attempt.post.ts`, but `app/server/services/intercept.service.ts` was also modified. The frontmatter should reflect all files that were changed as part of the fix.

File: `artifacts/tickets/resolved/bug/bug-047.md`, line 12.

Fix: Add `app/server/services/intercept.service.ts` to the `affected_files` list.

## What Looks Good

1. **Correctness of both fixes.** The schema declares `loyalty Int @default(3)` (Neutral). Both fallbacks now match: `attempt.post.ts` line 211 uses `?? 3`, `intercept.service.ts` line 118 uses `?? 3`. The values are semantically correct -- Neutral (3) is the expected default loyalty for a newly captured Pokemon.

2. **Friend Ball logic is correct.** The post-capture effect reads current loyalty, adds 1, clamps to max 6 via `Math.min(6, currentLoyalty + 1)`, and persists. With the fallback corrected to 3, a Pokemon with null loyalty would get 4 (Friendly) -- matching what the schema default would produce.

3. **Intercept logic is correct and now safer.** The old fallback `?? 0` meant a Pokemon with null loyalty would be blocked from intercepting (since `0 < 3`). With `?? 3`, a null-loyalty Pokemon is treated as Neutral, which matches the schema default and allows interception for their trainer. This is the correct behavior.

4. **Comprehensive codebase audit.** The developer grepped for all `loyalty ??` patterns and documented 8 sites across 7 files. Independent verification confirms the audit is complete -- all 8 runtime sites now use `?? 3`. The design spec (`spec-p2.md`) with `?? 0` was correctly noted as non-runtime.

5. **Commit granularity is appropriate.** Each fix is a separate commit touching exactly one file. The ticket update is a third commit. This follows the project's small-commit convention.

## Verdict

**APPROVED** -- The two code fixes are correct, minimal, and well-scoped. The codebase audit is verified complete. Two medium-severity documentation issues exist in the ticket file (stale commit hashes, incomplete affected_files) but these do not affect runtime behavior and can be corrected in a follow-up pass.

## Required Changes

None blocking. The two MED issues should be addressed during the next ticket cleanup cycle.
