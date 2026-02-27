---
cap_id: player-view-C021
name: player-view-C021
type: —
domain: player-view
---

### player-view-C021
- **name:** useCharacterExportImport composable
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts`
- **game_concept:** Character data portability (offline editing)
- **description:** Handles character JSON export (downloads as file) and import (uploads file, sends to server). Export creates a Blob, generates an object URL, and triggers a download link click. Import reads the file, parses JSON, sends to POST /api/player/import/:characterId, and displays results including conflict information. Provides operationResult with success/error state and conflict details.
- **inputs:** characterId (Ref<string>), characterName (Ref<string>)
- **outputs:** exporting, importing, operationResult, operationResultClass, handleExport, handleImportFile, clearOperationResult
- **accessible_from:** player
