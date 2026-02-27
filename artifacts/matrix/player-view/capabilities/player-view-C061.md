---
cap_id: player-view-C061
name: player-view-C061
type: —
domain: player-view
---

### player-view-C061
- **name:** player_move_response (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_move_response'
- **game_concept:** GM response to player token movement
- **description:** GM responds to a player movement request with approved/rejected/modified status. Server routes the response to the originating player via pendingRequests lookup.
- **inputs:** PlayerMoveResponse (requestId, status, position?, reason?)
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)
