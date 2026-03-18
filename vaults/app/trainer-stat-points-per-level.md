The `getStatPointsForLevel()` function in `app/constants/trainerStats.ts` computes the total stat point budget as `10 + (level - 1)`. A level 1 trainer has 10 points; a level 2 trainer has 11.

The [[trainer-level-up-stat-allocation-step]] uses this to determine how many new points are available — always 1 per level gained.

The constant `TOTAL_STAT_POINTS = 10` represents the base allocation at level 1, matching the [[full-create-combat-stats-section]] budget. The [[combat-stat-allocation-base-values]] describes the full set of base values and progression functions.
