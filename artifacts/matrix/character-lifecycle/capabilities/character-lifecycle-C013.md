---
cap_id: character-lifecycle-C013
name: character-lifecycle-C013
type: —
domain: character-lifecycle
---

### character-lifecycle-C013
- **name:** Update Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].put.ts`
- **game_concept:** Character sheet editing
- **description:** Partial update of any character fields. Handles nested stats object, JSON-stringifies arrays/objects, validates AP fields against level-based maxAp with clamping. Imports calculateMaxAp from restHealing.
- **inputs:** URL param: id. Body: any subset of character fields
- **outputs:** `{ success, data: Character }` — updated character
- **accessible_from:** gm
