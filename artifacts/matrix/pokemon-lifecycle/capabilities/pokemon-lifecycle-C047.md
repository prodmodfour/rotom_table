---
cap_id: pokemon-lifecycle-C047
name: GET /api/player/export/:characterId
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C047: GET /api/player/export/:characterId
- **cap_id**: pokemon-lifecycle-C047
- **name**: Character + Pokemon Export
- **type**: api-endpoint
- **location**: `app/server/api/player/export/[characterId].get.ts`
- **game_concept**: Offline data portability for players
- **description**: Exports full character data with all owned Pokemon as a versioned JSON blob. Includes exportVersion, exportedAt timestamp, and appVersion for import validation. Uses serializeCharacter() and serializePokemon().
- **inputs**: Route param: characterId
- **outputs**: { success: true, data: { exportVersion, exportedAt, appVersion, character, pokemon[] } }
- **accessible_from**: player
