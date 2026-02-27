---
cap_id: combat-C125
name: ManeuverGrid
type: component
domain: combat
---

### combat-C125: ManeuverGrid
- **cap_id**: combat-C125
- **name**: Maneuver Grid
- **type**: component
- **location**: `app/components/encounter/ManeuverGrid.vue`
- **game_concept**: PTU maneuver selection
- **description**: Grid of 9 maneuvers with icons and descriptions.
- **inputs**: COMBAT_MANEUVERS
- **outputs**: Selected maneuver
- **accessible_from**: gm, player

### combat-C126-C129: Combat Modals
- **cap_id**: combat-C126
- **name**: Combat Editor Modals
- **type**: component
- **location**: `app/components/encounter/CombatStagesModal.vue`, `StatusConditionsModal.vue`, `DamageSection.vue`, `TempHpModal.vue`
- **game_concept**: Stage editing, status toggling, damage entry, temp HP
- **description**: CombatStagesModal (7 stats, -6/+6), StatusConditionsModal (PTU categories), DamageSection (inline damage input), TempHpModal (temp HP entry).
- **inputs**: Current combatant state
- **outputs**: State changes
- **accessible_from**: gm
