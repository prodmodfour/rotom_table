---
cap_id: player-view-C056
name: player-view-C056
type: —
domain: player-view
---

### player-view-C056
- **name:** identify (player role)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` — case 'identify'
- **game_concept:** Player WebSocket session identification
- **description:** Client sends identify with role='player', optional encounterId, and characterId. Server stores the role and characterId on the peer info. Triggers sending active scene and tab state to the player.
- **inputs:** { role: 'player', encounterId?, characterId }
- **outputs:** Server stores identity; sends scene_sync and tab_state
- **accessible_from:** player
