# Pokemon Stat Allocation

Level-up stat point allocation. Each level grants 5 stat points, distributed freely across any stats with no ordering constraints.

## Pure logic

`utils/statAllocation.ts` — `extractStatPoints` (with warnings), `formatStatName`.

## Composable

`composables/useLevelUpAllocation.ts` — reactive stat allocation workflow: pending allocation, budget tracking (5 × level total), submit to server, `hasPendingActions`.

## Component

`components/pokemon/StatAllocationPanel.vue` — interactive stat point allocation UI with +/- controls and partial allocation with confirmation. Per [[five-stat-points-per-level]], total budget = 5 × level. Per [[base-stat-relations-removed]], no ordering constraints.

## API

POST `/api/pokemon/:id/allocate-stats` — incremental or batch mode, applies PTR HP formula. See [[pokemon-api-endpoints]].

## See also

- [[pokemon-api-endpoints]]
- [[pokemon-evolution-system]]
- [[pokemon-hp-formula]] — HP recalculated when HP stat points are allocated
