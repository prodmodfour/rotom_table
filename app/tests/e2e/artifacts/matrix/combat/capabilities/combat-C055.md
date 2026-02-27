---
cap_id: combat-C055
name: buildCombatantFromEntity
type: service-function
domain: combat
---

### combat-C055: buildCombatantFromEntity
- **cap_id**: combat-C055
- **name**: Build Combatant from Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` — `buildCombatantFromEntity()`
- **game_concept**: Converting DB record to combat-ready combatant
- **description**: Calculates initiative (speed + bonus, affected by Heavy Armor speed CS and Focus Speed +5), computes evasions (physical/special/speed using stage-modified stats + equipment evasion bonus + Focus stat bonuses), initializes turn state. Sets Heavy Armor default speed CS on entity.
- **inputs**: BuildCombatantOptions
- **outputs**: Combatant object
- **accessible_from**: gm (via add combatant)
