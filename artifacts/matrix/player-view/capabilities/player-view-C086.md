---
cap_id: player-view-C086
name: player-view-C086
type: —
domain: player-view
---

### player-view-C086
- **name:** pendingRequests utility
- **type:** service-function
- **location:** `app/server/utils/pendingRequests.ts`
- **game_concept:** Request-response routing for player-GM communication
- **description:** Shared Map storing requestId -> characterId for routing GM acknowledgments back to the originating player. Used by both the WebSocket handler and the REST fallback endpoint. Entries auto-expire after 60 seconds via periodic cleanup (every 30 seconds). Provides registerPendingRequest, consumePendingRequest (single-use), and getPendingRequest.
- **inputs:** requestId, characterId
- **outputs:** characterId lookup for response routing
- **accessible_from:** api-only (server-side utility)

---

## Types
