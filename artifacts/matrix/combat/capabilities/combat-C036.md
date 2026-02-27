---
cap_id: combat-C036
name: Distribute XP
type: api-endpoint
domain: combat
---

### combat-C036: Distribute XP
- **cap_id**: combat-C036
- **name**: XP Distribution
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: Awarding XP to Pokemon after combat
- **description**: Applies XP, detects level-ups, updates tutor points. Sets xpDistributed safety flag.
- **inputs**: `{ significanceMultiplier, playerCount, distribution: [{ pokemonId, xpAmount }] }`
- **outputs**: results[], totalXpDistributed
- **accessible_from**: gm
