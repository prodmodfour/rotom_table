---
cap_id: combat-C150
name: encounter_update
type: websocket-event
domain: combat
---

### combat-C150: encounter_update
- **cap_id**: combat-C150
- **name**: Encounter Update Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Real-time encounter sync
- **description**: GM broadcasts encounter state to all viewers.
- **inputs**: Encounter data
- **outputs**: Broadcast to group+player
- **accessible_from**: gm (send), group+player (receive)
