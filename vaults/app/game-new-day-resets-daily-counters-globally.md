The `POST /api/game/new-day` endpoint advances the in-game calendar day by resetting all daily counters across every entity in the database.

For all Pokemon: `restMinutesToday`, `injuriesHealedToday`, and `lastRestReset` are bulk-reset via `updateMany`. Daily move usage counters inside each Pokemon's moves JSON are individually reset because `updateMany` cannot modify JSON columns — the endpoint iterates through all Pokemon, parses their moves, calls `resetDailyUsage()`, and writes back only those that changed.

For all characters: `restMinutesToday`, `injuriesHealedToday`, and `drainedAp` are reset. `currentAp` is recalculated as `maxAp - boundAp` because bound AP persists until its binding effect ends, not until a new day. These updates run in a `$transaction` with one `updateMany` call per unique (level, boundAp) group.

## See also

- [[rest-healing-service-refreshes-daily-moves]] — handles per-character move refresh during Extended Rest, distinct from the global daily reset
- [[character-api-covers-crud-and-rest-healing]] — individual character rest endpoints
