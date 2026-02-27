---
cap_id: vtt-grid-C026
name: vtt-grid-C026
type: —
domain: vtt-grid
---

### vtt-grid-C026
- **name:** useElevation composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useElevation.ts`
- **game_concept:** Token and terrain elevation for isometric grid
- **description:** Manages per-token elevation (reactive map), default elevation for flying Pokemon (Sky capability), elevation change helpers (raise/lower token), terrain elevation brush (raise/lower ground cells). Validates elevation bounds (0 to maxElevation). Uses combatantCanFly/getSkySpeed from utilities.
- **inputs:** Token ID, elevation level, combatant capabilities
- **outputs:** Token elevations map, terrain elevations, brush elevation
- **accessible_from:** gm

## Composables — Shared
