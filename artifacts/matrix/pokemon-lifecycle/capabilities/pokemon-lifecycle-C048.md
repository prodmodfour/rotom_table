---
cap_id: pokemon-lifecycle-C048
name: POST /api/player/import/:characterId
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C048: POST /api/player/import/:characterId
- **cap_id**: pokemon-lifecycle-C048
- **name**: Character + Pokemon Import
- **type**: api-endpoint
- **location**: `app/server/api/player/import/[characterId].post.ts`
- **game_concept**: Merge offline player edits back to server
- **description**: Validates payload with Zod schema. Only accepts safe offline edits: character (background, personality, goals, notes), Pokemon (nickname, heldItem, move reorder). Conflict detection: if server updatedAt > exportedAt, differing fields flagged as conflicts (server wins). Atomic transaction. Returns update counts and conflict list.
- **inputs**: Route param: characterId, Body: validated import payload
- **outputs**: { success: true, data: { characterFieldsUpdated, pokemonUpdated, hasConflicts, conflicts[] } }
- **accessible_from**: player

---

## Store Actions
