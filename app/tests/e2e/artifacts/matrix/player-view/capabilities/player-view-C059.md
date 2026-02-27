---
cap_id: player-view-C059
name: player-view-C059
type: —
domain: player-view
---

### player-view-C059
- **name:** player_turn_notify (WS event)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'player_turn_notify'
- **game_concept:** Turn notification routing to specific player
- **description:** GM sends a notification that a specific player's combatant's turn has begun. Server routes the event to all player peers matching the playerId in the payload.
- **inputs:** { playerId, combatantId, combatantName, combatantType, round, availableActions }
- **outputs:** Routed to specific player peer
- **accessible_from:** gm (sends), player (receives)
