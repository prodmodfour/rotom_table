---
cap_id: healing-C008
name: Pokemon Pokemon Center API
type: —
domain: healing
---

## healing-C008: Pokemon Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for Pokemon
- **Description:** Full HP restoration to injury-reduced effective max, clears ALL status conditions, restores ALL move usage (usedToday and usedThisScene to 0 for all moves, no rolling window restriction), heals injuries (max 3/day). Calculates healing time. Clears lastInjuryTime when all injuries healed.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, restoredMoves, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false
