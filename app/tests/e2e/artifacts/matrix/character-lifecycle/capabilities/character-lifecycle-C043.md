---
cap_id: character-lifecycle-C043
name: character-lifecycle-C043
type: —
domain: character-lifecycle
---

### character-lifecycle-C043
- **name:** Library Store — filteredHumans / filteredPlayers / groupedNpcsByLocation getters
- **type:** store-getter
- **location:** `app/stores/library.ts`
- **game_concept:** Character search/filter/grouping
- **description:** filteredHumans filters by search text and characterType, sorts by name/level. filteredPlayers returns player-only subset. groupedNpcsByLocation groups non-player characters by location field.
- **inputs:** state.filters (search, characterType, sortBy, sortOrder)
- **outputs:** HumanCharacter[] or grouped arrays
- **accessible_from:** gm
