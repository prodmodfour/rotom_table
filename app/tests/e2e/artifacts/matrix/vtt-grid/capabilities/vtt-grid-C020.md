---
cap_id: vtt-grid-C020
name: vtt-grid-C020
type: —
domain: vtt-grid
---

### vtt-grid-C020
- **name:** useIsometricProjection composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricProjection.ts`
- **game_concept:** Isometric coordinate mathematics
- **description:** Pure math composable for isometric projection. 2:1 tile ratio (width:height). Functions: worldToScreen (grid → pixel with elevation), screenToWorld (pixel → grid inverse), rotateCoords/unrotateCoords (camera angle transform), getDepthKey (painter's algorithm), getTileDiamondPoints (4 corner points of isometric diamond), getGridOriginOffset (canvas centering). All stateless — camera angle and dimensions passed as params.
- **inputs:** Grid coordinates (x, y, z), camera angle, grid dimensions, cell size
- **outputs:** Screen coordinates (px, py), grid coordinates, depth keys, diamond points
- **accessible_from:** gm, group
