---
cap_id: character-lifecycle-C073
name: character-lifecycle-C073
type: —
domain: character-lifecycle
---

### character-lifecycle-C073
- **name:** computeEquipmentBonuses utility
- **type:** utility
- **location:** `app/utils/equipmentBonuses.ts` — computeEquipmentBonuses()
- **game_concept:** PTU equipment combat bonus aggregation
- **description:** Pure function computing aggregate combat bonuses from EquipmentSlots: total DR, evasion bonus, stat bonuses (Focus items — max 1 per PTU p.295), speed default CS, conditional DR entries.
- **inputs:** equipment: EquipmentSlots
- **outputs:** EquipmentCombatBonuses { damageReduction, evasionBonus, statBonuses, speedDefaultCS, conditionalDR }
- **accessible_from:** gm (via API and components)

## Components
