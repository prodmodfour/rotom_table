---
cap_id: character-lifecycle-C006
name: character-lifecycle-C006
type: —
domain: character-lifecycle
---

### character-lifecycle-C006
- **name:** HumanCharacter.edges field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.edges
- **game_concept:** PTU Trainer Edges (including Skill Edges)
- **description:** JSON-stringified array of edge name strings. Skill Edges formatted as "Skill Edge: [Skill Name]".
- **inputs:** Array of edge name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)
