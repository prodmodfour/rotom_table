# Pokemon Experience Chart

`EXPERIENCE_CHART` in `utils/experienceCalculation.ts` maps levels 1–100 to cumulative XP thresholds (PTU Core p.203). Level 1 = 0 XP, Level 100 = 20,555 XP (MAX_EXPERIENCE).

## Lookup Utilities

All pure functions in `utils/experienceCalculation.ts`:

- **`getXpForLevel(level)`** — returns cumulative XP needed to reach a level. Returns 0 below level 1, MAX_EXPERIENCE above 100.
- **`getLevelForXp(totalXp)`** — walks the chart from level 100 downward to find the highest qualifying level.
- **`getXpToNextLevel(currentExperience, currentLevel)`** — returns XP remaining until the next level. 0 at max level.

## Level-Up Detection

- **`checkLevelUp(oldLevel, newLevel, learnset)`** — returns one `LevelUpInfo` per level gained: +1 stat point, new moves from learnset at exactly that level, ability milestones (level 20 second ability, level 40 third ability), and [[pokemon-tutor-points]] at level 5 and every 5 levels.
- **`summarizeLevelUps(levelUpInfos)`** — aggregates multi-level info into a single summary: totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints.
- **`calculateLevelUps(currentExperience, currentLevel, xpToAdd, learnset)`** — determines new level from the chart, then delegates to `checkLevelUp` for per-level details.

## XP Sources

XP reaches Pokemon through two paths: manual XP grants via [[pokemon-api-endpoints|POST /api/pokemon/:id/add-experience]] and post-combat distribution via the [[xp-distribution-flow]].

## See also

- [[significance-and-budget]] — encounter XP formula using significance multipliers
- [[pokemon-hp-formula]] — HP recalculated on level-up
- [[pokemon-stat-allocation]] — stat points allocated per level gained
- [[pokemon-ability-assignment]] — ability milestones at levels 20 and 40
- [[pokemon-move-learning]] — new moves available per level from learnset
