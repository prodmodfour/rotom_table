---
cap_id: capture-C041
name: Pokemon.ownerId Field
type: prisma-field
domain: capture
---

### capture-C041: Pokemon.ownerId Field
- **cap_id**: capture-C041
- **name**: Pokemon Ownership Link
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` — `Pokemon.ownerId`
- **game_concept**: Trainer-Pokemon ownership
- **description**: Foreign key linking Pokemon to its owning HumanCharacter. Set on capture success to the capturing trainer's ID. Can be null for wild/unowned Pokemon.
- **inputs**: Set via capture attempt or link endpoint
- **outputs**: Owner reference
- **accessible_from**: gm, player
