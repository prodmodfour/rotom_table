---
review_id: code-review-082
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-067, ptu-rule-068, ptu-rule-065, ptu-rule-069, ptu-rule-066, ptu-rule-070, ptu-rule-071
domain: combat, healing
commits_reviewed:
  - 8ecdb47
  - 9f2fe2b
  - aaec2fa
  - 2b68a71
  - 74ba0fd
  - 06926ba
  - 21cb5e5
  - 2c36cb7
files_reviewed:
  - app/composables/useGridMovement.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/composables/useEncounterActions.ts
  - app/stores/encounterCombat.ts
  - app/utils/moveFrequency.ts
  - app/server/api/game/new-day.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/pages/gm/index.vue
  - app/tests/unit/utils/moveFrequency.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 0
scenarios_to_rerun:
  - combat-movement
  - combat-conditions
reviewed_at: 2026-02-20T03:30:00Z
---

## Review Scope

Session 6 implementations for 7 PTU rule fix tickets. Reviewed all 8 non-docs commits against their respective ticket specifications.

## Status Table

| Ticket | Description | Plan | Actual | Status |
|--------|-------------|------|--------|--------|
| ptu-rule-067 | Stuck sets speed to 0 | Change halve to 0 | Changed to 0, but downstream modifiers undo it | CRITICAL bug |
| ptu-rule-068 | Speed CS additive bonus | Replace multiplier with additive | Correct implementation | OK |
| ptu-rule-065 | Encounter end clears boundAp | Add boundAp clearing to end endpoint | Correct, matches deactivate pattern | OK |
| ptu-rule-069 | Sprint server persistence | New endpoint + store method + immutable client call | Correct 3-commit approach | OK |
| ptu-rule-066 | New-day resets daily move counters | Add resetDailyUsage to both new-day endpoints | Correct for both global and per-character | OK, missing tests |
| ptu-rule-070 | Scene x2/x3 EOT + Daily x2/x3 per-scene | Add validation logic + 16 tests | Correct logic and comprehensive tests | OK |
| ptu-rule-071 | Weather undo/redo snapshot | Add captureSnapshot + refreshUndoRedoState | Correct pattern match | OK |

## Issues

### CRITICAL

1. **Stuck condition bypassed by Speed CS and Sprint modifiers** -- `app/composables/useGridMovement.ts:145-181`

   When a combatant is Stuck AND has any Speed Combat Stage modifier or Sprint active, the Stuck condition (speed=0) is overridden by subsequent modifier calculations. Stuck should be an absolute block -- no movement regardless of other modifiers.

   **Scenario 1: Stuck + negative Speed CS (-2)**
   ```
   modifiedSpeed = 5 (base)
   Stuck:       modifiedSpeed = 0
   Speed CS -2: stageBonus = -1, modifiedSpeed = 0 + (-1) = -1
                stageBonus < 0 → Math.max(-1, 2) = 2  ← BUG: Stuck combatant gets speed 2
   ```

   **Scenario 2: Stuck + positive Speed CS (+6)**
   ```
   modifiedSpeed = 5 (base)
   Stuck:       modifiedSpeed = 0
   Speed CS +6: stageBonus = 3, modifiedSpeed = 0 + 3 = 3  ← BUG: Stuck combatant gets speed 3
   ```

   **Scenario 3: Stuck with no CS but base speed > 0**
   ```
   modifiedSpeed = 5 (base)
   Stuck:       modifiedSpeed = 0
   Line 180:    Math.max(0, speed > 0 ? 1 : 0) = Math.max(0, 1) = 1  ← BUG: minimum floor uses original base speed
   ```

   The Stuck fix (commit `8ecdb47`) correctly sets `modifiedSpeed = 0`, but the function continues to apply Speed CS modifiers, Sprint, and then the minimum-speed floor at line 180 -- all of which can raise the speed above 0.

   **Buggy code:**
   ```typescript
   // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
   if (conditions.includes('Stuck')) {
     modifiedSpeed = 0
   }

   // ... subsequent modifiers run and can raise it above 0 ...

   // Minimum speed is 1 (can always move at least 1 cell unless at 0)
   return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
   ```

   **Fix:** Early return for Stuck. Stuck is an absolute movement block per PTU p.231:
   ```typescript
   // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
   if (conditions.includes('Stuck')) {
     return 0
   }
   ```

### HIGH

1. **`resetDailyUsage()` has zero test coverage** -- `app/utils/moveFrequency.ts:251-263`

   The `resetDailyUsage` function was added for ptu-rule-066 and is called by both new-day endpoints (`game/new-day.post.ts` and `characters/[id]/new-day.post.ts`). The test file (`app/tests/unit/utils/moveFrequency.test.ts`) does not import or test this function. The import list at line 1-11 of the test file explicitly lists `resetSceneUsage` but not `resetDailyUsage`. This is the "fix one, miss the rest" pattern -- test coverage was added for ptu-rule-070 but not for ptu-rule-066's new utility function.

   **Required tests (minimum):**
   - Resets `usedToday` to 0 for daily-frequency moves
   - Resets `lastUsedAt` to undefined for daily-frequency moves
   - Returns same reference for moves needing no reset (At-Will, Scene)
   - Does not mutate original array
   - Returns new array reference

## What Looks Good

- **ptu-rule-068 (Speed CS):** Clean replacement of multiplicative table with additive formula. The `Math.floor(clamped / 2)` correctly implements PTU p.234. Removal of the unused `getSpeedStageMultiplier` function is good cleanup. The minimum floor of 2 for negative CS (PTU p.700) is correctly implemented.

- **ptu-rule-065 (encounter end boundAp):** Follows the exact pattern from `deactivate.post.ts`. Correctly uses `calculateSceneEndAp(char.level, char.drainedAp)` with implicit `boundAp=0`. The filter for `type === 'human' && entityId` is correct -- only characters with DB records and only human types have AP.

- **ptu-rule-069 (Sprint persistence):** Excellent 3-commit decomposition: server endpoint, store method, client integration. Each commit is a clean logical unit. The sprint endpoint correctly follows the breather.post.ts pattern with proper error handling. The client fix properly replaces the reactive mutation `combatant.tempConditions.push('Sprint')` with the immutable server-persisted `encounterCombatStore.sprint()` call.

- **ptu-rule-070 (Scene x2/x3 EOT + Daily x2/x3 per-scene):** Comprehensive test coverage (16 new tests). Priority ordering is correct -- exhaustion checks run before EOT/per-scene checks, so the user gets the most relevant error message. The `incrementMoveUsage` changes correctly track `lastTurnUsed` only for Scene x2/x3 (not Scene x1). The `checkMoveFrequency` guards are well-structured.

- **ptu-rule-071 (Weather undo/redo):** Minimal, correct fix. The snapshot label with weather name vs "Cleared Weather" is a nice touch. Matches the pattern of every other action handler.

- **ptu-rule-066 (new-day daily move reset):** Both code paths (global and per-character) correctly handle the JSON column limitation. The change-detection optimization (`JSON.stringify` comparison before writing) avoids unnecessary DB writes. The `resetDailyUsage` utility follows the same immutable pattern as `resetSceneUsage`.

- **Commit granularity** is good across the board -- small, focused commits with descriptive messages.

## Verdict

CHANGES_REQUIRED -- The Stuck interaction bug (CRITICAL) means a Stuck combatant can still move, which directly contradicts the PTU rule this fix was meant to implement. The missing test coverage for `resetDailyUsage` (HIGH) must also be addressed.

## Required Changes

1. **CRITICAL:** In `app/composables/useGridMovement.ts`, change the Stuck handler in `applyMovementModifiers()` from setting `modifiedSpeed = 0` (and continuing) to `return 0` (early exit). This prevents Speed CS, Sprint, and the minimum-speed floor from overriding the Stuck block. Reference: PTU 1.05 p.231 "Stuck means you cannot Shift at all."

2. **HIGH:** Add unit tests for `resetDailyUsage()` in `app/tests/unit/utils/moveFrequency.test.ts`. Import the function and add at minimum the 5 tests listed in the Issues section.

## New Tickets Filed

1. **ptu-rule-072** -- Stuck condition bypassed by Speed CS, Sprint, and minimum-speed floor in `applyMovementModifiers()`. Filed separately because this is a regression from the ptu-rule-067 fix.

2. **ptu-rule-073** -- Sprint and breather endpoint responses missing required `weatherDuration` field (pre-existing pattern, not introduced by this session but discovered during review).

## Scenarios to Re-run

- combat-movement: Stuck + Speed CS interaction, Stuck + Sprint interaction
- combat-conditions: Verify Stuck blocks all movement
