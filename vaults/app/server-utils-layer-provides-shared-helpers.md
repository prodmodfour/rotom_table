Ten utility files live in `app/server/utils/` providing shared infrastructure that route handlers and services import:

- **prisma.ts** — Prisma client singleton (see [[prisma-uses-sqlite-with-json-columns-pattern]])
- **websocket.ts** — peer tracking and broadcast functions (see [[websocket-peer-map-tracks-connected-clients]])
- **pendingRequests.ts** — player action request routing (see [[pending-requests-map-routes-gm-responses-to-players]])
- **serializers.ts** — JSON-to-typed-object transforms (see [[serializers-parse-json-columns-into-typed-objects]])
- **wildSpawnState.ts** — in-memory wild spawn preview (see [[wild-spawn-and-map-use-server-in-memory-singletons]])
- **servedMap.ts** — in-memory served map state (see [[wild-spawn-and-map-use-server-in-memory-singletons]])
- **turn-helpers.ts** — turn processing functions extracted from next-turn (trainer resolution resets, phase transitions, skip logic, weather tick damage)
- **csv-parser.ts** — CSV parsing utilities for character sheet imports
- **pokemon-nickname.ts** — nickname generation logic
- **significance-validation.ts** — density/significance validation rules

These are distinct from the services layer. Utils provide infrastructure and data transformation; [[services-are-stateless-function-modules]] contain business logic.

## See also

- [[turn-helpers-extract-round-lifecycle-functions]] — the most complex utility, handling phase transitions and skip logic
