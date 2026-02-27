---
cap_id: player-view-C072
name: player-view-C072
type: —
domain: player-view
---

### player-view-C072
- **name:** usePlayerGridView.getInfoLevel
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — getInfoLevel()
- **game_concept:** Information asymmetry for grid tokens
- **description:** Determines what level of information the player can see for a combatant on the grid: 'full' (own combatants — all data), 'allied' (same side — name + exact HP), 'enemy' (opponent — name + percentage HP).
- **inputs:** Combatant, characterId, pokemonIds
- **outputs:** 'full' | 'allied' | 'enemy'
- **accessible_from:** player
