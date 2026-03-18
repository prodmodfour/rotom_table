The `useEncounterActions` composable in `app/composables/useEncounterActions.ts` contains a `broadcastUpdate()` helper that sends an `encounter_update` WebSocket message with the full current encounter state. Every encounter action -- damage, heal, combat stage changes, status effects, move execution, token movement, grid config updates -- calls `broadcastUpdate()` after completing its mutation.

This is the client-initiated broadcast path, used when the GM mutates encounter state directly through the encounter UI. It complements the [[api-routes-broadcast-mutations-via-websocket|server-side notify helpers]], which broadcast after API route mutations (e.g. next-turn, switch, mount operations).

Both paths result in all connected clients receiving the updated encounter state, which they apply via the [[encounter-store-merges-websocket-updates-surgically|surgical merge]].

## See also

- [[gm-is-single-writer-for-encounter-state]] -- why only the GM triggers these broadcasts
