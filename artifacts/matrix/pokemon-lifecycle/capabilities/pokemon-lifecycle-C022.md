---
cap_id: pokemon-lifecycle-C022
name: enrichDefeatedEnemies
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C022: enrichDefeatedEnemies
- **cap_id**: pokemon-lifecycle-C022
- **name**: Defeated Enemy Enrichment
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `enrichDefeatedEnemies()`
- **game_concept**: Trainer identification for XP 2x multiplier
- **description**: Pure function. Converts raw defeated enemy entries (from encounter JSON) into DefeatedEnemy shape. Determines isTrainer via the type field on the entry (new entries) or fallback trainerEnemyIds (legacy). Default false.
- **inputs**: RawDefeatedEnemy[], optional trainerEnemyIds string[]
- **outputs**: DefeatedEnemy[] with isTrainer flag
- **accessible_from**: api-only
