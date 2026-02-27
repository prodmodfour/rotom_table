---
cap_id: pokemon-lifecycle-C005
name: ownerId Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C005: ownerId Field
- **cap_id**: pokemon-lifecycle-C005
- **name**: Pokemon Owner Relationship
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.ownerId`
- **game_concept**: Trainer-Pokemon ownership link
- **description**: Foreign key to HumanCharacter. Nullable. Set via link/unlink endpoints or capture auto-link. Determines which trainer's party a Pokemon belongs to.
- **inputs**: String (HumanCharacter ID) or null
- **outputs**: Used for library grouping, party display, XP distribution grouping
- **accessible_from**: gm, player
