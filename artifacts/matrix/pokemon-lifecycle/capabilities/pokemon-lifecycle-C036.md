---
cap_id: pokemon-lifecycle-C036
name: POST /api/pokemon
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C036: POST /api/pokemon
- **cap_id**: pokemon-lifecycle-C036
- **name**: Create Pokemon (Manual)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.post.ts`
- **game_concept**: Manual Pokemon creation by GM
- **description**: Creates a Pokemon record from arbitrary body data. Applies PTU HP formula (level + baseHp*3 + 10). Resolves nickname via resolveNickname(). Accepts baseStats, currentStats, types, nature, abilities, moves, capabilities, skills, eggGroups, and all other fields. Default origin: 'manual'. Does NOT use pokemon-generator service (that's for wild/template).
- **inputs**: Body: full or partial Pokemon data
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm
