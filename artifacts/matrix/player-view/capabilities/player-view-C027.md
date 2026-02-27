---
cap_id: player-view-C027
name: player-view-C027
type: —
domain: player-view
---

### player-view-C027
- **name:** PlayerEncounterView component
- **type:** component
- **location:** `app/components/player/PlayerEncounterView.vue`
- **game_concept:** Player's encounter participation view
- **description:** Main encounter tab component. Shows encounter name, round number, current turn indicator, and combatants grouped by side (players, allies, enemies). Displays PlayerCombatActions panel when it is the player's turn. Integrates PlayerGridView when the grid is enabled. Shows a waiting state when no active encounter exists. Auto-scrolls to the current combatant when the turn changes.
- **inputs:** myCharacterId, myPokemonIds, send, onMessage (WebSocket functions)
- **outputs:** Visual display with combat action interaction
- **accessible_from:** player
