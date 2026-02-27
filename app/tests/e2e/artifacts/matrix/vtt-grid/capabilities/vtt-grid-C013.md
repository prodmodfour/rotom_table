---
cap_id: vtt-grid-C013
name: vtt-grid-C013
type: —
domain: vtt-grid
---

### vtt-grid-C013
- **name:** useGridInteraction composable
- **type:** composable-function
- **location:** `app/composables/useGridInteraction.ts`
- **game_concept:** 2D grid mouse/touch interaction
- **description:** Handles mouse click, hover, drag for token selection/movement, zoom (wheel), pan (right-click drag). Delegates touch to useTouchInteraction. Converts screen coordinates to grid coordinates.
- **inputs:** Mouse/touch events, grid config
- **outputs:** Cell click, token select, token move, pan/zoom changes
- **accessible_from:** gm
