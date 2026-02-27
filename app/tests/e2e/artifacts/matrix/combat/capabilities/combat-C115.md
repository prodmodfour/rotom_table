---
cap_id: combat-C115
name: encounter store — getters
type: store-getter
domain: combat
---

### combat-C115: encounter store — getters
- **cap_id**: combat-C115
- **name**: Encounter Getters
- **type**: store-getter
- **location**: `app/stores/encounter.ts`
- **game_concept**: Derived combat state
- **description**: isActive, isPaused, isServed, currentRound, sceneNumber, battleType, isLeagueBattle, currentPhase, combatantsByInitiative, trainersByTurnOrder, pokemonByTurnOrder, currentCombatant, player/ally/enemy combatants, injuredCombatants, combatantsWithActions, moveLog.
- **inputs**: Store state
- **outputs**: Derived values
- **accessible_from**: gm, group, player
