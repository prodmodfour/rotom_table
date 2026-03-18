The server has no authentication, authorization, middleware, or plugins. There are no `app/server/middleware/` or `app/server/plugins/` directories. Any client can connect and claim any role (GM, group, player) via WebSocket or call any API endpoint.

This is intentional — the app runs on a local LAN for tabletop gaming sessions where all participants are trusted. The [[websocket-peer-map-tracks-connected-clients]] accepts whatever role a client declares.

Route rules in `nuxt.config.ts` disable caching for `/ws` and `/api/**` to ensure fresh data, especially when accessed through a Cloudflare Tunnel. Headers include `Cache-Control: no-store` and `X-Accel-Buffering: no` for the WebSocket endpoint.

The [[settings-api-exposes-network-and-tunnel-info]] provides LAN addresses and tunnel URLs to facilitate sharing access within this trust model.

## See also

- [[server-runs-as-spa-with-api-backend]]
- [[player-api-provides-rest-fallback-for-actions]] — export/import is also unprotected
- [[player-has-no-account-system]] — player identity is character selection, not authentication
