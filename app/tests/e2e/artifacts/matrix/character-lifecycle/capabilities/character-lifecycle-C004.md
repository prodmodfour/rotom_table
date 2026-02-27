---
cap_id: character-lifecycle-C004
name: character-lifecycle-C004
type: —
domain: character-lifecycle
---

### character-lifecycle-C004
- **name:** HumanCharacter.skills field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` — HumanCharacter.skills
- **game_concept:** PTU Trainer Skills (17 skills with ranks)
- **description:** JSON-stringified object mapping skill names to rank strings (Pathetic/Untrained/Novice/Adept/Expert/Master).
- **inputs:** Record<string, SkillRank>
- **outputs:** JSON string in DB, parsed object on API read
- **accessible_from:** gm, player (read-only)
