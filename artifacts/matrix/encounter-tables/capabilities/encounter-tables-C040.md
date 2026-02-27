---
cap_id: encounter-tables-C040
name: encounter-tables-C040
type: —
domain: encounter-tables
---

### encounter-tables-C040
- **name:** useEncounterBudget composable
- **type:** composable-function
- **location:** `app/composables/useEncounterBudget.ts`
- **game_concept:** Reactive encounter budget analysis
- **description:** Wraps encounterBudget.ts for Vue components. analyzeCurrent(averagePokemonLevel) computes BudgetAnalysis for the active encounter by extracting player count and enemy levels from the encounter store. Also re-exports all pure utility functions.
- **inputs:** averagePokemonLevel: number
- **outputs:** BudgetAnalysis | null; plus calculateEncounterBudget, calculateEffectiveEnemyLevels, analyzeEncounterBudget, calculateEncounterXp
- **accessible_from:** gm

## Components
