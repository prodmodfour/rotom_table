---
cap_id: combat-C029
name: Set Weather
type: api-endpoint
domain: combat
---

### combat-C029: Set Weather
- **cap_id**: combat-C029
- **name**: Set Encounter Weather
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/weather.post.ts`
- **game_concept**: PTU weather with duration
- **description**: Sets or clears weather. Source tracking (move/ability/manual) and duration in rounds.
- **inputs**: `{ weather, source?, duration? }`
- **outputs**: Updated encounter
- **accessible_from**: gm
