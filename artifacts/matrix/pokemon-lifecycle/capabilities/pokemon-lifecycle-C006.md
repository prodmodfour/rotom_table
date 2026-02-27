---
cap_id: pokemon-lifecycle-C006
name: experience Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C006: experience Field
- **cap_id**: pokemon-lifecycle-C006
- **name**: Pokemon Experience Points
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.experience`
- **game_concept**: PTU cumulative XP (Core p.203)
- **description**: Integer tracking total accumulated experience. Updated by add-experience endpoint and XP distribution. Capped at MAX_EXPERIENCE (20,555 for level 100). Level derived from experience via EXPERIENCE_CHART lookup.
- **inputs**: Integer, incremented by XP grants
- **outputs**: Determines level progression
- **accessible_from**: gm, player
