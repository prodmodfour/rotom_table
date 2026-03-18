# In-Memory Encounter State

A destructive restructuring to remove the database from the game action hot path by loading encounters into server memory during active play — addressing the [[persistence-hot-path-overhead|serialization overhead of every game action round-tripping through the database]].

## The idea

Every game action currently follows the same path: HTTP request → Prisma reads the encounter row → `JSON.parse()` on ~15 TEXT columns (combatants, turnOrder, declarations, moveLog, fogOfWarState, terrainState, weatherState, etc.) → find relevant data in parsed arrays → compute game logic → mutate state → `JSON.stringify()` everything → Prisma writes the row back → WebSocket broadcasts full state.

Dealing 5 damage to one combatant triggers the parsing of _every_ combatant's full entity snapshot and the re-serialization of the entire encounter. The database is not providing relational query benefits — it's functioning as a JSON file that happens to be accessed through SQL.

Load the encounter into a typed, fully hydrated in-memory object when the GM opens it. All game actions operate on this in-memory state directly — no serialization, no database reads, no Prisma queries. The database is used only for persistence snapshots: periodic auto-save, on explicit save, on encounter close, and on server shutdown.

```typescript
// Server: in-memory encounter state, fully typed, no JSON blobs
class LiveEncounter {
  private state: EncounterState  // fully typed, no JSON strings
  private dirty: boolean = false
  private lastSaved: number = Date.now()

  constructor(private encounterId: string) {}

  async load(): Promise<void> {
    const row = await prisma.encounter.findUnique({ where: { id: this.encounterId } })
    this.state = deserializeEncounter(row)  // one-time deserialization on load
  }

  // Game actions operate directly on typed state — no serialization
  dealDamage(targetId: string, amount: number): StateChange {
    const combatant = this.state.combatants.get(targetId)
    const absorbed = Math.min(combatant.tempHp, amount)
    combatant.tempHp -= absorbed
    combatant.hp = Math.max(0, combatant.hp - (amount - absorbed))
    this.dirty = true
    return { targetId, field: 'hp', oldValue: combatant.hp + (amount - absorbed), newValue: combatant.hp }
  }

  // Persistence happens on a schedule, not per-action
  async saveIfDirty(): Promise<void> {
    if (!this.dirty) return
    const serialized = serializeEncounter(this.state)  // one-time serialization on save
    await prisma.encounter.update({ where: { id: this.encounterId }, data: serialized })
    this.dirty = false
    this.lastSaved = Date.now()
  }
}

// Server: encounter registry manages active encounters
const activeEncounters = new Map<string, LiveEncounter>()

// API routes become thin wrappers
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const encounter = activeEncounters.get(id)
  if (!encounter) throw createError({ statusCode: 404, message: 'Encounter not loaded' })

  const { targetId, amount } = await readBody(event)
  const change = encounter.dealDamage(targetId, amount)
  broadcast(id, change)
  return { success: true, change }
})

// Background persistence — save every 30 seconds if dirty
setInterval(async () => {
  for (const encounter of activeEncounters.values()) {
    await encounter.saveIfDirty()
  }
}, 30_000)
```

## Why this is destructive

- **All 44 encounter API routes are rewritten.** Every route currently does its own read-mutate-write cycle with `JSON.parse` and `JSON.stringify`. After this change, routes call methods on the `LiveEncounter` object directly.
- **`encounter.service.ts` (514 lines) is gutted.** The `buildEncounterResponse` function, `ParsedEncounter` type, and all the JSON parsing logic are deleted. Encounter data is always typed in memory.
- **The encounter load/save model inverts.** Currently, every request loads the encounter. After this change, the encounter is loaded once when opened and held in memory until closed. The Prisma query pattern shifts from "read on every request" to "read once, write periodically."
- **`JSON.parse()` and `JSON.stringify()` on encounter data happen exactly twice**: once on load, once on save. Currently they happen on every single action during an encounter.
- **The WebSocket broadcast changes.** Instead of building a full encounter response (which requires re-serialization), broadcasts send the specific state change or a projection of the in-memory state — no serialization needed for the broadcast path.
- **API routes lose their Prisma imports for encounter operations.** Routes interact with `LiveEncounter` objects, not Prisma. Prisma becomes an implementation detail of the persistence layer, not a dependency of every route.

## Principles improved

- [[single-responsibility-principle]] — game logic is separated from persistence. Routes handle validation and delegation. `LiveEncounter` handles state transitions. The persistence layer handles saving. Currently, routes handle all three.
- [[dependency-inversion-principle]] — routes depend on the `LiveEncounter` abstraction, not on Prisma directly. This is the inverse of the current pattern where [[routes-bypass-service-layer|137/158 routes import Prisma directly]].
- Eliminates [[persistence-hot-path-overhead]] — the database is off the hot path. Game actions are pure in-memory operations.
- Improves [[route-to-service-migration-strategy]] — with in-memory state, routes naturally become thin because the state management logic lives in `LiveEncounter`.

## Patterns and techniques

- [[memento-pattern]] — periodic persistence snapshots are mementos of the in-memory state
- [[proxy-pattern]] — `LiveEncounter` is a proxy for the persisted encounter, providing in-memory access with deferred persistence
- [[facade-pattern]] — `LiveEncounter` presents a clean, typed API over the underlying encounter state
- Unit of Work — changes accumulate in memory and are flushed to the database as a batch
- Identity Map — `activeEncounters` maps encounter IDs to in-memory objects, preventing duplicate loading

## Trade-offs

- **Data loss risk.** If the server crashes between auto-saves, game actions since the last save are lost. With database-per-action persistence, every action is durable. Mitigations: shorter save intervals, write-ahead logging, or combining with [[event-sourced-encounter-state]] (events are persisted immediately, state is computed from events).
- **Server becomes stateful.** The current server is effectively stateless for encounter operations — every request reads from and writes to the database independently. With in-memory state, the server holds mutable state that must be managed across requests, WebSocket connections, and server restarts. This is fundamentally different.
- **Concurrency complexity.** If two requests arrive simultaneously for the same encounter (unlikely in a single-GM app but possible), they operate on the same in-memory object. Mutations must be serialized or locked. The current database-per-request model provides natural isolation.
- **Memory usage.** Each active encounter consumes server memory proportional to its combatant count and entity data size. For this app (typically 1–2 active encounters), memory is not a concern. But the pattern doesn't scale.
- **Server restart requires encounter reload.** After a server restart, active encounters must be reloaded from the database. Players may see a stale state flash before the encounter is rehydrated.
- **Testing changes.** Route tests currently mock Prisma and verify database writes. With in-memory state, tests verify `LiveEncounter` method calls — a different testing pattern.

## Open questions

- What is the save interval? 30 seconds? Every round? On every turn advancement? Configurable?
- How is crash recovery handled? Is "lose the last 30 seconds of combat" acceptable, or must durability be stronger?
- Should this be combined with [[event-sourced-encounter-state]] for durability (persist events immediately, compute state from events)?
- How does the `LiveEncounter` lifecycle work? Loaded when the GM opens the encounter page, unloaded after 5 minutes of inactivity? What if the browser tab is closed without closing the encounter?
- Does this apply to non-encounter entities (characters, Pokemon)? Or only to encounters during active combat?
- How does this interact with [[server-authoritative-reactive-streams]]? In-memory state enables efficient projection computation — the server can diff and push changes without database round-trips.
- What happens if the GM opens the same encounter in two browser tabs?

## See also

- [[persistence-hot-path-overhead]] — the problem this addresses
- [[denormalized-encounter-combatants]] — the JSON-in-SQLite pattern becomes less damaging when parsing happens only once
- [[encounter-schema-normalization]] — a complementary approach: normalize the schema AND hold it in memory
- [[event-sourced-encounter-state]] — combining event sourcing with in-memory state: events persist durably, state computes from events in memory
- [[server-authoritative-reactive-streams]] — in-memory state is a natural enabler for server-computed projections
- [[routes-bypass-service-layer]] — routes stop importing Prisma; they import `LiveEncounter`
