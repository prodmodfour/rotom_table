---
cap_id: combat-C051
name: applyDamageToEntity
type: service-function
domain: combat
---

### combat-C051: applyDamageToEntity
- **cap_id**: combat-C051
- **name**: Apply Damage to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `applyDamageToEntity()`
- **game_concept**: Updating combatant state after damage
- **description**: Updates HP, temp HP, injuries. On faint: clears persistent+volatile conditions (not Other), adds Fainted.
- **inputs**: Combatant, DamageResult
- **outputs**: Mutated entity
- **accessible_from**: gm (via API)
