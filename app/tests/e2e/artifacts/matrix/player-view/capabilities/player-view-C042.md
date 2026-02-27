---
cap_id: player-view-C042
name: player-view-C042
type: —
domain: player-view
---

### player-view-C042
- **name:** usePlayerCombat.switchablePokemon
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — switchablePokemon computed
- **game_concept:** Available Pokemon for switch-in
- **description:** Returns the player's non-fainted Pokemon excluding the currently active combatant's entity. Used by the Switch Pokemon panel.
- **inputs:** playerStore.pokemon, myActiveCombatant.entityId
- **outputs:** Pokemon[] (non-fainted, not currently active)
- **accessible_from:** player
