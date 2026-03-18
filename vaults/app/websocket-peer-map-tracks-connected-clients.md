Connected WebSocket clients are tracked in an in-memory `Map<Peer, ClientInfo>` exported from `app/server/utils/websocket.ts`. Each entry stores a role (`gm`, `group`, or `player`), an optional `encounterId` (the encounter room they've joined), and an optional `characterId` (for player-role clients).

New connections default to the `group` role until the client sends an `identify` message. The map is used by broadcast functions to target messages to specific audiences:

- `broadcast()` — all connected peers
- `broadcastToEncounter(id)` — peers watching a specific encounter
- `broadcastToGroup()` — group-role peers only
- `broadcastToPlayers(encounterId)` — player-role peers in a specific encounter
- `sendToPlayer(characterId)` — a specific player by character ID
- `broadcastToGroupAndPlayers()` — both group and player peers
- `broadcastToGm()` — GM-role peers

Notify helpers (`notifyEncounterUpdate`, `notifySceneUpdate`, `notifyPokemonEvolved`, etc.) wrap these broadcast functions for specific event types. API route handlers call these helpers after persisting state changes to the database.

Peers are removed from the map on `close` or `error` events, and `safeSend` auto-removes peers that throw during send.

## See also

- [[websocket-handler-routes-messages-by-type]]
- [[group-view-websocket-sync]]
- [[vtt-websocket-events-sync-state]]
- [[websocket-identity-is-role-based]] — how the three roles are assigned
- [[api-routes-broadcast-mutations-via-websocket]] — the 30+ routes that call these broadcast functions
