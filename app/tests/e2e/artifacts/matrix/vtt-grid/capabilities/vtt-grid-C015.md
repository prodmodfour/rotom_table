---
cap_id: vtt-grid-C015
name: vtt-grid-C015
type: —
domain: vtt-grid
---

### vtt-grid-C015
- **name:** useTerrainPersistence composable
- **type:** composable-function
- **location:** `app/composables/useTerrainPersistence.ts`
- **game_concept:** Terrain save/load to server
- **description:** Loads terrain state from encounter terrain API on init, saves terrain changes back. Debounced save to avoid excessive API calls.
- **inputs:** Encounter ID, terrain state
- **outputs:** Server-synced terrain data
- **accessible_from:** gm
