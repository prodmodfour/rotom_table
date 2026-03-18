Stat point allocation for Pokemon enforces the Base Relations Rule (`app/utils/baseRelations.ts`). This rule requires that the ordering of allocated stat points matches the ordering of the Pokemon's base stats. A stat with a higher base stat must have at least as many allocated points as a stat with a lower base stat.

`validateBaseRelations()` checks whether a proposed allocation satisfies this constraint. `getValidAllocationTargets()` determines which stats can legally receive the next point.

The total stat point budget is always `level + 10`.

This validation applies in three contexts:
- Manual stat allocation during [[pokemon-level-up-panel]] interactions
- The `POST /api/pokemon/:id/allocate-stats` endpoint
- Stat redistribution during the [[evolution-confirm-modal]]

The [[pokemon-generator-service]] uses a weighted random distribution followed by `enforceBaseRelations()` post-processing to ensure auto-generated Pokemon also comply.
