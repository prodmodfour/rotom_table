# Wild Spawn and Map Use Server In-Memory Singletons

The wild spawn preview and served map state are stored as module-level variables on the server rather than in the database. The files `server/utils/wildSpawnState.ts` and `server/utils/servedMap.ts` each export get/set/clear functions that operate on a single nullable variable.

This means both states are lost on server restart, which is intentional — they are transient display states that the GM actively controls and can re-serve at any time.

This contrasts with the [[group-view-tab-state]], which persists in the database as a `GroupViewState` Prisma model so the active tab and scene survive restarts.

## See also

- [[group-api-manages-tab-and-map-state]] — the API endpoints that read/write these singletons
- [[group-view-store-manages-wild-spawn-and-map]] — the client-side store that fetches from these singletons
- [[group-view-state-persisted-as-singleton-row]] — contrasting approach where tab state is persisted in the database
- [[server-utils-layer-provides-shared-helpers]] — these singletons live in the server utils layer