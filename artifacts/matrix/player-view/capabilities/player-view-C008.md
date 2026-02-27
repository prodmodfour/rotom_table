---
cap_id: player-view-C008
name: player-view-C008
type: —
domain: player-view
---

### player-view-C008
- **name:** playerIdentity.isIdentified getter
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts` — isIdentified
- **game_concept:** Whether the player has selected a character
- **description:** Returns true when characterId is not null. Used to toggle between the identity picker overlay and the main player view.
- **inputs:** Store state (characterId)
- **outputs:** boolean
- **accessible_from:** player
