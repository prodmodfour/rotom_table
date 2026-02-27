---
cap_id: healing-C003
name: Character Pokemon Center API
type: —
domain: healing
---

## healing-C003: Character Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for trainers
- **Description:** Restores HP to injury-reduced effective max, clears ALL status conditions, heals injuries (max 3/day). Calculates healing time (1hr base + 30min/injury, or 1hr/injury if 5+). Does NOT restore drained AP (exclusive to Extended Rest). Clears lastInjuryTime when all injuries healed.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, apRestored: 0, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Accessible From:** `gm`
- **Orphan:** false
