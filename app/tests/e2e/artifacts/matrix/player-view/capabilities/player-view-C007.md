---
cap_id: player-view-C007
name: player-view-C007
type: —
domain: player-view
---

### player-view-C007
- **name:** playerIdentity store
- **type:** store-action
- **location:** `app/stores/playerIdentity.ts`
- **game_concept:** Player identity state management
- **description:** Pinia store holding the player's selected characterId, characterName, full HumanCharacter object, Pokemon array, loading state, and error state. Provides actions: setIdentity, setCharacterData, setLoading, setError, clearIdentity. Provides getters: isIdentified, activePokemonId, activePokemon, pokemonIds.
- **inputs:** characterId, characterName, character, pokemon
- **outputs:** Reactive state for all player view components
- **accessible_from:** player
