---
cap_id: vtt-grid-C001
name: vtt-grid-C001
type: —
domain: vtt-grid
---

### vtt-grid-C001
- **name:** Encounter Grid Store
- **type:** store-action
- **location:** `app/stores/encounterGrid.ts`
- **game_concept:** VTT grid configuration and token positions
- **description:** Manages grid config (width, height, cellSize, showGrid, backgroundImage, gridMode), token positions keyed by combatant ID, pan/zoom state, selected cell, drag state. Actions for position updates, grid config changes, background image management.
- **inputs:** Grid config, token positions, pan/zoom values
- **outputs:** Reactive grid state for rendering
- **accessible_from:** gm, group (display)
