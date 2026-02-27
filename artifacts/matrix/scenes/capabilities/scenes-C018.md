---
cap_id: scenes-C018
name: scenes-C018
type: —
domain: scenes
---

### scenes-C018
- **name:** Batch Update Positions API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/positions.put.ts`
- **game_concept:** Drag-and-drop position updates
- **description:** Batch updates positions of pokemon, characters, and groups in a single request. Lightweight alternative to full scene PUT for drag-and-drop operations.
- **inputs:** URL param: id. Body: { pokemon?: [{id, position, groupId?}], characters?: [{id, position, groupId?}], groups?: [{id, position}] }
- **outputs:** `{ success: true }`
- **accessible_from:** gm

## Store
