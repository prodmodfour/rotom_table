---
cap_id: vtt-grid-C023
name: vtt-grid-C023
type: —
domain: vtt-grid
---

### vtt-grid-C023
- **name:** useIsometricInteraction composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricInteraction.ts`
- **game_concept:** Isometric grid mouse/touch interaction
- **description:** Handles mouse/touch interaction for isometric grid. Converts screen coordinates to world grid coordinates via screenToWorld. Handles token selection, movement, hover, drag-and-drop. Delegates touch to useTouchInteraction.
- **inputs:** Mouse/touch events, camera angle, grid config
- **outputs:** Cell click, token select, token move
- **accessible_from:** gm
