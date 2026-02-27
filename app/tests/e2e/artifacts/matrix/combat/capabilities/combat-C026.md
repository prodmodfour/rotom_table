---
cap_id: combat-C026
name: Sprint Action
type: api-endpoint
domain: combat
---

### combat-C026: Sprint Action
- **cap_id**: combat-C026
- **name**: Sprint Combat Action
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/sprint.post.ts`
- **game_concept**: PTU Sprint — Standard Action for +50% movement
- **description**: Marks combatant as sprinting (temp condition), uses standard action.
- **inputs**: `{ combatantId }`
- **outputs**: Updated encounter
- **accessible_from**: gm
