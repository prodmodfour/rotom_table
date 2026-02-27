---
cap_id: combat-C157
name: player_turn_notify
type: websocket-event
domain: combat
---

### combat-C157: player_turn_notify
- **cap_id**: combat-C157
- **name**: Player Turn Notification
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Turn notification
- **description**: GM notifies player their turn started.
- **inputs**: playerId
- **outputs**: Routed to player
- **accessible_from**: gm (send), player (receive)
