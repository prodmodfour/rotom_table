---
review_id: code-review-012
target: refactoring-001
ticket_id: refactoring-001
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16
commits_reviewed:
  - 2771191
files_reviewed:
  - app/stores/encounter.ts
  - app/composables/useEncounterActions.ts
scenarios_to_rerun: []
---

## Summary

Clean, well-executed refactoring of the #1 hotspot file in the codebase. The encounter store went from 945 to 574 lines (39% reduction) by removing 14 verified-dead delegation methods, consolidating 3 identical action methods into one, and redirecting VTT grid and PTU combat consumers to call sub-stores directly from the `useEncounterActions` composable. No functional changes, no broken call sites, no new mutation risks.

## Verification Results

### Dead Code Removal (14 methods) — VERIFIED

All 14 removed methods were confirmed to have **zero external consumers** via exhaustive grep across all `.ts` and `.vue` files:

| Method | Status | Notes |
|--------|--------|-------|
| `toggleGrid` | SAFE | VTTContainer.vue has its own local function, not a store call |
| `setTokenSize` | SAFE | Only definition in encounterGrid.ts |
| `resetCombatantActions` | SAFE | Zero references anywhere |
| `addInjury` | SAFE | Only definition in encounterCombat.ts |
| `removeInjury` | SAFE | Only definition in encounterCombat.ts |
| `nextScene` | SAFE | Only definition in encounterCombat.ts |
| `setTrainerPhase` | SAFE | Zero references anywhere |
| `setPokemonPhase` | SAFE | Zero references anywhere |
| `addStatusCondition` | SAFE | Only definition in encounterCombat.ts |
| `removeStatusCondition` | SAFE | Only definition in encounterCombat.ts |
| `modifyStage` | SAFE | Only definition in encounterCombat.ts |
| `loadFogState` | SAFE | Consumers use `useFogPersistence` composable → encounterGrid store |
| `saveFogState` | SAFE | Consumers use `useFogPersistence` composable → encounterGrid store |
| `useStandardAction`/`useShiftAction`/`useSwiftAction` | SAFE | Replaced by `useAction`; zero remaining references |

### Action Consolidation (Finding 3) — CORRECT

`useStandardAction`, `useShiftAction`, `useSwiftAction` collapsed into `useAction(combatantId, actionType: 'standard' | 'shift' | 'swift')`. The type union prevents invalid action types at compile time. All 7 call sites in `useEncounterActions.ts` updated correctly:

- `handleAction` (line 31-33): switch → `includes()` check + cast
- `handleExecuteAction` (lines 132, 136-137, 150): direct calls with string literal types
- Error message uses template literal for context: `` `Failed to use ${actionType} action` ``

### Consumer Redirect (VTT Grid + PTU Combat) — CORRECT

Six handlers in `useEncounterActions.ts` now call sub-stores directly instead of going through encounter store delegation:

| Handler | Old Target | New Target | Local State Update |
|---------|-----------|-----------|-------------------|
| `handleStages` | `encounterStore.setCombatStages()` | `encounterCombatStore.setCombatStages()` | `encounterStore.encounter = result` |
| `handleStatus` | `encounterStore.updateStatusConditions()` | `encounterCombatStore.updateStatusConditions()` | `encounterStore.encounter = result` |
| `handleExecuteAction` (breather) | `encounterStore.takeABreather()` | `encounterCombatStore.takeABreather()` | `encounterStore.encounter = result` |
| `handleGridConfigUpdate` | `encounterStore.updateGridConfig()` | `encounterGridStore.updateGridConfig()` | Spread-assign to `gridConfig` |
| `handleTokenMove` | `encounterStore.updateCombatantPosition()` | `encounterGridStore.updateCombatantPosition()` | `localCombatant.position = position` |
| `handleBackgroundUpload` | `encounterStore.uploadBackgroundImage()` | `encounterGridStore.uploadBackgroundImage()` | Spread-assign to `gridConfig` |
| `handleBackgroundRemove` | `encounterStore.removeBackgroundImage()` | `encounterGridStore.removeBackgroundImage()` | Spread-assign to `gridConfig` |

All seven add `if (!encounterStore.encounter) return` guards, consistent with the rest of the composable.

### Mutation Pattern Analysis — NO NEW RISKS

Every mutation in the new composable code is a line-for-line port of the pattern that existed in the old encounter store actions:

- `localCombatant.position = position` (line 186) — old `updateCombatantPosition` did identical nested mutation inside a store action
- `encounterStore.encounter.gridConfig = { ...spread }` — old `updateGridConfig`, `uploadBackgroundImage`, `removeBackgroundImage` used identical spread-assign
- `encounterStore.encounter = await subStore.method()` — old delegation methods did `this.encounter = await combatStore.method()`

Pinia state is backed by `reactive()` and supports direct mutation from anywhere. The pre-existing "pass" handler (lines 155-158) already mutated `combatant.turnState` from the composable. Zero new patterns introduced.

### Error Handling — ACCEPTABLE CHANGE

The old delegation methods set `encounterStore.error` before re-throwing. The new direct calls skip this. This is a behavior difference, but:

- **No UI reads `encounterStore.error`** — verified via grep across all `.vue` files. Zero matches.
- Errors still propagate (nothing is silently swallowed).
- The pattern is consistent with how the composable's own handlers already work.

### Tests — VERIFIED

- 446/447 unit tests pass. The 1 failure is pre-existing in `settings.test.ts` (expects `'set'`, gets `'rolled'` — unrelated to refactoring).
- 34 "failed" test files are Playwright e2e specs incorrectly collected by vitest — pre-existing config issue, not related to this change.

### Line Count — VERIFIED

- `encounter.ts`: 574 lines (confirmed via `wc -l`). Well under 800-line P0 threshold.
- `useEncounterActions.ts`: 239 lines. Healthy size.
- Ticket suggested "under 500 lines" — 574 is above that aspiration but the remaining code is 3 cohesive responsibility areas (core combat, serve/unserve, undo/redo) that all need direct access to `this.encounter` state. Splitting further would create artificial cross-store dependencies. 574 is the right size.

## What Looks Good

- **Approach**: Removing dead delegation instead of moving code between files is the simpler, lower-risk path. The sub-stores already existed and already had the real implementations. The worker correctly identified that these were pure pass-throughs and removed them rather than shuffling code.
- **Commit hygiene**: Single commit, descriptive message with line-item changes, correct conventional commit prefix.
- **Resolution log**: Thorough — lists specific methods removed, consumer redirects, remaining responsibilities, and the fog state dead code finding.
- **Guard consistency**: All redirected handlers got `if (!encounterStore.encounter) return` guards matching the pattern used throughout the composable.

## Verdict

**APPROVED** — Refactoring is correct, no functional changes, no broken consumers, no new risks. The encounter store is now within healthy bounds and the remaining responsibilities are cohesive.

No scenarios need re-running — this is a pure dead-code removal + consumer redirect with no behavioral changes visible to the API or UI layers.
