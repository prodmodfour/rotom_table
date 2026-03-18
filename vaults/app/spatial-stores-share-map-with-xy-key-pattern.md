The [[fog-of-war-tracks-three-cell-states|fogOfWar]] and [[terrain-cells-combine-base-type-and-movement-flags|terrain]] stores both use `Map<string, T>` with `"x,y"` string keys to index spatial data. This is the same key format and the same JavaScript `Map` type in both stores.

Both stores also share an import/export pattern using tuple serialization (`[string, T][]`) for persistence, and both are saved via the [[fog-and-terrain-auto-save-with-debounce|debounced auto-save]] persistence composables.

The shared pattern is not extracted into a base class or utility — each store implements it independently. This keeps the stores decoupled but means the key format convention (`"x,y"`) is duplicated.

## See also

- [[all-stores-use-pinia-options-api]]