---
cap_id: player-view-C002
name: player-view-C002
type: —
domain: player-view
---

### player-view-C002
- **name:** usePlayerIdentity composable
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts`
- **game_concept:** Player identity persistence and data loading
- **description:** Wraps the playerIdentity store with localStorage persistence and server data fetching. Provides restoreIdentity (loads from localStorage on startup), selectCharacter (saves identity and fetches character data), clearIdentity (removes from localStorage), and refreshCharacterData (re-fetches from server).
- **inputs:** characterId, characterName (for selection)
- **outputs:** identity, character (HumanCharacter), pokemon (Pokemon[]), isIdentified, loading, error
- **accessible_from:** player
