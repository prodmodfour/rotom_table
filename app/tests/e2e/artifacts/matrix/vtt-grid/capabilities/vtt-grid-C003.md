---
cap_id: vtt-grid-C003
name: vtt-grid-C003
type: —
domain: vtt-grid
---

### vtt-grid-C003
- **name:** Terrain Store
- **type:** store-action
- **location:** `app/stores/terrain.ts`
- **game_concept:** PTU terrain types with movement costs
- **description:** 2D grid of terrain types per cell. 6 terrain types: normal, rough, water, ice, lava, blocked. Each type has movement cost multiplier. Actions: setTerrain, clearTerrain, loadFromServer, saveToServer. Terrain elevation stored per-cell for isometric mode.
- **inputs:** Cell coordinates, terrain type, elevation
- **outputs:** TerrainType per cell, movement cost per cell, elevation per cell
- **accessible_from:** gm (edit), group (display)
