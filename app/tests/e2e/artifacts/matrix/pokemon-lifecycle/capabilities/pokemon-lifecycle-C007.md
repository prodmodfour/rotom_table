---
cap_id: pokemon-lifecycle-C007
name: level Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C007: level Field
- **cap_id**: pokemon-lifecycle-C007
- **name**: Pokemon Level
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.level`
- **game_concept**: PTU Pokemon level (1-100)
- **description**: Integer level. Updated alongside experience when XP causes level-ups. Used in HP formula (level + HP_stat*3 + 10), stat point distribution, move learning, ability milestones, and capture rate calculation.
- **inputs**: Integer 1-100
- **outputs**: HP calculation, move learning eligibility, ability milestones
- **accessible_from**: gm, player
