---
cap_id: combat-C035
name: Calculate XP Preview
type: api-endpoint
domain: combat
---

### combat-C035: Calculate XP Preview
- **cap_id**: combat-C035
- **name**: XP Calculation Preview
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: PTU XP formula preview
- **description**: Computes XP: total enemy levels (trainers double), significance, per-player share. Returns participating Pokemon. Read-only.
- **inputs**: `{ significanceMultiplier, playerCount, isBossEncounter?, trainerEnemyIds? }`
- **outputs**: totalXpPerPlayer, breakdown, participatingPokemon[]
- **accessible_from**: gm
