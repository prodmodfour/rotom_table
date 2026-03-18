When the WebSocket connection drops, the [[use-websocket-composable-is-client-foundation]] automatically attempts to reconnect using exponential backoff. The delay starts at 1 second and doubles on each failure up to a 30-second maximum.

The number of retry attempts depends on the [[connection-type-derived-from-hostname|connection type]]: localhost and LAN connections get 5 attempts, while tunnel (remote) connections get 10.

During reconnection, `isReconnecting` is set to true (which the [[player-view-connection-status]] reflects). On successful reconnect, the composable re-sends the stored `identify` message so the [[websocket-peer-map-tracks-connected-clients|server peer map]] has the correct role and encounter assignment.

## See also

- [[player-reconnection-recovery-re-requests-all-state]] — additional state re-fetch after reconnect
