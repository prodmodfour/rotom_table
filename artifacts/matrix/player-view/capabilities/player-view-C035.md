---
cap_id: player-view-C035
name: player-view-C035
type: —
domain: player-view
---

### player-view-C035
- **name:** usePlayerCombat.useShiftAction
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — useShiftAction()
- **game_concept:** PTU Shift action (move 1 meter)
- **description:** Uses the combatant's Shift action, marking it as used for the turn. Direct action — calls encounterStore.useAction with 'shift'. Throws error if not the player's turn.
- **inputs:** None
- **outputs:** void (side effect: marks shift action used)
- **accessible_from:** player
