---
cap_id: pokemon-lifecycle-C001
name: Pokemon Prisma Model
type: prisma-model
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C001: Pokemon Prisma Model
- **cap_id**: pokemon-lifecycle-C001
- **name**: Pokemon Data Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma:Pokemon`
- **game_concept**: Core Pokemon entity
- **description**: Primary data model for all Pokemon. Stores species, level, experience, nature (JSON), base/current stats, types, abilities (JSON), moves (JSON), capabilities (JSON), skills (JSON), status conditions, injuries, HP, held item, gender, shiny flag, origin, location, owner relationship, archive flag (isInLibrary), tutor points, training exp, egg groups, and rest/healing tracking fields.
- **inputs**: N/A (schema definition)
- **outputs**: Defines the complete Pokemon record shape
- **accessible_from**: gm, player, group, api-only
