---
review_id: rules-review-006
target: refactoring-004
ticket_id: refactoring-004
trigger: developer-fix-review
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-16
commits_reviewed:
  - 86db8fc
files_reviewed:
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
mechanics_verified:
  - initiative-turn-order
  - league-battle-phase-separation
  - turn-state-reset
  - combat-phase-defaults
ptu_references:
  - "PTU 1.05 p.227: Initiative — League Battles trainers act first (declare low→high, resolve high→low), then Pokemon (high→low)"
  - "PTU 1.05 p.227: Full Contact / Wild — all participants go highest to lowest speed"
  - "PTU 1.05 p.227: Ties settled with d20 roll off"
  - "PTU 1.05 p.227: Action Types — one Standard Action, one Shift Action, one Swift Action per turn"
scenarios_to_rerun: []
---

## Summary

Refactoring-004 replaces inline encounter response construction in 3 API handlers with the canonical `buildEncounterResponse()`. This is a purely structural refactoring — no game logic, formulas, or mechanic implementations were modified. The initiative sorting, phase separation, turn state reset, and combatant/spawn logic are all untouched.

## PTU Rules Verification Report

### Scope
- [x] Field-by-field comparison of old inline responses vs `buildEncounterResponse` output for all 3 endpoints
- [x] Initiative and turn order logic in `start.post.ts` (untouched by refactoring, verified for correctness)
- [x] Combat phase defaults and overrides
- [x] Turn state reset values

### Mechanics Verified

#### 1. Initiative / Turn Order (start.post.ts:117-148)

- **Rule:** "During League Battles, all Trainers should take their turns first, before any Pokemon act. Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. Following that, all Pokemon then act in order from highest to lowest speed." (PTU 1.05 p.227)
- **Implementation:** `sortByInitiativeWithRollOff(trainers, true)` sorts trainers high→low (resolution order). `sortByInitiativeWithRollOff(pokemon, true)` sorts Pokemon high→low. `turnOrder = [...trainerTurnOrder, ...pokemonTurnOrder]` puts trainers before Pokemon.
- **Status:** CORRECT — Resolution order (high→low) matches PTU. Trainers before Pokemon matches PTU League Battle rules.
- **Refactoring impact:** NONE — Initiative sorting code is completely untouched by commit 86db8fc. The refactoring only changes how the computed `turnOrder`, `trainerTurnOrder`, `pokemonTurnOrder`, and `currentPhase` values are passed to the response builder.

#### 2. Full Contact Initiative (start.post.ts:143-148)

- **Rule:** "In full contact matches, wild encounters, and other situations where Trainers are directly involved in the fight, all participants simply go in order from highest to lowest speed." (PTU 1.05 p.227)
- **Implementation:** `sortByInitiativeWithRollOff(combatants, true)` sorts all combatants high→low. `currentPhase = 'pokemon'` (phase is irrelevant in full contact).
- **Status:** CORRECT
- **Refactoring impact:** NONE

#### 3. Tie-Breaking (start.post.ts:7-68)

- **Rule:** "Ties in Initiative should be settled with a d20 roll off." (PTU 1.05 p.227)
- **Implementation:** `sortByInitiativeWithRollOff()` assigns `initiativeRollOff = rollD20()` for tied groups, re-rolling until all ties are broken.
- **Status:** CORRECT
- **Refactoring impact:** NONE

#### 4. Turn State Reset (start.post.ts:103-115)

- **Rule:** "Each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn." (PTU 1.05 p.227)
- **Implementation:** `turnState: { standardActionUsed: false, shiftActionUsed: false, swiftActionUsed: false, ... }` — boolean flags for each action type, all reset to false. Legacy numeric fields (`actionsRemaining: 2`, `shiftActionsRemaining: 1`) also present.
- **Status:** CORRECT — Boolean flags match PTU's 3 action types. Legacy numeric fields are not used for game logic (noted as "Legacy support" in `Combatant` type definition).
- **Refactoring impact:** NONE

#### 5. Combat Phase Defaults (encounter.service.ts:152-153)

- **Rule:** League Battles have separate trainer/pokemon phases. Full Contact battles have no phase distinction.
- **Implementation:** `buildEncounterResponse` defaults: `trainerTurnOrder: []`, `pokemonTurnOrder: []`, `currentPhase: 'pokemon'`. These are overridden by `start.post.ts` with computed values; `combatants.post.ts` and `wild-spawn.post.ts` use the defaults.
- **Status:** CORRECT — Defaults match the old inline code in all 3 endpoints. Adding combatants or spawning wild Pokemon doesn't change phase state.
- **Refactoring impact:** NONE — Same defaults as old inline code.

### Field-by-Field Preservation Check

Verified that `buildEncounterResponse` produces identical output to old inline code for all game-mechanic-relevant fields:

| Field | combatants.post | wild-spawn.post | start.post | Notes |
|-------|:-:|:-:|:-:|-------|
| turnOrder | = | = | = (override) | |
| currentRound | = | = | = (override: 1) | |
| currentTurnIndex | = | = | = (override: 0) | |
| isActive | = | = | = (override: true) | |
| isPaused | = | = | = (override: false) | |
| trainerTurnOrder | = | = | = (override) | |
| pokemonTurnOrder | = | = | = (override) | |
| currentPhase | = | = | = (override) | |
| combatants | = | = | = | |
| weather | = | = | **+fix** | Was missing in old start.post.ts |
| moveLog | = | = | = | |
| defeatedEnemies | = | = | = | |
| gridConfig.background | = | **+fix** | **+fix** | Was `backgroundImage` (wrong) in wild-spawn and start |
| gridConfig null | **~** | **~** | **~** | Now null when disabled; 5 other endpoints already did this |

Legend: `=` identical, `+fix` bug fixed, `~` behavioral change (consistent with existing endpoints)

### Bug Fixes Verified

1. **`backgroundImage` → `background`:** Confirmed `GridConfig.background` is the correct field name per `app/types/spatial.ts:21`. The old `backgroundImage` was silently ignored by the client type system.

2. **Missing `weather` in start.post.ts:** Weather affects combat mechanics (type boost/penalty, move changes per PTU Chapter 6). Including it in the encounter response is correct.

### Issues Found

None.

### Summary

- Mechanics checked: 5
- Correct: 5
- Incorrect: 0
- Needs review: 0

## Verdict

**APPROVED** — The refactoring is purely structural. No game logic, formulas, or mechanic implementations were modified. All 5 verified mechanics (initiative sorting, phase separation, tie-breaking, turn state reset, phase defaults) are untouched by the commit and produce identical results through the canonical function. Two real bugs were fixed (wrong field name, missing weather field). No PTU rules concerns.
