The file `app/constants/trainerStats.ts` defines the base values and constraints for trainer stat allocation at character creation:

- `BASE_HP` = 10 (starting HP stat before point allocation)
- `BASE_OTHER` = 5 (starting Attack, Defense, Sp.Atk, Sp.Def, Speed before allocation)
- `TOTAL_STAT_POINTS` = 10 (points available at level 1)
- `MAX_POINTS_PER_STAT` = 5 (maximum points allocatable to a single stat)

`STAT_DEFINITIONS` lists the six stats (HP, Attack, Defense, Special Attack, Special Defense, Speed) with keys and display labels.

Additional progression functions beyond [[trainer-stat-points-per-level]]:
- `getMaxSkillRankForLevel()` — level 1: Novice, 2+: Adept, 6+: Expert, 12+: Master
- `getExpectedEdgesForLevel()` — base = 4 + floor(level/2), plus bonus skill edges at levels 2, 6, 12
- `getExpectedFeaturesForLevel()` — 5 + floor((level-1)/2)

The Combat Stats section in [[full-create-mode]] displays each stat as "base + allocated = total" with increment/decrement buttons, using these constants for validation. Derived stats (Max HP, Physical/Special/Speed Evasion) update live below the stat rows.
