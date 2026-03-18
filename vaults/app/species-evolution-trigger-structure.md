The `EvolutionTrigger` interface (`app/types/species.ts`) describes one possible evolution path from a species. Fields:

- **toSpecies** — target species name this species can evolve into
- **targetStage** — evolution stage of the target (2 or 3)
- **minimumLevel** — required level, or null for non-level evolutions (e.g., stone-only)
- **requiredItem** — stone or held item name, or null for level-only evolutions
- **itemMustBeHeld** — whether the item must be held (vs consumed like a stone)
- **requiredGender** — `'Male'`, `'Female'`, or null for any gender
- **requiredMove** — move the Pokemon must know to evolve, or null

Stored as a JSON array in the [[species-data-model-fields]] `evolutionTriggers` column. The [[evolution-check-utility]] evaluates these triggers against a Pokemon's current state to determine eligibility, and the [[evolution-service]] validates them again before performing the evolution.

## See also

- [[evolution-confirm-modal]]