---
cap_id: player-view-C012
name: player-view-C012
type: —
domain: player-view
---

### player-view-C012
- **name:** GET /api/characters/players
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player character listing for identity picker
- **description:** Returns all characters with characterType='player'. Used by the PlayerIdentityPicker to list available characters. Includes id, name, level, trainerClasses, and linked pokemon (id, species, nickname).
- **inputs:** None
- **outputs:** { success, data: PlayerSummary[] }
- **accessible_from:** player
