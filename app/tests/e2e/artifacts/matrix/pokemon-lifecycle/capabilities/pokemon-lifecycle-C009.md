---
cap_id: pokemon-lifecycle-C009
name: maxHp Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C009: maxHp Field
- **cap_id**: pokemon-lifecycle-C009
- **name**: Pokemon Max HP
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.maxHp`
- **game_concept**: PTU HP formula: Level + (HP_stat * 3) + 10
- **description**: Integer maximum HP. Recalculated on level-up (level component increases by 1 per level gained). HP stat component only changes when stat points are manually allocated. If Pokemon was at full HP before leveling, currentHp is also increased to prevent appearing damaged.
- **inputs**: Calculated from level + baseHp
- **outputs**: Rest healing cap, combat HP bar
- **accessible_from**: gm, player, group
