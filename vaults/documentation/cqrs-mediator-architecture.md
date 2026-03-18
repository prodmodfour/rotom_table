# CQRS Mediator Architecture

A destructive restructuring to demolish the five-layer request-response pipeline (Component → Composable → Store → API Route → Service) and replace it with a two-sided mediator: commands go in, events come out — addressing [[horizontal-layer-coupling]], [[service-responsibility-conflation]], [[routes-bypass-service-layer]], and the [[message-chains-smell|message chain]] that spans the entire stack.

## The idea

Every game action currently traverses five layers. A damage action starts in a Vue component, calls a composable method, which calls a store action, which calls `$fetch('/api/encounters/:id/damage')`, which calls a service function, which calls Prisma. Each layer transforms the data. Each layer has its own error handling. Each layer has its own type definitions. Adding a new action means touching 5 files across 5 directories. This is [[shotgun-surgery-smell|shotgun surgery]] at the architectural level.

Collapse the pipeline into two paths:

**Command side:** A typed command object is dispatched to a mediator. The mediator routes it to a single handler. The handler validates, executes, emits events, and returns a result. No store. No composable wrapping a store wrapping a fetch. One hop.

**Query side:** A typed query object is dispatched to the mediator. The mediator routes it to a query handler that reads and projects data. No store caching stale server state. No composable wrapping a store wrapping a computed.

```typescript
// === COMMANDS ===
// One object per action. Fully typed. Self-describing.

interface DealDamageCommand {
  type: 'DealDamage'
  encounterId: string
  targetId: string
  amount: number
  damageType: string
  source: string
}

interface SwitchPokemonCommand {
  type: 'SwitchPokemon'
  encounterId: string
  outgoingId: string
  incomingPokemonId: string
  position: GridPosition
}

interface LearnMoveCommand {
  type: 'LearnMove'
  pokemonId: string
  moveId: string
  slot: number
}

// Union of all commands
type Command = DealDamageCommand | SwitchPokemonCommand | LearnMoveCommand | /* ... */

// === COMMAND HANDLERS ===
// One handler per command. Contains ALL logic for that action.
// No service layer. No route handler. No store action. Just this.

const dealDamageHandler: CommandHandler<DealDamageCommand> = {
  type: 'DealDamage',

  validate(cmd: DealDamageCommand): ValidationResult {
    // All precondition checks in one place
    if (cmd.amount < 0) return { valid: false, error: 'Damage must be positive' }
    return { valid: true }
  },

  async execute(cmd: DealDamageCommand): Promise<CommandResult> {
    const encounter = await loadEncounter(cmd.encounterId)
    const target = findCombatant(encounter, cmd.targetId)
    const result = calculateDamageApplication(target, cmd.amount, cmd.damageType)

    await persistChanges(cmd.encounterId, result.changes)

    return {
      events: [
        { type: 'DamageDealt', targetId: cmd.targetId, amount: result.applied },
        ...(result.fainted ? [{ type: 'PokemonFainted', pokemonId: cmd.targetId }] : []),
      ],
      data: result
    }
  }
}

// === QUERIES ===
// One object per data need. Fully typed.

interface GetEncounterQuery {
  type: 'GetEncounter'
  encounterId: string
  viewerRole: 'gm' | 'player' | 'spectator'
  viewerPlayerId?: string
}

interface GetCharacterQuery {
  type: 'GetCharacter'
  characterId: string
}

type Query = GetEncounterQuery | GetCharacterQuery | /* ... */

// === THE MEDIATOR ===
// Single dispatch point for the entire application.

class GameMediator {
  private commandHandlers = new Map<string, CommandHandler>()
  private queryHandlers = new Map<string, QueryHandler>()
  private middleware: Middleware[] = []

  async dispatch(command: Command): Promise<CommandResult> {
    // Middleware runs on every command: logging, auth, validation, optimistic broadcast
    for (const mw of this.middleware) await mw.before(command)

    const handler = this.commandHandlers.get(command.type)
    const validation = handler.validate(command)
    if (!validation.valid) throw new ValidationError(validation.error)

    const result = await handler.execute(command)

    for (const mw of this.middleware) await mw.after(command, result)

    // Broadcast events to connected clients
    this.broadcastEvents(result.events)

    return result
  }

  async query<T>(query: Query): Promise<T> {
    const handler = this.queryHandlers.get(query.type)
    return handler.execute(query)
  }
}

// === CLIENT USAGE ===
// Components dispatch commands directly. No composable. No store. No fetch.

// In a Vue component:
const mediator = useMediator()  // thin composable that wraps the transport

async function handleDamage(targetId: string, amount: number) {
  const result = await mediator.dispatch({
    type: 'DealDamage',
    encounterId: route.params.id,
    targetId,
    amount,
    damageType: 'physical',
    source: 'manual'
  })
  // UI updates via event subscription, not via store mutation
}
```

## Why this is destructive

- **All 158 API routes are deleted.** There are no route files. The server exposes a single `POST /commands` endpoint (or a WebSocket command channel) and a `POST /queries` endpoint. The file-based routing convention is abandoned.
- **All 25 services are dissolved.** Service logic is absorbed into command handlers. The `switching.service.ts` (927 lines) becomes `SwitchPokemonHandler`, `RecallPokemonHandler`, `DeploySwitchHandler`, etc. — each focused on one command.
- **All 63 composables that wrap store actions are simplified or deleted.** Composables that exist to bridge components and stores (`useEncounterActions`, `useEncounterCombat`) are replaced by direct `mediator.dispatch()` calls. Composables that compute derived state (`useMoveCalculation`) remain.
- **All 17 Pinia stores are deleted or reduced to query caches.** The encounter store's 30+ actions disappear — they were always just `$fetch` wrappers. State management becomes a thin reactive cache over query results, updated by event subscriptions.
- **The WebSocket protocol simplifies radically.** Instead of 30+ event types with custom payloads, the server broadcasts `CommandResult.events`. Clients subscribe to event types they care about. The `WebSocketEvent` discriminated union in `types/api.ts` is replaced by the command event union.
- **Error handling consolidates.** Currently, errors are caught at 3–4 layers (route, service, store, component). With the mediator, validation errors are returned from `handler.validate()`, execution errors from `handler.execute()`, and the component handles the result. One path.
- **The `$fetch` pattern is eliminated.** Components and stores currently embed URL paths (`$fetch('/api/encounters/${id}/damage')`). With the mediator, the transport is abstracted — commands are typed objects, not HTTP requests.

## Principles improved

- [[single-responsibility-principle]] — each command handler has exactly one responsibility: validate and execute one command. No handler knows about HTTP, WebSocket, or Vue.
- [[open-closed-principle]] — adding a new game action means adding a new command type and a new handler. No existing handler, route, service, or store is modified.
- [[dependency-inversion-principle]] — components depend on the `Mediator` abstraction, not on specific API URLs, store actions, or service functions. The transport can be HTTP, WebSocket, or in-process — the component doesn't know.
- [[interface-segregation-principle]] — command handlers depend only on the data they need (the command payload), not on the full request context, session, or encounter state.
- Eliminates [[horizontal-layer-coupling]] — there are no horizontal layers. Each command handler vertically owns its entire lifecycle from validation to persistence.
- Eliminates [[routes-bypass-service-layer]] — there are no routes to bypass and no service layer to bypass. Commands go directly to handlers.
- Eliminates [[service-responsibility-conflation]] — services don't exist. Handlers are single-purpose.
- Eliminates [[shotgun-surgery-smell]] — adding a new action means adding one command type and one handler file. One file. One directory.
- Eliminates [[message-chains-smell]] — the chain `component → composable → store → route → service → prisma` is replaced by `component → mediator → handler`.

## Patterns and techniques

- [[mediator-pattern]] — the core pattern. The `GameMediator` decouples senders (components) from receivers (handlers).
- [[command-pattern]] — every action is a first-class command object that can be logged, replayed, batched, or undone.
- [[chain-of-responsibility-pattern]] — middleware forms a chain through which every command passes (logging, auth, validation, broadcast).
- [[strategy-pattern]] — command handlers are strategies selected by command type.
- [[observer-pattern]] — clients subscribe to event streams produced by command execution.
- CQRS (Command Query Responsibility Segregation) — commands and queries are separate paths with different handlers, different data flows, and different optimization strategies.

## Trade-offs

- **Loss of RESTful conventions.** The current API is discoverable — `GET /api/encounters/:id`, `POST /api/encounters/:id/damage`. With a single `POST /commands` endpoint, discoverability requires documentation or a schema explorer. External tools (Postman, curl) become harder to use.
- **Handler registration boilerplate.** Every command type must be registered with the mediator. A typo in the type string means a runtime error. TypeScript discriminated unions mitigate this but don't eliminate it.
- **Middleware complexity.** Cross-cutting concerns (auth, logging, broadcasting) that currently live in per-route middleware must be implemented as mediator middleware — potentially more complex because the middleware must be generic over all command types.
- **Testing the mediator.** The mediator is a central point of failure. Testing that all commands are correctly registered, validated, and executed requires integration tests that exercise the full mediator, not just individual handlers.
- **Query optimization.** The current REST API naturally maps to SQL queries via Prisma. A generic query handler must decide how to efficiently serve each query type — potentially re-implementing the query optimization that Prisma provides.
- **Loss of HTTP semantics.** HTTP verbs, status codes, caching headers, and content negotiation are lost when everything is `POST /commands`. This matters if the app ever needs a public API, CDN caching, or standard HTTP tooling.

## Open questions

- Should the mediator be in-process (function calls on the server) or over-the-wire (client sends command objects via WebSocket)? If over-the-wire, the client mediator is a thin transport wrapper. If in-process, the client still needs `$fetch` to reach the server.
- How does the command/query split map to real-time needs? The GM's encounter view needs continuous updates. Is this a persistent query subscription, or a query result + event stream?
- How does this interact with [[game-engine-extraction]]? If the engine exists, command handlers call engine functions. The mediator orchestrates; the engine computes.
- How does this interact with [[universal-event-journal]]? Commands produce events. The journal persists events. The mediator is the bridge between commands and the event store.
- Should commands support batching (multiple commands in one dispatch) for atomic multi-step actions like "deal damage + apply status + advance turn"?
- Should the mediator support command undo? If commands are invertible, the mediator can maintain an undo stack by storing the inverse of each command.
- How does authentication work? Currently, the GM is implicitly authorized by being on the `/gm` page. With a mediator, authorization must be explicit in each command handler or in middleware.

## See also

- [[horizontal-layer-coupling]] — the problem this addresses (by collapsing layers into vertical handlers)
- [[routes-bypass-service-layer]] — eliminated: there are no routes or services
- [[service-responsibility-conflation]] — eliminated: handlers replace services
- [[command-bus-ui-architecture]] — superseded: this proposal extends the command bus from the UI layer to the entire stack, replacing the API and service layers too
- [[typed-rpc-api-layer]] — superseded: RPC is a transport optimization; CQRS is an architectural pattern
- [[kill-the-api-directory]] — superseded: not only is the API directory killed, the concept of API routes is killed
- [[mediator-pattern]] — the core pattern
- [[command-pattern]] — commands as first-class objects
- [[game-engine-extraction]] — compatible: handlers delegate to the engine
- [[universal-event-journal]] — compatible: handlers emit events to the journal
