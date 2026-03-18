The level-up panel appears on the [[gm-pokemon-detail-page]] when a Pokemon's level is increased during [[gm-pokemon-detail-edit-mode]]. It is driven by the [[pokemon-level-up-allocation-composable]].

The panel shows:
- Stat point allocation — one point per level gained, constrained by [[pokemon-stat-allocation-enforces-base-relations]]
- New learnset moves available at the target level, identified by the [[level-up-check-utility]] and displayed in the [[move-learning-panel]]
- Ability milestones if the level crosses 20 or 40 (see [[pokemon-ability-milestone-assignment]])

Stat allocation is submitted via `POST /api/pokemon/:id/allocate-stats`, which validates the budget (`level + 10` total points) and base relations, then recalculates combat stats and max HP using the formula `level + (hpStat * 3) + 10`.
