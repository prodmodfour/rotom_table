The pending requests module (`app/server/utils/pendingRequests.ts`) maps `requestId` to `characterId` so that GM acknowledgments can be routed back to the originating player. It is used by both the [[websocket-handler-routes-messages-by-type]] and a REST fallback endpoint at `POST /api/player/action-request`.

When a player submits an action, `registerPendingRequest(requestId, characterId)` stores the mapping. When the GM responds, `consumePendingRequest(requestId)` returns the characterId and deletes the entry (single-use). `getPendingRequest` allows checking existence without consuming.

Entries auto-expire after 60 seconds. A `setInterval` runs every 30 seconds to purge expired entries. The cleanup interval is cleared on process `beforeExit`.

## See also

- [[websocket-peer-map-tracks-connected-clients]] — the peer map that `routeToPlayer` iterates to deliver the response
- [[player-api-provides-rest-fallback-for-actions]] — the REST endpoint that registers pending requests
- [[player-websocket-wraps-actions-as-promises]] — the client-side promise tracking that consumes the routed acks
- [[gm-processes-player-requests-via-request-handlers]] — the GM-side handlers that produce the acks
