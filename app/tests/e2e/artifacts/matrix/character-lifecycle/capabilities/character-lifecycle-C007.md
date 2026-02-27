---
cap_id: character-lifecycle-C007
name: character-lifecycle-C007
type: —
domain: character-lifecycle
---

### character-lifecycle-C007
- **name:** HumanCharacter.equipment field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.equipment
- **game_concept:** PTU Equipment Slots (head, body, mainHand, offHand, feet, accessory)
- **description:** JSON-stringified EquipmentSlots object mapping slot names to equipped item objects with bonuses.
- **inputs:** EquipmentSlots object
- **outputs:** JSON string in DB, parsed EquipmentSlots on API read
- **accessible_from:** gm, player (read-only)

## API Endpoints
