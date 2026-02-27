---
cap_id: character-lifecycle-C020
name: character-lifecycle-C020
type: —
domain: character-lifecycle
---

### character-lifecycle-C020
- **name:** Character Extended Rest API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/extended-rest.post.ts`
- **game_concept:** PTU 4+ hour extended rest
- **description:** Applies up to 8 rest periods (4 hours), clears persistent status conditions, restores all drained and bound AP to full maxAp.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, boundApCleared, restMinutes } }`
- **accessible_from:** gm
