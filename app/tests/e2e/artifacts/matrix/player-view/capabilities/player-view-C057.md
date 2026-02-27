---
cap_id: player-view-C057
name: player-view-C057
type: —
domain: player-view
---

### player-view-C057
- **name:** player_action (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_action'
- **game_concept:** Player combat action forwarding to GM
- **description:** Player or group client submits an action request (use_item, switch_pokemon, maneuver, etc.). Server registers requestId -> playerId in pendingRequests, then forwards the event to all GM peers. Requires the client to be in an encounter.
- **inputs:** PlayerActionRequest (requestId, playerId, playerName, action, ...)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player, group (when in encounter)
