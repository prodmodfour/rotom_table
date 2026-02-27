---
cap_id: player-view-C015
name: player-view-C015
type: —
domain: player-view
---

### player-view-C015
- **name:** POST /api/player/action-request
- **type:** api-endpoint
- **location:** `app/server/api/player/action-request.post.ts`
- **game_concept:** REST fallback for player combat action requests
- **description:** Forwards player action requests to the GM via server-side WebSocket when the player's WebSocket is momentarily disconnected. Registers requestId -> playerId in the shared pendingRequests map for response routing. Iterates over all GM peers and sends the player_action event.
- **inputs:** { playerId, playerName, action, requestId, ...action-specific fields }
- **outputs:** { success, data: { requestId, forwarded } } or error if no GM connected
- **accessible_from:** player
