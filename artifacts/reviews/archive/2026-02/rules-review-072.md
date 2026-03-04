---
review_id: rules-review-072
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-065, ptu-rule-066, ptu-rule-067, ptu-rule-068, ptu-rule-069, ptu-rule-070, ptu-rule-071
domain: combat, healing, scenes
commits_reviewed:
  - 8ecdb47
  - 9f2fe2b
  - aaec2fa
  - 74ba0fd
  - 06926ba
  - 21cb5e5
  - 2c36cb7
  - 2b68a71
mechanics_verified:
  - stuck-movement-block
  - speed-cs-movement-modifier
  - stratagem-unbind-encounter-end
  - sprint-maneuver
  - new-day-daily-move-reset
  - scene-x2-x3-eot-restriction
  - daily-x2-x3-per-scene-cap
  - weather-undo-redo-snapshot
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 0
ptu_refs:
  - core/07-combat.md#Stuck
  - core/07-combat.md#Speed-Combat-Stages-and-Movement
  - core/07-combat.md#Sprint-Maneuver
  - core/03-skills-edges-and-features.md#Stratagem
  - core/06-playing-the-game.md#Action-Points
  - core/10-indices-and-reference.md#Scene-Frequency
  - core/10-indices-and-reference.md#Daily-Frequency
reviewed_at: 2026-02-20T22:00:00
---

## Review Scope

Session 6 developer implementations across 7 PTU rule tickets (ptu-rule-065 through ptu-rule-071). Each ticket addresses a specific PTU rule compliance gap identified by prior code reviews and the feature matrix pipeline. All 8 commits reviewed against the PTU 1.05 rulebook.

## Mechanics Verified

### 1. Stuck Movement Block (ptu-rule-067)

- **Rule:** "Stuck means you cannot Shift at all" (`core/07-combat.md`, line 434). "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move" (`core/07-combat.md`, line 1722-1723).
- **Implementation:** `applyMovementModifiers()` in `app/composables/useGridMovement.ts` sets `modifiedSpeed = 0` when `Stuck` is present in status conditions.
- **Status:** INCORRECT
- **Severity:** CRITICAL
- **Issue:** The Stuck handler correctly sets `modifiedSpeed = 0`, but the function's final return line `return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` overrides this back to 1. The `speed > 0` check evaluates the _original_ base speed (parameter `speed`), not the modified value. For any combatant with base speed > 0 (which is all of them), the minimum floor ensures they can always move at least 1 cell -- even when Stuck.

  Additionally, the Speed CS minimum floor at line 169 (`modifiedSpeed = Math.max(modifiedSpeed, 2)`) would also override Stuck if the combatant has negative Speed CS: Stuck sets speed to 0, then Speed CS -3 subtracts 2, giving -2, which the floor raises to 2.

  The result: a Stuck combatant can still move 1-2 cells depending on their Speed CS, which directly contradicts "cannot Shift at all."

- **Fix:** The Stuck check should short-circuit and return 0 immediately, bypassing all subsequent modifiers and the minimum speed floor. Move the Stuck check to the top of the function and return early:
  ```typescript
  // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
  // Must return immediately — no modifier or floor should override this
  if (conditions.includes('Stuck')) {
    return 0
  }
  ```
  Alternatively, if keeping the linear structure, track a `isStuck` flag and check it at the final return: `return isStuck ? 0 : Math.max(modifiedSpeed, speed > 0 ? 1 : 0)`.

### 2. Speed CS Movement Modifier (ptu-rule-068)

- **Rule:** "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2." (`core/07-combat.md`, lines 695-700)
- **Implementation:** `applyMovementModifiers()` uses `const stageBonus = Math.floor(clamped / 2)` where `clamped` is the Speed CS value in [-6, +6]. Minimum floor of 2 applied via `Math.max(modifiedSpeed, 2)` for negative CS.
- **Status:** INCORRECT
- **Severity:** HIGH
- **Issue:** `Math.floor()` produces asymmetric results for negative odd values. The PTU says the penalty "reduces your movement equally" -- meaning the magnitude of the penalty should match the magnitude of the bonus at the same absolute stage value.

  | CS | Math.floor(cs/2) | Math.trunc(cs/2) | Symmetric? |
  |----|------------------|------------------|------------|
  | +6 | +3 | +3 | -- |
  | +5 | +2 | +2 | -- |
  | +1 | +0 | +0 | -- |
  | -1 | -1 | 0 | Math.floor breaks symmetry |
  | -3 | -2 | -1 | Math.floor breaks symmetry |
  | -5 | -3 | -2 | Math.floor breaks symmetry |
  | -6 | -3 | -3 | Same (even) |

  At CS -1, `Math.floor(-0.5) = -1`, so the combatant loses 1 movement. But at CS +1, `Math.floor(0.5) = 0`, so the combatant gains 0 movement. The word "equally" indicates CS -1 should also produce a 0-magnitude change, just as CS +1 does. `Math.trunc()` produces this symmetric behavior.

  Practical impact: at CS -1, -3, or -5, the combatant loses 1 more movement than they should. For a base-5 Overland combatant at CS -1, the speed becomes 4 instead of the correct 5.

- **Fix:** Replace `Math.floor(clamped / 2)` with `Math.trunc(clamped / 2)`. This produces symmetric rounding toward zero for both positive and negative stages, matching the "equally" language and the +6 → +3 example.

### 3. Stratagem Unbind at Encounter End (ptu-rule-065)

- **Rule:** "[Stratagem] Features may only be bound during combat and automatically unbind when combat ends." (`core/03-skills-edges-and-features.md`, lines 1758-1760, 1919-1920)
- **Implementation:** `app/server/api/encounters/[id]/end.post.ts` (lines 130-155) collects all human combatant entity IDs, fetches their `level` and `drainedAp` from the database, sets `boundAp: 0` and `currentAp: calculateSceneEndAp(level, drainedAp)`.
- **Status:** CORRECT
- **Verification details:**
  - `calculateSceneEndAp(level, drainedAp)` defaults `boundAp` to 0, producing `maxAp - 0 - drainedAp = maxAp - drainedAp`. Since `boundAp` is separately set to 0 in the DB update, this is correct.
  - The pattern matches the existing scene deactivation endpoint which was already handling this correctly.
  - Only human combatants with `entityId` are processed -- Pokemon don't have AP, so this is correct.
  - The PTU rule says Stratagems unbind "when combat ends" -- an encounter ending IS combat ending, so the trigger is correct.

### 4. Sprint Maneuver Persistence (ptu-rule-069)

- **Rule:** "Maneuver: Sprint -- Action: Standard -- Class: Status -- Range: Self -- Effect: Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md`, lines 1231-1236)
- **Implementation:** Three changes: (1) New server endpoint `app/server/api/encounters/[id]/sprint.post.ts` persists Sprint as a tempCondition. (2) Store method `sprint()` in `encounterCombat.ts`. (3) `useEncounterActions.ts` calls the store method immutably.
- **Status:** CORRECT
- **Verification details:**
  - Sprint is a Standard Action -- the `useEncounterActions.ts` handler calls `encounterStore.useAction(combatantId, 'standard')` before applying Sprint. Correct.
  - Sprint effect is +50% movement speed -- `applyMovementModifiers()` applies `Math.floor(modifiedSpeed * 1.5)`. This matches "Increase your Movement Speeds by 50%."
  - Sprint is "for the rest of your turn" -- implemented as a tempCondition that is cleared at turn end. Correct.
  - Server endpoint uses immutable array spread: `combatant.tempConditions = [...combatant.tempConditions, 'Sprint']`. Correct immutability pattern.
  - Move log entry is created with the Sprint action details. Correct.
  - Idempotency: if Sprint is already active, the endpoint skips the push but still logs. Reasonable behavior.

### 5. New-Day Daily Move Reset (ptu-rule-066)

- **Rule:** Daily frequency moves are "refreshed by an Extended Rest, or by a visit to the Pokemon Center" (`core/10-indices-and-reference.md`, lines 3016-3021). A new day is a clean slate for daily counters.
- **Implementation:** (1) `resetDailyUsage()` added to `app/utils/moveFrequency.ts` -- pure function that resets `usedToday: 0` and `lastUsedAt: undefined`. (2) `app/server/api/game/new-day.post.ts` iterates all Pokemon, applies `resetDailyUsage()`, writes back only when changes detected. (3) `app/server/api/characters/[id]/new-day.post.ts` does the same for a specific character's Pokemon.
- **Status:** CORRECT
- **Verification details:**
  - `resetDailyUsage()` follows the same immutable pattern as `resetSceneUsage()` -- returns same reference when no reset needed, new object when reset applied. Correct.
  - Both new-day endpoints (global and per-character) now reset Pokemon daily move counters. The per-character endpoint also includes `{ pokemon: { select: { id: true, moves: true } } }` in the query. Correct.
  - The change detection (`JSON.stringify` comparison) prevents unnecessary DB writes. Correct optimization.
  - Both endpoints also reset scalar daily counters (`restMinutesToday`, `injuriesHealedToday`). Correct.
  - The global endpoint resets ALL Pokemon, not just those owned by characters. This is correct -- wild/template Pokemon shouldn't retain stale daily counters either.

### 6. Scene x2/x3 EOT Restriction (ptu-rule-070)

- **Rule:** "Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns." (`core/10-indices-and-reference.md`, lines 3011-3014)
- **Implementation:** `checkMoveFrequency()` in `app/utils/moveFrequency.ts` adds EOT check for scene-frequency moves with `sceneLimit > 1`: blocks if `currentRound <= lastTurnUsed + 1`. `incrementMoveUsage()` sets `lastTurnUsed = currentRound` for Scene x2/x3 moves.
- **Status:** CORRECT
- **Verification details:**
  - Scene x1 is correctly excluded from the EOT check (only 1 use total, consecutive usage is impossible). Correct per the rule which says "Moves that can be used _multiple times_ a Scene."
  - Exhaustion check runs before EOT check, so "used 2/2 times this scene" takes priority over "used last round." Correct priority.
  - The EOT check uses `currentRound <= lastTurnUsed + 1`, which blocks both same-round and next-round usage. This matches standard EOT semantics.
  - 16 new unit tests cover all edge cases: consecutive block, skip-a-turn allow, same-turn block, exhaustion priority, and Scene x1 exemption. Tests are comprehensive.

### 7. Daily x2/x3 Per-Scene Cap (ptu-rule-070)

- **Rule:** "Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene." (`core/10-indices-and-reference.md`, lines 3018-3021)
- **Implementation:** `checkMoveFrequency()` adds `usedThisScene >= 1` check for daily-frequency moves with `dailyLimit > 1`. `incrementMoveUsage()` already increments `usedThisScene` for daily moves.
- **Status:** CORRECT
- **Verification details:**
  - Daily x1 is correctly excluded from the per-scene cap (only 1 daily use total, per-scene restriction is redundant). Correct per the rule which says "Moves that can be used _multiple times_ Daily."
  - Daily exhaustion check runs before per-scene check, so "used 2/2 times today" takes priority. Correct priority.
  - Scene resets clear `usedThisScene` via `resetSceneUsage()`, so the per-scene cap resets between scenes. Verified in the `resetSceneUsage()` function.
  - Unit tests cover: per-scene block, new-scene allow, Daily x3 block, daily exhaustion priority, and Daily x1 exemption.

### 8. Weather Undo/Redo Snapshot (ptu-rule-071)

- **Rule:** This is not a PTU rule issue per se -- it is a consistency/UX issue. Weather changes should be undoable like all other encounter actions (damage, heal, status, stages, moves, token movement).
- **Implementation:** `handleSetWeather()` in `app/pages/gm/index.vue` (lines 375-389) now calls `encounterStore.captureSnapshot(label)` before `setWeather()` and `refreshUndoRedoState()` after.
- **Status:** CORRECT
- **Verification details:**
  - The snapshot label is descriptive: `'Set Weather: ${weather}'` or `'Cleared Weather'`. Correct.
  - The pattern matches all other action handlers in `useEncounterActions.ts`: snapshot-before-mutation, refresh-after.
  - Only one call site for `setWeather` exists in the GM page -- no other mutation paths were missed.
  - The store's `syncEncounterState` (WebSocket sync receiver) correctly does NOT capture snapshots -- it is a state receiver, not a user action.

## Pre-Existing Issues Found

### CRITICAL -- Stuck movement block defeated by minimum speed floor

**File:** `app/composables/useGridMovement.ts`, line 180

The minimum speed floor at the end of `applyMovementModifiers()` overrides the Stuck = 0 result back to 1 for any combatant with a positive base speed. This issue was introduced by the ptu-rule-067 fix itself -- the Stuck handler sets `modifiedSpeed = 0` but the existing floor logic at the end of the function undoes it.

Additionally, the Speed CS minimum floor of 2 (line 169-171) also applies after Stuck, further inflating the result when negative Speed CS is present.

**Ticket created:** ptu-rule-067 resolution is incomplete. The fix must be updated to ensure Stuck = 0 survives all subsequent modifiers and the minimum speed floor.

### HIGH -- Speed CS uses Math.floor instead of Math.trunc for negative stages

**File:** `app/composables/useGridMovement.ts`, line 166

The `Math.floor(clamped / 2)` call produces asymmetric rounding for negative odd Speed CS values. PTU says the penalty "reduces your movement equally" (symmetric with positive bonus). `Math.trunc(clamped / 2)` produces the correct symmetric behavior.

Practical impact: at CS -1, -3, or -5, the combatant loses 1 more movement than they should.

**Ticket:** ptu-rule-068 resolution is incomplete. The fix should use `Math.trunc` instead of `Math.floor`.

## Summary

- Mechanics checked: 8
- Correct: 6
- Incorrect: 2
- Needs review: 0

## Verdict

CHANGES_REQUIRED -- Two issues in `useGridMovement.ts` need correction: (1) CRITICAL: Stuck = 0 is overridden by the minimum speed floor, allowing Stuck combatants to move 1-2 cells. (2) HIGH: Speed CS uses `Math.floor` instead of `Math.trunc` for negative odd stages, producing asymmetric penalties.

The remaining 6 mechanics (Stratagem unbind, Sprint persistence, new-day daily move reset, Scene x2/x3 EOT restriction, Daily x2/x3 per-scene cap, weather undo/redo snapshot) are all correctly implemented per PTU 1.05 rules.

## Required Changes

1. **CRITICAL (ptu-rule-067):** In `app/composables/useGridMovement.ts`, `applyMovementModifiers()` -- add early return for Stuck condition before any other modifiers are applied. The Stuck check at line 151 should `return 0` immediately, not just set `modifiedSpeed = 0` and allow subsequent logic to override it. PTU ref: `core/07-combat.md` lines 434, 1722-1723.

2. **HIGH (ptu-rule-068):** In `app/composables/useGridMovement.ts`, line 166 -- replace `Math.floor(clamped / 2)` with `Math.trunc(clamped / 2)` to produce symmetric rounding for negative odd Speed CS values. PTU ref: `core/07-combat.md` lines 695-700 ("reduces your movement equally").
