---
cap_id: pokemon-lifecycle-C037
name: PUT /api/pokemon/:id
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C037: PUT /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C037
- **name**: Update Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].put.ts`
- **game_concept**: Edit Pokemon stats, moves, items, etc.
- **description**: Updates any subset of Pokemon fields. Handles JSON serialization for nature, stageModifiers, abilities, moves, statusConditions. Supports baseStats and currentStats as nested objects. Also handles healing fields (injuries, restMinutesToday, etc.). Resolves nickname changes via resolveNickname().
- **inputs**: Route param: id, Body: partial Pokemon data
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm
