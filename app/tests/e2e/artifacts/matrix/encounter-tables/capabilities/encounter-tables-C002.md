---
cap_id: encounter-tables-C002
name: encounter-tables-C002
type: —
domain: encounter-tables
---

### encounter-tables-C002
- **name:** EncounterTableEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model EncounterTableEntry
- **game_concept:** Pokemon species entry in encounter table
- **description:** Links a species (speciesId → SpeciesData) to a table with a weight (encounter probability) and optional level range override. Unique constraint on (tableId, speciesId).
- **inputs:** speciesId, weight, levelMin?, levelMax?, tableId
- **outputs:** Persisted entry record
- **accessible_from:** gm
