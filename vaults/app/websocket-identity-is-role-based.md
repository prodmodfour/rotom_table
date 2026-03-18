Each WebSocket client identifies itself with one of three roles: `gm`, `group`, or `player`. The [[websocket-peer-map-tracks-connected-clients|peer map]] stores this role alongside optional `encounterId` and `characterId` fields.

New connections default to `group`. After the client receives a `connected` message (containing a `peerId`), it sends an `identify` message with its role and context:

- **GM** identifies with `role: 'gm'` and the current `encounterId` (if one is active). The GM page watches for encounter changes and re-identifies when the encounter ID changes.
- **Group** implicitly uses the default `group` role. It receives tab state and scene events.
- **Player** identifies with `role: 'player'`, the `encounterId`, and a `characterId`. The player page waits until both the WebSocket connection and the character selection are ready before identifying.

The role determines which broadcast functions target the client — `broadcastToGm`, `broadcastToGroup`, `broadcastToPlayers`, or `sendToPlayer`.

## See also

- [[websocket-handler-routes-messages-by-type]] — the server handler that processes `identify` messages
- [[use-websocket-composable-is-client-foundation]] — the client-side composable that sends the `identify`
- [[gm-is-single-writer-for-encounter-state]] — the authority model built on these roles


- [[player-identity-store-is-populated-externally]] — the store that holds the player's character selection used in identification