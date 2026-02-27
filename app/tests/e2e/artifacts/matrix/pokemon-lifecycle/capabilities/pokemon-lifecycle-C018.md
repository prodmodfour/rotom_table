---
cap_id: pokemon-lifecycle-C018
name: checkLevelUp
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C018: checkLevelUp
- **cap_id**: pokemon-lifecycle-C018
- **name**: Per-Level Level-Up Info Calculator
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -- `checkLevelUp()`
- **game_concept**: PTU level-up effects (Core Chapter 5, pp.201-202)
- **description**: Pure function. Returns array of LevelUpInfo (one per level gained): +1 stat point per level, new moves from learnset at exactly that level, ability milestones (level 20: second ability, level 40: third ability), tutor points at level 5 and every 5 levels. Does NOT handle evolution (conditions vary by species).
- **inputs**: { oldLevel, newLevel, learnset: LearnsetEntry[] }
- **outputs**: LevelUpInfo[] with newMoves, abilityMilestone, tutorPointGained per level
- **accessible_from**: api-only
