---
cap_id: vtt-grid-C002
name: vtt-grid-C002
type: —
domain: vtt-grid
---

### vtt-grid-C002
- **name:** Fog of War Store
- **type:** store-action
- **location:** `app/stores/fogOfWar.ts`
- **game_concept:** PTU fog of war (3-state: hidden/revealed/explored)
- **description:** 2D grid of fog state per cell. Actions: setFogState (individual cell), revealArea (radius), exploreCells, resetFog. Persists to server via encounter fog endpoints. GM sees all states with visual indicators; group/player sees only revealed cells.
- **inputs:** Cell coordinates, fog state, area parameters
- **outputs:** FogState per cell (hidden/revealed/explored)
- **accessible_from:** gm (edit), group+player (display, hidden cells obscured)
