The `useLevelUpAllocation` composable (`app/composables/useLevelUpAllocation.ts`) manages the stat-point allocation workflow during Pokemon level-up on the [[gm-pokemon-detail-page]].

It tracks pending stat point allocations, validates each allocation against the [[pokemon-stat-allocation-enforces-base-relations]] rule, checks for [[pokemon-ability-milestone-assignment]] events, and identifies new learnset moves.

The composable submits the final allocation via `POST /api/pokemon/:id/allocate-stats`. This endpoint validates the total budget and base relations server-side, then updates calculated stats and max HP.

## See also

- [[pokemon-level-up-panel]]
- [[pokemon-xp-and-leveling-system]]
