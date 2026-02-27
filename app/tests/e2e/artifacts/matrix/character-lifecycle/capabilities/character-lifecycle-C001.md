---
cap_id: character-lifecycle-C001
name: character-lifecycle-C001
type: —
domain: character-lifecycle
---

### character-lifecycle-C001
- **name:** HumanCharacter Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` — model HumanCharacter
- **game_concept:** Trainer / NPC data record
- **description:** Core data model for human characters (players, NPCs, trainers). Stores stats, classes, skills, features, edges, equipment, inventory, status conditions, stage modifiers, injuries, rest/healing tracking, AP pool, avatar, background/biography, and library membership.
- **inputs:** All fields defined on the model (id, name, characterType, playedBy, age, gender, height, weight, level, stats, currentHp, maxHp, trainerClasses, skills, features, edges, equipment, inventory, money, statusConditions, stageModifiers, injuries, temporaryHp, rest tracking fields, drainedAp, boundAp, currentAp, avatarUrl, background, personality, goals, location, isInLibrary, notes, pokemon relation)
- **outputs:** Persisted character record with all fields
- **accessible_from:** gm, player (read-only via player-view endpoint), api-only
