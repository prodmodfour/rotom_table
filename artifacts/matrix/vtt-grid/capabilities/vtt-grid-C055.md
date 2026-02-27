---
cap_id: vtt-grid-C055
name: vtt-grid-C055
type: —
domain: vtt-grid
---

### vtt-grid-C055
- **name:** Grid Position/Config/Background APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/position.post.ts`, `grid-config.put.ts`, `background.post.ts`, `background.delete.ts`
- **game_concept:** VTT grid persistence
- **description:** Position: update token position on grid. Grid config: update grid dimensions, cell size, grid mode. Background: upload/delete background image.
- **inputs:** Encounter ID, position/config/image data
- **outputs:** Updated encounter data
- **accessible_from:** gm
