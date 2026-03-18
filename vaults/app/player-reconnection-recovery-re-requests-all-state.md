The `useStateSync` composable in `app/composables/useStateSync.ts` handles reconnection recovery for the player view. It watches the `isConnected` flag from the [[use-websocket-composable-is-client-foundation]] and triggers a full state re-sync when a reconnection is detected.

On reconnect, it performs four actions:
1. Re-identifies the player with the server (role, encounterId, characterId)
2. Rejoins the encounter room and requests full encounter state via `sync_request`
3. Requests the active scene and current tab state
4. Re-fetches the character data via REST (`/api/characters/:id/player-view`)

A 5-second cooldown prevents repeated syncs if the connection flaps.

## See also

- [[websocket-auto-reconnects-with-exponential-backoff]] — the reconnection that triggers this recovery
- [[player-api-provides-rest-fallback-for-actions]] — the REST endpoints used alongside WebSocket during recovery
