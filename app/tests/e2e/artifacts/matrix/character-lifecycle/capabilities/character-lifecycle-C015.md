---
cap_id: character-lifecycle-C015
name: character-lifecycle-C015
type: —
domain: character-lifecycle
---

### character-lifecycle-C015
- **name:** List Player Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player roster for encounters/scenes/player-identity
- **description:** Returns all characters where isInLibrary=true AND characterType='player', with full Pokemon team data (id, species, nickname, level, types, HP, shiny, sprite).
- **inputs:** None
- **outputs:** `{ success, data: PlayerCharacter[] }` — id, name, playedBy, level, currentHp, maxHp, avatarUrl, trainerClasses, pokemon[]
- **accessible_from:** gm, player
