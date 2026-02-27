---
cap_id: player-view-C031
name: player-view-C031
type: —
domain: player-view
---

### player-view-C031
- **name:** usePlayerCombat composable
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts`
- **game_concept:** Player combat logic and action execution
- **description:** Central combat composable for the player view. Provides turn detection (isMyTurn), active combatant tracking, league battle phase awareness, turn state (action pip tracking), move availability with frequency exhaustion, direct actions (executeMove, useShiftAction, useStruggle, passTurn), and GM-requested actions (requestUseItem, requestSwitchPokemon, requestManeuver). Uses provide/inject for the shared WebSocket send function.
- **inputs:** encounterStore state, playerStore identity, WebSocket send (via inject)
- **outputs:** All combat state and action functions
- **accessible_from:** player
