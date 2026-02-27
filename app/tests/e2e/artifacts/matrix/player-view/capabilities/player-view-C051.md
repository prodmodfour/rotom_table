---
cap_id: player-view-C051
name: player-view-C051
type: —
domain: player-view
---

### player-view-C051
- **name:** usePlayerWebSocket.handleTurnNotify
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleTurnNotify()
- **game_concept:** Turn notification with haptic feedback
- **description:** Handles player_turn_notify events from the GM. Sets turnNotification state (auto-clears after 5 seconds). Triggers haptic vibration via vibrateOnTurnStart(). The player page watches turnNotification and auto-switches to the Encounter tab.
- **inputs:** PlayerTurnNotification payload from WebSocket
- **outputs:** Sets turnNotification ref, triggers vibration
- **accessible_from:** player
