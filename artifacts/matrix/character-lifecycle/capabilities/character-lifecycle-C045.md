---
cap_id: character-lifecycle-C045
name: character-lifecycle-C045
type: —
domain: character-lifecycle
---

### character-lifecycle-C045
- **name:** Library Store — setFilters / resetFilters actions
- **type:** store-action
- **location:** `app/stores/library.ts` — useLibraryStore().setFilters() / resetFilters()
- **game_concept:** Library filter management
- **description:** Updates or resets filter state (search, type, characterType, pokemonType, pokemonOrigin, sortBy, sortOrder).
- **inputs:** Partial<LibraryFilters> or none (reset)
- **outputs:** Updated filters state
- **accessible_from:** gm

## Composables
