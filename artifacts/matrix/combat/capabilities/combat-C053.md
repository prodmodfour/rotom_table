---
cap_id: combat-C053
name: updateStatusConditions
type: service-function
domain: combat
---

### combat-C053: updateStatusConditions
- **cap_id**: combat-C053
- **name**: Status Condition Manager
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `updateStatusConditions()`
- **game_concept**: PTU status add/remove
- **description**: Adds/removes conditions, avoids duplicates, validates.
- **inputs**: Combatant, add[], remove[]
- **outputs**: StatusChangeResult
- **accessible_from**: gm (via status endpoint)
