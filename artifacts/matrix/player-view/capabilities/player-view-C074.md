---
cap_id: player-view-C074
name: player-view-C074
type: —
domain: player-view
---

### player-view-C074
- **name:** useStateSync composable
- **type:** composable-function
- **location:** `app/composables/useStateSync.ts`
- **game_concept:** Reconnect recovery for player view
- **description:** Automatically performs full state sync when the WebSocket reconnects after a disconnect. Sequence: (1) re-identify as player, (2) rejoin encounter, (3) request full encounter state via sync_request, (4) request active scene via scene_request, (5) request tab state via tab_sync_request, (6) re-fetch character data via REST. Includes a 5-second cooldown between syncs to avoid spamming. Distinguishes initial connect from reconnect.
- **inputs:** isConnected, send, identify, joinEncounter, refreshCharacterData
- **outputs:** isSyncing (boolean), performSync()
- **accessible_from:** player
