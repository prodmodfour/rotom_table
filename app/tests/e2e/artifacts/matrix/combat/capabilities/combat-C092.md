---
cap_id: combat-C092
name: usePlayerCombat
type: composable-function
domain: combat
---

### combat-C092: usePlayerCombat
- **cap_id**: combat-C092
- **name**: Player Combat Composable
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts`
- **game_concept**: Player combat actions
- **description**: Turn detection, League phase awareness, turn state, move availability with frequency, direct actions (move, shift, struggle, pass), WS requests (item, switch, maneuver), target helpers, canBeCommanded check.
- **inputs**: Stores + WS inject
- **outputs**: Player combat state + actions
- **accessible_from**: player
