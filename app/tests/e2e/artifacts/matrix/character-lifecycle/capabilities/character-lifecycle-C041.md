---
cap_id: character-lifecycle-C041
name: character-lifecycle-C041
type: —
domain: character-lifecycle
---

### character-lifecycle-C041
- **name:** Library Store — createHuman action
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().createHuman()
- **game_concept:** Create character via store
- **description:** POSTs to /api/characters, pushes result to local humans array.
- **inputs:** Partial<HumanCharacter> data
- **outputs:** Created HumanCharacter
- **accessible_from:** gm
