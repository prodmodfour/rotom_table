---
cap_id: combat-C153
name: status_change / move_executed
type: websocket-event
domain: combat
---

### combat-C153: status_change / move_executed
- **cap_id**: combat-C153
- **name**: Status/Move Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Combat action notifications
- **description**: Broadcast status changes and move executions.
- **inputs**: Event data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player
