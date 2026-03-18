# Character Export/Import Composable

`useCharacterExportImport` handles the client side of the [[player-data-api]] export/import flow.

## Export

`handleExport()` fetches from `GET /api/player/export/:characterId`, creates a JSON Blob, generates a temporary object URL, and triggers a download link click. File is named `{characterName}_export.json` with non-alphanumeric characters replaced by underscores.

## Import

`handleImportFile()` reads a File object, parses as JSON, and sends to `POST /api/player/import/:characterId`. Displays results including how many character fields and Pokemon were updated, and any conflicts where the server version was kept. Returns `operationResult` with success/error state and conflict details.

## See also

- [[player-data-api]] — the REST endpoints this composable calls
- [[player-character-sheet-display]] — export/import buttons live in the character sheet
