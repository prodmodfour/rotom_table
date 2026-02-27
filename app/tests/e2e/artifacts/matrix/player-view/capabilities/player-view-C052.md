---
cap_id: player-view-C052
name: player-view-C052
type: —
domain: player-view
---

### player-view-C052
- **name:** usePlayerWebSocket.handleDamageApplied
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleDamageApplied()
- **game_concept:** Haptic feedback when player's entity takes damage
- **description:** Handles damage_applied WebSocket events. Checks if the damaged entity (targetId) matches the player's character or any of their Pokemon. If so, triggers vibrateOnDamageTaken() haptic feedback.
- **inputs:** { targetId } from WebSocket event
- **outputs:** Triggers vibration if player's entity was damaged
- **accessible_from:** player
