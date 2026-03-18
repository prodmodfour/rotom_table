The `usePlayerWebSocket` composable in `app/composables/usePlayerWebSocket.ts` wraps the [[use-websocket-composable-is-client-foundation]] with player-specific logic. Its `sendAction()` function returns a Promise that resolves when the GM acknowledges the request or rejects after a 60-second timeout.

Each action request is tagged with a unique `requestId`. The composable maintains a local `pendingActions` map keyed by `requestId`. When a `player_action_ack` message arrives, it matches the `requestId`, resolves the corresponding promise, and removes the entry. The GM's response includes `accepted`, `rejected`, or `pending` status.

The composable also handles `player_turn_notify` (triggering [[haptic-feedback-vibrates-on-combat-events|haptic feedback]]), `scene_sync`/`scene_deactivated`/`scene_activated` (delegating to scene state), `character_update` (refreshing character data if relevant), and `damage_applied` (triggering vibration if the player's entity was hit).

On mount, it watches `isConnected` and the selected `characterId` to auto-identify as a player once both are available.

## See also

- [[pending-requests-map-routes-gm-responses-to-players]] -- the server-side map that routes GM acks back to the right player
- [[gm-processes-player-requests-via-request-handlers]] -- the GM-side code that processes these requests
- [[player-api-provides-rest-fallback-for-actions]] -- the REST fallback when WebSocket is disconnected
