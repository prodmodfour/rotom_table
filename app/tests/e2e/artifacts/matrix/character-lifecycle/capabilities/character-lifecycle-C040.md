---
cap_id: character-lifecycle-C040
name: character-lifecycle-C040
type: —
domain: character-lifecycle
---

### character-lifecycle-C040
- **name:** Library Store — loadLibrary action
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().loadLibrary()
- **game_concept:** Load all library entities
- **description:** Fetches all characters and Pokemon in parallel from /api/characters and /api/pokemon. Populates humans[] and pokemon[] state arrays.
- **inputs:** None
- **outputs:** Populates state.humans and state.pokemon
- **accessible_from:** gm
