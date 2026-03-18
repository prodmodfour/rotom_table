The `SpeciesData.learnset` column (see [[species-data-model-fields]]) is a JSON string defaulting to `"[]"`. Each entry is `{ level: number, move: string }` — the level at which a species can learn a particular move by level-up.

This learnset drives three move-acquisition paths:
- The [[pokemon-generator-service]] uses it to select initial moves for auto-created Pokemon, taking the 6 most recent entries at or below the Pokemon's level
- The [[level-up-check-utility]] compares old and new levels against it to identify newly available moves
- The [[evolution-check-utility]] uses it to find moves available from a new species form after evolution

The `move` field is a name string that must match an entry in the [[movedata-reference-table]] for full details to be retrieved.
