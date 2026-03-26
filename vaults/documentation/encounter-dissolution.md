# Encounter Dissolution

A destructive restructuring to dissolve the monolithic Encounter model into a composition of independent, focused state containers — addressing the [[encounter-store-god-object-risk|encounter god object]] not by trimming its surface but by eliminating the single-entity concept entirely.

## The idea

The Encounter is the god model. It has 15+ JSON TEXT columns encoding combatants, turn order, weather, terrain, fog of war, wild spawn state, grid configuration, significance levels, mounted pairs, living weapon states, and more. Every game action reads the entire encounter, parses all JSON columns, modifies one concern, serializes everything back, and broadcasts the full state. The [[encounter-schema-normalization]] proposal addresses this by normalizing the JSON columns into relational tables — but the Encounter remains a single entity that owns everything.

What if there is no Encounter?

Replace the Encounter with a **session** — a lightweight container that holds an ID and a set of **state containers**. Each state container owns one concern. They share nothing except the session ID. They are loaded, modified, persisted, and broadcast independently.

```typescript
// There is no Encounter model. There are state containers.

interface CombatRoster {
  sessionId: string
  combatants: Combatant[]
  sides: { allies: string[]; enemies: string[]; neutral: string[] }
}

interface TurnTracker {
  sessionId: string
  currentRound: number
  currentTurnIndex: number
  turnOrder: string[]       // combatant IDs
  declarations: Map<string, Declaration>
  phase: 'setup' | 'declaration' | 'resolution' | 'cleanup'
}

interface SpatialState {
  sessionId: string
  gridWidth: number
  gridHeight: number
  projection: 'orthographic' | 'isometric'
  tokenPositions: Map<string, Position>
  terrain: TerrainTile[]
  elevation: ElevationData
}

interface WeatherState {
  sessionId: string
  current: WeatherType
  duration: number
  source: string | null
}

interface FogOfWarState {
  sessionId: string
  revealedTiles: Set<string>
  visionSources: Map<string, VisionSource>
  darkvisionRanges: Map<string, number>
}

interface WildSpawnState {
  sessionId: string
  spawnTable: string | null
  spawnedPokemon: WildPokemon[]
  catchAttempts: CatchAttempt[]
}

interface SignificanceState {
  sessionId: string
  levels: Map<string, 'background' | 'minor' | 'moderate' | 'major' | 'critical'>
  xpEarners: string[]
}

interface MountingState {
  sessionId: string
  mountedPairs: Array<{ riderId: string; mountId: string }>
}

// A "session" is just a composition of state containers
interface GameSession {
  id: string
  name: string
  sceneId: string | null
  containers: Map<ContainerType, StateContainer>
}

// Each container has its own:
// - Database table (normalized, typed columns, not JSON blobs)
// - Service (focused on one concern)
// - API routes (scoped to one concern)
// - WebSocket events (broadcasted independently)
// - Store slice on the client

// Dealing damage touches CombatRoster (HP change) and maybe
// TurnTracker (heavily injured check). It does NOT load or
// serialize WeatherState, FogOfWarState, WildSpawnState, etc.

async function dealDamage(sessionId: string, targetId: string, amount: number) {
  // Load ONLY the containers we need
  const roster = await loadContainer<CombatRoster>(sessionId, 'combat-roster')
  const turns = await loadContainer<TurnTracker>(sessionId, 'turn-tracker')

  const target = roster.combatants.find(c => c.id === targetId)
  const result = applyDamage(target, amount)

  // Persist ONLY the changed container
  await saveContainer(sessionId, 'combat-roster', roster)

  // Broadcast ONLY the changed container's relevant diff
  broadcast(sessionId, { container: 'combat-roster', diff: result.diff })

  // If heavily injured triggered, update turn tracker too
  if (result.heavilyInjured) {
    applyHeavilyInjuredPenalty(turns, target)
    await saveContainer(sessionId, 'turn-tracker', turns)
    broadcast(sessionId, { container: 'turn-tracker', diff: turns.diff })
  }
}
```

## Why this is destructive

- **The `Encounter` Prisma model is deleted.** The single table with 15+ JSON TEXT columns is replaced by 8–10 focused tables, each with typed, indexed columns. Every migration, seed, and query that references `Encounter` is rewritten.
- **`buildEncounterResponse` is deleted.** There is no single encounter object to serialize. Each container serializes itself. The 200+ line response builder that assembles the god object is gone.
- **`updateFromWebSocket` is deleted.** The client doesn't receive a full encounter snapshot. It receives container-specific diffs. There is no field-by-field copy of a monolithic state object.
- **The encounter store (1,814 lines) is split into container stores.** `useRosterStore`, `useTurnStore`, `useSpatialStore`, `useWeatherStore`, etc. Each is small, focused, and independently testable. The god object is not trimmed — it's dissolved.
- **All 44 encounter API routes are reorganized.** Routes are grouped by container: `/sessions/:id/roster/...`, `/sessions/:id/turns/...`, `/sessions/:id/spatial/...`. The `encounters/:id` namespace is gone.
- **Services decompose naturally.** Each container has at most one service. `combatant.service.ts` (797 lines) splits into roster service, status service, and equipment service. `out-of-turn.service.ts` (752 lines) splits into turn service and intercept service.
- **The JSON parse/serialize hot path is eliminated.** Instead of parsing all 15 JSON columns on every action, only the affected container is loaded. Dealing damage never touches fog of war or weather. The [[persistence-hot-path-overhead]] is structurally eliminated.
- **The WebSocket broadcast granularity changes.** Instead of broadcasting the entire encounter state (500KB+), each container broadcasts its own diffs. A weather change sends 50 bytes, not the entire encounter.

## Principles improved

- [[single-responsibility-principle]] — each state container owns exactly one concern. The roster knows about combatants. The turn tracker knows about turn order. Neither knows about the other's internals.
- [[interface-segregation-principle]] — consumers depend only on the containers they need. A weather effect handler doesn't receive (or parse) the combat roster, fog of war, or spatial state.
- [[open-closed-principle]] — adding a new concern (e.g., "trap state" for battlefield traps) means adding a new container. No existing containers change. No schema migrations touch existing tables.
- [[dependency-inversion-principle]] — services depend on container interfaces, not on the monolithic encounter shape.
- Eliminates [[encounter-store-god-object-risk]] — the god object is replaced by focused containers.
- Eliminates [[persistence-hot-path-overhead]] — only affected containers are loaded and saved.
- Eliminates [[denormalized-encounter-combatants]] — combatant data lives in the roster container's normalized table, not in a JSON blob.
- Supersedes [[encounter-schema-normalization]] — normalization happens at the container level, not at the encounter level.

## Patterns and techniques

- [[composite-pattern]] — a session is a composition of state containers, not a monolithic entity
- [[facade-pattern]] — each container presents a clean interface over its concern
- [[observer-pattern]] — containers publish diffs to subscribers independently
- [[strategy-pattern]] — container persistence can vary by type (relational for roster, key-value for weather, spatial index for grid)
- Bounded contexts (Domain-Driven Design) — each container is a bounded context with its own ubiquitous language and data model
- Aggregate decomposition — the Encounter aggregate is decomposed into smaller aggregates, each with its own consistency boundary

## Trade-offs

- **Cross-container transactions.** Some actions span multiple containers: dealing damage may trigger heavily-injured (roster + turns), switching may affect spatial state (roster + spatial), declaring a move involves turns and roster. These require coordinated updates across containers, introducing distributed state management complexity.
- **Session assembly cost.** Building a "full encounter view" for the GM requires loading all containers and composing them. This is more queries than loading one encounter row — though each query is simpler and more cacheable.
- **Container boundary debates.** Should "status conditions" be part of the roster container or a separate container? Should "mounted pairs" be part of spatial state or its own container? Every boundary decision is debatable and affects the query/update pattern.
- **Referential integrity across containers.** A combatant ID in the roster must match a token ID in spatial state and a turn entry in the turn tracker. Without a single model enforcing this, consistency must be maintained by convention or by a cross-container validator.
- **Client-side composition complexity.** The client must subscribe to multiple container streams and compose them for rendering. A combatant card needs data from the roster container, the spatial container (position), and the turn container (is it their turn?). This requires cross-container joins on the client.
- **Migration from monolith is all-or-nothing.** Unlike schema normalization (which can happen column by column), dissolving the Encounter model requires all containers to exist before any single one can be used. The migration has no incremental path.
- **Loss of snapshot simplicity.** Currently, saving/restoring an encounter is one database row. With containers, it's 8–10 saves/restores that must be atomically consistent. Export/import becomes container orchestration.

## Open questions

- What are the right container boundaries? The 8 containers above are a starting point, but should there be more (separate status-conditions container? separate traits container?) or fewer (combine roster + turns into a "combat" container)?
- How do cross-container transactions work? Is there a session-level transaction coordinator, or do containers use eventual consistency with compensating actions?
- Should containers be loaded eagerly (all at session start) or lazily (on first access)? Lazy loading reduces startup cost but adds latency on first action.
- How does this interact with [[in-memory-encounter-state]]? Each container could be independently loaded into memory — only the combat roster needs to be in-memory during active play; weather can stay in the database.
- How does this interact with [[event-sourced-encounter-state]]? Each container could maintain its own event log, or there could be one session-level event log that references containers.
- How does this interact with [[plugin-mechanic-architecture]]? Each plugin could own one or more containers, making the container system the plugin's data layer.
- How does the client render a unified encounter view from multiple container subscriptions? Is there a client-side session compositor, or do components individually subscribe to the containers they need?
- Should the session concept extend beyond encounters — e.g., a "campaign session" that includes character state, inventory, and scene context alongside combat containers?

## See also

- [[encounter-store-god-object-risk]] — the problem this addresses (by dissolution, not reduction)
- [[encounter-schema-normalization]] — superseded: normalization happens per-container
- [[persistence-hot-path-overhead]] — eliminated: only affected containers are touched
- [[denormalized-encounter-combatants]] — eliminated: combatants live in a normalized roster table
- [[in-memory-encounter-state]] — compatible: individual containers can be memory-resident
- [[event-sourced-encounter-state]] — compatible: events can target specific containers
- [[encounter-lifecycle-state-machine]] — the turn tracker container embeds the state machine
- [[plugin-mechanic-architecture]] — compatible: plugins own containers
- [[encounter-store-surface-reduction]] — superseded: the store is dissolved, not reduced
- [[combatant-service-decomposition]] — superseded: decomposition follows container boundaries
- [[combatant-as-lens]] — compatible: lenses can live inside the CombatRoster container
- [[universal-event-journal]] — compatible: containers can be projections over the event stream
