---
id: feature-007
title: Pokemon Level-Up Allocation UI
priority: P1
severity: HIGH
status: in-progress
domain: pokemon-lifecycle
source: matrix-gap (GAP-PLC-2)
matrix_source: pokemon-lifecycle R014, R015, R027, R028
created_by: master-planner
created_at: 2026-02-28
design_ref: artifacts/designs/design-level-up-allocation-001/
---

# feature-007: Pokemon Level-Up Allocation UI

## Summary

Level-up milestones are detected and displayed (`checkLevelUp`, `PokemonLevelUpPanel`, `LevelUpNotification`) but there is no UI for the GM to act on them. Stat point allocation, ability assignment at levels 20/40, and move learning all require manual JSON editing. 4 matrix rules classified as Partial.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R014 | Abilities — Level 20 | Partial — milestone detected, no assignment UI |
| R015 | Abilities — Level 40 | Partial — milestone detected, no assignment UI |
| R027 | Level Up — Stat Point | Partial — +1 stat point reported, no allocation UI enforcing Base Relations Rule |
| R028 | Level Up — Move Check | Partial — new moves reported from learnset, no UI to add to active set |

## PTU Rules

- Level 20: choose second ability from Basic/Advanced list
- Level 40: choose third ability from any list (Basic/Advanced/High)
- Each level: +1 stat point allocated to any base stat (must respect Base Relations Rule)
- Each level: check learnset for new moves, optionally add to active move set (max 6)

## Implementation Scope

FULL-scope feature requiring design spec. Interacts with existing `PokemonLevelUpPanel` and `LevelUpNotification` components.

## Affected Areas

- `app/components/pokemon/PokemonLevelUpPanel.vue` — add allocation controls
- `app/components/pokemon/LevelUpNotification.vue` — add action buttons
- `app/server/api/pokemon/` — stat allocation + ability assignment endpoints
- `app/composables/` — level-up allocation logic

## Design Reference

Full design spec: [`design-level-up-allocation-001`](../../../designs/design-level-up-allocation-001/_index.md)

### Priority Tiers

- **P0:** Stat point allocation with Base Relations validation (R027)
  - `app/utils/baseRelations.ts` — validation utility (shared with evolution)
  - `POST /api/pokemon/:id/allocate-stats` — stat allocation endpoint
  - `app/composables/useLevelUpAllocation.ts` — client-side state
  - `app/components/pokemon/StatAllocationPanel.vue` — interactive UI
- **P1:** Ability assignment at levels 20/40 + move learning (R014, R015, R028)
  - `POST /api/pokemon/:id/assign-ability` — ability assignment endpoint
  - `POST /api/pokemon/:id/learn-move` — move learning endpoint
  - `app/components/pokemon/AbilityAssignmentPanel.vue` — ability picker
  - `app/components/pokemon/MoveLearningPanel.vue` — move selection UI

## Resolution Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-28 | a873c1a | Design spec created (5 files in design-level-up-allocation-001/) |
| 2026-02-28 | 4dd592e | P0: baseRelations.ts shared utility (validation, extraction, targets) |
| 2026-02-28 | 5130701 | P0: refactor evolutionCheck to delegate to shared baseRelations |
| 2026-02-28 | 43b7f52 | P0: POST /api/pokemon/:id/allocate-stats endpoint |
| 2026-02-28 | e8b6b0c | P0: useLevelUpAllocation composable |
| 2026-02-28 | 09e6025 | P0: StatAllocationPanel.vue component |
| 2026-02-28 | 1460447 | P0: Integrate StatAllocationPanel into PokemonLevelUpPanel |
| 2026-02-28 | b546d5b | P0: Add allocation navigation link to LevelUpNotification |
| 2026-03-01 | 24b84d1 | Fix: add warnings field to extractStatPoints for negative clamping visibility |
| 2026-03-01 | abb33a1 | Fix: replace hardcoded gap with $spacing-xs in allocate-link SCSS |
| 2026-03-01 | bb3422e | Fix: allow partial stat allocation with confirmation dialog |
| 2026-03-01 | a1b4337 | Test: 37 unit tests for baseRelations.ts (all 4 functions + integration) |
| 2026-03-01 | 44e0d46 | Docs: add level-up allocation files to app-surface.md |
| 2026-03-01 | d1cd4197 | P1: getAbilityPool() utility for ability pool computation |
| 2026-03-01 | 2669e244 | P1: POST /api/abilities/batch endpoint |
| 2026-03-01 | ef9b9e94 | P1: POST /api/pokemon/:id/assign-ability endpoint |
| 2026-03-01 | a20e2ff3 | P1: AbilityAssignmentPanel.vue component |
| 2026-03-01 | da1fcef5 | P1: POST /api/moves/batch endpoint |
| 2026-03-01 | 43d8c40d | P1: POST /api/pokemon/:id/learn-move endpoint |
| 2026-03-01 | c14dbddf | P1: MoveLearningPanel.vue component |
| 2026-03-01 | 1d7828fc | P1: Extend useLevelUpAllocation with ability/move state |
| 2026-03-01 | 555f9b74 | P1: LevelUpNotification clickable ability/move action buttons |
| 2026-03-01 | dcf67640 | P1: GET /api/species/:name endpoint for ability data |
| 2026-03-01 | 7ea7658e | P1: PokemonLevelUpPanel inline ability/move panels |
| 2026-03-01 | 3bbbb00d | P1: XpDistributionResults ability/move event wiring |
