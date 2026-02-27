---
cap_id: combat-C001
name: Encounter Model
type: prisma-model
domain: combat
---

### combat-C001: Encounter Model
- **cap_id**: combat-C001
- **name**: Encounter Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` — `model Encounter`
- **game_concept**: Combat encounter — the container for all combat state
- **description**: Stores encounter name, battle type (trainer/full_contact), weather (with duration and source tracking), combatants JSON, turn order (overall + trainer + pokemon phase orders), round/turn index, active/paused/served state, VTT grid config (2D + isometric), fog of war, terrain, move log, XP tracking (defeatedEnemies, xpDistributed, significanceMultiplier, significanceTier).
- **inputs**: Created via API; updated via combat actions
- **outputs**: Full encounter state object
- **accessible_from**: gm, group, player
