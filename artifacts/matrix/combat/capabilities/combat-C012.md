---
cap_id: combat-C012
name: Get Encounter
type: api-endpoint
domain: combat
---

### combat-C012: Get Encounter
- **cap_id**: combat-C012
- **name**: Get Encounter by ID
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id].get.ts`
- **game_concept**: Loading a specific encounter
- **description**: Retrieves a single encounter by ID with full combat state.
- **inputs**: Encounter ID (route param)
- **outputs**: Encounter data object
- **accessible_from**: gm, group, player
