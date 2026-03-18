# Client-Server State Mirroring

The encounter store ([[encounter-store-god-object-risk|1,814 lines across 6 files]]) maintains a full copy of the server's encounter state on the client. Every time the server processes an action, it broadcasts the entire encounter state via WebSocket. The client's `updateFromWebSocket` method (encounter store lines 383–438) manually copies every field of the encounter, then iterates all combatants doing surgical `Object.assign` updates.

This means:

- **Full state duplication.** The client holds the same data as the server — all combatants with all their nested entity data, all declarations, the full turn order, the full move log, fog of war state, terrain state, weather state.
- **Manual sync maintenance.** Every time a new field is added to the Encounter type, `updateFromWebSocket` must be updated. Forgetting to copy a field creates silent desync bugs.
- **Duplicated game logic.** Composables like `useMoveCalculation.ts` (871 lines) and `useDamageCalculation.ts` re-implement server-side game logic on the client for preview calculations (damage preview, capture probability, move accuracy). The server has the same logic in services and utils. The two copies can diverge.
- **Wasteful broadcasts.** When the GM deals damage to one combatant, the WebSocket broadcasts the entire encounter state to all connected clients — including all combatant data, even for the Player view which should only see its own Pokemon.
- **No view-specific filtering.** The Group view and Player view receive the same full state as the GM view, then filter it client-side. Information hiding (e.g., not revealing enemy HP to players) depends on client-side filtering, not server-side access control.

The current architecture treats the client as a co-equal state manager rather than a rendering endpoint. The client doesn't merely display server state — it maintains, diffs, merges, and partially computes it. This coupling means that changes to the server's state shape require coordinated changes to the store, the WebSocket handler, and every composable that reads encounter state.

## See also

- [[encounter-store-god-object-risk]] — the store that maintains the duplicate state
- [[websocket-sync-as-observer-pattern]] — the sync mechanism that broadcasts full state
- [[observer-pattern]] — the current approach (full-state push) vs. the ideal (event-stream push)
- [[duplicate-code-smell]] — server/client game logic duplication
- [[server-authoritative-reactive-streams]] — a destructive proposal to eliminate client-side state
- [[composable-architectural-overreach]] — composables that duplicate server logic as a symptom of mirroring
- [[command-bus-ui-architecture]] — a destructive proposal that routes all mutations through server calls, reducing mirroring
