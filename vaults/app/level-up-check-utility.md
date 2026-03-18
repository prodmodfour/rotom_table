The level-up check utility (`app/utils/levelUpCheck.ts`) provides pure functions for determining what happens when a Pokemon levels up.

`checkLevelUp({ oldLevel, newLevel, learnset })` iterates each level from `oldLevel + 1` to `newLevel` and returns a `LevelUpInfo` per level: new moves available (learnset entries at exactly that level), whether an ability milestone is reached (level 20 for 2nd, level 40 for 3rd), tutor point gains (every 5 levels starting at 5), and always +1 stat point.

`summarizeLevelUps(infos)` aggregates multiple levels into a single summary: total stat points, combined new moves, all ability milestones, and total tutor points.

The new moves identified here are names from the [[species-learnset-stored-as-json]]. The [[move-learning-panel]] receives these names and fetches their full details from the [[batch-move-lookup-api]].

## See also

- [[pokemon-level-up-panel]] — the UI that displays the results
- [[pokemon-xp-and-leveling-system]] — triggers level-up checks after XP gain
