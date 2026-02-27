---
cap_id: pokemon-lifecycle-C011
name: moves Field
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C011: moves Field
- **cap_id**: pokemon-lifecycle-C011
- **name**: Pokemon Move Set
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.moves`
- **game_concept**: PTU move list (up to 6 active)
- **description**: JSON array of MoveDetail objects (name, type, damageClass, frequency, ac, damageBase, range, effect). Auto-selected from learnset at generation (most recent 6 at or below level). Can be overridden via template loading. Updated by player import (reorder only). Level-up detection reports new available moves but does not auto-add.
- **inputs**: Array of MoveDetail objects
- **outputs**: Move cards on moves tab, damage/attack rolls
- **accessible_from**: gm, player
