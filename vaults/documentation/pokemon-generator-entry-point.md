# Pokemon Generator Entry Point

All Pokemon creation must go through `pokemon-generator.service.ts`. Four graduated functions:

1. **`generatePokemonData(input)`** — Pure function. Looks up SpeciesData, rolls nature/gender, selects moves + abilities, calculates stats. Returns `GeneratedPokemonData` (no DB write).
2. **`createPokemonRecord(data, origin, ownerId?)`** — DB writer. Takes pre-built data and persists a Pokemon row. Returns `CreatedPokemon` with DB id. Sets the [[pokemon-origin-enum|origin]] field.
3. **`generateAndCreatePokemon(input)`** — Convenience combo of (1) + (2). Single call from species name to DB record.
4. **`buildPokemonCombatant(pokemon, side, ...)`** — Wraps a Pokemon entity into a `Combatant` struct for encounter use. Delegates to `combatant.service.buildCombatantFromEntity`.

Never build Pokemon records ad-hoc in API routes. This is enforced by the [[service-delegation-rule]].

## See also

- [[service-inventory]]
- [[service-dependency-map]]
- [[scene-to-encounter-conversion]]
- [[pokemon-nature-system]] — nature rolled and applied during generation
- [[pokemon-hp-formula]] — HP calculated at generation time
- [[pokemon-nickname-resolution]] — default nickname generated when none provided
- [[species-data-model]] — species lookup for stats, learnset, abilities
