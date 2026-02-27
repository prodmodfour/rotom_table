---
cap_id: player-view-C064
name: player-view-C064
type: —
domain: player-view
---

### player-view-C064
- **name:** scene_request (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'scene_request'
- **game_concept:** Player requesting active scene data
- **description:** Player requests the current active scene. Server queries the database for the active scene and sends a scene_sync event back to the requesting player. Only handled for player-role clients.
- **inputs:** None
- **outputs:** scene_sync event sent back to requesting player
- **accessible_from:** player

---

## Scene View
