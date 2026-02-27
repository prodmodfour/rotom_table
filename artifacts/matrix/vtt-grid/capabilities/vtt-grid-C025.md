---
cap_id: vtt-grid-C025
name: vtt-grid-C025
type: —
domain: vtt-grid
---

### vtt-grid-C025
- **name:** useDepthSorting composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useDepthSorting.ts`
- **game_concept:** Painter's algorithm depth ordering
- **description:** Sorts drawable items by depth key for correct isometric rendering order. 4 layers: terrain < grid < token < fog. Items at same depth ordered by layer priority. Uses getDepthKey from isometric projection.
- **inputs:** Array of Drawable items (gridX, gridY, elevation, layer)
- **outputs:** Sorted Drawable array
- **accessible_from:** gm, group
