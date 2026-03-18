# Player View Connection Status

A status indicator in the [[player-view-header]] showing the connection to the GM's server. It displays as a small green dot next to the character name when connected.

The compact label reads something like "Connected - LAN (Local) - 1ms". Tapping it reveals a dropdown with three rows:

- Connection type (e.g. "LAN (Local)")
- Status (e.g. "Connected")
- Latency (e.g. "1ms")

Each row has an icon alongside the text. The latency value updates over time from the [[keepalive-prevents-tunnel-idle-timeout|keepalive heartbeat]].

## See also

- [[use-websocket-composable-is-client-foundation]] — exposes the `isConnected` and `latencyMs` reactive state this indicator displays
- [[websocket-auto-reconnects-with-exponential-backoff]] — the reconnection behavior reflected in the status
- [[player-view-auto-connects-websocket-on-load]] — the auto-connection observed from the browser
- [[connection-type-derived-from-hostname]] — how the "LAN (Local)" / "Tunnel" label is determined
