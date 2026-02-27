---
cap_id: pokemon-lifecycle-C041
name: POST /api/pokemon/bulk-action
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C041: POST /api/pokemon/bulk-action
- **cap_id**: pokemon-lifecycle-C041
- **name**: Bulk Archive/Delete Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/bulk-action.post.ts`
- **game_concept**: Mass Pokemon management
- **description**: Bulk archive (isInLibrary=false) or delete Pokemon. Accepts pokemonIds array OR filter (origin, hasOwner). Safety check: blocks both archive and delete for Pokemon in active encounters (checks encounter combatants JSON). Returns count of affected records.
- **inputs**: Body: { action: 'archive'|'delete', pokemonIds?: string[], filter?: { origin?, hasOwner? } }
- **outputs**: { success: true, data: { action, count } }
- **accessible_from**: gm
