---
cap_id: combat-C065
name: computeEquipmentBonuses
type: utility
domain: combat
---

### combat-C065: computeEquipmentBonuses
- **cap_id**: combat-C065
- **name**: Equipment Bonus Aggregator
- **type**: utility
- **location**: `app/utils/equipmentBonuses.ts` — `computeEquipmentBonuses()`
- **game_concept**: Aggregate combat bonuses from equipment
- **description**: Sums DR, evasion bonus, stat bonuses (first Focus only per PTU p.295), speed default CS, conditional DR. Pure function.
- **inputs**: EquipmentSlots
- **outputs**: EquipmentCombatBonuses
- **accessible_from**: gm, player
