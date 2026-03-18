The WebSocket handler responds to `keepalive` messages with a `keepalive_ack` containing a timestamp. This prevents Cloudflare Tunnel (or other reverse proxies) from closing idle connections.

The nuxt config also sets `X-Accel-Buffering: no` and `Cache-Control: no-store` on the `/ws` route to prevent proxy buffering and caching of the WebSocket endpoint.

## See also

- [[websocket-handler-routes-messages-by-type]]
- [[server-has-no-auth-or-middleware]]
- [[use-websocket-composable-is-client-foundation]] — the composable that sends the 45-second heartbeat
- [[player-view-connection-status]] — displays the latency measured by the keepalive roundtrip
