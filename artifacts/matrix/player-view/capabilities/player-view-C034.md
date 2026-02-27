---
cap_id: player-view-C034
name: player-view-C034
type: —
domain: player-view
---

### player-view-C034
- **name:** usePlayerCombat.executeMove
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — executeMove()
- **game_concept:** PTU move execution in combat (direct action)
- **description:** Executes a Pokemon move against selected targets. Calls encounterStore.executeMove with the combatant ID, move ID, and target IDs. This is a direct action (no GM approval needed). Throws error if it is not the player's turn.
- **inputs:** moveId: string, targetIds: string[]
- **outputs:** void (side effect: server API call via encounterStore)
- **accessible_from:** player
