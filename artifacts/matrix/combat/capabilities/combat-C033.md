---
cap_id: combat-C033
name: Wild Pokemon Spawn
type: api-endpoint
domain: combat
---

### combat-C033: Wild Pokemon Spawn
- **cap_id**: combat-C033
- **name**: Spawn Wild Pokemon in Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/wild-spawn.post.ts`
- **game_concept**: Adding wild Pokemon to combat from encounter tables
- **description**: Creates Pokemon records from species/level data, builds combatants, adds to encounter.
- **inputs**: `{ pokemon: [{ speciesName, level }], side? }`
- **outputs**: Updated encounter + added pokemon IDs
- **accessible_from**: gm
