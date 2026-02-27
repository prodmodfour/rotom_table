---
cap_id: combat-C041
name: Manage Grid Background
type: api-endpoint
domain: combat
---

### combat-C041: Manage Grid Background
- **cap_id**: combat-C041
- **name**: Set/Remove Grid Background
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/background.post.ts`, `background.delete.ts`
- **game_concept**: VTT map background
- **description**: Upload or remove background image for VTT grid.
- **inputs**: Background data (POST) or nothing (DELETE)
- **outputs**: Updated encounter
- **accessible_from**: gm
