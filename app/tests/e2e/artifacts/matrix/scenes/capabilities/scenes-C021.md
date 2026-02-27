---
cap_id: scenes-C021
name: scenes-C021
type: —
domain: scenes
---

### scenes-C021
- **name:** GroupViewTabs Store — activate/deactivate scene actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — activateScene(), deactivateScene()
- **game_concept:** Scene serving control
- **description:** Activates/deactivates a scene, updates local state (marks active, sets activeScene/activeSceneId), and posts BroadcastChannel messages for cross-tab sync.
- **inputs:** sceneId
- **outputs:** Updated activeScene state, BroadcastChannel notification
- **accessible_from:** gm
