---
cap_id: player-view-C022
name: player-view-C022
type: —
domain: player-view
---

### player-view-C022
- **name:** useCharacterExportImport.handleExport
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts` — handleExport()
- **game_concept:** Export character data as downloadable JSON file
- **description:** Fetches character data from GET /api/player/export/:characterId, creates a JSON Blob, generates a temporary download link, and triggers the download. File is named `{characterName}_export.json` with non-alphanumeric characters replaced by underscores.
- **inputs:** None (uses characterId and characterName refs)
- **outputs:** Downloaded JSON file
- **accessible_from:** player
