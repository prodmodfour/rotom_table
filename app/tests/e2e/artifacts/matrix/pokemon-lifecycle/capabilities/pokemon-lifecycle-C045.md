---
cap_id: pokemon-lifecycle-C045
name: POST /api/encounters/:id/xp-distribute
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C045: POST /api/encounters/:id/xp-distribute
- **cap_id**: pokemon-lifecycle-C045
- **name**: Encounter XP Distribution (Write)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: Apply post-combat XP to Pokemon (Core p.460)
- **description**: Write endpoint. Recalculates XP from encounter data to verify. Rejects duplicate pokemonIds. Validates total distribution <= maxDistributable (totalXpPerPlayer * playerCount). For each Pokemon: loads learnset, calls calculateLevelUps(), updates experience/level/tutorPoints/maxHp. Marks encounter.xpDistributed = true. Returns per-Pokemon XpApplicationResult with level-up events.
- **inputs**: Route param: id, Body: { significanceMultiplier, playerCount, isBossEncounter?, distribution: [{ pokemonId, xpAmount }] }
- **outputs**: { success: true, data: { results: XpApplicationResult[], totalXpDistributed } }
- **accessible_from**: gm
