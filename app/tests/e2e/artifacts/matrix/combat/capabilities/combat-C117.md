---
cap_id: combat-C117
name: encounterCombat store
type: store-action
domain: combat
---

### combat-C117: encounterCombat store
- **cap_id**: combat-C117
- **name**: Combat Actions Store
- **type**: store-action
- **location**: `app/stores/encounterCombat.ts`
- **game_concept**: Status, stages, injuries, maneuvers, phases, scenes
- **description**: addStatusCondition, removeStatusCondition, updateStatusConditions, modifyStage, setCombatStages, addInjury, removeInjury, takeABreather, sprint, pass, setPhase, nextScene.
- **inputs**: encounterId, combatantId, params
- **outputs**: Updated encounter
- **accessible_from**: gm

---

## Component Capabilities
