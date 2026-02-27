---
cap_id: character-lifecycle-C018
name: character-lifecycle-C018
type: —
domain: character-lifecycle
---

### character-lifecycle-C018
- **name:** Update Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept:** Equip/unequip items
- **description:** Accepts partial equipment slot updates. Zod-validates each item (name, slot, DR, evasion, stat bonus, conditional DR, speed CS, readied bonuses, two-handed). Handles two-handed auto-clear logic. Returns updated slots and aggregate bonuses.
- **inputs:** URL param: id. Body: { slots: { [slotKey]: EquippedItem | null } }
- **outputs:** `{ success, data: { slots, aggregateBonuses } }`
- **accessible_from:** gm
