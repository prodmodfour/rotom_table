---
cap_id: character-lifecycle-C019
name: character-lifecycle-C019
type: —
domain: character-lifecycle
---

### character-lifecycle-C019
- **name:** Character 30-min Rest API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/rest.post.ts`
- **game_concept:** PTU 30-minute rest healing
- **description:** Heals 1/16th maxHp. Blocked if 5+ injuries or daily rest limit (480 min) reached. Auto-resets daily counters if new day.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **accessible_from:** gm
