# Settings API

REST endpoints under `/api/settings` for server configuration.

**Server info:** GET `/api/settings/server-info` — returns LAN network addresses, port, and primary URL for player connections.

**Tunnel:** GET `/api/settings/tunnel` — get the configured Cloudflare Tunnel URL. PUT `/api/settings/tunnel` — set or clear the Cloudflare Tunnel URL (Zod-validated).

## See also

- [[api-endpoint-layout]]
