# P2 Specification

## D. Budget Validation Warnings (P2)

### Encounter Creation Warnings

When the GM generates or assembles an encounter and the budget ratio falls outside the "balanced" range, display contextual warnings:

- **Under-budget (<70%)**: "This encounter may be too easy for your party. Consider adding more enemies or increasing their levels."
- **Over-budget (>130%)**: "This encounter exceeds the recommended budget. Your players may struggle. Consider reducing enemy count or levels."
- **Deadly (>180%)**: "WARNING: This encounter is significantly over-budget and could be lethal. Ensure this is intentional."

These are informational warnings, not blocks. The GM can always proceed.

### Active Encounter Budget Display

Add a small budget indicator to the encounter header (visible during combat) that shows the current encounter's budget analysis. This helps the GM contextualize difficulty mid-combat. Displayed as a compact badge: "Budget: 120/120 (Balanced)".

### Budget Warning in Add Combatant Flow

When the GM adds a combatant mid-encounter, show how the addition affects the budget ratio. If the new combatant pushes the encounter from "balanced" to "hard" or "deadly", display a brief warning.

---


## E. Difficulty Presets (P2)

### Quick Encounter Generation by Difficulty

Add preset buttons to `GenerateEncounterModal.vue` that auto-configure spawn count based on the budget:

- **Trivial**: Generate enemies totaling ~40% of budget
- **Easy**: Generate enemies totaling ~70% of budget
- **Balanced**: Generate enemies totaling ~100% of budget
- **Hard**: Generate enemies totaling ~140% of budget

These presets calculate how many Pokemon at the table's level range would fill the target budget, then set the spawn count accordingly.

```typescript
/**
 * Calculate spawn count to hit a target budget percentage.
 * Uses the midpoint of the table's level range as the expected average level.
 */
export function suggestSpawnCount(
  targetBudgetRatio: number,
  budget: number,
  levelRange: { min: number; max: number }
): number {
  const averageLevel = Math.floor((levelRange.min + levelRange.max) / 2)
  if (averageLevel <= 0) return 1
  const targetLevels = Math.floor(budget * targetBudgetRatio)
  return Math.max(1, Math.round(targetLevels / averageLevel))
}
```

The preset buttons appear next to the "Override spawn count" checkbox and auto-enable the override with the calculated count.

---

