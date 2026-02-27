---
cap_id: combat-C054
name: updateStageModifiers
type: service-function
domain: combat
---

### combat-C054: updateStageModifiers
- **cap_id**: combat-C054
- **name**: Stage Modifier Manager
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `updateStageModifiers()`
- **game_concept**: PTU combat stages
- **description**: Delta or absolute stage updates, clamped -6/+6.
- **inputs**: Combatant, changes, isAbsolute
- **outputs**: StageChangeResult
- **accessible_from**: gm (via stages endpoint)
