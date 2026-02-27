---
cap_id: player-view-C071
name: player-view-C071
type: —
domain: player-view
---

### player-view-C071
- **name:** usePlayerGridView.confirmMove (move request)
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — confirmMove()
- **game_concept:** Player token movement request (GM approval required)
- **description:** Sends a player_move_request WebSocket event to the GM with requestId, playerId, combatantId, from/to positions, and distance. Sets pendingMove state for UI tracking. Auto-times out after 30 seconds if GM doesn't respond.
- **inputs:** Selected combatantId, moveConfirmTarget (position + distance)
- **outputs:** Sends WebSocket event; sets pendingMove ref
- **accessible_from:** player
