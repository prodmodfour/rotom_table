---
cap_id: pokemon-lifecycle-C002
name: SpeciesData Prisma Model
type: prisma-model
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C002: SpeciesData Prisma Model
- **cap_id**: pokemon-lifecycle-C002
- **name**: Species Reference Data Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma:SpeciesData`
- **game_concept**: Pokemon species reference data (seeded from PTU pokedex)
- **description**: Reference data for each Pokemon species seeded from the PTU pokedex. Contains base stats, types, abilities (JSON), learnset (JSON with level+move entries), evolution stage/max, movement capabilities, size, weight class, power, jump, skills, egg groups, and numeric basic ability count. Used by pokemon-generator service and level-up check.
- **inputs**: Populated by seed.ts from books/markdown/pokedexes/
- **outputs**: Species lookup data for generation, level-up, capture rate
- **accessible_from**: api-only

---

## Prisma Fields (Key Pokemon Fields)
