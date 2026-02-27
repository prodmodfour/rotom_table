---
cap_id: player-view-C054
name: player-view-C054
type: —
domain: player-view
---

### player-view-C054
- **name:** usePlayerWebSocket.handleCharacterUpdate
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handleCharacterUpdate()
- **game_concept:** Real-time character data synchronization
- **description:** Handles character_update WebSocket events. If the updated entity ID matches the player's character or any Pokemon, triggers a full refreshCharacterData() to re-fetch from the server. Ensures the player view stays in sync with GM-side changes (HP, status, stats, etc.).
- **inputs:** { id } from WebSocket event
- **outputs:** Triggers refreshCharacterData() if relevant
- **accessible_from:** player
