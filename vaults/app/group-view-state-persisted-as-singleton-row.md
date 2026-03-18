The `GroupViewState` Prisma model stores the active Group View tab and scene ID as a single database row with `id: 'singleton'`. This is one of two singleton rows in the schema (the other being `AppSettings`).

The GM switches the Group View tab via the tab buttons in the header bar, which calls `POST /api/group/tab` to update this row. Group and player clients receive the change via WebSocket (`tab_change` event) and also poll `GET /api/group/tab` as a fallback (see [[group-view-polls-as-websocket-fallback]]).

Unlike the [[wild-spawn-and-map-use-server-in-memory-singletons]], tab state survives server restarts because it is persisted in SQLite.

## See also

- [[group-api-manages-tab-and-map-state]] — the API endpoints that read/write this singleton
- [[group-view-websocket-sync]]
- [[prisma-schema-has-fourteen-models]]
