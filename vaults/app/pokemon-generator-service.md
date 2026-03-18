The Pokemon generator service (`app/server/services/pokemon-generator.service.ts`) auto-creates Pokemon for wild encounters, scenes, and CSV imports. It replaces the manual [[pokemon-creation-tab]] flow with a fully automated pipeline.

`generatePokemonData()` is a pure function that:
- Looks up [[species-data-model-fields]] from the database
- Applies a random nature
- Distributes `level + 10` stat points weighted by base stats, enforcing the [[pokemon-stat-allocation-enforces-base-relations]] rule
- Selects up to 6 of the most recent learnset moves at or below the Pokemon's level from the [[species-learnset-stored-as-json]], looking up details in the [[movedata-reference-table]] (see [[generator-falls-back-to-stub-for-missing-moves]])
- Picks one random Basic Ability from the species' ability pool
- Computes tutor points as `1 + floor(level/5)`

`createPokemonRecord()` writes the generated data to Prisma and sets initial loyalty based on origin: wild and captured Pokemon get loyalty 2 (Wary), others get loyalty 3 (Neutral).

`buildPokemonCombatant()` wraps a generated Pokemon into an encounter combatant for the battle system.

## See also

- [[pokemon-xp-and-leveling-system]]
- [[evolution-service]]
- [[scene-to-encounter-generates-db-pokemon]] — uses this service to convert transient scene pokemon into DB records
- [[encounter-generation-uses-weighted-random-with-diversity-decay]] — the upstream selection algorithm that picks species before this service generates full Pokemon records
- [[services-are-stateless-function-modules]] — the stateless function pattern this service follows
