---
cap_id: combat-C151
name: turn_change
type: websocket-event
domain: combat
---

### combat-C151: turn_change
- **cap_id**: combat-C151
- **name**: Turn Change Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Turn advancement
- **description**: Broadcast on turn change.
- **inputs**: Turn data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player
