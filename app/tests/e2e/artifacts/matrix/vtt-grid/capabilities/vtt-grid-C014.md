---
cap_id: vtt-grid-C014
name: vtt-grid-C014
type: —
domain: vtt-grid
---

### vtt-grid-C014
- **name:** useGridMovement composable
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts`
- **game_concept:** PTU terrain-aware movement
- **description:** Movement validation considering terrain costs, speed modifiers (slow/stuck conditions), multi-tile tokens, movement range display. Integrates with terrain store for cost calculations.
- **inputs:** Combatant, target position, terrain state
- **outputs:** Movement validity, movement cost, movement range cells
- **accessible_from:** gm
