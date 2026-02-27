---
cap_id: combat-C154
name: combatant_added / combatant_removed
type: websocket-event
domain: combat
---

### combat-C154: combatant_added / combatant_removed
- **cap_id**: combat-C154
- **name**: Combatant Roster Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Roster changes
- **description**: Broadcast on add/remove combatant.
- **inputs**: Combatant data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player
