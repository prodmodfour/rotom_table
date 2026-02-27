---
cap_id: player-view-C041
name: player-view-C041
type: —
domain: player-view
---

### player-view-C041
- **name:** usePlayerCombat.validTargets
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — validTargets computed
- **game_concept:** Target selection for moves and attacks
- **description:** Returns all non-fainted combatants in the encounter as valid targets. Filters out combatants with currentHp <= 0. Used by the target selection overlay in PlayerCombatActions.
- **inputs:** encounterStore.encounter.combatants
- **outputs:** Combatant[] (non-fainted only)
- **accessible_from:** player
