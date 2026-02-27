---
cap_id: character-lifecycle-C044
name: character-lifecycle-C044
type: —
domain: character-lifecycle
---

### character-lifecycle-C044
- **name:** Library Store — getHumanById getter
- **type:** store-getter
- **location:** `app/stores/library.ts` — useLibraryStore().getHumanById()
- **game_concept:** Character lookup
- **description:** Finds a character by ID in the local state array.
- **inputs:** id: string
- **outputs:** HumanCharacter | undefined
- **accessible_from:** gm
