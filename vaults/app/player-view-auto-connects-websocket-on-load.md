The player view establishes a WebSocket connection automatically on page load without requiring any manual "Connect" action. After selecting a character, the [[player-view-connection-status]] immediately shows "Connected - LAN (Local)" with a green dot.

The connection status expands on tap to show three rows: connection type ("LAN (Local)"), status ("Connected"), and latency (e.g. "2ms"). The latency value updates over time from the [[keepalive-prevents-tunnel-idle-timeout|keepalive heartbeat]].

The group view similarly auto-connects without user interaction. Both views begin receiving real-time events (tab changes, encounter updates, scene events) as soon as the connection is established and the client has [[websocket-identity-is-role-based|identified its role]].

## See also

- [[use-websocket-composable-is-client-foundation]] — the composable that manages the auto-connection lifecycle
- [[gm-connect-panel]] — the GM's connection panel, which is informational rather than required for WebSocket
