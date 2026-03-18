The encounter store splits its action surface across five composable modules — `useEncounterCombatActions`, `useEncounterUndoRedo`, `useEncounterSwitching`, `useEncounterOutOfTurn`, and `useEncounterMounts` — using a delegation pattern built around an internal `_buildContext()` helper.

`_buildContext()` creates a context object with getters and setters for the store's reactive state (encounter, loading, error), plus the encounter ID. Each composable accepts this context and returns a bag of action functions. The store then exposes those action functions as its own actions, presenting a unified API surface to consumers.

This keeps the encounter store file manageable (source comment notes an 800-line target) while allowing each combat subsystem to be developed and tested in isolation. Consumers of the store see a flat list of actions and never need to know about the delegation.

## See also

- [[encounter-store-merges-websocket-updates-surgically]] — the store's WebSocket merge lives in the store itself, not in a delegate
- [[gm-encounter-actions-broadcast-after-each-mutation]] — the broadcast composable is separate from these delegates
- [[stateless-service-stores-wrap-api-calls]] — a different decomposition strategy for encounter-related logic
- [[encounter-store-is-largest-hub-store]] — the scale of the store that necessitates this delegation
- [[encounter-xp-store-extracted-to-limit-file-size]] — a complementary size-management strategy