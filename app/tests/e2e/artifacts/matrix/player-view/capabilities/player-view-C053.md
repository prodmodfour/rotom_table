---
cap_id: player-view-C053
name: player-view-C053
type: —
domain: player-view
---

### player-view-C053
- **name:** usePlayerWebSocket.handleMoveExecuted
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleMoveExecuted()
- **game_concept:** Haptic feedback when player's entity executes a move
- **description:** Handles move_executed WebSocket events. Checks if the executing entity (entityId) matches the player's character or any of their Pokemon. If so, triggers vibrateOnMoveExecute() haptic feedback.
- **inputs:** { combatantId, entityId } from WebSocket event
- **outputs:** Triggers vibration if player's entity executed
- **accessible_from:** player
