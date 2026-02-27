---
cap_id: pokemon-lifecycle-C019
name: summarizeLevelUps
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C019: summarizeLevelUps
- **cap_id**: pokemon-lifecycle-C019
- **name**: Level-Up Summary Aggregator
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -- `summarizeLevelUps()`
- **game_concept**: Aggregate multi-level level-up info for display
- **description**: Pure function. Combines array of LevelUpInfo into a single summary: totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints. Used by level-up-check endpoint for single notification display.
- **inputs**: LevelUpInfo[]
- **outputs**: { totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints }
- **accessible_from**: api-only
