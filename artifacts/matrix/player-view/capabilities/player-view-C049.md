---
cap_id: player-view-C049
name: player-view-C049
type: —
domain: player-view
---

### player-view-C049
- **name:** usePlayerWebSocket.sendAction
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — sendAction()
- **game_concept:** Tracked action request with promise-based acknowledgment
- **description:** Sends a player action request with a generated requestId and returns a Promise that resolves when the GM acknowledges (player_action_ack). Pending actions are tracked in a Map with automatic 60-second timeout. If the GM doesn't respond within 60 seconds, the promise rejects.
- **inputs:** Action object (minus requestId/playerId/playerName which are auto-filled)
- **outputs:** Promise<PlayerActionAck>
- **accessible_from:** player
