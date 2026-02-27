---
cap_id: character-lifecycle-C003
name: character-lifecycle-C003
type: —
domain: character-lifecycle
---

### character-lifecycle-C003
- **name:** HumanCharacter.trainerClasses field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.trainerClasses
- **game_concept:** PTU Trainer Classes (max 4)
- **description:** JSON-stringified array of class name strings. Stored as text, parsed on read.
- **inputs:** Array of class name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)
