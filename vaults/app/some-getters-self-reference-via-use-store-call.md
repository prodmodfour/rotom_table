# Some Getters Self-Reference via useStore Call

Two stores access their own computed getters from within other getters by calling `useXxxStore()` on themselves. In the [[library-store-loads-humans-and-pokemon-in-parallel|library store]], the `allFiltered` getter calls `useLibraryStore()` to access `filteredHumans` and `filteredPokemon`. In the [[encounter-table-store-centralizes-state-and-api-calls|encounterTables store]], the `getTotalWeight` getter calls `useEncounterTablesStore()` to access `getResolvedEntries`.

This works because Pinia stores are singletons — calling `useXxxStore()` inside the same store returns the already-instantiated instance. It is a workaround for the Options API limitation where getters cannot reference other getters directly by name; they only receive `state` as a parameter, not other getters. The alternative would be duplicating the filtering logic.

## See also

- [[all-stores-use-pinia-options-api]] — this pattern is a consequence of the Options API choice
- [[no-store-imports-another-store]] — these are self-references, not cross-store imports