---
cap_id: combat-C052
name: applyHealingToEntity
type: service-function
domain: combat
---

### combat-C052: applyHealingToEntity
- **cap_id**: combat-C052
- **name**: Apply Healing to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `applyHealingToEntity()`
- **game_concept**: In-combat healing
- **description**: Heals injuries first, then HP (capped at injury-reduced max), then temp HP (keep higher). Removes Fainted if healed from 0.
- **inputs**: Combatant, HealOptions
- **outputs**: HealResult
- **accessible_from**: gm (via heal endpoint)
