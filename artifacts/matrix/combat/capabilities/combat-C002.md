---
cap_id: combat-C002
name: HumanCharacter Equipment Field
type: prisma-field
domain: combat
---

### combat-C002: HumanCharacter Equipment Field
- **cap_id**: combat-C002
- **name**: Equipment JSON Storage
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `HumanCharacter.equipment`
- **game_concept**: PTU trainer equipment slots (head, body, mainHand, offHand, feet, accessory)
- **description**: JSON string storing EquipmentSlots object mapping slot names to EquippedItem objects. Supports DR, evasion bonus, stat bonuses (Focus items), speed default CS (Heavy Armor), conditional DR (Helmet), readied shield bonuses.
- **inputs**: Updated via PUT /api/characters/:id/equipment
- **outputs**: Equipment slots + computed aggregate bonuses
- **accessible_from**: gm, player
