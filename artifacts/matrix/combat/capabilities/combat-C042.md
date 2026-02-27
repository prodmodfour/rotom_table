---
cap_id: combat-C042
name: Get/Set Fog of War
type: api-endpoint
domain: combat
---

### combat-C042: Get/Set Fog of War
- **cap_id**: combat-C042
- **name**: Fog of War State
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **game_concept**: PTU fog of war — 3-state cells
- **description**: Get or update fog of war grid state.
- **inputs**: Fog state (PUT)
- **outputs**: Fog state
- **accessible_from**: gm
