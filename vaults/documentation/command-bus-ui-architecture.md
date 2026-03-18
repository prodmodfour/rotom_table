# Command Bus UI Architecture

A destructive restructuring to replace the 63-composable client-side architecture with a command bus — where every user action is a typed command object dispatched through a central bus, and all UI state is derived from command results — addressing [[composable-architectural-overreach|the overuse of composables as an architectural pattern]].

## The idea

The composable layer has become a shadow application. 63 composables span 16 domains, some reaching 25KB+, mixing reactive bindings with business logic, orchestrating multi-step workflows, maintaining complex internal state, and duplicating server-side game rules. They directly import stores as singletons (see [[composable-store-direct-coupling]]), making them untestable. They are procedural scripts wearing a composable costume.

Replace all action-oriented composables with a command bus. Every user interaction — dealing damage, advancing a turn, moving a token, switching a Pokemon — becomes a typed command object dispatched to a central bus. The bus routes commands to handlers that call the server, process results, and update state. Components become stateless dispatchers. The remaining composables become pure reactive derivations with no side effects.

```typescript
// Commands — typed, serializable, self-documenting
type Command =
  | { type: 'combat:deal-damage'; targetId: string; damage: number; damageType: string }
  | { type: 'combat:advance-turn' }
  | { type: 'combat:use-move'; userId: string; moveId: string; targetId: string }
  | { type: 'encounter:switch-pokemon'; combatantId: string; replacementId: string }
  | { type: 'grid:move-token'; tokenId: string; path: GridPosition[] }
  | { type: 'capture:throw-ball'; ballType: string; targetId: string }
  | { type: 'weather:set'; weather: WeatherType }
  | { type: 'mounting:mount'; riderId: string; mountId: string }
  // ... every user action is a command

// The bus — central dispatch with middleware
class CommandBus {
  private handlers = new Map<string, CommandHandler>()
  private middleware: Middleware[] = []

  register(commandType: string, handler: CommandHandler) {
    this.handlers.set(commandType, handler)
  }

  use(middleware: Middleware) {
    this.middleware.push(middleware)
  }

  async dispatch(command: Command): Promise<CommandResult> {
    // Run middleware chain: logging, optimistic updates, error handling
    const pipeline = this.middleware.reduce(
      (next, mw) => (cmd) => mw(cmd, next),
      (cmd) => this.handlers.get(cmd.type)!(cmd)
    )
    return pipeline(command)
  }
}

// Handler — focused, testable, no Vue dependency
const dealDamageHandler: CommandHandler<'combat:deal-damage'> = async (cmd, { api, state }) => {
  // Optimistic update
  state.optimistic.applyDamage(cmd.targetId, cmd.damage)

  // Server call
  const result = await api.post(`/encounters/${state.encounterId}/damage`, {
    combatantId: cmd.targetId,
    damage: cmd.damage,
    damageType: cmd.damageType,
  })

  // Reconcile
  state.reconcile(result)
  return { success: true, result }
}

// Middleware — cross-cutting concerns
const loggingMiddleware: Middleware = async (cmd, next) => {
  console.log('[CMD]', cmd.type, cmd)
  const result = await next(cmd)
  console.log('[RESULT]', cmd.type, result)
  return result
}

const undoMiddleware: Middleware = async (cmd, next) => {
  const snapshot = state.snapshot()
  const result = await next(cmd)
  undoStack.push({ command: cmd, snapshot })
  return result
}

const optimisticMiddleware: Middleware = async (cmd, next) => {
  // Apply optimistic prediction immediately
  const prediction = predictors.get(cmd.type)?.(cmd)
  if (prediction) state.applyOptimistic(prediction)
  try {
    return await next(cmd)
  } catch (e) {
    state.rollbackOptimistic(prediction)
    throw e
  }
}

// Components dispatch commands — no logic, no store access
// <template>
//   <button @click="bus.dispatch({ type: 'combat:deal-damage', targetId, damage })">
//     Deal Damage
//   </button>
// </template>

// Remaining composables are PURE derivations — no side effects, no commands
function useCombatantDisplay(combatant: Ref<Combatant>) {
  const hpPercentage = computed(() => combatant.value.hp / combatant.value.maxHp * 100)
  const hpColor = computed(() => hpPercentage.value < 25 ? 'red' : hpPercentage.value < 50 ? 'yellow' : 'green')
  const displayName = computed(() => combatant.value.nickname || combatant.value.species)
  return { hpPercentage, hpColor, displayName }
}
```

## Why this is destructive

- **~40 of 63 composables are deleted or gutted.** Every composable that orchestrates actions, calls APIs, manages side effects, or updates stores is replaced by command handlers. Only pure reactive derivations survive.
- **`useMoveCalculation.ts` (871 lines) is demolished.** Move execution becomes a command: `{ type: 'combat:use-move', ... }`. Damage preview becomes a query command: `{ type: 'combat:preview-damage', ... }`. The 871-line composable becomes two focused handlers.
- **`useGridMovement.ts` (26KB) is split.** Token movement becomes a command. Path preview becomes a derivation. Grid rendering stays as a composable (it's genuinely reactive rendering logic). The 26KB composable becomes a 2KB handler + a 5KB derivation.
- **`useGridInteraction.ts` is decomposed.** Mouse click becomes a command. Selection becomes state. Drag becomes a command sequence. Measurement becomes a derivation. The 5-concern composable becomes 5 focused pieces.
- **Store-composable coupling is eliminated.** Command handlers receive state through dependency injection, not through global singleton access. [[composable-store-direct-coupling]] is structurally impossible — handlers don't call `useEncounterStore()`.
- **The entire client-side action surface becomes enumerable.** The `Command` discriminated union is a complete catalog of every action the UI can trigger. Currently, this surface is implicit — scattered across 63 composables and undocumented.
- **Every Vue component that calls a composable action method is rewritten.** Instead of `const { dealDamage } = useCombatActions(); dealDamage(target, amount)`, components do `bus.dispatch({ type: 'combat:deal-damage', targetId: target.id, damage: amount })`.

## Principles improved

- [[single-responsibility-principle]] — command handlers do one thing: process one command. Composables do one thing: derive reactive values. Components do one thing: render and dispatch.
- [[open-closed-principle]] — adding a new action means registering a new command type and handler. No existing handler changes. The bus is closed for modification, open for extension.
- [[dependency-inversion-principle]] — handlers depend on injected abstractions (`api`, `state`), not on concrete stores. Components depend on the bus abstraction, not on concrete composables.
- [[interface-segregation-principle]] — components see only `dispatch(command)`. Handlers see only their command's payload and their injected dependencies. No one sees the full system surface.
- Eliminates [[composable-architectural-overreach]] — composables return to their intended purpose (reactive derivations).
- Eliminates [[composable-store-direct-coupling]] — there are no store imports in handlers; dependencies are injected.
- Reduces [[client-server-state-mirroring]] — the command bus is a natural place to enforce "server is authoritative" by routing all mutations through server calls.

## Patterns and techniques

- [[command-pattern]] — the foundational pattern: actions are objects, not function calls
- [[chain-of-responsibility-pattern]] — middleware forms a processing chain around command dispatch
- [[mediator-pattern]] — the bus mediates between components (dispatchers) and handlers (processors)
- [[strategy-pattern]] — each handler is a strategy for processing its command type
- [[memento-pattern]] — undo middleware captures state snapshots before command execution
- CQRS — commands (mutations via dispatch) are structurally separated from queries (reactive derivations via composables)
- Event-driven architecture — commands can emit events after execution, enabling cross-handler coordination without direct coupling

## Trade-offs

- **Indirection tax.** Currently, `this.dealDamage(target, amount)` is a direct function call. With the bus, it's `dispatch({ type: 'combat:deal-damage', ... })` — a string-keyed dispatch through middleware and a handler map. Debugging requires tracing through the bus, not following a function call.
- **TypeScript ergonomics.** String-typed command dispatch loses IDE "go to definition" for the handler. The discriminated union provides type safety for payloads, but the dispatch-to-handler mapping is runtime, not compile-time. Source-mapping tooling would help.
- **Component verbosity.** Components that currently call `const { x, y, z } = useTheThing()` must instead inject the bus and construct command objects for every interaction. Templates become more verbose with explicit command payloads.
- **Optimistic update complexity.** The current architecture naturally gives instant feedback because state is local. The command bus must explicitly implement optimistic updates, rollbacks, and reconciliation as middleware — adding complexity for what used to be free.
- **Over-engineering for simple actions.** A "toggle sidebar" or "select combatant" action doesn't need a typed command, a handler, middleware processing, and server reconciliation. Some actions are genuinely local and simple. The command bus must coexist with simple local state.
- **Loss of composable co-location.** Currently, a composable co-locates the action, its related reactive state, and its derived values. With the bus, these are split across a handler, a store slice, and a derivation composable. Related concepts are physically separated.
- **Testing trade-off.** Handlers are easier to unit test (inject mocks, dispatch command, assert result). But integration testing the full flow — component dispatches command, bus routes to handler, handler calls API, state updates, component re-renders — is harder than testing a composable that does everything internally.

## Open questions

- What's the boundary between "command" (goes through the bus) and "local action" (stays in the component)? Is selecting a combatant a command? Is hovering over a token a command?
- Should the command bus be global (one bus per app) or scoped (one bus per encounter, one per character sheet)?
- How does the bus interact with WebSocket events? When the server broadcasts a state change, does it become a synthetic command (`{ type: 'sync:state-update', ... }`) or bypass the bus entirely?
- Should command handlers be async (enabling server calls and optimistic updates) or sync (with side effects scheduled separately)?
- How does this interact with [[event-sourced-encounter-state]]? Commands are inputs; events are outputs. The command bus could feed an event log naturally.
- How does this interact with [[server-authoritative-reactive-streams]]? If the server pushes projections, command handlers don't need to update local state — they just dispatch to the server and wait for the stream update.
- Is undo/redo a first-class feature? The memento middleware enables it cheaply, but supporting undo for every command adds design constraints.

## See also

- [[composable-architectural-overreach]] — the problem this addresses
- [[composable-store-direct-coupling]] — eliminated by dependency injection in handlers
- [[client-server-state-mirroring]] — reduced by routing all mutations through server calls
- [[encounter-store-god-object-risk]] — the store's action surface moves to command handlers, leaving it as a pure state container
- [[event-sourced-encounter-state]] — compatible: commands feed events
- [[server-authoritative-reactive-streams]] — compatible: commands go to server, streams come back
- [[composable-dependency-injection-pattern]] — superseded: injection happens at the handler level, not the composable level
- [[cqrs-mediator-architecture]] — the radical extension: the command bus replaces the entire API and service layer, not just the UI layer
