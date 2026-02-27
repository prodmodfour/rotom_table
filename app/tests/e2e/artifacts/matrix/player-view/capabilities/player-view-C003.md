---
cap_id: player-view-C003
name: player-view-C003
type: —
domain: player-view
---

### player-view-C003
- **name:** usePlayerIdentity.restoreIdentity
- **type:** composable-function
- **location:** `app/composables/usePlayerIdentity.ts` — restoreIdentity()
- **game_concept:** Session persistence across page reloads
- **description:** Reads stored identity from localStorage (key: 'ptu_player_identity'), sets it in the store, and fetches fresh character data from the server. Returns true if identity was successfully restored.
- **inputs:** None (reads from localStorage)
- **outputs:** boolean (whether identity was restored)
- **accessible_from:** player
