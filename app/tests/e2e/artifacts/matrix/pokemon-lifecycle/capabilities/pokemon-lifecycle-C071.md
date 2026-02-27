---
cap_id: pokemon-lifecycle-C071
name: useCharacterExportImport.handleImportFile
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C071: useCharacterExportImport.handleImportFile
- **cap_id**: pokemon-lifecycle-C071
- **name**: Character Import Handler
- **type**: composable-function
- **location**: `app/composables/useCharacterExportImport.ts` -- `handleImportFile()`
- **game_concept**: Upload offline edits back to server
- **description**: Reads File as text, parses JSON, POSTs to /api/player/import/:characterId. Reports update counts and conflicts. Returns boolean indicating whether fields were updated. Manages importing/operationResult state.
- **inputs**: File object
- **outputs**: Promise<boolean>, operationResult state
- **accessible_from**: player

---

## Components
