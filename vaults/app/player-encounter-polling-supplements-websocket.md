The player view (`/player/index.vue`) polls `/api/encounters` every 3 seconds to detect active encounters, supplementing the WebSocket channel. If the poll request fails, the interval backs off exponentially up to 30 seconds. On success, the interval resets to 3 seconds.

This polling exists because a player might connect before the GM has started or served an encounter — the poll detects new encounters even if the WebSocket `encounter_served` event was missed (e.g. during a brief disconnection).

The [[group-view-polls-as-websocket-fallback]] uses a similar pattern but with different endpoints and intervals.

## See also

- [[use-websocket-composable-is-client-foundation]] — the primary channel that makes polling redundant when connected
- [[player-reconnection-recovery-re-requests-all-state]] — the recovery mechanism that also re-requests state on reconnect
