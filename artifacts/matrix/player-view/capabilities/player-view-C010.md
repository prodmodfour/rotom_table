---
cap_id: player-view-C010
name: player-view-C010
type: —
domain: player-view
---

### player-view-C010
- **name:** playerIdentity.pokemonIds getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — pokemonIds
- **game_concept:** IDs of all player's Pokemon
- **description:** Returns an array of Pokemon IDs for the player's team. Used for ownership detection in combat, fog of war visibility, and character_update event filtering.
- **inputs:** Store state (pokemon[])
- **outputs:** string[]
- **accessible_from:** player

---

## Player View API Endpoints
