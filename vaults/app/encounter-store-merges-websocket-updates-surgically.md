The encounter store's `updateFromWebSocket` method in `app/stores/encounter.ts` merges incoming encounter data field-by-field rather than replacing the entire encounter object. Top-level fields (weather, round, turn, phase, declarations, grid config) are merged individually.

Combatants are matched by ID: existing combatants receive field-by-field updates to preserve Vue reactivity proxies, new combatants are appended, and combatants absent from the incoming data are removed. This avoids breaking reactive watchers that would lose their reference if the entire combatant array were swapped.

This merge strategy means the [[use-websocket-composable-is-client-foundation]] can broadcast the full encounter state on every change without causing unnecessary re-renders or losing local reactive bindings.

## See also

- [[gm-is-single-writer-for-encounter-state]] -- the sync model that makes full-state broadcasts safe
- [[gm-encounter-actions-broadcast-after-each-mutation]] -- the GM-side composable that triggers these broadcasts


- [[encounter-store-delegates-via-build-context]] — the delegation pattern for the store's combat logic
- [[encounter-store-between-turns-gates-priority]] — the betweenTurns flag included in the merge
- [[all-stores-use-pinia-options-api]]
- [[groupviewtabs-has-many-websocket-handler-methods]] — a contrasting approach where individual events trigger targeted mutations instead of a full-state merge
- [[encounter-store-is-largest-hub-store]] — the hub store where this merge lives