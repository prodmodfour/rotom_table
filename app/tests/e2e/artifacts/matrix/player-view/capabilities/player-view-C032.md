---
cap_id: player-view-C032
name: player-view-C032
type: —
domain: player-view
---

### player-view-C032
- **name:** usePlayerCombat.isMyTurn
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — isMyTurn computed
- **game_concept:** Turn detection for player
- **description:** Returns true when the current combatant's entityId matches the player's character ID or any of their Pokemon IDs. Drives the display of the combat action panel.
- **inputs:** encounterStore.currentCombatant, playerStore.character.id, playerStore.pokemon
- **outputs:** boolean
- **accessible_from:** player
