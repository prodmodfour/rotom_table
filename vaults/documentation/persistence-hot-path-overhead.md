# Persistence Hot Path Overhead

Every game action during an encounter follows the same cycle: HTTP request → Prisma query → `JSON.parse()` on ~15 TEXT columns → find relevant combatant in parsed array → compute game logic → mutate state → `JSON.stringify()` all combatants → Prisma update → WebSocket broadcast of full state.

This means that dealing 5 damage to one combatant triggers the parsing and re-serialization of _every_ combatant's full entity data (including all moves, abilities, capabilities, features, equipment, inventory, and status conditions). In an encounter with 12 combatants, a single HP change round-trips through the serialization of ~12 full entity snapshots.

The overhead is not theoretical. The `encounter.service.ts` `buildEncounterResponse` function performs `JSON.parse()` on `combatants`, `turnOrder`, `pokemonTurnOrder`, `declarations`, `moveLog`, `defeatedEnemies`, `fogOfWarState`, `terrainState`, `weatherState`, and more — every single time an encounter is loaded. This happens on every API call that touches encounter state, which during active combat is nearly every user action.

The database is not functioning as a database. It's functioning as a JSON file store with SQL-shaped access patterns. Prisma's query builder, connection pooling, and type-safe query generation add overhead but provide none of their usual benefits (relational queries, partial updates, indexing) because the data is opaque JSON strings.

This is related to but distinct from [[denormalized-encounter-combatants]] (which concerns the _schema_ choice to use JSON columns). The hot-path problem would partially survive normalization — even with relational tables, if every action still round-trips through the database, the I/O overhead remains. The deeper issue is that the database sits on the critical path of every game action, even though encounter state during active play is ephemeral and accessed by exactly one GM at a time.

## See also

- [[denormalized-encounter-combatants]] — the schema problem that amplifies the hot-path cost
- [[encounter-schema-normalization]] — addresses the schema, but the round-trip remains
- [[event-sourced-encounter-state]] — eliminates mutable read-write but adds replay cost
- [[in-memory-encounter-state]] — a destructive proposal to remove the database from the hot path entirely
- [[encounter-dissolution]] — a destructive proposal that eliminates the hot path by loading only affected state containers
- [[headless-game-server]] — a destructive proposal enabling the server to manage its own memory lifecycle
