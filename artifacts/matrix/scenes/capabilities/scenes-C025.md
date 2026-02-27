---
cap_id: scenes-C025
name: scenes-C025
type: —
domain: scenes
---

### scenes-C025
- **name:** GroupViewTabs Store — cross-tab sync
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — setupCrossTabSync()
- **game_concept:** Multi-tab Group View synchronization
- **description:** Sets up BroadcastChannel ('ptu-scene-sync') for cross-tab scene state synchronization. Handles scene_activated and scene_deactivated messages.
- **inputs:** None
- **outputs:** BroadcastChannel listener
- **accessible_from:** gm, group
