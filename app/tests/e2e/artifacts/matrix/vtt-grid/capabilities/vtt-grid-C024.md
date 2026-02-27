---
cap_id: vtt-grid-C024
name: vtt-grid-C024
type: —
domain: vtt-grid
---

### vtt-grid-C024
- **name:** useIsometricOverlays composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricOverlays.ts`
- **game_concept:** Isometric fog/terrain/measurement diamond overlays
- **description:** Renders overlays through isometric projection: fog of war (3-state with GM indicators), terrain types (6 types with color fills), measurement shapes (5 modes with colored diamonds), elevation darkening for depth cues. All rendered as isometric diamonds using getTileDiamondPoints.
- **inputs:** Grid config, camera angle, fog/terrain/measurement state, sorted cell array
- **outputs:** Overlay rendering on canvas
- **accessible_from:** gm, group
