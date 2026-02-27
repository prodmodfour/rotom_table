---
cap_id: player-view-C013
name: player-view-C013
type: —
domain: player-view
---

### player-view-C013
- **name:** GET /api/player/export/:characterId
- **type:** api-endpoint
- **location:** `app/server/api/player/export/[characterId].get.ts`
- **game_concept:** Character data export for offline portability
- **description:** Exports a full character with all owned Pokemon as a JSON blob. Includes metadata (exportVersion, exportedAt, appVersion) for import validation. Character data is fully serialized via serializeCharacter. Pokemon data is fully serialized via serializePokemon.
- **inputs:** characterId (route param)
- **outputs:** { success, data: { exportVersion, exportedAt, appVersion, character, pokemon[] } }
- **accessible_from:** player
