---
cap_id: scenes-C023
name: scenes-C023
type: —
domain: scenes
---

### scenes-C023
- **name:** GroupViewTabs Store — WebSocket event handlers
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` — handleSceneUpdate(), handleSceneActivated(), handleSceneDeactivated(), handleScenePositionsUpdated(), handleSceneCharacterAdded/Removed(), handleScenePokemonAdded/Removed(), handleSceneGroupCreated/Updated/Deleted()
- **game_concept:** Real-time scene synchronization
- **description:** 10 WebSocket event handlers for scene changes. Each updates local state immutably: full scene updates, activate/deactivate, position updates (selective merge), character/pokemon add/remove, group create/update/delete. All check activeScene ID before applying.
- **inputs:** WebSocket event payloads
- **outputs:** Updated activeScene state
- **accessible_from:** gm, group, player
