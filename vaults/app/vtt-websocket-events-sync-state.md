# VTT WebSocket Events Sync State

`VTTWebSocketEvent` in `types/spatial.ts` defines four event types broadcast over WebSocket to synchronize VTT state between the GM and spectator views:

- `position_update` — a combatant moved to a new grid position
- `grid_config_update` — the [[grid-config-type]] changed (dimensions, isometric toggle, etc.)
- `terrain_update` — terrain cells were modified
- `token_size_update` — a token's grid footprint changed

The [[group-grid-canvas-provides-read-only-spectating]] receives these events to update the player view in real time. The isometric camera angle is also synchronized between views via the `isometricCamera` store.

Movement preview events allow spectators to see a token's pending movement path before it completes.

## See also

- [[websocket-handler-routes-messages-by-type]] — the server handler that dispatches these events
- [[websocket-peer-map-tracks-connected-clients]] — the peer tracking that targets encounter viewers
