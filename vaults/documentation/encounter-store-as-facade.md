# Encounter Store as Facade

The [[encounter-store-decomposition|encounter store]] delegates combat logic to 5 composables via a `_buildContext()` pattern, acting as a [[facade-pattern]] over the subsystems. This partially follows the [[single-responsibility-principle]] by extracting combat actions, undo/redo, switching, out-of-turn, and mounts into separate modules.

However, the store retains 30+ thin proxy methods that forward calls to the composables, meaning all consumers still depend on the full encounter store interface. This is a [[facade-pattern]] strength (simplified access point) but an [[interface-segregation-principle]] weakness (no way to depend on just one subsystem).

The `_buildContext()` mechanism is a form of manual dependency injection — the composables receive a context object with `getEncounter`, `setEncounter`, `setError`, and `setBetweenTurns` rather than importing the store directly.

## See also

- [[encounter-store-god-object-risk]] — the negative side of this pattern
- [[mediator-pattern]] — the store also acts as a mediator between subsystems
- [[composable-domain-grouping]] — the composables it delegates to
- [[encounter-store-surface-reduction]] — potential alternatives to the facade approach
