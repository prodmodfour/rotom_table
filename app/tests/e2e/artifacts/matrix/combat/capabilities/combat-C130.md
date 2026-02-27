---
cap_id: combat-C130
name: AddCombatantModal
type: component
domain: combat
---

### combat-C130: AddCombatantModal
- **cap_id**: combat-C130
- **name**: Add Combatant Modal
- **type**: component
- **location**: `app/components/encounter/AddCombatantModal.vue`
- **game_concept**: Adding entities to encounter
- **description**: Select Pokemon/character, side, initiative bonus.
- **inputs**: Available entities
- **outputs**: Entity + side + bonus
- **accessible_from**: gm

### combat-C131-C135: Significance + XP Components
- **cap_id**: combat-C131
- **name**: Significance and XP Components
- **type**: component
- **location**: `app/components/encounter/SignificancePanel.vue`, `BudgetIndicator.vue`, `XpDistributionModal.vue`, `XpDistributionResults.vue`, `LevelUpNotification.vue`
- **game_concept**: Encounter difficulty + XP distribution
- **description**: SignificancePanel (5 presets, slider, XP preview), BudgetIndicator (difficulty bar), XpDistributionModal (per-player allocation), XpDistributionResults (results display), LevelUpNotification (level-up details).
- **inputs**: Encounter data, XP data
- **outputs**: Significance changes, XP confirmation
- **accessible_from**: gm
