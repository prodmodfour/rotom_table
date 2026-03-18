When the [[pokemon-generator-service]] calls `selectMovesFromLearnset`, it queries the [[movedata-reference-table]] for each move name from the [[species-learnset-stored-as-json]]. If a move name is not found in MoveData, the generator creates a stub move instead of failing: `{ name, type: 'Normal', damageClass: 'Status', frequency: 'At-Will', ac: null, damageBase: null, range: 'Melee', effect: '' }`.

This means auto-generated Pokemon can carry moves with placeholder data if the species learnset references moves not present in the CSV-seeded database.
