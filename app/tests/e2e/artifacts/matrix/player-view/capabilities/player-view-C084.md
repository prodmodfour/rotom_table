---
cap_id: player-view-C084
name: player-view-C084
type: —
domain: player-view
---

### player-view-C084
- **name:** getConnectionType utility
- **type:** utility
- **location:** `app/utils/connectionType.ts`
- **game_concept:** Network topology detection
- **description:** Determines the connection type based on the current hostname: 'localhost' (127.0.0.1, ::1), 'lan' (192.168.x.x, 10.x.x.x, 172.16-31.x.x), or 'tunnel' (everything else — Cloudflare Tunnel, ngrok, etc.). Used by WebSocket reconnection logic and ConnectionStatus UI to adjust behavior and display.
- **inputs:** window.location.hostname
- **outputs:** 'localhost' | 'lan' | 'tunnel'
- **accessible_from:** player, group, gm
