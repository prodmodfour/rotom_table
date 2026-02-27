---
cap_id: encounter-tables-C004
name: encounter-tables-C004
type: —
domain: encounter-tables
---

### encounter-tables-C004
- **name:** ModificationEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model ModificationEntry
- **game_concept:** Sub-habitat species override/add/remove
- **description:** Individual entry in a modification. speciesName (string, not FK — can add species not in parent). weight (overrides parent) or remove=true (excludes). Optional level range override.
- **inputs:** speciesName, weight?, remove, levelMin?, levelMax?, modificationId
- **outputs:** Persisted modification entry
- **accessible_from:** gm

## API Endpoints
