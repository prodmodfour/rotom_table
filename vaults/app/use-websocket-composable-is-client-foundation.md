The `useWebSocket` composable in `app/composables/useWebSocket.ts` is the foundation for all real-time communication on the client side. All three views — GM, group, and player — use it to establish a native `WebSocket` connection to the `/ws` endpoint.

On mount, the composable creates a `WebSocket` to `ws(s)://<host>/ws`, automatically selecting the protocol based on page origin. On unmount, it disconnects cleanly. It stores the client's identity (role, encounterId, characterId) so that it can [[websocket-auto-reconnects-with-exponential-backoff|re-identify automatically on reconnect]].

Incoming messages are dispatched internally to the encounter store (`updateFromWebSocket`), the library store (for `character_update`), and the group view tabs store. The composable also maintains reactive state for `movementPreview`, `receivedFlankingMap`, `lastCaptureAttempt`, and `statusTickQueue`.

Exposes: `isConnected`, `isReconnecting`, `latencyMs`, `send`, `identify`, `joinEncounter`, `leaveEncounter`, `requestSync`, and `onMessage` (a listener registration function for views to add their own handlers).

The group view wraps it with `useGroupViewWebSocket` for [[group-view-websocket-sync|scene and tab events]]. The player view wraps it with `usePlayerWebSocket` for [[player-reconnection-recovery-re-requests-all-state|reconnection recovery]] and action acknowledgment handling.

## See also

- [[websocket-handler-routes-messages-by-type]] — the server endpoint this composable connects to
- [[keepalive-prevents-tunnel-idle-timeout]] — the 45-second heartbeat this composable sends
- [[player-view-connection-status]] — the UI that displays this composable's `isConnected` and `latencyMs`
- [[encounter-store-merges-websocket-updates-surgically]] — how the encounter store applies the `encounter_update` events this composable receives
- [[websocket-event-types-defined-as-discriminated-union]] — the TypeScript types for messages this composable sends and receives
