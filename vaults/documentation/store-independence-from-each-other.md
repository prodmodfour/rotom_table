# Store Independence from Each Other

No Pinia store in the codebase imports another store. Cross-store coordination happens through composables that consume multiple stores, keeping stores decoupled from each other's internal structure. This follows the [[dependency-inversion-principle]] at the store boundary — stores depend on their own state and Pinia abstractions, not on sibling stores.

The [[cross-store-coordination-rule]] enforces this pattern. Composables act as [[mediator-pattern|mediators]] between stores: `useGridInteraction` reads from 8 stores simultaneously, but none of those stores know about each other.

However, this independence creates implicit coupling at the consumer level — when many composables depend on the same set of stores, changes to a store's interface ripple through all consuming composables. The coupling is deferred, not eliminated.

## See also

- [[pinia-store-classification]] — the store inventory and their scopes
- [[composable-store-direct-coupling]] — the flip side: composables are tightly coupled to store implementations
- [[encounter-store-as-facade]] — the encounter store avoids cross-store imports by internalizing everything
