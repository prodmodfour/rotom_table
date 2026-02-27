---
cap_id: player-view-C001
name: player-view-C001
type: —
domain: player-view
---

### player-view-C001
- **name:** PlayerIdentityPicker component
- **type:** component
- **location:** `app/components/player/PlayerIdentityPicker.vue`
- **game_concept:** Player character selection
- **description:** Full-screen overlay that lists available player characters (fetched via GET /api/characters/players). Shows name, level, trainer classes, and up to 6 Pokemon sprites per character. Emits `select` event with characterId and characterName.
- **inputs:** None (auto-fetches on mount)
- **outputs:** Emits `select(characterId, characterName)` to parent
- **accessible_from:** player
