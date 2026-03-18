Categoric Inclination is a trainer edge that grants a bonus to moves of a chosen type category (e.g., Dark, Fire). The edge is stored as a [[structured-edge-objects|structured edge object]] with metadata specifying the chosen category.

This metadata allows the app to automatically apply the bonus during damage calculation without parsing the edge name. The [[damage-flow-pipeline]] checks for Categoric Inclination metadata when resolving trainer-sourced bonuses.

## See also

- [[structured-edge-objects]] — the storage pattern for this edge
- [[damage-flow-pipeline]] — consumes the category metadata during calculation
- [[automate-routine-bookkeeping]] — the principle driving automatic bonus application
- [[trainer-class-catalog]] — lists which classes grant access to this edge
