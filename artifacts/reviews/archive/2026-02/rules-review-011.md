---
review_id: rules-review-011
target: refactoring-001
ticket_id: refactoring-001
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-16
trigger: refactoring-review
commits_reviewed:
  - 2771191
files_reviewed:
  - app/stores/encounter.ts
  - app/composables/useEncounterActions.ts
  - app/stores/encounterCombat.ts
  - app/constants/combatManeuvers.ts
mechanics_verified:
  - action-system
  - combat-stages
  - status-conditions
  - take-a-breather
  - maneuver-action-costs
ptu_references:
  - "core/07-combat.md: Standard/Shift/Swift actions, Take a Breather, Combat Maneuvers"
scenarios_to_rerun: []
---

## Summary

Pure structural refactoring — no PTU logic was added, removed, or altered. All 5 mechanics touched by the refactoring produce identical API calls with identical arguments to the same server endpoints. The actual PTU formulas and rules live server-side and in the sub-stores, none of which were modified.

## Mechanics Verified

### 1. Action System (Standard / Shift / Swift)

- **Rule:** PTU 1.05 p.236 — each combatant gets one Standard, one Shift, and one Swift action per turn
- **Old code:** Three separate methods (`useStandardAction`, `useShiftAction`, `useSwiftAction`) each POSTing to `/api/encounters/{id}/action` with `{ combatantId, actionType: '<type>' }`
- **New code:** Single `useAction(combatantId, actionType: 'standard' | 'shift' | 'swift')` POSTing to the same endpoint with `{ combatantId, actionType }`
- **Verification:** API endpoint, HTTP method, request body shape, and response handling are identical. TypeScript union constrains to valid action types at compile time.
- **Status:** CORRECT — identical PTU behavior

### 2. Combat Stages (setCombatStages redirect)

- **Rule:** PTU 1.05 p.238 — combat stages range -6 to +6, positive = +20%/stage, negative = -10%/stage
- **Old call chain:** `encounterStore.setCombatStages(combatantId, stages, absolute)` → `combatStore.setCombatStages(this.encounter.id, combatantId, stages, absolute)`
- **New direct call:** `encounterCombatStore.setCombatStages(encounterStore.encounter.id, combatantId, changes, absolute)`
- **Verification:** Same function on same store, same 4 arguments in same order. Stage clamping and multiplier logic lives server-side — untouched.
- **Status:** CORRECT — identical PTU behavior

### 3. Status Conditions (updateStatusConditions redirect)

- **Rule:** PTU 1.05 p.246-247 — persistent vs volatile afflictions with distinct cure mechanics
- **Old call chain:** `encounterStore.updateStatusConditions(combatantId, add, remove)` → `combatStore.updateStatusConditions(this.encounter.id, combatantId, add as any, remove as any)`
- **New direct call:** `encounterCombatStore.updateStatusConditions(encounterStore.encounter.id, combatantId, add, remove)`
- **Verification:** Same function on same store, same 4 arguments. The `as any` type casts from the old delegation are gone — the composable already passes `StatusCondition[]` matching the sub-store signature. Improved type safety, identical runtime behavior.
- **Status:** CORRECT — identical PTU behavior, improved typing

### 4. Take a Breather (takeABreather redirect)

- **Rule:** PTU 1.05 p.239 — Full Action; resets all combat stages to 0, removes all temporary HP, cures all volatile status conditions, user becomes Tripped
- **Old call chain:** `encounterStore.takeABreather(combatantId)` → `combatStore.takeABreather(this.encounter.id, combatantId)`
- **New direct call:** `encounterCombatStore.takeABreather(encounterStore.encounter.id, combatantId)`
- **Verification:** Same function on same store, same 2 arguments. Full Action cost (standard + shift) still consumed by the `handleExecuteAction` caller before invoking this. Breather logic lives server-side at `/api/encounters/{id}/breather` — untouched.
- **Status:** CORRECT — identical PTU behavior

### 5. Maneuver Action Costs (handleExecuteAction)

- **Rule:** PTU 1.05 p.239-240 — Push/Sprint/Trip/Grapple = Standard Action; Intercept/Take a Breather = Full Action (Standard + Shift)
- **Old code:** Calls `useStandardAction()` / `useShiftAction()` for each maneuver type
- **New code:** Calls `useAction(id, 'standard')` / `useAction(id, 'shift')` for each maneuver type
- **Verification:** Same action types consumed for same maneuver IDs. The `if` conditions matching maneuver IDs to action costs are unchanged. Cross-referenced against `combatManeuvers.ts` constants: push/sprint/trip/grapple = `actionType: 'standard'`, intercept-melee/intercept-ranged = `actionType: 'interrupt'` (Full + Interrupt), take-a-breather = `actionType: 'full'`. Code correctly implements all three tiers.
- **Status:** CORRECT — identical PTU behavior

## Dead Code Removal — PTU Impact Assessment

All 14 removed methods were pure delegations to sub-stores with no client-side PTU logic:

| Removed Method | Sub-store Target | PTU Logic Location |
|---|---|---|
| `addInjury` | `encounterCombat.addInjury()` | Server: `/api/encounters/{id}/injury` |
| `removeInjury` | `encounterCombat.removeInjury()` | Server: `/api/encounters/{id}/injury` |
| `nextScene` | `encounterCombat.nextScene()` | Server: `/api/encounters/{id}/next-scene` |
| `setTrainerPhase` | `encounterCombat.setPhase()` | Server: `/api/encounters/{id}/phase` |
| `setPokemonPhase` | `encounterCombat.setPhase()` | Server: `/api/encounters/{id}/phase` |
| `addStatusCondition` | `encounterCombat.addStatusCondition()` | Server: `/api/encounters/{id}/status` |
| `removeStatusCondition` | `encounterCombat.removeStatusCondition()` | Server: `/api/encounters/{id}/status` |
| `updateStatusConditions` | `encounterCombat.updateStatusConditions()` | Server: `/api/encounters/{id}/status` |
| `modifyStage` | `encounterCombat.modifyStage()` | Server: `/api/encounters/{id}/stages` |
| `setCombatStages` | `encounterCombat.setCombatStages()` | Server: `/api/encounters/{id}/stages` |
| `takeABreather` | `encounterCombat.takeABreather()` | Server: `/api/encounters/{id}/breather` |
| `resetCombatantActions` | (local state only) | No API call — dead code with 0 consumers |
| `loadFogState` / `saveFogState` | `encounterGrid.loadFogState/saveFogState()` | VTT — no PTU logic |

No PTU formulas, no PTU rule implementations, no PTU data transformations existed in any of the removed methods. All PTU logic is in the server endpoints and remains untouched.

## Pre-existing Issues

None found in the code touched by this commit. The remaining encounter store methods (damage, healing, initiative, turn progression) were not modified and are outside scope.

## Verdict

**APPROVED** — Zero PTU behavioral changes. All 5 verified mechanics produce identical API calls with identical arguments to unchanged server endpoints. No PTU logic was removed — all removed methods were pure pass-through delegations. No pre-existing PTU issues discovered in reviewed code.
