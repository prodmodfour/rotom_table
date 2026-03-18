# Cross-Store Coordination Rule

Stores never import each other. All coordination happens at the component or composable level:

- `useGridInteraction` uses `selection`, `measurement`, `fogOfWar`, `terrain` stores
- `useGridMovement` uses `terrain` store for movement cost lookups
- `VTTContainer.vue` uses `selection`, `measurement`, `fogOfWar`, `terrain` stores directly

This prevents circular dependencies and keeps each [[pinia-store-classification|store]] independently testable. The rule embodies the [[dependency-inversion-principle]] — stores depend on composable abstractions rather than on each other.

## See also

- [[mediator-pattern]] — the principle of routing communication through a central point rather than allowing direct coupling
- [[technical-debt-cause-tight-coupling]] — this rule prevents the monolithic coupling that causes technical debt
- [[encounter-store-surface-reduction]] — store splits would increase cross-store coordination needs
