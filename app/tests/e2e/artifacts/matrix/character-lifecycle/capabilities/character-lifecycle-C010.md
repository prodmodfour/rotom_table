---
cap_id: character-lifecycle-C010
name: character-lifecycle-C010
type: —
domain: character-lifecycle
---

### character-lifecycle-C010
- **name:** List Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.get.ts`
- **game_concept:** Character library browsing
- **description:** Returns all characters where isInLibrary=true, ordered by name, with summary Pokemon data. Uses serializeCharacterSummary.
- **inputs:** None (no query params)
- **outputs:** `{ success, data: CharacterSummary[] }` — id, name, characterType, level, location, avatarUrl, pokemon summaries
- **accessible_from:** gm
