---
cap_id: encounter-tables-C033
name: encounter-tables-C033
type: —
domain: encounter-tables
---

### encounter-tables-C033
- **name:** calculateEncounterXp utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEncounterXp()
- **game_concept:** PTU XP calculation (PTU Core p. 460)
- **description:** Pure function: effectiveEnemyLevels * significanceMultiplier / playerCount. Returns totalXp, xpPerPlayer, and baseXp.
- **inputs:** Array<{ level, isTrainer }>, significanceMultiplier, playerCount
- **outputs:** { totalXp, xpPerPlayer, baseXp }
- **accessible_from:** gm (via composable)
