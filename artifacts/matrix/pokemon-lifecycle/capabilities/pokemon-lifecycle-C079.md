---
cap_id: pokemon-lifecycle-C079
name: character_update
type: websocket-event
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C079: character_update
- **cap_id**: pokemon-lifecycle-C079
- **name**: Character/Pokemon Update Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts` -- broadcast event
- **game_concept**: Real-time sync of entity changes
- **description**: Broadcast event relayed to all connected clients (gm, group, player). Sent after character or Pokemon updates. Clients receiving this event can refresh their local state.
- **inputs**: Entity update data
- **outputs**: Broadcast to all clients
- **accessible_from**: gm, group, player

---

## GM Page (Container)
