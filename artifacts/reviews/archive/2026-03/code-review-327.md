---
review_id: code-review-327
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-106
domain: combat
commits_reviewed:
  - b5d5af8e
  - 1a57b6a1
  - c00b1460
  - 4f2eabd6
  - 3971e97b
  - ed906a60
  - ff64a2a7
  - fb01f6a2
files_reviewed:
  - app/constants/statusConditions.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/utils/captureRate.ts
  - app/utils/restHealing.ts
  - artifacts/tickets/open/refactoring/refactoring-106.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-128.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-03-04T15:00:00Z
follows_up: null
---

## Review Scope

Reviewing refactoring-106 (decouple status condition behaviors from category arrays) and ptu-rule-128 (Sleep/Bad Sleep persist through recall and encounter end), implemented across 8 commits touching 6 source files. Per decree-038, each condition gets independent behavior flags (`clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint`) and category is used for display grouping only.

Decrees checked: decree-038 (primary), decree-005 (CS auto-application), decree-012 (type immunities), decree-044 (Bound/Trapped).

## Issues

### HIGH

**HIGH-001: `clearsOnFaint: true` on Other conditions expands faint clearing behavior beyond RAW and old code**

Files: `app/constants/statusConditions.ts` (lines 169-203)

The old `applyFaintStatus` cleared `[...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS]` -- exactly the 14 persistent and volatile conditions. PTU p.248 (line 1692) states: "automatically cured of all Persistent and Volatile Status Conditions." The new code sets `clearsOnFaint: true` for Stuck, Slowed, Trapped, Tripped, and Vulnerable (Other category conditions), expanding the faint-cleared set from 14 to 19 conditions.

This is a silent behavioral change that goes beyond what the ticket describes. While pragmatically reasonable (a fainted Pokemon can't be Stuck or Tripped), it contradicts the explicit RAW text which only mentions Persistent and Volatile. The ticket for refactoring-106 states "All existing condition behaviors are preserved (except Sleep, handled by ptu-rule-128)" -- this criterion is violated.

**Fix:** Set `clearsOnFaint: false` for Stuck, Slowed, Trapped, Tripped, and Vulnerable to match the old behavior and RAW. If the developer intends to expand faint clearing to Other conditions, that should be a separate ticket with a decree-need (since it contradicts RAW p.248). Alternatively, if the team considers this a pragmatic improvement, file a decree-need ticket documenting the decision and keep the flags, but do not ship it silently.

### MEDIUM

**MEDIUM-001: `clearsOnEncounterEnd: true` on Other conditions expands encounter-end clearing beyond old behavior**

Files: `app/constants/statusConditions.ts` (lines 169-203), `app/server/api/encounters/[id]/end.post.ts`

The old encounter-end code cleared only `VOLATILE_CONDITIONS` (9 conditions). The new `ENCOUNTER_END_CLEARED_CONDITIONS` includes Stuck, Slowed, Trapped, Tripped, and Vulnerable (via `clearsOnEncounterEnd: true`), expanding from 9 to 12 conditions (9 volatile minus Asleep/Bad Sleep + 5 Other).

Unlike the faint case, this expansion is arguably correct -- combat-scoped conditions like Stuck/Tripped should not persist after combat ends. However, this is still a behavioral change not explicitly called out in either ticket, and the old code did not clear them. The refactoring-106 acceptance criteria states "All existing condition behaviors are preserved."

**Fix:** Either (a) set `clearsOnEncounterEnd: false` for Stuck, Slowed, Trapped, Tripped, Vulnerable to match old behavior, or (b) explicitly document this as an intentional improvement in the ticket resolution log. Option (b) is acceptable here since these conditions logically should not persist after encounters, but the change should be transparent.

## What Looks Good

1. **StatusConditionDef type design is clean and extensible.** The `readonly` modifiers, JSDoc comments, and `as const` assertion on the record prevent accidental mutation. Adding new conditions or flags in the future is straightforward -- add an entry to `STATUS_CONDITION_DEFS` and behavior propagates automatically.

2. **Decree-038 compliance for Sleep/Bad Sleep.** Asleep and Bad Sleep correctly have `category: 'volatile'` (for UI grouping), `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, and `clearsOnFaint: true`. This matches the decree exactly. The RECALL_CLEARED_CONDITIONS and ENCOUNTER_END_CLEARED_CONDITIONS derived arrays automatically exclude them.

3. **switching.service.ts benefits transparently.** The recall logic in `applyRecallSideEffects` (line 772) imports `RECALL_CLEARED_CONDITIONS` and now automatically gets the corrected set without any code change needed in that file. Sleep correctly persists through recall.

4. **Breather logic correctly uses category for its own purpose.** The breather (p.245) cures "all Volatile status conditions" which is a category-based rule, not a behavior-flag-based one. The code correctly filters by `d.category === 'volatile'` rather than using `clearsOnRecall` or `clearsOnEncounterEnd`. Sleep IS volatile and IS cured by Take a Breather -- this is correct per RAW.

5. **Capture rate and rest healing correctly use category lookups.** Both `captureRate.ts` and `restHealing.ts` now look up `STATUS_CONDITION_DEFS[condition]?.category` instead of doing `PERSISTENT_CONDITIONS.includes()`. This is the correct approach since capture rate bonuses and extended rest clearing are category-based rules, not behavior-flag-based.

6. **Commit granularity is excellent.** Eight commits, each doing exactly one logical change. The progression is clear: type definition first, then each consumer migrated individually, then the Sleep fix, then docs. Easy to bisect if needed.

7. **Backward compatibility preserved.** The old `PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS`, `OTHER_CONDITIONS`, and `ALL_STATUS_CONDITIONS` arrays are still exported, now derived from the defs. Any remaining consumers get identical values.

8. **No immutability violations.** The `clearEncounterEndConditions` function returns a new array via `.filter()`. The `applyFaintStatus` creates new arrays. No direct mutation of reactive objects.

## Verdict

**CHANGES_REQUIRED**

The core architecture is sound and decree-038 compliance for Sleep/Bad Sleep is correct. However, HIGH-001 (expanded faint clearing for Other conditions) is a silent behavioral change that contradicts both the PTU RAW text and the ticket's own acceptance criteria ("All existing condition behaviors are preserved"). This must be fixed before approval.

## Required Changes

1. **HIGH-001:** Set `clearsOnFaint: false` for Stuck, Slowed, Trapped, Tripped, and Vulnerable to match old behavior (and RAW p.248). If expanded faint clearing is desired, create a decree-need ticket.

2. **MEDIUM-001:** Either revert `clearsOnEncounterEnd` to `false` for the five Other conditions, or add a note to the refactoring-106 resolution log explicitly documenting this as an intentional improvement (with reasoning that combat-scoped conditions should not persist after encounters).
