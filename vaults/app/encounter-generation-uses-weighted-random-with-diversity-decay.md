The `generateEncounterPokemon` function in the encounter generation service implements weighted random selection with a diversity enforcement mechanism.

Each time a species is selected, its effective weight is halved (exponential decay), making it progressively less likely to appear again. A per-species cap of `ceil(count / 2)` prevents any single species from dominating the results. When only one species exists in the pool, diversity logic is skipped entirely. If all species hit their cap, the system falls back to original weights.

Level for each generated Pokemon is randomized uniformly within the entry-specific level range (if set) or the table's default range.

The function is pure — it takes a `GenerateEncounterInput` with pool entries and count, and returns a `GeneratedPokemon[]` array.

## See also

- [[generate-wild-encounter-modal]] — the UI that triggers generation and shows results
- [[store-resolves-entries-by-merging-parent-with-modification]] — builds the pool fed into this function
- [[pokemon-generator-service]] — a different service that creates full Pokemon records from generated stubs
