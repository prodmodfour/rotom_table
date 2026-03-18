# Encounter Store God Object Risk

The [[encounter-store-decomposition|encounter store]] is 723 lines of state, getters, and actions, plus ~1,091 lines across 5 delegated composables — ~1,814 lines of total encounter logic funneled through a single entry point. Despite the delegation, the store remains the single point of access for: encounter CRUD, serve/unserve, WebSocket sync, weather, wild spawn, environment presets, vision, significance, and 30+ proxy methods to composables.

Any component needing any encounter capability must `useEncounterStore()` and receive the entire surface. This exhibits the [[large-class-smell]] and risks becoming a God Object — a central coordinator that everything depends on.

The delegation mitigates internal complexity (each composable is focused) but not external coupling (every consumer sees everything). Compare with the [[interface-segregation-principle]] success of the zero-state stores ([[pinia-store-classification]]) which expose narrow, focused surfaces.

## See also

- [[encounter-store-as-facade]] — the positive side of the same pattern
- [[interface-segregation-principle]] — consumers forced to depend on the full interface
- [[single-responsibility-principle]] — the store has many reasons to change
- [[mediator-pattern]] — the store mediates between subsystems, a valid but risky role
- [[encounter-store-surface-reduction]] — potential approaches to reduce the store's surface area
- [[event-sourced-encounter-state]] — a destructive proposal that eliminates the god object by replacing it with a reducer
- [[encounter-lifecycle-state-machine]] — a destructive proposal that restructures the store around explicit phases
- [[domain-module-architecture]] — a destructive proposal that distributes the store across domain modules
- [[encounter-dissolution]] — a destructive proposal that dissolves the encounter into independent state containers
- [[command-bus-ui-architecture]] — a destructive proposal that moves the store's action surface to a command bus
