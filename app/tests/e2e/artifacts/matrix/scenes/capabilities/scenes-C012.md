---
cap_id: scenes-C012
name: scenes-C012
type: —
domain: scenes
---

### scenes-C012
- **name:** Get/Update/Delete Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].get.ts`, `[id].put.ts`, `[id].delete.ts`
- **game_concept:** Scene CRUD
- **description:** Get returns full scene with parsed JSON fields. Update accepts partial scene data. Delete removes scene. Update broadcasts scene_update WebSocket event.
- **inputs:** URL param: id. Body (put): partial scene fields
- **outputs:** `{ success, data: Scene }` or `{ success: true }`
- **accessible_from:** gm
