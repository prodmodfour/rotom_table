---
cap_id: player-view-C048
name: player-view-C048
type: —
domain: player-view
---

### player-view-C048
- **name:** usePlayerWebSocket composable
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts`
- **game_concept:** Player-specific WebSocket orchestration
- **description:** Orchestrates all player-specific WebSocket behavior. Auto-identifies as 'player' when connected with a characterId. Handles scene_sync, scene_deactivated, character_update, damage_applied, move_executed, player_action_ack, player_turn_notify, and granular scene events. Manages pending action request tracking with 60s timeout. Provides sendAction with requestId tracking and promise-based acknowledgment.
- **inputs:** Base useWebSocket composable, playerStore, encounterStore, usePlayerScene, useHapticFeedback
- **outputs:** Connection state, activeScene, sendAction, pendingActionCount, lastActionAck, turnNotification
- **accessible_from:** player
