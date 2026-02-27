---
cap_id: combat-C027
name: Pass Turn
type: api-endpoint
domain: combat
---

### combat-C027: Pass Turn
- **cap_id**: combat-C027
- **name**: Pass Turn Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/pass.post.ts`
- **game_concept**: Forfeiting remaining actions
- **description**: Forfeits all remaining actions for the combatant.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter
- **accessible_from**: gm, player
