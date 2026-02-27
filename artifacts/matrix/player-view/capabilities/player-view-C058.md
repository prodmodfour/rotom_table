---
cap_id: player-view-C058
name: player-view-C058
type: —
domain: player-view
---

### player-view-C058
- **name:** player_action_ack (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_action_ack'
- **game_concept:** GM acknowledgment routing back to player
- **description:** GM sends an acknowledgment for a player action request. Server looks up the requestId in pendingRequests to find the originating player's characterId, then routes the ack to all player peers matching that characterId.
- **inputs:** { requestId, status, reason? } from GM
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)
