The database is SQLite (stored at `app/prisma/ptu.db`) accessed through Prisma ORM. The Prisma client is initialized as a `globalThis` singleton in `app/server/utils/prisma.ts` to survive hot module replacement during development. In development mode, query logging is enabled alongside error and warning logs.

The schema stores complex nested data as JSON text columns rather than normalized relational tables. Moves, abilities, inventory, equipment, status conditions, stage modifiers, skills, features, edges, capabilities, and egg groups are all `String` columns containing JSON. The [[serializers-parse-json-columns-into-typed-objects]] layer handles parsing at the API boundary.

The `Encounter` model takes this pattern furthest — its `combatants` column holds the entire combat state (all combatant data, positions, turn state, conditions) as a single JSON blob. This is loaded, parsed, mutated in memory during combat operations, then re-serialized and saved. The [[entity-update-service-syncs-combatants-back-to-db]] additionally writes changes back to the canonical `Pokemon` and `HumanCharacter` tables.

## See also

- [[encounter-combatants-are-dual-persisted]] — the consequence of storing combat state as JSON alongside entity tables
- [[encounter-table-data-model-has-four-prisma-entities]] — one of the few fully relational domain models
- [[encounter-template-prisma-model]] — uses a mix of JSON columns and separate scalar columns
- [[seed-files-populate-reference-and-campaign-data]] — how the database is initially populated
- [[species-search-api-broken-on-sqlite]] — a SQLite limitation affecting Prisma queries
