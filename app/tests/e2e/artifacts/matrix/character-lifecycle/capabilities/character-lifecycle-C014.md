---
cap_id: character-lifecycle-C014
name: character-lifecycle-C014
type: —
domain: character-lifecycle
---

### character-lifecycle-C014
- **name:** Delete Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].delete.ts`
- **game_concept:** Character removal
- **description:** Deletes a character. First unlinks all owned Pokemon (sets ownerId to null), then deletes the character record.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm
