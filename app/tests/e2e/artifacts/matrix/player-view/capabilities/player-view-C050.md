---
cap_id: player-view-C050
name: player-view-C050
type: —
domain: player-view
---

### player-view-C050
- **name:** usePlayerWebSocket.handleActionAck
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleActionAck()
- **game_concept:** GM acknowledgment processing
- **description:** Handles incoming player_action_ack events. Sets lastActionAck for toast display (auto-clears after 4 seconds). Resolves the matching pending action promise. Removes the entry from the pendingActions map.
- **inputs:** PlayerActionAck payload from WebSocket
- **outputs:** Updates lastActionAck ref, resolves pending promise
- **accessible_from:** player
