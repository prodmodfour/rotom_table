# Significance and Budget

Encounter significance tier and difficulty budget calculation.

## Budget Utility

`utils/encounterBudget.ts` — pure PTU level budget calculator: budget formula, difficulty assessment, XP calculation, `SIGNIFICANCE_PRESETS`.

## Composable

`composables/useEncounterBudget.ts` — reactive wrapper for active encounter budget analysis.

## Model Fields

`significanceMultiplier` (Float, default 1.0) and `significanceTier` (String, default "insignificant") on Encounter.

Set at encounter creation via `StartEncounterModal` / `GenerateEncounterModal`. Editable mid-encounter via `PUT /api/encounters/:id/significance`.

## Components

`SignificancePanel.vue` — significance preset selector, difficulty adjustment, XP breakdown.

`BudgetIndicator.vue` — encounter difficulty bar/label based on level budget ratio.

## Budget Formula

Level budget = `avgPartyLevel * 2 * playerCount` (PTU Chapter 11 Encounter Creation Guide). The `analyzeEncounterBudget` function computes effective enemy levels (trainers count double), the budget ratio, and a difficulty label.

## XP Formula

XP per player = `effectiveLevels * significanceMultiplier / playerCount` (PTU Core p.460). Effective levels sum defeated enemies with trainers counting double.

## Significance Presets

Five tiers: Insignificant (x1-1.5), Everyday (x2-3), Significant (x3-4), Climactic (x4-5), Legendary (x5). Stored in the `SIGNIFICANCE_PRESETS` constant.

## See also

- [[xp-distribution-flow]]
- [[faint-and-revival-effects]] — defeated enemies recorded for XP on faint
- [[encounter-core-api]]
- [[encounter-table-store]] — budget analysis used alongside table generation
- [[pokemon-experience-chart]] — XP thresholds that map significance-scaled XP to levels
