---
cap_id: player-view-C023
name: player-view-C023
type: —
domain: player-view
---

### player-view-C023
- **name:** useCharacterExportImport.handleImportFile
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts` — handleImportFile()
- **game_concept:** Import character data from JSON file with conflict detection
- **description:** Reads a File object, parses as JSON, sends to POST /api/player/import/:characterId. Displays results including how many character fields and Pokemon were updated, and any conflicts where the server version was kept. Returns true if any fields were actually updated.
- **inputs:** File object from file input
- **outputs:** boolean (whether updates were applied); sets operationResult state
- **accessible_from:** player

---

## Pokemon Team Display
