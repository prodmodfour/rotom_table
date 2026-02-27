---
cap_id: player-view-C005
name: player-view-C005
type: —
domain: player-view
---

### player-view-C005
- **name:** usePlayerIdentity.refreshCharacterData
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — refreshCharacterData()
- **game_concept:** Character data refresh after server-side changes
- **description:** Re-fetches the player's character and Pokemon data from GET /api/characters/:id/player-view. Called on identity restore, character selection, WebSocket character_update events, and reconnection recovery.
- **inputs:** None (uses store's characterId)
- **outputs:** void (updates store with fresh data)
- **accessible_from:** player
