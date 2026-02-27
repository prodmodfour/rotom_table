---
cap_id: vtt-grid-C043
name: vtt-grid-C043
type: —
domain: vtt-grid
---

### vtt-grid-C043
- **name:** GroupGridCanvas component
- **type:** component
- **location:** `app/components/vtt/GroupGridCanvas.vue`
- **game_concept:** Group View grid display (2D and isometric)
- **description:** Read-only grid canvas for Group View display. Supports both 2D and isometric modes. Receives grid state via WebSocket, no editing controls. Applies fog of war for player-facing visibility.
- **inputs:** Encounter data, grid config, fog state
- **outputs:** Read-only grid render
- **accessible_from:** group
