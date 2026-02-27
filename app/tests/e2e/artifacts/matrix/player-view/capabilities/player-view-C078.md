---
cap_id: player-view-C078
name: player-view-C078
type: —
domain: player-view
---

### player-view-C078
- **name:** ConnectionStatus component
- **type:** component
- **location:** `app/components/player/ConnectionStatus.vue`
- **game_concept:** WebSocket connection health indicator
- **description:** Displays a colored dot indicating connection state (connected=green, reconnecting=yellow/pulsing, disconnected=red). Tappable to show details: connection type (LAN/Tunnel), state label, latency in ms, reconnect attempt counter, and retry button. Uses getConnectionType() utility to determine LAN vs tunnel. Click-outside dismisses details.
- **inputs:** isConnected, isReconnecting, reconnectAttempt, maxReconnectAttempts, latencyMs, lastError
- **outputs:** Emits 'retry' event; visual status display
- **accessible_from:** player

---

## Navigation & Layout
