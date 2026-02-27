---
cap_id: scenes-C013
name: scenes-C013
type: —
domain: scenes
---

### scenes-C013
- **name:** Get Active Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Currently served scene
- **description:** Returns the scene where isActive=true, or null if no scene is active.
- **inputs:** None
- **outputs:** `{ success, data: Scene | null }`
- **accessible_from:** gm, group, player
