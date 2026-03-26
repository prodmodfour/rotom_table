# Pokemon Experience Chart

`EXPERIENCE_CHART` in `utils/experienceCalculation.ts` maps levels 1–20 to cumulative XP thresholds per [[ptr-xp-table]]. Level 1 = 0 XP, Level 20 = 20,555 XP (MAX_EXPERIENCE). The [[total-xp-unchanged|total XP to max is unchanged]] from PTU despite the compressed [[pokemon-level-range-1-to-20|1–20 level range]].

## Lookup Utilities

All pure functions in `utils/experienceCalculation.ts`:

- **`getXpForLevel(level)`** — returns cumulative XP needed to reach a level. Returns 0 below level 1, MAX_EXPERIENCE above 20.
- **`getLevelForXp(totalXp)`** — walks the chart from level 20 downward to find the highest qualifying level.
- **`getXpToNextLevel(currentExperience, currentLevel)`** — returns XP remaining until the next level. 0 at max level.

## Level-Up Detection

- **`checkLevelUp(oldLevel, newLevel)`** — returns one `LevelUpInfo` per level gained: [[five-stat-points-per-level|+5 stat points]], [[evolution-check-on-level-up|evolution check]], and new [[trait-definition|trait]] checks per [[level-up-ordered-steps]].
- **`summarizeLevelUps(levelUpInfos)`** — aggregates multi-level info into a single summary: totalStatPoints and trait/evolution checks.
- **`calculateLevelUps(currentExperience, currentLevel, xpToAdd)`** — determines new level from the chart, then delegates to `checkLevelUp` for per-level details.

## XP Sources

XP reaches Pokemon through two paths: manual XP grants via [[pokemon-api-endpoints|POST /api/pokemon/:id/add-experience]] and post-combat distribution via the [[xp-distribution-flow]].

## See also

- [[significance-and-budget]] — encounter XP formula using significance multipliers
- [[pokemon-hp-formula]] — HP recalculated on level-up
- [[pokemon-stat-allocation]] — stat points allocated per level gained
- [[pokemon-move-learning]] — moves unlocked via conditions, not level-based learnsets
