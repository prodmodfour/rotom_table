---
cap_id: pokemon-lifecycle-C029
name: generatePokemonData
type: service-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C029: generatePokemonData
- **cap_id**: pokemon-lifecycle-C029
- **name**: Pokemon Data Generator (Pure)
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -- `generatePokemonData()`
- **game_concept**: Full Pokemon sheet generation from species + level
- **description**: Async function. Looks up SpeciesData, selects random nature and applies modifiers, distributes stat points (level + 10 points weighted by base stats with Base Relations enforcement), calculates HP (level + HP_stat*3 + 10), selects up to 6 moves from learnset, picks random Basic Ability, assigns random gender. Supports overrideMoves and overrideAbilities for template preservation. No DB writes.
- **inputs**: GeneratePokemonInput (speciesName, level, nickname?, origin, overrideMoves?, overrideAbilities?)
- **outputs**: GeneratedPokemonData (full sheet data)
- **accessible_from**: api-only
