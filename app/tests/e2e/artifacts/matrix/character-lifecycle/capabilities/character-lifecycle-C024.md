---
cap_id: character-lifecycle-C024
name: character-lifecycle-C024
type: —
domain: character-lifecycle
---

### character-lifecycle-C024
- **name:** Character Player View API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player view data loading
- **description:** Returns full character data with all linked Pokemon in a single request. Designed for the Player View to load character sheet and Pokemon team simultaneously.
- **inputs:** URL param: id
- **outputs:** `{ success, data: { character: {..., pokemonIds}, pokemon: Pokemon[] } }`
- **accessible_from:** player, gm

## Services
