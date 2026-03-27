# Pokemon HP Formula

Pokemon max HP = `(Level × 5) + (HP_stat × 3) + 10` (PTR).

The `maxHp` field on the Pokemon model stores this calculated value. It is recalculated on level-up: the level component increases by 1 per level gained. The HP stat component only changes when stat points are manually allocated via [[pokemon-stat-allocation]].

## Full-HP Preservation

When a Pokemon levels up and was at full HP before the level increase, `currentHp` is also increased to match the new `maxHp`. This prevents a healthy Pokemon from appearing damaged after gaining XP.

## Recalculation Points

- [[xp-distribution-flow|POST /api/encounters/:id/xp-distribute]] — on level-up from combat XP

## See also

- [[pokemon-experience-chart]] — level-up detection triggers HP recalculation
- [[pokemon-stat-allocation]] — stat point allocation can change HP stat
