# GM Connect Panel

A dropdown panel opened by clicking the "Connect" button in the [[gm-navigation-bar]]. It is headed "Player Connection" and provides URLs that players on other devices can use to reach the app.

The panel has two connection sections:

- **Tunnel (Remote)** — for connections outside the local network. Shows "No tunnel configured" by default with a "Configure" button.
- **LAN (Local Network)** — lists each network interface on the GM's machine (e.g. "eth0", "tailscale0") with a copyable URL like `http://172.31.70.164:3000`. Each URL has a copy button.

A **"Show QR codes"** toggle button reveals a QR code beneath each LAN URL so players can scan it with their phone camera.

The URLs point to the app root (`/`), which shows the [[landing-page]]. Since the landing page does not link to the [[player-view-character-selection]], players reaching the app this way have no visible path to the `/player` route.

The "Connect" button is informational — the GM's WebSocket connection is established automatically by the [[use-websocket-composable-is-client-foundation]], not by clicking this button. The panel helps the GM share the app URL with players on other devices.

## See also

- [[player-view-auto-connects-websocket-on-load]] — the auto-connection behavior on the player side
