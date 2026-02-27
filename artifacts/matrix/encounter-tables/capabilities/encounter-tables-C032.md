---
cap_id: encounter-tables-C032
name: encounter-tables-C032
type: —
domain: encounter-tables
---

### encounter-tables-C032
- **name:** analyzeEncounterBudget utility
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` — analyzeEncounterBudget()
- **game_concept:** Encounter difficulty assessment
- **description:** Full budget analysis combining budget calculation and enemy level analysis. Computes budgetRatio (effective enemy levels / total budget) and assesses difficulty: trivial (<0.4), easy (0.4-0.7), balanced (0.7-1.3), hard (1.3-1.8), deadly (>1.8).
- **inputs:** BudgetCalcInput, Array<{ level, isTrainer }>
- **outputs:** BudgetAnalysis { totalEnemyLevels, budget, budgetRatio, difficulty, hasTrainerEnemies, effectiveEnemyLevels }
- **accessible_from:** gm (via composable)
