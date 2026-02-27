---
cap_id: encounter-tables-C001
name: encounter-tables-C001
type: —
domain: encounter-tables
---

### encounter-tables-C001
- **name:** EncounterTable Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model EncounterTable
- **game_concept:** PTU encounter table / habitat
- **description:** Weighted spawn table with name, description, imageUrl, default level range (levelMin/levelMax), population density tier, entries (EncounterTableEntry[]), and sub-habitat modifications (TableModification[]).
- **inputs:** name, description, imageUrl, levelMin, levelMax, density
- **outputs:** Persisted table record with entries and modifications
- **accessible_from:** gm
