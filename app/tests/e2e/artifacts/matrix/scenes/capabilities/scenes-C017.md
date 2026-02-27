---
cap_id: scenes-C017
name: scenes-C017
type: —
domain: scenes
---

### scenes-C017
- **name:** Scene Group CRUD APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups.post.ts`, `[id]/groups/[groupId].put.ts`, `[id]/groups/[groupId].delete.ts`
- **game_concept:** Scene group management (entity grouping)
- **description:** Create, update, delete groups within a scene. Groups have name, position, width, height. Operations update JSON groups array and broadcast WebSocket events (scene_group_created, scene_group_updated, scene_group_deleted).
- **inputs:** URL params: id, groupId. Body: { name, position?, width?, height? }
- **outputs:** `{ success, data: SceneGroup }` or `{ success: true }`
- **accessible_from:** gm
