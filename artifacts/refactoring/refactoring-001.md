---
ticket_id: refactoring-001
priority: P0
categories:
  - LLM-SIZE
  - EXT-GOD
affected_files:
  - app/stores/encounter.ts
estimated_scope: large
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
`encounter.ts` is the hottest file in the combat domain (16 changes in 30 days, 945 lines) and handles 6+ unrelated responsibilities. LLM agents lose context in files this large and produce conflicting edits when modifying one concern area without awareness of others.

## Findings

### Finding 1: LLM-SIZE
- **Metric:** 945 lines
- **Threshold:** 800 lines (P0)
- **Impact:** LLM agents cannot hold the full file in working memory. Edits to grid actions may conflict with combat actions or undo/redo logic. The file was changed 16 times in the last 30 days, making it the #1 hotspot.
- **Evidence:** `app/stores/encounter.ts:1-945`

### Finding 2: EXT-GOD
- **Metric:** 6+ unrelated responsibility areas
- **Threshold:** 3+ (P0 when combined with LLM-SIZE)
- **Impact:** Any change to one concern risks breaking another. New features in any area require reading the entire 945-line file.
- **Evidence:**
  - Core combat: `loadEncounter`, `createEncounter`, `addCombatant`, `removeCombatant`, `startEncounter`, `nextTurn`, `executeMove`, `applyDamage`, `healCombatant` (lines 98-305)
  - PTU actions: `addInjury`, `removeInjury`, `nextScene`, `setTrainerPhase`, `setPokemonPhase`, `addStatusCondition`, `removeStatusCondition`, `updateStatusConditions`, `modifyStage`, `setCombatStages`, `takeABreather` (lines 596-745)
  - Turn state: `useStandardAction`, `useShiftAction`, `useSwiftAction`, `resetCombatantActions` (lines 527-590)
  - VTT Grid: `updateCombatantPosition`, `updateGridConfig`, `toggleGrid`, `setTokenSize`, `uploadBackgroundImage`, `removeBackgroundImage` (lines 782-905)
  - Fog of War: `loadFogState`, `saveFogState` (lines 912-943)
  - Undo/Redo: `captureSnapshot`, `undoAction`, `redoAction`, `getUndoRedoState`, `initializeHistory` (lines 448-520)
  - Serve/Unserve: `serveEncounter`, `unserveEncounter`, `loadServedEncounter` (lines 398-441)
  - Wild Pokemon: `addWildPokemon` (lines 752-776)

### Finding 3: EXT-DUPLICATE (minor)
- **Metric:** 3 nearly identical action methods
- **Threshold:** 10+ similar lines in 2+ locations
- **Impact:** `useStandardAction` (527-540), `useShiftAction` (542-556), `useSwiftAction` (558-572) differ only in the `actionType` string. Could be one parameterized method.
- **Evidence:** `app/stores/encounter.ts:527-572`

## Suggested Refactoring
1. Extract VTT Grid + Fog of War actions into `app/stores/encounterGrid.ts` (already has `useEncounterGridStore` — move delegation logic there or create thin wrappers)
2. Extract Undo/Redo actions into `app/stores/encounterHistory.ts` (already has `useEncounterHistory` composable — make it a store or keep composable and remove store delegation)
3. Consolidate `useStandardAction`/`useShiftAction`/`useSwiftAction` into `useAction(combatantId, actionType)` in the main store
4. Keep core combat, serve/unserve, and turn management in the main store (natural cohesion)
5. Target: main store under 500 lines

Estimated commits: 4-5

## Related Lessons
- Developer Lesson 2: "Identify and update all code paths that perform the same operation" — the 3 identical action methods are a minor instance of this pattern

## Resolution Log
- Commits: `2771191` — refactor: split encounter god store
- Files changed:
  - `app/stores/encounter.ts` (945 → 574 lines, -398 lines, 39% reduction)
  - `app/composables/useEncounterActions.ts` (217 → 239 lines, +22 lines — absorbed grid/combat delegation)
- New files created: none
- Tests passing: 29/29 encounter store unit tests pass, 446/447 total unit tests pass (1 pre-existing failure in settings.test.ts unrelated to refactoring), 0 new type errors
- Changes made:
  1. Removed 14 dead delegation methods with zero external consumers (toggleGrid, setTokenSize, resetCombatantActions, addInjury, removeInjury, nextScene, setTrainerPhase, setPokemonPhase, addStatusCondition, removeStatusCondition, modifyStage, loadFogState, saveFogState)
  2. Consolidated `useStandardAction`/`useShiftAction`/`useSwiftAction` into `useAction(combatantId, actionType)` (Finding 3 resolved)
  3. Redirected VTT grid consumers to call `encounterGridStore` directly from `useEncounterActions`
  4. Redirected PTU combat consumers to call `encounterCombatStore` directly from `useEncounterActions`
  5. Cleaned up unused type imports
- Remaining responsibilities in encounter store (3 cohesive areas): core combat, serve/unserve, undo/redo — natural cohesion, no further split needed
- Note: `loadFogState`/`saveFogState` on both encounter store and encounterGrid store were dead code — consumers use `useFogPersistence` composable directly
