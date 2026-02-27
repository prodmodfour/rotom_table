---
cap_id: character-lifecycle-C021
name: character-lifecycle-C021
type: —
domain: character-lifecycle
---

### character-lifecycle-C021
- **name:** Character Pokemon Center API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/pokemon-center.post.ts`
- **game_concept:** PTU Pokemon Center healing
- **description:** Full HP restoration, all status conditions cleared, injuries healed (max 3/day). Does NOT restore drained AP. Calculates effective max HP after injury reduction.
- **inputs:** URL param: id
- **outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, healingTime } }`
- **accessible_from:** gm
