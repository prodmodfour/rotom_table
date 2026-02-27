---
cap_id: encounter-tables-C031
name: encounter-tables-C031
type: —
domain: encounter-tables
---

### encounter-tables-C031
- **name:** calculateEffectiveEnemyLevels utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEffectiveEnemyLevels()
- **game_concept:** PTU XP rules — trainer levels count double (p. 460)
- **description:** Pure function: sums enemy levels, doubling trainer levels. Returns both raw total and effective (doubled) total.
- **inputs:** Array<{ level, isTrainer }>
- **outputs:** { totalLevels, effectiveLevels }
- **accessible_from:** gm (via composable)
