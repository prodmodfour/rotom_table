---
cap_id: combat-C031
name: Unserve Encounter
type: api-endpoint
domain: combat
---

### combat-C031: Unserve Encounter
- **cap_id**: combat-C031
- **name**: Unserve Encounter
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/unserve.post.ts`
- **game_concept**: Removing encounter from shared display
- **description**: Marks encounter as no longer served, resets GroupViewState to lobby.
- **inputs**: Encounter ID
- **outputs**: Updated encounter
- **accessible_from**: gm
