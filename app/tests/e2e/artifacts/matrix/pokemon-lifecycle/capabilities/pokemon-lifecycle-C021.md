---
cap_id: pokemon-lifecycle-C021
name: calculateLevelUps
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C021: calculateLevelUps
- **cap_id**: pokemon-lifecycle-C021
- **name**: XP Application Level-Up Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `calculateLevelUps()`
- **game_concept**: Determine level-ups from XP gain (Core p.202-203)
- **description**: Pure function. Given current experience/level and XP to add, determines new level via EXPERIENCE_CHART lookup, then delegates to checkLevelUp() for per-level details. Returns XpApplicationResult with previousExperience, newExperience, levelsGained, and LevelUpEvent array.
- **inputs**: currentExperience, currentLevel, xpToAdd, learnset?, evolutionLevels?
- **outputs**: Omit<XpApplicationResult, 'pokemonId' | 'species'>
- **accessible_from**: api-only
