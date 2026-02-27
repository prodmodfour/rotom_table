---
cap_id: combat-C152
name: damage_applied / heal_applied
type: websocket-event
domain: combat
---

### combat-C152: damage_applied / heal_applied
- **cap_id**: combat-C152
- **name**: Damage/Heal Broadcast
- **type**: websocket-event
- **location**: `app/server/routes/ws.ts`
- **game_concept**: Damage/heal notifications
- **description**: Broadcast on damage/heal.
- **inputs**: Damage/heal data
- **outputs**: Broadcast
- **accessible_from**: gm+group+player
