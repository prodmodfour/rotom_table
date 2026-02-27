---
cap_id: vtt-grid-C012
name: vtt-grid-C012
type: —
domain: vtt-grid
---

### vtt-grid-C012
- **name:** useGridRendering composable
- **type:** composable-function
- **location:** `app/composables/useGridRendering.ts`
- **game_concept:** 2D grid rendering pipeline
- **description:** Full 2D render pipeline: grid lines, tokens (with sprites, HP bars, side colors, turn indicators), movement range, measurement overlays, fog of war, terrain.
- **inputs:** Grid config, combatants, fog state, terrain state, measurement state
- **outputs:** Full 2D grid render on canvas
- **accessible_from:** gm, group
