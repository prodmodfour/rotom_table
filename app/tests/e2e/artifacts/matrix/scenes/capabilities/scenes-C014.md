---
cap_id: scenes-C014
name: scenes-C014
type: —
domain: scenes
---

### scenes-C014
- **name:** Activate/Deactivate Scene APIs
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`, `[id]/deactivate.post.ts`
- **game_concept:** Scene serving to Group View
- **description:** Activate sets isActive=true on target scene (deactivates any other active scene), updates GroupViewState to scene tab, broadcasts scene_activated. Deactivate sets isActive=false, updates GroupViewState to lobby, broadcasts scene_deactivated.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm
