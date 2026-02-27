---
cap_id: vtt-grid-C022
name: vtt-grid-C022
type: —
domain: vtt-grid
---

### vtt-grid-C022
- **name:** useIsometricRendering composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricRendering.ts`
- **game_concept:** Isometric grid rendering pipeline
- **description:** Full isometric render pipeline: diamond grid lines, tokens (with sprites, HP bars, side colors, turn indicators, elevation badges), movement range, selection highlights, hover highlights, movement previews. Renders in depth-sorted order (painter's algorithm). Uses useIsometricProjection for coordinate transforms and useIsometricOverlays for fog/terrain/measurement overlays.
- **inputs:** Grid config, combatants, camera angle, zoom, pan, fog/terrain/measurement state
- **outputs:** Full isometric grid render on canvas
- **accessible_from:** gm, group
