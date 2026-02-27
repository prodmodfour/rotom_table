---
review_id: code-review-094
target: ptu-rule-075
trigger: orchestrator-routed
reviewed_commits:
  - 4cb5198
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

## Scope

Review of ptu-rule-075: Replace `Array.push()` mutation on `combatant.tempConditions` with immutable spread assignment in `breather.post.ts`, matching the pattern already used in `sprint.post.ts`.

1 commit reviewed:
- `4cb5198` -- replace push mutation with immutable spread in breather.post.ts

## Issues Found

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

1. **Exact pattern match with sprint.post.ts.** The fix on lines 89 and 93 of `breather.post.ts` now uses `combatant.tempConditions = [...combatant.tempConditions, 'Tripped']` and `[...combatant.tempConditions, 'Vulnerable']`, which is character-for-character consistent with `sprint.post.ts` line 38 (`combatant.tempConditions = [...combatant.tempConditions, 'Sprint']`). The two maneuver endpoints are now pattern-identical for tempCondition assignment.

2. **Behavioral equivalence is guaranteed.** The `combatant` object is a JSON-parsed structure from `loadEncounter()`, not a reactive proxy or frozen object. Reassigning `combatant.tempConditions` to a new array vs. pushing onto the existing array produces the same final state. The downstream `JSON.stringify(combatants)` call on line 124 serializes the same result either way. Zero risk of behavioral change.

3. **Remaining `.push()` calls in the file are correctly left alone.** Three other `.push()` calls exist in this file:
   - Line 76: `result.conditionsCured.push(status)` -- `result` is a local object created on line 48, never shared.
   - Line 78: `remainingStatuses.push(status)` -- local builder array created on line 72, assigned to `entity.statusConditions` via `=` on line 82.
   - Line 111: `moveLog.push({...})` -- freshly parsed from `JSON.parse()` on line 109, same pattern used in `sprint.post.ts` line 45.

   All three operate on locally-scoped or freshly-cloned arrays. The ticket correctly targeted only `combatant.tempConditions` because `combatant` is a shared reference from the loaded encounter graph. The developer showed correct judgment in not over-applying the fix.

4. **Commit message is well-formed.** Conventional commit format (`fix:`), references the specific mutation being replaced, names the target pattern (`sprint.post.ts`), and explains why. Clean and descriptive.

5. **Ticket updated with fix log.** The ticket file was updated to `in-progress` status with a clear fix log entry documenting the change, affected lines, and risk assessment. Good traceability.

## Verdict

**APPROVED**

Minimal, correctly scoped fix. The two mutated lines were the only ones that needed changing. Pattern now matches the adjacent sprint endpoint exactly. No issues found.
