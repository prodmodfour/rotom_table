---
cap_id: pokemon-lifecycle-C031
name: generateAndCreatePokemon
type: service-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C031: generateAndCreatePokemon
- **cap_id**: pokemon-lifecycle-C031
- **name**: Pokemon Generate + Create (Combined)
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `generateAndCreatePokemon()`
- **game_concept**: Primary entry point for Pokemon creation
- **description**: Async function. Calls generatePokemonData() then createPokemonRecord(). Primary entry point for wild spawns, template loads, and scene-to-encounter conversion.
- **inputs**: GeneratePokemonInput
- **outputs**: CreatedPokemon
- **accessible_from**: api-only
