---
cap_id: player-view-C073
name: player-view-C073
type: —
domain: player-view
---

### player-view-C073
- **name:** PlayerMoveRequest component
- **type:** component
- **location:** `app/components/player/PlayerMoveRequest.vue`
- **game_concept:** Move confirmation sheet for grid token movement
- **description:** Bottom sheet overlay that shows the destination coordinates and distance for a pending move. Provides Confirm and Cancel buttons. Uses slide-up transition. Positioned above the player nav bar.
- **inputs:** visible, position (GridPosition), distance (number)
- **outputs:** Emits 'confirm' or 'cancel'
- **accessible_from:** player

---

## Reconnection & State Sync
