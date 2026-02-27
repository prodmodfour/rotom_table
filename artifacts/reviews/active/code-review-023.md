---
review_id: code-review-023
target: refactoring-009
verdict: CHANGES_REQUIRED
reviewer: senior-reviewer
date: 2026-02-17
commits_reviewed:
  - 3fc41eb
files_reviewed:
  - app/types/combat.ts
  - app/constants/statusConditions.ts
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/prisma/migrate-phantom-conditions.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
scenarios_to_rerun: []
---

## Summary

Clean removal of three phantom status conditions (Encored, Taunted, Tormented) from the type system, canonical constants, server validation, and UI picker. Migration script handles any existing DB records. All 6 files identified in the ticket are correctly addressed — 4 via direct edits, 2 via existing imports from the canonical constants source (no change needed).

## Status Table

| Task | Status |
|------|--------|
| Remove from `StatusCondition` union (`types/combat.ts`) | DONE |
| Remove from `VOLATILE_CONDITIONS` (`constants/statusConditions.ts`) | DONE |
| Remove from `VALID_STATUS_CONDITIONS` (`combatant.service.ts`) | DONE |
| Remove from `AVAILABLE_STATUSES` (`StatusConditionsModal.vue`) | DONE |
| `captureRate.ts` — imports from constants, no local copy | VERIFIED |
| `useCapture.ts` — imports from constants, no local copy | VERIFIED |
| Migration script for existing DB records | DONE |
| All 4 condition lists consistent (19 conditions) | VERIFIED |
| Grep confirms no runtime references remain | VERIFIED |
| Resolution log updated in ticket | VERIFIED |

## Code Verification

**Type union (`combat.ts:4-9`):**
- 19 conditions in union. Previous: 22. Exactly 3 removed. Correct.

**Canonical constants (`statusConditions.ts:11-13`):**
- `VOLATILE_CONDITIONS` now 8 entries: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Matches PTU 1.05 p.247. Correct.

**Server validation (`combatant.service.ts:235-241`):**
- `VALID_STATUS_CONDITIONS` matches the full union (19 conditions). Correct.

**UI picker (`StatusConditionsModal.vue:48-53`):**
- `AVAILABLE_STATUSES` matches the full union (19 conditions). Enraged and Suppressed moved into the Disabled line to maintain grouping after removal. Clean.

**Capture files (no changes needed):**
- `captureRate.ts:14` imports `VOLATILE_CONDITIONS` from `~/constants/statusConditions`. Uses it at line 116. Correctly gets the updated list automatically.
- `useCapture.ts:2` imports `VOLATILE_CONDITIONS` from `~/constants/statusConditions`. Uses it at line 148. Correctly gets the updated list automatically.
- This is the payoff from refactoring-008's deduplication — two fewer files to touch.

**Migration script (`migrate-phantom-conditions.ts`):**
- Maps Taunted→Enraged, Tormented→Suppressed, Encored→Enraged. Correct per PTU move effects.
- Handles both `humanCharacter` and `pokemon` tables. Correct — these are the two entity types with `statusConditions` JSON.
- Deduplication logic at lines 46-48 prevents double Enraged if a record has both Taunted + Enraged. Correct.
- Parses `record.statusConditions || '[]'` — handles null/empty. Correct.
- Worker reports 0 records affected (no phantom conditions existed in the DB). Expected — the app is in development, not active play.

**Grep verification:**
- `grep -r 'Encored\|Taunted\|Tormented' app/` returns only: the migration script itself + test artifacts (documentation/reviews/lessons). No runtime references remain.

## Issues

### HIGH #1 — Capture loop doc still lists phantom conditions

**File:** `app/tests/e2e/artifacts/loops/capture.md`
**Lines:** 403-405

The volatile conditions section still lists:
```
- Encored: +5
- Taunted: +5
- Tormented: +5
```

These three lines should be removed. The capture loop doc is the reference used by Scenario Crafter and Playtester agents — stale conditions here will generate incorrect test scenarios.

**Required fix:** Delete lines 403-405 in a follow-up commit.

### NEW TICKET — Hardcoded condition lists should import from canonical source

**Files:**
- `app/server/services/combatant.service.ts:235-241` — `VALID_STATUS_CONDITIONS`
- `app/components/encounter/StatusConditionsModal.vue:48-53` — `AVAILABLE_STATUSES`

Both are hardcoded 19-condition arrays identical to `ALL_STATUS_CONDITIONS` from `constants/statusConditions.ts`. Should import from the canonical source, same as `captureRate.ts` and `useCapture.ts` already do. This is the same DRY violation that refactoring-006 fixed in `breather.post.ts` and refactoring-008 fixed in the capture files — these two are the last remaining instances.

**Impact:** Next time a condition is added or removed, these two files must be manually updated. This commit is proof — the worker had to touch 4 files when 2 would have sufficed.

File as a new refactoring ticket.

## What Looks Good

- Exactly the right scope — 4 file edits + 1 migration script, nothing extraneous
- Commit message is thorough — explains the PTU rationale, lists affected locations, references the ticket
- Migration script is well-structured: separate function per table, deduplication, clear logging
- Resolution log in the ticket is complete and accurate (including the "auto-fixed" distinction for import-based files)
- The worker correctly recognized that `captureRate.ts` and `useCapture.ts` didn't need changes because they import from constants — shows understanding of the prior refactoring-008 work

## Recommended Next Steps

1. Fix HIGH #1: Remove 3 phantom condition lines from `capture.md` (follow-up commit)
2. File new refactoring ticket for condition list deduplication (combatant.service.ts + StatusConditionsModal.vue)
3. Route to Game Logic Reviewer — no PTU formula logic changed, but verify the volatile list matches p.247
