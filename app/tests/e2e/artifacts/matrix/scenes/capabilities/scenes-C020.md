---
cap_id: scenes-C020
name: scenes-C020
type: —
domain: scenes
---

### scenes-C020
- **name:** GroupViewTabs Store — scene CRUD actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — fetchScenes(), createScene(), updateScene(), deleteScene(), fetchScene(), fetchActiveScene()
- **game_concept:** Scene state management
- **description:** Manages scenes list and active scene in local state. All actions call corresponding API endpoints and update local arrays immutably.
- **inputs:** Scene CRUD data
- **outputs:** Updated scenes/activeScene state
- **accessible_from:** gm, group (read-only via fetchActiveScene)
