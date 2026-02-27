---
cap_id: player-view-C016
name: player-view-C016
type: —
domain: player-view
---

### player-view-C016
- **name:** GET /api/scenes/active
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Active scene retrieval for player scene view
- **description:** Returns the currently active scene (if any) with characters, pokemon, and groups. Used by the player scene composable as a REST fallback for scene data when WebSocket is unavailable. Enriches characters with isPlayerCharacter flag and pokemon with ownerId.
- **inputs:** None
- **outputs:** { success, data: Scene | null }
- **accessible_from:** player, group, gm

---

## Character Sheet Display
