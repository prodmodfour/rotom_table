---
cap_id: character-lifecycle-C012
name: character-lifecycle-C012
type: —
domain: character-lifecycle
---

### character-lifecycle-C012
- **name:** Get Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].get.ts`
- **game_concept:** Character sheet reading
- **description:** Returns a single character by ID with all linked Pokemon. Uses serializeCharacter for JSON field parsing.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Character }` — full character with parsed JSON fields and pokemon
- **accessible_from:** gm, player
