---
cap_id: character-lifecycle-C005
name: character-lifecycle-C005
type: —
domain: character-lifecycle
---

### character-lifecycle-C005
- **name:** HumanCharacter.features field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.features
- **game_concept:** PTU Trainer Features
- **description:** JSON-stringified array of feature name strings. Includes class features and training feature.
- **inputs:** Array of feature name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)
