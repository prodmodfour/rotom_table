# Encounter Schema Normalization

A destructive restructuring to replace the [[denormalized-encounter-combatants|JSON-in-SQLite encounter model]] with a fully normalized relational schema.

## The idea

Tear out the ~15 JSON TEXT columns on the Encounter model (`combatants`, `turnOrder`, `declarations`, `switchActions`, `pendingActions`, `holdQueue`, `moveLog`, `defeatedEnemies`, `fogOfWarState`, `terrainState`, `environmentPreset`, etc.) and replace them with proper relational tables:

| New table | Replaces | Key fields |
|---|---|---|
| `EncounterCombatant` | `combatants` JSON | FK to Encounter, FK to Pokemon/HumanCharacter, HP, position, initiative, side |
| `CombatantStatusCondition` | nested JSON in combatants | FK to EncounterCombatant, type, source, duration |
| `CombatantStageModifier` | nested JSON in combatants | FK to EncounterCombatant, stat, value |
| `TurnOrderEntry` | `turnOrder` JSON | FK to Encounter, FK to EncounterCombatant, position, acted |
| `Declaration` | `declarations` JSON | FK to Encounter, FK to EncounterCombatant, moveId, targetId, priority |
| `MoveLogEntry` | `moveLog` JSON | FK to Encounter, round, combatantId, moveId, result |
| `FogOfWarCell` | `fogOfWarState` JSON | FK to Encounter, x, y, revealed |
| `TerrainCell` | `terrainState` JSON | FK to Encounter, x, y, type |

Every route, service, composable, and store that reads or writes encounter state must be rewritten to work with relational queries instead of JSON parse/mutate/serialize cycles.

## Why this is destructive

The JSON blob is the load-bearing assumption of the entire encounter system. Every service function receives a parsed `combatants` array, mutates it in-place, and the route handler serializes the whole thing back. Normalization doesn't refactor this pattern — it obliterates it.

- All 44 encounter routes must be rewritten
- All services in the [[service-inventory]] that touch encounter state must change their signatures
- The encounter store must change how it receives and processes data
- The [[websocket-sync-as-observer-pattern|WebSocket sync]] protocol changes — no more full encounter state broadcasts
- The [[entity-update-service|entity-update service]] sync-back pattern changes fundamentally, since combatant state now lives in relational tables rather than JSON snapshots

## Principles improved

- [[single-responsibility-principle]] — each table has one reason to change; combatant status is independent of turn order
- [[open-closed-principle]] — adding a new encounter sub-entity (e.g., terrain hazards) means adding a table, not extending a JSON blob
- [[interface-segregation-principle]] — routes that only need combatant HP don't deserialize the entire encounter
- Eliminates the [[primitive-obsession-smell]] — JSON strings encoding complex domain objects become typed relational records

## Patterns and techniques

- Repository pattern — each new table gets a focused data access layer, replacing the monolithic `prisma.encounter.update({ combatants: JSON.stringify(...) })`
- [[extract-class]] at the data model level — the mega-Encounter becomes a cluster of focused entities
- The [[service-layer-pattern]] becomes enforceable — services receive typed entities from Prisma includes, not hand-parsed JSON

## Trade-offs

- **Massive blast radius.** This is the single highest-impact structural change possible. Every encounter-related file changes.
- **Write performance trade-off.** Currently, updating one combatant's HP requires: read encounter → parse JSON → mutate → stringify → write entire blob. After normalization: `UPDATE encounter_combatant SET hp = ? WHERE id = ?`. Single-field updates are faster, but bulk operations (mutating many combatants at once) lose the efficiency of a single JSON write.
- **Migration pain.** Existing databases must be migrated. The JSON columns must be parsed and their contents inserted into new tables. Data integrity issues in the JSON blobs (malformed data, orphaned references) will surface during migration.
- **SQLite join limitations.** SQLite lacks the join optimization of PostgreSQL. For this app's scale (single GM, ~10 combatants), this is unlikely to matter — but it shifts the performance ceiling.
- **Read amplification.** Loading a full encounter currently requires 1 query. After normalization, it requires Prisma `include` chains across 8+ tables. Prisma generates multiple queries under the hood for SQLite includes.

## Open questions

- Should this be done in one pass or incrementally (e.g., normalize combatants first, then turn order, then declarations)?
- Does the app's scale (single GM, 1–20 combatants, no concurrent writes) actually suffer from the JSON pattern, or is this solving a theoretical problem?
- Would a migration to a database with native JSON support (PostgreSQL with JSONB) be a less destructive alternative that preserves the current pattern while gaining queryability?
- How does this interact with [[combatant-type-segregation]] and [[combat-entity-base-interface]] — does normalization make those proposals easier or redundant?
- What happens to the [[undo-redo-as-memento-pattern|undo/redo system]], which currently snapshots the entire JSON state? Relational state requires a different snapshot strategy.

## See also

- [[denormalized-encounter-combatants]] — the current pattern being destroyed
- [[json-as-text-columns]] — the SQLite constraint that drove the current design
- [[prisma-schema-overview]] — the schema that would be restructured
- [[combatant-type-segregation]] — may be subsumed by relational typing
- [[encounter-store-surface-reduction]] — normalized data naturally segments the store surface
- [[event-sourced-encounter-state]] — an even more radical alternative to both JSON blobs and normalized tables
- [[encounter-dissolution]] — an even more radical alternative that dissolves the Encounter model into independent state containers
