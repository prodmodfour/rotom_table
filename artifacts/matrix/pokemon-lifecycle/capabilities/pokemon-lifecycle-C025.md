---
cap_id: pokemon-lifecycle-C025
name: getXpToNextLevel
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C025: getXpToNextLevel
- **cap_id**: pokemon-lifecycle-C025
- **name**: XP to Next Level Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `getXpToNextLevel()`
- **game_concept**: Remaining XP until next level
- **description**: Pure function. Returns XP remaining until the next level. 0 if at max level. Max(0, nextLevelXp - currentExperience).
- **inputs**: currentExperience, currentLevel
- **outputs**: XP remaining number
- **accessible_from**: gm
