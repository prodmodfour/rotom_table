---
cap_id: pokemon-lifecycle-C004
name: isInLibrary Field (Archive Flag)
type: prisma-field
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C004: isInLibrary Field (Archive Flag)
- **cap_id**: pokemon-lifecycle-C004
- **name**: Pokemon Archive Flag
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma:Pokemon.isInLibrary`
- **game_concept**: Archive/visibility control
- **description**: Boolean flag repurposed as an archive indicator. true = visible in sheets and library, false = archived (hidden from sheets but preserved in DB). Default true.
- **inputs**: Set via bulk-action archive or direct PUT
- **outputs**: Filters library queries (GET /api/pokemon excludes archived unless includeArchived=true)
- **accessible_from**: gm
