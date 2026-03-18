Edges are stored as structured objects with type-specific metadata fields: `{ name, metadata: {...} }`. This enables the app to query and automate edge-dependent mechanics without fragile string parsing.

Edges like Categoric Inclination have metadata (chosen category: Dark, Fire) that affects game mechanics. The plain `string[]` model makes this invisible to the app.

This is a different approach than [[branching-class-suffix-pattern]] because edge metadata is richer and more varied, justifying [[structured-data-for-complex-metadata]].

## See also

- [[skill-stunt-trade-die-for-flat]]
- [[skill-enhancement-edge]]
- [[virtuoso-edge]]
- [[categoric-inclination-edge]]
