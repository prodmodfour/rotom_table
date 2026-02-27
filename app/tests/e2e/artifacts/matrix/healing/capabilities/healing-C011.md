---
cap_id: healing-C011
name: Global New Day API
type: —
domain: healing
---

## healing-C011: Global New Day API

- **Type:** api-endpoint
- **Location:** `server/api/game/new-day.post.ts:default`
- **Game Concept:** Global daily counter reset for all entities
- **Description:** Resets daily healing counters for ALL Pokemon (restMinutesToday, injuriesHealedToday via bulk updateMany + individual move JSON reset via resetDailyUsage) and ALL Characters (restMinutesToday, injuriesHealedToday, drainedAp, boundAp to 0, currentAp to calculateMaxAp per level). Uses level-grouped batch transaction for characters.
- **Inputs:** None
- **Outputs:** `{ success, message, data: { pokemonReset, pokemonMovesReset, charactersReset, timestamp } }`
- **Accessible From:** `gm`
- **Orphan:** false
