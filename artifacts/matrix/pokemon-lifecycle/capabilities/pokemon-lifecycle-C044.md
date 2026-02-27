---
cap_id: pokemon-lifecycle-C044
name: POST /api/encounters/:id/xp-calculate
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C044: POST /api/encounters/:id/xp-calculate
- **cap_id**: pokemon-lifecycle-C044
- **name**: Encounter XP Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: Post-combat XP preview (Core p.460)
- **description**: Read-only endpoint. Loads encounter's defeated enemies, enriches trainer status, calls calculateEncounterXp(). Collects player-side Pokemon combatants with owner info. Returns XP breakdown and participating Pokemon list for the XP distribution modal. Does not write to DB.
- **inputs**: Route param: id, Body: { significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }
- **outputs**: { success: true, data: { totalXpPerPlayer, breakdown, participatingPokemon[] } }
- **accessible_from**: gm
