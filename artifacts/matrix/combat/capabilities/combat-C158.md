---
cap_id: combat-C158
name: movement_preview
type: websocket-event
domain: combat
---

### combat-C158: movement_preview
- **cap_id**: combat-C158
- **name**: Movement Preview
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: VTT token preview
- **description**: GM previews token move, broadcast to group.
- **inputs**: Movement data
- **outputs**: Broadcast
- **accessible_from**: gm (send), group+player (receive)
