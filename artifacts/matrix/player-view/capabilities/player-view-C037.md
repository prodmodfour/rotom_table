---
cap_id: player-view-C037
name: player-view-C037
type: —
domain: player-view
---

### player-view-C037
- **name:** usePlayerCombat.passTurn
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — passTurn()
- **game_concept:** End combatant's turn and advance to next
- **description:** Ends the player's turn and advances to the next combatant. Direct action — calls encounterStore.nextTurn(). Throws error if not the player's turn.
- **inputs:** None
- **outputs:** void (side effect: advances encounter turn)
- **accessible_from:** player
