---
cap_id: pokemon-lifecycle-C008
name: tutorPoints Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C008: tutorPoints Field
- **cap_id**: pokemon-lifecycle-C008
- **name**: Pokemon Tutor Points
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.tutorPoints`
- **game_concept**: PTU tutor point currency (Core p.202)
- **description**: Integer tracking tutor points. Gained at level 5 and every 5 levels thereafter. Updated by add-experience and xp-distribute endpoints when leveling. Used for purchasing TM moves and tutored moves.
- **inputs**: Integer, incremented on qualifying level-ups
- **outputs**: Displayed on skills tab
- **accessible_from**: gm, player
