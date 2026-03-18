# Player Data API

REST endpoints under `/api/player` for offline character data export and import.

**Export:** GET `/api/player/export/:characterId` — exports the character and all owned Pokemon as a JSON blob with metadata (`exportVersion`, `exportedAt`, `appVersion`).

**Import:** POST `/api/player/import/:characterId` — imports offline edits (background, personality, goals, notes, nicknames, held items, move order) with conflict detection. Server wins on conflicts.

## See also

- [[api-endpoint-layout]]
- [[character-export-import-composable]] — client-side composable that calls these endpoints
- [[player-identity-system]] — identity used for export/import targeting
