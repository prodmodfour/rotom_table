---
cap_id: player-view-C055
name: player-view-C055
type: —
domain: player-view
---

### player-view-C055
- **name:** Scene event handling (granular)
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts` — handlePlayerMessage switch cases
- **game_concept:** Real-time scene synchronization for player
- **description:** Handles 10 granular scene-related WebSocket events: scene_sync (applies WebSocket payload), scene_deactivated (clears scene), scene_activated (fetches via REST), scene_update, scene_character_added/removed, scene_pokemon_added/removed, scene_group_created/updated/deleted, scene_positions_updated. All granular events trigger fetchActiveScene() REST fallback rather than incremental patching for simplicity.
- **inputs:** Various WebSocket event payloads
- **outputs:** Updates activeScene ref via REST fetch or direct mapping
- **accessible_from:** player

---

## WebSocket Events (Player-Specific)
