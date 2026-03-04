---
review_id: rules-review-189
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-037, refactoring-094
domain: combat
commits_reviewed:
  - 8b306f7
  - 3f779f8
mechanics_verified:
  - rough-terrain-accuracy-penalty
  - enemy-occupied-rough-terrain
  - endpoint-exclusion
  - naturewalk-bypass-scope
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Rough-Terrain
  - core/07-combat.md#Terrain-Types
reviewed_at: 2026-02-28T02:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Rough Terrain Accuracy Penalty (PTU p.231)

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." and "Squares occupied by enemies always count as Rough Terrain." (`core/07-combat.md`, lines 476-485)
- **Implementation:** `useMoveCalculation.ts` lines 108-127 compute `enemyOccupiedCells` by iterating `allCombatants.value`, filtering to enemy-side combatants via `isEnemySide()`, and collecting all cells they occupy (including multi-cell tokens). The `targetsThroughRoughTerrain()` function (lines 146-220) traces a Bresenham line from attacker to target and returns `true` if any intermediate cell is in `enemyOccupiedCells` or has a painted rough flag. `getRoughTerrainPenalty()` (lines 233-238) returns a flat `2` if rough terrain is found, `0` otherwise. This penalty is added to the accuracy threshold in `getAccuracyThreshold()` (line 396).
- **Status:** CORRECT

The flat -2 penalty (not cumulative per cell) matches the PTU text. The penalty correctly increases the accuracy threshold, making it harder to hit.

### 2. Enemy-Occupied Rough Terrain Data Source (decree-003)

- **Rule:** Per decree-003: "All tokens are passable; enemy-occupied squares count as rough terrain per PTU p.231." Enemy squares impose the rough terrain accuracy penalty (-2) when targeting through them.
- **Implementation (before fix):** `MoveTargetModal.vue` called `useMoveCalculation(moveRef, actorRef, targetsRef, targetsRef)` — passing `targetsRef` as the 4th argument (`allCombatants`). This meant `enemyOccupiedCells` could only see enemies that were also in the target list. Non-target enemies standing along the line of sight were invisible to the rough terrain check.
- **Implementation (after fix, commit 8b306f7):** `MoveTargetModal.vue` now imports `useEncounterStore()` (line 233), creates `allEncounterCombatants` as `computed(() => encounterStore.encounter?.combatants ?? [])` (lines 254-256), and passes this as the 4th argument: `useMoveCalculation(moveRef, actorRef, targetsRef, allEncounterCombatants)` (line 296).
- **Status:** CORRECT

The encounter store's `combatants` array contains every combatant in the encounter (confirmed in `app/stores/encounter.ts` — the state holds a full `Encounter` object with all combatants). The `enemyOccupiedCells` computed in `useMoveCalculation.ts` line 112 now iterates the complete list, correctly identifying all enemy-occupied squares for the LoS rough terrain trace. This is the correct fix for bug-037.

### 3. Endpoint Exclusion (decree-025)

- **Rule:** Per decree-025: "Only intervening rough terrain (between attacker and target) triggers the -2 accuracy penalty; endpoint cells are excluded."
- **Implementation:** `targetsThroughRoughTerrain()` (lines 156-168) builds `actorCells` and `targetCells` sets for all cells occupied by the actor and target tokens. The Bresenham loop (line 190) checks `if (!actorCells.has(key) && !targetCells.has(key))` before evaluating rough terrain — correctly excluding both endpoint tokens from the penalty check.
- **Status:** CORRECT

Multi-cell tokens are properly handled: all cells of the actor and target tokens are excluded, not just anchor positions.

### 4. Naturewalk Bypass Scope

- **Rule:** PTU p.322: "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." Per decree-003 implementation note: "Enemy-occupied rough terrain is a game mechanic, NOT painted terrain. Naturewalk does NOT bypass enemy-occupied rough."
- **Implementation:** In `targetsThroughRoughTerrain()` lines 191-203, the code first checks `enemyOccupiedCells` (returns `true` immediately — no Naturewalk check). Only for painted terrain cells (lines 198-203) does it check `naturewalkBypassesTerrain(actor.value, baseType)`. The `naturewalkBypassesTerrain()` utility in `app/utils/combatantCapabilities.ts` (lines 257-273) has an explicit doc comment confirming enemy-occupied rough is excluded from Naturewalk bypass.
- **Status:** CORRECT

The ordering of checks (enemy-occupied first, painted terrain second with Naturewalk exemption) correctly distinguishes game-mechanic rough terrain from terrain-based rough terrain, per decree-003.

### 5. combatantsOnGrid Removal (refactoring-094)

- **Rule:** N/A (code hygiene, no PTU mechanic change)
- **Implementation (commit 3f779f8):** Removed the `combatantsOnGrid` computed (which was `computed(() => allCombatants.value)` — a trivial identity passthrough). Replaced its single usage in `enemyOccupiedCells` (line 112) with direct `allCombatants.value`. Grep confirms zero remaining references to `combatantsOnGrid` in the codebase.
- **Status:** CORRECT

No behavioral change. The refactoring is mechanically equivalent — `allCombatants.value` was the only data source for `combatantsOnGrid`, and it now serves `enemyOccupiedCells` directly.

## Summary

The fix correctly addresses bug-037. Before the fix, `MoveTargetModal` passed `targetsRef` (the selectable target list, typically a subset of encounter combatants) as both the `targets` and `allCombatants` arguments to `useMoveCalculation()`. This caused the `enemyOccupiedCells` computed to only see enemies that were also valid targets — non-target enemies along the line of sight were invisible, meaning the decree-003 rough terrain penalty would not fire for them.

After the fix, the component sources `allCombatants` from `encounterStore.encounter?.combatants`, which is the complete combatant roster. The `enemyOccupiedCells` computed now correctly sees all enemies on the grid, regardless of whether they are in the target list. The Bresenham LoS trace can now detect any non-target enemy-occupied square along the attack path and apply the -2 accuracy penalty per PTU p.231 and decree-003.

The refactoring-094 change (removing the trivial `combatantsOnGrid` passthrough) is mechanically neutral and leaves no dangling references.

## Rulings

No new ambiguities discovered. All mechanics align with PTU 1.05 RAW and active decrees:

- **decree-003** (enemy-occupied rough terrain): Fully respected. All combatants now visible to the rough terrain check.
- **decree-025** (endpoint exclusion): Fully respected. Both actor and target cells excluded from intermediate rough terrain check.

## Verdict

**APPROVED** — Both bug-037 and refactoring-094 are correct. The rough terrain accuracy penalty now correctly fires for non-target enemies along the line of sight, per PTU p.231 and decree-003. No regressions introduced.

## Required Changes

None.
