---
cap_id: vtt-grid-C056
name: vtt-grid-C056
type: —
domain: vtt-grid
---

### vtt-grid-C056
- **name:** Fog of War APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **game_concept:** Fog of war persistence
- **description:** Get/put fog state as 2D array of FogState values. Persisted on the Encounter model.
- **inputs:** Encounter ID, fog state array
- **outputs:** Fog state data
- **accessible_from:** gm
