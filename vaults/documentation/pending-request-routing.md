# Pending Request Routing

Server-side utility at `server/utils/pendingRequests.ts` that routes GM acknowledgments back to the originating player.

## Mechanism

A shared `Map<string, { characterId: string, timestamp: number }>` maps `requestId` to the player who sent the request. Used by both the WebSocket handler and the [[player-view-architecture|REST fallback]] endpoint (`POST /api/player/action-request`).

## API

- `registerPendingRequest(requestId, characterId)` — stores the mapping.
- `consumePendingRequest(requestId)` — returns and removes the characterId (single-use).
- `getPendingRequest(requestId)` — reads without removing.

## Auto-Expiry

Entries expire after 60 seconds. A periodic cleanup runs every 30 seconds, removing stale entries.

## See also

- [[player-websocket-composable]] — client-side pending action tracking
- [[player-websocket-events]] — player_action / player_action_ack event pair
- [[websocket-real-time-sync]] — the WebSocket server handler
