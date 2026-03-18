The utility `app/utils/connectionType.ts` classifies the current connection as one of three types based on `window.location.hostname`:

- **localhost** -- `localhost` or `127.0.0.1`
- **lan** -- private IP ranges (`10.*`, `172.16-31.*`, `192.168.*`)
- **tunnel** -- everything else (e.g. Cloudflare Tunnel domains)

This classification affects the [[websocket-auto-reconnects-with-exponential-backoff|reconnection strategy]]: localhost and LAN connections get 5 retry attempts, tunnel connections get 10. The connection type is also displayed in the [[player-view-connection-status]] dropdown (e.g. "LAN (Local)") and in the [[gm-connect-panel]].
