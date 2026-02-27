---
cap_id: scenes-C024
name: scenes-C024
type: —
domain: scenes
---

### scenes-C024
- **name:** GroupViewTabs Store — position updates
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — updatePositions()
- **game_concept:** Batch position update via store
- **description:** PUTs to /api/scenes/:id/positions with position arrays for pokemon, characters, groups.
- **inputs:** sceneId, positions object
- **outputs:** API call (no local state update — relies on WebSocket echo)
- **accessible_from:** gm
