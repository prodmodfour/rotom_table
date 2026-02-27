---
cap_id: combat-C155
name: serve_encounter / encounter_unserved
type: websocket-event
domain: combat
---

### combat-C155: serve_encounter / encounter_unserved
- **cap_id**: combat-C155
- **name**: Serve/Unserve Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Display management
- **description**: Broadcast serve/unserve to group+player.
- **inputs**: Encounter ID
- **outputs**: Broadcast
- **accessible_from**: gm (send), group+player (receive)
