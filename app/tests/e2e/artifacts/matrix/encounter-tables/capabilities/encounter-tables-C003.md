---
cap_id: encounter-tables-C003
name: encounter-tables-C003
type: —
domain: encounter-tables
---

### encounter-tables-C003
- **name:** TableModification Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model TableModification
- **game_concept:** Sub-habitat modification of parent encounter table
- **description:** Modifies a parent table's species pool: can add, remove, or override entries. Has own level range override, density multiplier (scales parent density), and nested ModificationEntry[] records.
- **inputs:** name, description, parentTableId, levelMin?, levelMax?, densityMultiplier
- **outputs:** Persisted modification with entries
- **accessible_from:** gm
