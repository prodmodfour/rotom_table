---
cap_id: pokemon-lifecycle-C030
name: createPokemonRecord
type: service-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C030: createPokemonRecord
- **cap_id**: pokemon-lifecycle-C030
- **name**: Pokemon DB Record Creator
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `createPokemonRecord()`
- **game_concept**: Persist generated Pokemon to database
- **description**: Async function. Takes GeneratePokemonInput + GeneratedPokemonData and creates a Prisma Pokemon record. Always sets isInLibrary: true. Resolves nickname via resolveNickname(). Stores origin and originLabel (in notes). Returns CreatedPokemon with id, species, level, nickname, data.
- **inputs**: GeneratePokemonInput, GeneratedPokemonData
- **outputs**: CreatedPokemon
- **accessible_from**: api-only
