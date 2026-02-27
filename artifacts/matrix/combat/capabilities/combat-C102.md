---
cap_id: combat-C102
name: encounter store — createFromScene
type: store-action
domain: combat
---

### combat-C102: encounter store — createFromScene
- **cap_id**: combat-C102
- **name**: Create From Scene
- **type**: store-action
- **location**: `app/stores/encounter.ts` — `createFromScene()`
- **game_concept**: Scene-to-encounter
- **description**: Creates from scene with combatants and significance.
- **inputs**: sceneId, battleType, significance?
- **outputs**: Created encounter
- **accessible_from**: gm

### combat-C103-C108: encounter store — combat actions
- **cap_id**: combat-C103
- **name**: Combat Action Store Methods
- **type**: store-action
- **location**: `app/stores/encounter.ts`
- **game_concept**: Combat lifecycle and actions
- **description**: addCombatant, removeCombatant, executeMove, applyDamage, healCombatant, startEncounter, nextTurn, endEncounter, endAndClear, loadFromTemplate, useAction, setReadyAction.
- **inputs**: Various per action
- **outputs**: Updated encounter
- **accessible_from**: gm (most), player (executeMove, passTurn)
