---
cap_id: combat-C071
name: analyzeEncounterBudget
type: utility
domain: combat
---

### combat-C071: analyzeEncounterBudget
- **cap_id**: combat-C071
- **name**: Budget Analysis
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `analyzeEncounterBudget()`
- **game_concept**: Encounter difficulty assessment
- **description**: Budget, effective enemy levels (trainers double), ratio, difficulty label.
- **inputs**: BudgetCalcInput, enemies[]
- **outputs**: BudgetAnalysis
- **accessible_from**: gm
