---
cap_id: player-view-C029
name: player-view-C029
type: —
domain: player-view
---

### player-view-C029
- **name:** Combatant visibility rules
- **type:** composable-function
- **location:** `app/components/player/PlayerCombatantInfo.vue` — visibility computed
- **game_concept:** PTU information asymmetry (own/ally/enemy visibility levels)
- **description:** Determines what data fields are visible to the player for each combatant. isOwn: full data (showExactHp, showStats, showMoves, showAbilities, showInjuries). isAlly: exact HP + injuries only. isEnemy: percentage HP only (no exact values, no stats, no injuries).
- **inputs:** combatant.entityId, myCharacterId, myPokemonIds, combatant.side
- **outputs:** { showExactHp, showStats, showMoves, showAbilities, showInjuries }
- **accessible_from:** player

---

## Combat Actions
