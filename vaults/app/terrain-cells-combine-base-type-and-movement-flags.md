# Terrain Cells Combine Base Type and Movement Flags

Each terrain cell in the `terrain` Pinia store has a base type (normal, blocking, water, earth, hazard, elevated) and two boolean movement flags: `rough` (-2 accuracy penalty) and `slow` (double movement cost). The flags can be combined with any base type — a water cell can also be rough, for example.

Legacy terrain types `difficult` and `rough` are migrated on load: `difficult` becomes `normal` with the `slow` flag, `rough` becomes `normal` with the `rough` flag.

The terrain store provides movement cost computation: blocking cells are impassable (cost `Infinity`), slow-flagged cells cost 2, and all others cost 1. Water requires Swim capability and earth requires Burrow, enforced by [[grid-movement-selects-speed-by-terrain]].

## See also

- [[terrain-painter-supports-four-tool-modes]] — the UI for editing terrain cells
- [[fog-and-terrain-auto-save-with-debounce]] — how terrain state persists to the server


- [[spatial-stores-share-map-with-xy-key-pattern]] — the Map\<string, T\> pattern shared with fog of war
- [[all-stores-use-pinia-options-api]]