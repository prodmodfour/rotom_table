---
cap_id: player-view-C062
name: player-view-C062
type: —
domain: player-view
---

### player-view-C062
- **name:** group_view_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'group_view_request'
- **game_concept:** Player requesting Group View tab change
- **description:** Player requests a tab change on the shared Group View (TV/projector). Forwarded to GM for approval. Uses the same pending request pattern as other player actions.
- **inputs:** GroupViewRequest (requestId, playerId, playerName, requestType, tab?, sceneId?)
- **outputs:** Forwarded to GM peers
- **accessible_from:** player
