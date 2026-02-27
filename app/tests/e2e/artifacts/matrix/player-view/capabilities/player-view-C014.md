---
cap_id: player-view-C014
name: player-view-C014
type: —
domain: player-view
---

### player-view-C014
- **name:** POST /api/player/import/:characterId
- **type:** api-endpoint
- **location:** `app/server/api/player/import/[characterId].post.ts`
- **game_concept:** Character data import with conflict detection
- **description:** Accepts an exported JSON payload and merges safe offline edits. Only updates player-editable fields: character (background, personality, goals, notes) and pokemon (nicknames, held items, move order). Performs conflict detection — if server updatedAt is newer than exportedAt, differing fields are flagged as conflicts (server wins). All updates are applied in a single Prisma transaction. Validated with Zod schema.
- **inputs:** characterId (route param), import payload (exportVersion, exportedAt, character, pokemon[])
- **outputs:** { success, data: { characterFieldsUpdated, pokemonUpdated, conflicts[], hasConflicts } }
- **accessible_from:** player
