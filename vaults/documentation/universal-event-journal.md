# Universal Event Journal

A destructive restructuring to annihilate the entire persistence layer — replacing Prisma, SQLite, and all CRUD operations with a single append-only event journal from which ALL application state is derived — extending [[event-sourced-encounter-state]] from encounters to the entire domain.

## The idea

[[event-sourced-encounter-state]] proposes event-sourcing encounters. But encounters are not the only entities suffering from [[denormalized-encounter-combatants|JSON blob storage]] and mutable read-modify-write cycles. The `Pokemon` model has 20+ columns (many JSON strings: `moves`, `abilities`, `capabilities`, `statusConditions`, `stageModifiers`). The `HumanCharacter` model has a similar structure (`skills`, `features`, `edges`, `trainerClasses`, `equipment`, `inventory`). `Campaign`, `Scene`, `EncounterTable` — every Prisma model follows the same pattern: load row, parse JSON, mutate, serialize, save.

What if the database is not a set of mutable rows? What if it is a single append-only log of everything that has ever happened?

Every state-changing operation in the app — creating a character, levelling up a Pokemon, adding equipment, dealing damage, switching Pokemon, capturing a wild Pokemon — becomes an event appended to the journal. Current state is computed by replaying events through a reducer. The Prisma schema collapses from 11 models with 100+ columns to one `Event` table and optional materialized projections.

```typescript
// === THE JOURNAL ===
// One table. One schema. Everything.

interface DomainEvent {
  id: string
  timestamp: number
  aggregateType: 'character' | 'pokemon' | 'encounter' | 'campaign' | 'scene'
  aggregateId: string
  eventType: string
  payload: unknown  // typed per event via discriminated union
  causedBy: string | null  // event that triggered this event (causal chain)
}

// === EVENT TYPES (partial) ===

type CharacterEvent =
  | { eventType: 'CHARACTER_CREATED'; payload: { name: string; level: number; nature: string } }
  | { eventType: 'STAT_ALLOCATED'; payload: { stat: string; points: number } }
  | { eventType: 'FEATURE_LEARNED'; payload: { featureId: string; source: string } }
  | { eventType: 'EQUIPMENT_ADDED'; payload: { slotId: string; item: EquipmentData } }
  | { eventType: 'LEVEL_GAINED'; payload: { newLevel: number; statPoints: number } }
  | { eventType: 'SKILL_RANKED'; payload: { skill: string; newRank: number } }

type PokemonEvent =
  | { eventType: 'POKEMON_CREATED'; payload: { species: string; level: number; nature: string } }
  | { eventType: 'MOVE_LEARNED'; payload: { moveId: string; slot: number } }
  | { eventType: 'ABILITY_CHANGED'; payload: { abilityId: string } }
  | { eventType: 'EVOLUTION_APPLIED'; payload: { newSpecies: string; statChanges: StatBlock } }
  | { eventType: 'XP_GAINED'; payload: { amount: number; source: string } }
  | { eventType: 'DAMAGE_TAKEN'; payload: { amount: number; damageType: string } }
  | { eventType: 'HEALED'; payload: { amount: number; source: string } }

type EncounterEvent =
  | { eventType: 'ENCOUNTER_STARTED'; payload: { name: string; combatantIds: string[] } }
  | { eventType: 'TURN_ADVANCED'; payload: { round: number; turnIndex: number } }
  | { eventType: 'MOVE_DECLARED'; payload: { combatantId: string; moveId: string } }
  // ... all current encounter mutations become events

// === STATE COMPUTATION ===

function computeCharacter(events: CharacterEvent[]): HumanCharacter {
  return events.reduce(applyCharacterEvent, emptyCharacter())
}

function computePokemon(events: PokemonEvent[]): Pokemon {
  return events.reduce(applyPokemonEvent, emptyPokemon())
}

function computeEncounter(events: EncounterEvent[]): EncounterState {
  return events.reduce(applyEncounterEvent, emptyEncounter())
}

// === API ROUTES BECOME EVENT EMITTERS ===

// Before:
async function handleDamage(req) {
  const encounter = await prisma.encounter.findUnique(...)
  const parsed = parseEncounterJson(encounter)
  const combatant = parsed.combatants.find(c => c.id === req.targetId)
  combatant.hp -= req.amount
  await prisma.encounter.update({ data: { combatants: JSON.stringify(parsed.combatants) } })
}

// After:
async function handleDamage(req) {
  await journal.append({
    aggregateType: 'encounter',
    aggregateId: req.encounterId,
    eventType: 'DAMAGE_DEALT',
    payload: { targetId: req.targetId, amount: req.amount, damageType: req.type }
  })
  // State is recomputed from the journal on next read
}
```

## Why this is destructive

- **The entire Prisma schema is destroyed.** All 11 models — `Campaign`, `Scene`, `HumanCharacter`, `Pokemon`, `Encounter`, `EncounterRecord`, `EncounterTable`, `EncounterTableEntry`, `Pokemon` roster tables — are replaced by a single `Event` table with optional materialized projection tables for read performance.
- **All 25 services are rewritten.** Every service currently performs read-mutate-write against Prisma models. After this change, services validate preconditions and emit events. They never read-mutate-write.
- **All 158 API routes are rewritten.** Every route that currently calls `prisma.model.update()` becomes an event emitter. Routes that read data call projection functions instead of `prisma.model.findUnique()`.
- **The serializer layer (`server/utils/serializers.ts`) is deleted.** There is no JSON-to-model transformation because there are no JSON columns. State is computed from typed events.
- **All 17 Pinia stores change fundamentally.** Stores no longer mirror a mutable server record. They hold the latest computed projection and receive event streams — or are eliminated entirely per [[storeless-query-cache|storeless query cache]].
- **The `updateFromWebSocket` surgical merge is eliminated.** Instead of broadcasting full state snapshots, the server broadcasts events. Clients apply events to their local projection using the same reducer functions.
- **Character and Pokemon CRUD is eliminated.** There is no "update character" mutation. There are events: `STAT_ALLOCATED`, `FEATURE_LEARNED`, `EQUIPMENT_ADDED`. The character's current state is always a replay of its history.
- **Full audit trail becomes automatic.** Every change to every entity is permanently recorded. "What happened to this Pokemon's HP?" is answered by filtering the event log. The current system overwrites history on every save.

## Principles improved

- [[single-responsibility-principle]] — event handlers have one job (validate + emit). Reducers have one job (fold events into state). Persistence has one job (append events). These responsibilities were previously conflated in services.
- [[open-closed-principle]] — new event types are added without modifying existing reducers. A new mechanic means a new event type and a new case in the reducer — no existing logic changes.
- [[dependency-inversion-principle]] — the domain depends on event abstractions, not on Prisma models. Persistence is an adapter behind an `EventStore` interface.
- [[interface-segregation-principle]] — consumers subscribe to specific event types, not to full entity snapshots. The weather system subscribes to `WEATHER_CHANGED` events, not to the entire encounter object.
- Eliminates [[persistence-hot-path-overhead]] — there is no JSON parse/serialize cycle. Events are typed records appended to a log.
- Eliminates [[denormalized-encounter-combatants]] — there are no JSON blob columns. Combatant state is derived from events.
- Eliminates [[service-responsibility-conflation]] — services no longer mix business logic with persistence operations. They validate and emit; persistence is the journal's concern.
- Eliminates [[routes-bypass-service-layer]] — routes that currently import Prisma directly must instead emit events through the journal API. There is no Prisma to bypass.

## Patterns and techniques

- [[command-pattern]] — events are recorded commands with full context for replay
- [[memento-pattern]] — the event journal IS the memento history; no separate undo/redo system needed
- [[observer-pattern]] — projections subscribe to event streams
- [[strategy-pattern]] — different reducers for different aggregate types implement the same fold interface
- [[chain-of-responsibility-pattern]] — event handlers can be chained: an event can trigger derived events (e.g., `DAMAGE_DEALT` triggers `POKEMON_FAINTED` if HP reaches 0)
- Event sourcing — the core architectural pattern
- CQRS — command side appends events; query side reads projections
- Materialized views — pre-computed projections for read performance

## Trade-offs

- **Replay cost at scale.** A campaign with 50 sessions, 200 encounters, and 6 characters accumulates tens of thousands of events. Replaying the full log on every request is prohibitive. Periodic snapshots (materialized projections) are mandatory, adding snapshot management complexity.
- **Event schema evolution.** Events are immutable once written. Changing the payload shape of `DAMAGE_DEALT` requires versioning (`DAMAGE_DEALT_V1`, `DAMAGE_DEALT_V2`) or upcasting logic in the reducer. This is harder than `ALTER TABLE`.
- **Debugging opacity.** "What's the character's current HP?" cannot be answered by a single database query. It requires replaying the character's event stream — or maintaining a projection that must be kept in sync.
- **Tooling vacuum.** The current stack (Prisma, Prisma Studio, SQLite CLI) provides excellent debugging tools. A hand-rolled event store has none. Event replay, projection debugging, and event inspection must be built from scratch.
- **Write amplification for projections.** Every event must update all affected projections. A `DAMAGE_DEALT` event updates the combatant projection, the encounter projection, the combat log projection, and potentially the character projection. Multiple writes per event.
- **All-or-nothing migration.** The current 11-model Prisma schema cannot coexist with the event journal. Migration requires replaying all existing data as synthetic creation events — a one-way transformation.
- **Overkill for simple CRUD.** Campaign metadata (name, description) rarely changes and has no audit requirement. Event-sourcing it adds ceremony for zero benefit. Not all entities benefit equally from this pattern.
- **Causal ordering complexity.** Events across aggregates may have causal dependencies (a `POKEMON_CAPTURED` event depends on an `ENCOUNTER_STARTED` event in a different aggregate). Maintaining causal ordering across aggregates adds distributed systems complexity to what is currently a single-process SQLite app.

## Open questions

- Should every aggregate type use event sourcing, or should some (Campaign, Scene) remain CRUD while others (Encounter, Character, Pokemon) are event-sourced? A hybrid approach reduces scope but adds architectural inconsistency.
- What is the snapshot strategy? Time-based (snapshot every N minutes), count-based (snapshot every N events), or explicit (snapshot on session end)?
- How does this interact with [[encounter-dissolution]]? Each state container could maintain its own event sub-stream within the journal, combining both patterns.
- How does this interact with [[game-engine-extraction]]? If the engine is the reducer, the engine module processes events and produces state. The app becomes event emitter + engine + projection renderer.
- Should the event store support projections-as-queries (real-time materialized views) or projections-as-subscriptions (event stream processors)?
- How does character import/export work? Currently it's a JSON dump. With event sourcing, is it an event stream export, or a snapshot export? Can characters be imported into a different campaign with a different event history?
- What happens to the Prisma migration history? Is it abandoned entirely, or do the projection tables still use Prisma for their schema?

## See also

- [[event-sourced-encounter-state]] — superseded: this proposal extends event sourcing to the entire domain, not just encounters
- [[persistence-hot-path-overhead]] — eliminated: event append is O(1), no JSON parse/serialize
- [[denormalized-encounter-combatants]] — eliminated: no JSON blob columns exist
- [[service-responsibility-conflation]] — eliminated: services validate and emit, they don't persist
- [[routes-bypass-service-layer]] — eliminated: there is no Prisma to bypass
- [[encounter-schema-normalization]] — superseded: there is no schema to normalize
- [[in-memory-encounter-state]] — compatible: projections can be held in memory as a read cache over the event stream
- [[undo-redo-as-memento-pattern]] — superseded: the event journal IS the undo history
- [[encounter-dissolution]] — compatible: containers can be projections over the event stream
