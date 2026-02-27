---
cap_id: player-view-C004
name: player-view-C004
type: —
domain: player-view
---

### player-view-C004
- **name:** usePlayerIdentity.selectCharacter
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — selectCharacter()
- **game_concept:** Player choosing their character
- **description:** Persists the selected characterId and characterName to localStorage with a timestamp, sets identity in store, and fetches full character + Pokemon data from the server via GET /api/characters/:id/player-view.
- **inputs:** characterId: string, characterName: string
- **outputs:** void (populates store with character and pokemon data)
- **accessible_from:** player
