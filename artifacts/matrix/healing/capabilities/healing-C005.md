---
cap_id: healing-C005
name: Character New Day API
type: —
domain: healing
---

## healing-C005: Character New Day API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/new-day.post.ts:default`
- **Game Concept:** Per-character daily counter reset with cascading Pokemon reset
- **Description:** Resets a single character's daily healing counters: restMinutesToday, injuriesHealedToday, drainedAp, boundAp all to 0, currentAp to calculateMaxAp(level). Also cascades to all linked Pokemon: resets their restMinutesToday and injuriesHealedToday, and calls resetDailyUsage on their moves JSON.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, boundAp, currentAp, lastRestReset, pokemonReset } }`
- **Accessible From:** `gm`
- **Orphan:** false
