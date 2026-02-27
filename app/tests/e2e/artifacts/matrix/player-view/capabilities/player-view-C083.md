---
cap_id: player-view-C083
name: player-view-C083
type: —
domain: player-view
---

### player-view-C083
- **name:** Auto-switch to encounter tab on turn notification
- **type:** component
- **location:** `app/pages/player/index.vue` — watch(turnNotification)
- **game_concept:** Automatic tab focus when player's turn begins
- **description:** Watches the turnNotification ref from usePlayerWebSocket. When a turn notification arrives, automatically switches the active tab to 'encounter' so the player immediately sees their combat action panel.
- **inputs:** turnNotification from usePlayerWebSocket
- **outputs:** Sets activeTab to 'encounter'
- **accessible_from:** player

---

## Utility Functions
