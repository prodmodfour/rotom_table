The settings API at `/api/settings/` exposes server configuration for LAN sharing and remote access.

`server-info.get` returns the server's local network addresses so the GM can share the connection URL with players on the same network. This supports the [[server-has-no-auth-or-middleware]] LAN trust model.

`tunnel.get` and `tunnel.put` read and update the Cloudflare Tunnel URL stored in the `AppSettings` singleton. The tunnel URL enables remote players to connect to the server from outside the local network. The [[keepalive-prevents-tunnel-idle-timeout]] mechanism keeps the tunnel connection alive.

## See also

- [[server-runs-as-spa-with-api-backend]] — the server architecture these settings configure
- [[gm-connect-panel]] — the UI that displays connection info using this API
