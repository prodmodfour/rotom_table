---
cap_id: combat-C039
name: Update Grid Position
type: api-endpoint
domain: combat
---

### combat-C039: Update Grid Position
- **cap_id**: combat-C039
- **name**: Update Combatant Grid Position
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/position.post.ts`
- **game_concept**: Moving tokens on VTT grid
- **description**: Updates combatant x,y position.
- **inputs**: `{ combatantId, position: { x, y } }`
- **outputs**: Updated encounter
- **accessible_from**: gm
