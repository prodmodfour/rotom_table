---
cap_id: player-view-C039
name: player-view-C039
type: —
domain: player-view
---

### player-view-C039
- **name:** usePlayerCombat.requestSwitchPokemon
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestSwitchPokemon()
- **game_concept:** Request to switch active Pokemon (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'switch_pokemon' and pokemonId. Requires GM approval before the switch is executed.
- **inputs:** pokemonId: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player
