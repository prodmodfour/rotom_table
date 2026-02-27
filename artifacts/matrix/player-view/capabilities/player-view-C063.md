---
cap_id: player-view-C063
name: player-view-C063
type: —
domain: player-view
---

### player-view-C063
- **name:** group_view_response (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'group_view_response'
- **game_concept:** GM response to Group View tab change request
- **description:** GM responds to a player's Group View change request with approved/rejected status. Routed to the originating player via pendingRequests lookup.
- **inputs:** GroupViewResponse (requestId, status, reason?)
- **outputs:** Routed to originating player peer
- **accessible_from:** gm (sends), player (receives)
