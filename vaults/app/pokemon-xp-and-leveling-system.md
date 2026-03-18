The Pokemon XP system is built around a cumulative experience chart for levels 1–100 (`app/utils/experienceCalculation.ts`).

`POST /api/pokemon/:id/add-experience` adds XP, auto-calculates level-ups, and updates tutor points and max HP. It uses `calculateLevelUps()` to determine per-level events: +1 stat point per level, new learnset moves (via the [[level-up-check-utility]]), tutor points (every 5 levels starting at level 5), ability milestones (level 20 for 2nd ability, level 40 for 3rd), and evolution eligibility.

The [[pokemon-level-up-panel]] appears in [[gm-pokemon-detail-edit-mode]] when the level increases, letting the GM allocate stat points and choose moves.

`calculateEncounterXp()` computes post-combat XP: total defeated levels (trainers count as 2x), multiplied by a significance modifier, divided by the number of player participants.

## See also

- [[pokemon-stat-allocation-enforces-base-relations]]
- [[pokemon-ability-milestone-assignment]]
- [[pokemon-level-up-allocation-composable]]
- [[trainer-xp-bank-system]] — trainer XP uses a separate, simpler bank system
