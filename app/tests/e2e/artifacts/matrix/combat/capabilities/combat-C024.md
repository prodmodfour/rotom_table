---
cap_id: combat-C024
name: Update Status Conditions
type: api-endpoint
domain: combat
---

### combat-C024: Update Status Conditions
- **cap_id**: combat-C024
- **name**: Add/Remove Status Conditions
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/status.post.ts`
- **game_concept**: PTU status conditions — persistent, volatile, and other
- **description**: Adds and/or removes status conditions. Validates against known PTU conditions. Bulk add/remove in single call.
- **inputs**: `{ combatantId, add?: StatusCondition[], remove?: StatusCondition[] }`
- **outputs**: Updated encounter + status change details
- **accessible_from**: gm
