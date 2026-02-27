---
cap_id: pokemon-lifecycle-C032
name: buildPokemonCombatant
type: service-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C032: buildPokemonCombatant
- **cap_id**: pokemon-lifecycle-C032
- **name**: Pokemon-to-Combatant Builder
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `buildPokemonCombatant()`
- **game_concept**: Embed Pokemon in encounter combatants JSON
- **description**: Converts a CreatedPokemon into a full Combatant wrapper via createdPokemonToEntity() and buildCombatantFromEntity(). Determines token size from species size. Used when spawning Pokemon directly into encounters.
- **inputs**: CreatedPokemon, side string, optional position {x, y}
- **outputs**: Combatant object for encounter JSON
- **accessible_from**: api-only
