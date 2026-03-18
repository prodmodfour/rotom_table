# Ball Condition Service

`server/services/ball-condition.service.ts` auto-populates the `BallConditionContext` for [[conditional-ball-modifier-rules|conditional ball evaluators]] from DB state.

## buildConditionContext

Server-side function that assembles context from multiple data sources:

| Field | Source |
|---|---|
| encounterRound | Encounter record |
| targetLevel, targetTypes, targetGender, targetSpecies, targetWeightClass, targetMovementSpeed | SpeciesData |
| activePokemonLevel, activePokemonGender, activePokemonEvoLine | Trainer's active Pokemon in encounter |
| trainerOwnsSpecies | Prisma count query |
| targetEvolvesWithStone | `checkEvolvesWithStone` parsing evolution triggers |

GM overrides take priority over auto-populated values.

## Helpers

`checkEvolvesWithStone` parses `SpeciesData.evolutionTriggers` JSON for stone keywords (Fire Stone, Water Stone, etc.). Used for Moon Ball evaluation.

`deriveEvoLine` builds a basic evolution line from species name and triggers. Returns the species itself plus any `toSpecies` from its triggers. Used for Love Ball evaluation.

## See also

- [[poke-ball-system]]
- [[service-inventory]]
- [[conditional-ball-modifier-rules]]
