---
cap_id: player-view-C088
name: player-view-C088
type: —
domain: player-view
---

### player-view-C088
- **name:** Player-sync types (full protocol)
- **type:** constant
- **location:** `app/types/player-sync.ts`
- **game_concept:** Player-GM WebSocket communication protocol
- **description:** Defines all WebSocket message types for player-GM communication: PlayerActionType (8 action types), PlayerActionRequest (with requestId tracking), PlayerActionAck (accepted/rejected/pending), PlayerTurnNotification (with available actions), PlayerMoveRequest (token movement), PlayerMoveResponse (approved/rejected/modified), GroupViewRequest (tab change), GroupViewResponse, SceneSyncPayload (player-safe scene shape).
- **inputs:** N/A (type definitions)
- **outputs:** N/A (type definitions)
- **accessible_from:** player, gm
