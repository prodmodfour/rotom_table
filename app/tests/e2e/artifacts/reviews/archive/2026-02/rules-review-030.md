---
review_id: rules-review-030
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-029, refactoring-030, refactoring-027
domain: healing, encounter
commits_reviewed:
  - 7783c65
  - 29c270f
  - 5583fa1
  - f82c28d
  - 5d6a26f
mechanics_verified:
  - persistent-affliction-taxonomy
  - extended-rest-description
  - wild-encounter-creation-workflow
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Persistent-Afflictions
  - core/07-combat.md#Volatile-Afflictions
  - core/07-combat.md#Resting
reviewed_at: 2026-02-18T19:00:00
---

## Review Scope

Three tickets resolved across 5 commits:

1. **ptu-rule-029** (commit `7783c65`): Remove "Asleep" from persistent conditions parenthetical in `HealingTab.vue` extended rest description text.
2. **refactoring-030** (commits `29c270f`, `5583fa1`): Extract `useEncounterCreation` composable from duplicate wild encounter creation workflow in `habitats/[id].vue` and `encounter-tables.vue`.
3. **refactoring-027** (commits `f82c28d`, `5d6a26f`): Decompose `encounter-tables.vue` (927 -> 443 lines) by extracting `ImportTableModal` component and replacing inline generate modal with existing `GenerateEncounterModal` component.

## Mechanics Verified

### Persistent Affliction Taxonomy

- **Rule:** Persistent Afflictions are: Burned, Frozen, Paralyzed, Poisoned (including Badly Poisoned variant). (`core/07-combat.md#Persistent-Afflictions`, p.246). Sleep (Bad Sleep / Good Sleep) is enumerated under Volatile Afflictions (`core/07-combat.md#Volatile-Afflictions`, p.247).
- **Implementation:** After commit `7783c65`, extended rest description for Pokemon reads: "clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned)". Asleep removed from parenthetical.
- **Status:** CORRECT
- **Notes:** The four named conditions match the PTU enumeration exactly. Badly Poisoned is a severity variant of Poisoned (described within the Poisoned subsection on p.246), so "Poisoned" in the parenthetical covers both.

### Extended Rest Description

- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP. Daily-Frequency Moves are also regained during an Extended Rest." (`core/07-combat.md#Resting`, p.252)
- **Implementation:** Pokemon description: "Heal HP for 4 hours, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned), restore daily moves." Character description: "Heal HP for 4 hours, clear persistent status conditions, restore drained AP."
- **Status:** CORRECT
- **Notes:** Both descriptions accurately summarize the PTU extended rest rules. Pokemon version mentions daily moves (correct per PTU). Character version mentions drained AP (correct per PTU).

### Wild Encounter Creation Workflow

- **Rule:** No specific PTU rule governs encounter creation workflow (this is app orchestration). Verified that the default battle mode (`full_contact`) and enemy side assignment (`enemies`) are appropriate for wild encounters, since wild Pokemon engage in direct combat (not League/Trainer battles).
- **Implementation:** `useEncounterCreation.createWildEncounter()` calls `createEncounter(tableName, 'full_contact')` -> `addWildPokemon(pokemon, 'enemies')` -> `serveEncounter()` -> `router.push('/gm')`. Both `habitats/[id].vue` and `encounter-tables.vue` now use this composable.
- **Status:** CORRECT
- **Notes:** The composable faithfully reproduces the original inline workflow from both pages. No game mechanics were altered. Battle mode `full_contact` is appropriate for wild encounters. Pokemon are correctly placed on the `enemies` side.

## Summary

- Mechanics checked: 3
- Correct: 3
- Incorrect: 0
- Needs review: 0

## Rulings

None required. All mechanics are unambiguous.

## Verdict

APPROVED — All PTU mechanics are correctly implemented. The ptu-rule-029 fix correctly removes the Volatile affliction "Asleep" from the Persistent conditions list. The refactoring commits (030, 027) are pure structural changes that preserve identical game logic behavior.

## Required Changes

None.

## Non-PTU Observations

The `encounter-tables.vue` `handleAddToScene` error handler stores errors in a local `addError` ref, but the `GenerateEncounterModal` receives only `encounterCreation.error.value` via its `:add-error` prop (not the combined `encounterCreation.error.value || addError` used in `habitats/[id].vue`). This means scene-add errors won't display in the modal. This is a UI bug, not a PTU rule issue, so it does not affect the verdict. Filed as **refactoring-035**.
