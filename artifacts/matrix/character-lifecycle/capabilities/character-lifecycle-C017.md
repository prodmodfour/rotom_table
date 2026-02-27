---
cap_id: character-lifecycle-C017
name: character-lifecycle-C017
type: —
domain: character-lifecycle
---

### character-lifecycle-C017
- **name:** Get Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept:** Equipment slot inspection
- **description:** Returns current equipment slots and computed aggregate combat bonuses (DR, evasion, stat bonuses, speed CS, conditional DR).
- **inputs:** URL param: id
- **outputs:** `{ success, data: { slots: EquipmentSlots, aggregateBonuses: EquipmentCombatBonuses } }`
- **accessible_from:** gm
