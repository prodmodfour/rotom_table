---
cap_id: healing-C047
name: WebSocket heal_applied Event
type: —
domain: healing
---

## healing-C047: WebSocket heal_applied Event

- **Type:** websocket-event
- **Location:** `server/routes/ws.ts` (case 'heal_applied') and `types/api.ts:WebSocketEvent`
- **Game Concept:** Real-time healing broadcast to Group View
- **Description:** When healing is applied to a combatant, the `heal_applied` event is broadcast to all clients in the same encounter room. Relayed by the WS server to all peers except sender.
- **Inputs:** Event from GM client after healing action
- **Outputs:** Broadcast to all encounter-room clients (Group View, other GMs)
- **Accessible From:** `gm`, `group`
- **Orphan:** false

---

## Prisma Fields (Healing Tracking)
