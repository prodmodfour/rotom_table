# Singleton State Coupling

The app's stores and composables are accessed as global singletons. `useEncounterStore()`, `useCharacterStore()`, `usePokemonStore()` are called at import time and return shared instances. Composables like `useEncounterActions()` call these singletons internally, creating invisible coupling chains.

## How it manifests

```typescript
// Composable calls store singleton — invisible dependency
function useEncounterActions() {
  const store = useEncounterStore()       // singleton
  const gridStore = useEncounterGridStore()  // singleton
  const combatStore = useEncounterCombatStore()  // singleton
  // ...operates on all three
}

// Component calls composable — doesn't see store dependencies
const { advanceTurn, dealDamage } = useEncounterActions()
```

The component appears to depend only on `useEncounterActions`. But at runtime, it transitively depends on three Pinia stores, their internal state, and their initialization order. This dependency graph is invisible in the import tree.

## Why this is a problem

- **Untestable without full Pinia setup.** Testing a composable that calls `useEncounterStore()` internally requires initializing Pinia, populating the store with test data, and managing global state between tests. There is no way to inject a mock store.
- **[[inappropriate-intimacy-smell]]** — 10+ composables reach directly into store internals. They know the store's reactive shape, its action names, its getters. The composable and store are so intertwined that changing either requires changing the other.
- **Hidden coupling graph.** The actual dependency graph of the app is invisible. Reading a composable's import statements does not reveal its runtime dependencies. This violates the principle of least surprise and makes refactoring hazardous.
- **[[dependency-inversion-principle]]** violated — high-level composables depend on concrete store implementations, not on abstractions. Swapping the store for a different state manager (or for a test double) requires modifying every composable.
- **Initialization order fragility.** If store A's setup calls store B's getter, and store B's setup calls store A's getter, circular initialization occurs. This has happened in the codebase and is diagnosed only at runtime.

## Relationship to [[composable-store-direct-coupling]]

The [[composable-store-direct-coupling]] note identifies that composables import stores directly. This note generalizes the problem: the entire app (stores, composables, components) uses singletons as the coupling mechanism, making the dependency graph invisible and untestable.

## See also

- [[composable-store-direct-coupling]] — the specific manifestation in composables
- [[dependency-inversion-principle]] — the principle violated
- [[inappropriate-intimacy-smell]] — composables and stores know too much about each other
- [[singleton-pattern]] — the pattern being misused
- [[composable-dependency-injection-pattern]] — the current incremental mitigation
- [[ioc-container-architecture]] — the destructive proposal to replace singletons with explicit injection
- [[law-of-demeter]] — invisible transitive dependencies violate "only talk to your immediate friends"
