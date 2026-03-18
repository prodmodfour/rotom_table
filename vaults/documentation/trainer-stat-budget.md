# Trainer Stat Budget

Constants and budget functions in `constants/trainerStats.ts` governing character creation and level-up stat allocation.

## Base Values

| Constant | Value | Meaning |
|---|---|---|
| `BASE_HP` | 10 | Starting HP base before stat contribution |
| `BASE_OTHER` | 5 | Starting base for non-HP stats |
| `TOTAL_STAT_POINTS` | 10 | Stat points available at level 1 |
| `MAX_POINTS_PER_STAT` | 5 | Per-stat cap at level 1 |

PTU Trainer HP formula: `Level × 2 + HP Stat × 3 + 10`.

## Budget Functions

- **getStatPointsForLevel(level)** — total stat point budget at a given level
- **getMaxSkillRankForLevel(level)** — skill rank cap by level (used by [[character-creation-validation]] and [[trainer-level-up-wizard]])
- **isSkillRankAboveCap(rank, level)** — checks if a rank exceeds the level-based cap
- **getExpectedEdgesForLevel(level)** — returns `{base, bonusSkillEdges, total}` edge budget
- **getExpectedFeaturesForLevel(level)** — feature budget by level

## See also

- [[character-creation-composable]]
- [[character-creation-validation]]
- [[trainer-level-up-wizard]]
- [[trainer-derived-stats]]
