---
cap_id: character-lifecycle-C023
name: character-lifecycle-C023
type: —
domain: character-lifecycle
---

### character-lifecycle-C023
- **name:** Character New Day API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/new-day.post.ts`
- **game_concept:** PTU daily reset for character
- **description:** Resets restMinutesToday, injuriesHealedToday, drained/bound AP to 0, currentAp to maxAp. Also resets daily counters and move frequency usage for all linked Pokemon.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, boundAp, currentAp, pokemonReset } }`
- **accessible_from:** gm
