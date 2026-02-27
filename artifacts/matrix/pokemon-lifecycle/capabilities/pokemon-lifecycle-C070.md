---
cap_id: pokemon-lifecycle-C070
name: useCharacterExportImport.handleExport
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C070: useCharacterExportImport.handleExport
- **cap_id**: pokemon-lifecycle-C070
- **name**: Character Export Handler
- **type**: composable-function
- **location**: `app/composables/useCharacterExportImport.ts` -- `handleExport()`
- **game_concept**: Download character + Pokemon as JSON
- **description**: Fetches GET /api/player/export/:characterId. Creates a Blob and triggers download with filename "{characterName}_export.json". Manages exporting/operationResult state.
- **inputs**: characterId (from ref), characterName (from ref)
- **outputs**: Browser download, operationResult state
- **accessible_from**: player
