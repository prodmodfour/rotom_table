---
cap_id: combat-C038
name: Update Character Equipment
type: api-endpoint
domain: combat
---

### combat-C038: Update Character Equipment
- **cap_id**: combat-C038
- **name**: Equip/Unequip Items
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept**: Managing trainer equipment
- **description**: Equips/unequips items. Zod-validated. Slot consistency check. Two-handed auto-clear. Returns updated slots + bonuses.
- **inputs**: `{ slots: { [slotName]: EquippedItem | null } }`
- **outputs**: `{ slots, aggregateBonuses }`
- **accessible_from**: gm
