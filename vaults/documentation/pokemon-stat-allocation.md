# Pokemon Stat Allocation

Level-up stat point allocation following the PTU Base Relations Rule.

## Pure logic

`utils/baseRelations.ts` — `buildStatTiers`, `validateBaseRelations`, `getValidAllocationTargets`, `extractStatPoints` (with warnings), `formatStatName`. Implements decree-035 ordering.

## Composable

`composables/useLevelUpAllocation.ts` — reactive stat allocation workflow: pending allocation, validation, valid targets, budget tracking, submit to server, `pendingAbilityMilestone`, `pendingNewMoves`, `hasPendingActions`.

## Component

`components/pokemon/StatAllocationPanel.vue` — interactive stat point allocation UI with tier display, +/- controls, validation feedback, and partial allocation with confirmation.

## API

POST `/api/pokemon/:id/allocate-stats` — incremental or batch mode, applies PTU HP formula. See [[pokemon-api-endpoints]].

## See also

- [[pokemon-api-endpoints]]
- [[pokemon-evolution-system]]
- [[pokemon-hp-formula]] — HP recalculated when HP stat points are allocated
