---
cap_id: vtt-grid-C040
name: vtt-grid-C040
type: —
domain: vtt-grid
---

### vtt-grid-C040
- **name:** VTTContainer component
- **type:** component
- **location:** `app/components/vtt/VTTContainer.vue`
- **game_concept:** 2D/isometric mode switch
- **description:** Top-level container that renders either GridCanvas (2D) or IsometricCanvas (isometric) based on grid mode setting. Passes shared props (encounter data, grid config) to the active canvas.
- **inputs:** Grid mode, encounter data
- **outputs:** Renders appropriate canvas component
- **accessible_from:** gm, group
