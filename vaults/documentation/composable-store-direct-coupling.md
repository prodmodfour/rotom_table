# Composable Store Direct Coupling

Composables across the codebase directly call `useEncounterStore()`, `useTerrainStore()`, `useMeasurementStore()`, `useFogOfWarStore()`, and `useSelectionStore()` as global singletons inside their function bodies. This appears in 10+ composables including `useMoveCalculation`, `useGridRendering`, `useGridMovement`, and both interaction composables.

This violates the [[dependency-inversion-principle]] — composables depend on concrete store implementations rather than abstractions, making them impossible to test in isolation without mocking the entire Pinia ecosystem.

The inconsistency is notable: several composables already accept some dependencies via their options objects (e.g., `useMoveCalculation` takes `move`, `actor`, `targets` as injected refs) but then bypass that pattern to call `useEncounterStore()` directly for weather and wield state. The options pattern is the right approach — it just isn't applied consistently.

The [[singleton-pattern]] documentation notes that singletons create hidden coupling. The Pinia stores are effectively singletons, and the direct calls spread that coupling widely.

## See also

- [[dependency-inversion-principle]] — composables should depend on injected abstractions, not global singletons
- [[singleton-pattern]] — Pinia stores as singletons with hidden coupling
- [[technical-debt-cause-tight-coupling]] — the tight coupling makes composables hard to test and reuse
- [[store-independence-from-each-other]] — stores themselves are decoupled, but composables bridge them tightly
- [[composable-dependency-injection-pattern]] — a potential design to inject stores instead of calling them directly
- [[composable-architectural-overreach]] — the broader problem of composables exceeding their intended purpose
- [[command-bus-ui-architecture]] — a destructive proposal that eliminates composable-store coupling by replacing action composables with command handlers
- [[ioc-container-architecture]] — a destructive proposal to replace singleton access with explicit container injection
- [[singleton-state-coupling]] — the broader problem of singletons as the coupling mechanism across the app
- [[law-of-demeter]] — composables reach through global singletons to access store internals, violating "only talk to your immediate friends"
