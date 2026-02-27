---
cap_id: player-view-C009
name: player-view-C009
type: —
domain: player-view
---

### player-view-C009
- **name:** playerIdentity.activePokemon getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — activePokemon
- **game_concept:** Currently active Pokemon on the trainer's team
- **description:** Returns the Pokemon object matching the character's activePokemonId, or null if none is set. Used to highlight the active Pokemon in the team list.
- **inputs:** Store state (character.activePokemonId, pokemon[])
- **outputs:** Pokemon | null
- **accessible_from:** player
