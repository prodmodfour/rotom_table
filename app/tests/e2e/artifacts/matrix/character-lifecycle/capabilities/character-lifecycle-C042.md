---
cap_id: character-lifecycle-C042
name: character-lifecycle-C042
type: —
domain: character-lifecycle
---

### character-lifecycle-C042
- **name:** Library Store — updateHuman / deleteHuman actions
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().updateHuman(), deleteHuman()
- **game_concept:** Update/delete character via store
- **description:** PUTs to /api/characters/:id and updates local array, or DELETEs and filters out.
- **inputs:** id: string, data: Partial<HumanCharacter> (for update)
- **outputs:** Updated HumanCharacter (for update), void (for delete)
- **accessible_from:** gm
