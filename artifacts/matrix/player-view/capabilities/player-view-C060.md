---
cap_id: player-view-C060
name: player-view-C060
type: —
domain: player-view
---

### player-view-C060
- **name:** player_move_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_move_request'
- **game_concept:** Player token movement request on VTT grid
- **description:** Player requests to move their token on the tactical grid. Server registers requestId in pendingRequests and forwards to GM peers. Requires the player to be in an encounter.
- **inputs:** PlayerMoveRequest (requestId, playerId, combatantId, fromPosition, toPosition, distance)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player
