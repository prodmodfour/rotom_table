---
cap_id: combat-C156
name: player_action / player_action_ack
type: websocket-event
domain: combat
---

### combat-C156: player_action / player_action_ack
- **cap_id**: combat-C156
- **name**: Player Action Request/Ack
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Player requesting GM approval
- **description**: Player sends request (item/switch/maneuver), GM responds with ack. PendingRequests routing.
- **inputs**: PlayerActionRequest / ack
- **outputs**: Forward/route
- **accessible_from**: player (request), gm (ack)
