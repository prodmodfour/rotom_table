---
cap_id: encounter-tables-C030
name: encounter-tables-C030
type: —
domain: encounter-tables
---

### encounter-tables-C030
- **name:** calculateEncounterBudget utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — calculateEncounterBudget()
- **game_concept:** PTU Level Budget formula (PTU Core p. 473)
- **description:** Pure function: averagePokemonLevel * 2 * playerCount = total level budget. Returns breakdown with per-player and total budget.
- **inputs:** BudgetCalcInput { averagePokemonLevel, playerCount }
- **outputs:** BudgetCalcResult { totalBudget, levelBudgetPerPlayer, breakdown }
- **accessible_from:** gm (via composable)
