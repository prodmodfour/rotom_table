---
cap_id: pokemon-lifecycle-C049
name: library.loadLibrary
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C049: library.loadLibrary
- **cap_id**: pokemon-lifecycle-C049
- **name**: Load Library (Characters + Pokemon)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `loadLibrary()`
- **game_concept**: Fetch all entities for library view
- **description**: Parallel-fetches GET /api/characters and GET /api/pokemon. Populates humans and pokemon state arrays. Manages loading/error state.
- **inputs**: None
- **outputs**: Populates store state
- **accessible_from**: gm
