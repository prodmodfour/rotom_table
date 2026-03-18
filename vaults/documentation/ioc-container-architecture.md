# IoC Container Architecture

A destructive restructuring to rip out every singleton import, every global store access, and every auto-imported dependency — replacing them with an Inversion of Control container that explicitly wires all dependencies at application startup — addressing [[singleton-state-coupling|singleton state coupling]], [[composable-store-direct-coupling|composable-store direct coupling]], and the invisible dependency graph created by [[nuxt-framework-entanglement|Nuxt auto-imports]].

## The idea

The app has no composition root. Dependencies are resolved by calling global functions (`useEncounterStore()`, `useGridMovement()`, `useMoveCalculation()`) that internally call other global functions. The dependency graph is invisible — you cannot trace what depends on what without running the code. Testing requires initializing the entire Pinia store tree. Swapping implementations (e.g., a mock store for testing, a different persistence layer) is structurally impossible.

Introduce an IoC container that holds all application services, stores, and domain operations as named, typed registrations. Every composable, store, and component receives its dependencies through injection — never through global singleton access. The container is the single place where the dependency graph is visible and configurable.

```typescript
// === THE CONTAINER — explicit, typed dependency graph ===
interface AppContainer {
  // Persistence
  encounterRepository: EncounterRepository
  characterRepository: CharacterRepository
  pokemonRepository: PokemonRepository

  // Domain operations
  damageCalculator: DamageCalculator
  captureCalculator: CaptureCalculator
  switchValidator: SwitchValidator
  mountValidator: MountValidator
  turnManager: TurnManager
  weatherEngine: WeatherEngine

  // State
  encounterState: EncounterState
  gridState: GridState
  combatState: CombatState

  // Infrastructure
  webSocketClient: WebSocketClient
  apiClient: ApiClient
}

// === CONTAINER CREATION — the composition root ===
function createAppContainer(): AppContainer {
  const apiClient = new HttpApiClient(config.gameServerUrl)
  const wsClient = new WebSocketClient(config.wsUrl)

  const encounterRepo = new PrismaEncounterRepository(prisma)
  const characterRepo = new PrismaCharacterRepository(prisma)
  const pokemonRepo = new PrismaPokemonRepository(prisma)

  const damageCalc = new PtuDamageCalculator()
  const captureCalc = new PtuCaptureCalculator()
  const switchValidator = new PtuSwitchValidator()
  const mountValidator = new PtuMountValidator()

  const encounterState = new ReactiveEncounterState()
  const gridState = new ReactiveGridState()
  const combatState = new ReactiveCombatState()

  const turnManager = new TurnManager(encounterState, combatState)
  const weatherEngine = new WeatherEngine(encounterState)

  return {
    encounterRepository: encounterRepo,
    characterRepository: characterRepo,
    pokemonRepository: pokemonRepo,
    damageCalculator: damageCalc,
    captureCalculator: captureCalc,
    switchValidator: switchValidator,
    mountValidator: mountValidator,
    turnManager: turnManager,
    weatherEngine: weatherEngine,
    encounterState: encounterState,
    gridState: gridState,
    combatState: combatState,
    webSocketClient: wsClient,
    apiClient: apiClient,
  }
}

// === PROVIDE AT APP ROOT ===
const app = createApp(App)
const container = createAppContainer()
app.provide('container', container)

// === COMPOSABLES RECEIVE DEPENDENCIES — no singleton access ===
function useEncounterActions(container: AppContainer) {
  const { encounterState, damageCalculator, apiClient, turnManager } = container

  async function dealDamage(targetId: string, amount: number) {
    // Uses injected dependencies, not global singletons
    const preview = damageCalculator.calculate(
      encounterState.getCombatant(targetId),
      amount
    )
    await apiClient.post('/damage', { targetId, amount })
  }

  function advanceTurn() {
    turnManager.advance()
  }

  return { dealDamage, advanceTurn }
}

// === COMPONENTS INJECT CONTAINER ===
// <script setup>
// const container = inject<AppContainer>('container')!
// const { dealDamage, advanceTurn } = useEncounterActions(container)
// </script>

// === TESTING — swap the entire dependency graph ===
function createTestContainer(overrides?: Partial<AppContainer>): AppContainer {
  const defaults = {
    encounterRepository: new InMemoryEncounterRepository(),
    characterRepository: new InMemoryCharacterRepository(),
    pokemonRepository: new InMemoryPokemonRepository(),
    damageCalculator: new PtuDamageCalculator(),
    captureCalculator: new PtuCaptureCalculator(),
    switchValidator: new PtuSwitchValidator(),
    mountValidator: new PtuMountValidator(),
    encounterState: new ReactiveEncounterState(),
    gridState: new ReactiveGridState(),
    combatState: new ReactiveCombatState(),
    turnManager: new InMemoryTurnManager(),
    weatherEngine: new InMemoryWeatherEngine(),
    webSocketClient: new NoOpWebSocketClient(),
    apiClient: new InMemoryApiClient(),
  }
  return { ...defaults, ...overrides }
}

// Test: damage calculation with a specific encounter state
test('deals damage through temp HP first', () => {
  const state = new ReactiveEncounterState()
  state.loadCombatant({ id: '1', hp: 50, maxHp: 100, tempHp: 10 })

  const container = createTestContainer({ encounterState: state })
  const { dealDamage } = useEncounterActions(container)

  dealDamage('1', 15)
  expect(state.getCombatant('1').tempHp).toBe(0)
  expect(state.getCombatant('1').hp).toBe(45)
})
```

## Why this is destructive

- **Every `useXxxStore()` call in every composable is removed.** Stores are no longer accessed as global singletons. They are registered in the container and injected into consumers. The 10+ composables that directly import stores (see [[composable-store-direct-coupling]]) are all rewritten.
- **Every auto-imported composable becomes an explicit import with injected dependencies.** The invisible dependency graph created by Nuxt auto-imports is replaced by a visible, traceable injection graph.
- **The Pinia store pattern is fundamentally changed.** Stores no longer use `defineStore` with global registration. They become plain reactive objects registered in the container. Pinia may be retained as the reactivity implementation but loses its role as the dependency resolution mechanism.
- **The `_buildContext()` pattern in the encounter store is eliminated.** The store currently builds a context object to pass to composables — a hand-rolled, incomplete version of dependency injection. The container replaces this with systematic injection.
- **Every Vue component that calls a composable must inject the container first.** This is more verbose but makes every dependency visible. The template becomes `const container = inject('container')!; const { x } = useX(container)` instead of `const { x } = useX()`.
- **The entire test suite is rewritten.** Tests currently initialize Pinia, populate stores, and call composables. After this change, tests create a test container with mock dependencies and inject it. The testing pattern is fundamentally different — simpler per test, but requires migrating every existing test.
- **Server-side services also participate.** If the server uses the same container pattern, services receive repositories through injection instead of importing `prisma` directly. This enables testing services with in-memory repositories.

## Principles improved

- [[dependency-inversion-principle]] — the foundational principle. Every module depends on injected abstractions, not on concrete implementations. Stores, repositories, calculators — all are swappable. This is the most comprehensive DIP application in any proposal.
- [[single-responsibility-principle]] — the container's only job is wiring dependencies. Composables' only job is domain logic. Stores' only job is reactive state. No one resolves their own dependencies.
- [[open-closed-principle]] — swapping implementations (e.g., replacing `PtuDamageCalculator` with `HouseRuleDamageCalculator`) means changing one line in the container. No consumer code changes.
- [[liskov-substitution-principle]] — any implementation satisfying the interface can be substituted. `InMemoryEncounterRepository` substitutes for `PrismaEncounterRepository` in tests. The consumer cannot tell the difference.
- [[interface-segregation-principle]] — the container registration uses specific interfaces (`EncounterRepository`, `DamageCalculator`), not monolithic god interfaces.
- Eliminates [[singleton-state-coupling]] — there are no singletons. Dependencies are explicit.
- Eliminates [[composable-store-direct-coupling]] — composables don't import stores. They receive state interfaces from the container.
- Reduces [[nuxt-framework-entanglement]] — auto-imports become irrelevant when all dependencies are explicitly injected.

## Patterns and techniques

- IoC Container / Dependency Injection Container — the core pattern
- Composition Root — a single place where the entire dependency graph is constructed
- [[factory-method-pattern]] — `createAppContainer()` and `createTestContainer()` are factory methods
- [[strategy-pattern]] — every interface in the container is a strategy slot: swap the implementation, change the behavior
- [[adapter-pattern]] — `PrismaEncounterRepository` adapts Prisma to the `EncounterRepository` interface
- [[proxy-pattern]] — the container can wrap registrations with proxies for logging, caching, or metrics
- Service Locator (anti-pattern avoided) — the container is injected once at the root, not looked up globally. Components inject the container, not individual services, to avoid the service locator pattern.

## Trade-offs

- **Verbosity.** Every composable gains a `container` parameter. Every component gains a `const container = inject(...)` line. The code becomes more explicit but noisier. What was `const { x } = useX()` becomes `const container = inject('container')!; const { x } = useX(container)`.
- **Container as god object.** If poorly managed, the container itself becomes a god object — a single registry that knows every class in the system. Mitigated by scoping: an `EncounterContainer` for encounter concerns, a `CharacterContainer` for character concerns, composed into the root container.
- **Over-engineering for a small team.** IoC containers shine in large codebases with multiple teams. For a solo developer, the indirection may not pay for itself. The current singleton pattern works for small scale — its problems emerge in testing and refactoring.
- **Vue reactivity integration.** Vue's `provide`/`inject` is the natural IoC mechanism, but it's scoped to the component tree — it doesn't work in server-side code or in non-component contexts (store initialization, utility functions). A custom container solution is needed.
- **Container initialization order.** Dependencies that depend on each other must be registered in the right order. Circular dependencies surface as errors at startup — which is better than runtime, but requires careful ordering.
- **Loss of Pinia devtools.** If stores become plain reactive objects instead of Pinia stores, the Vue devtools' Pinia panel stops working. State inspection moves from devtools to manual logging.

## Open questions

- Should the container use Vue's built-in `provide`/`inject`, a third-party IoC library (tsyringe, inversify), or a hand-rolled registry?
- How are scoped containers handled? Does the encounter page get its own `EncounterContainer` with encounter-specific dependencies?
- Should the server also use an IoC container, or only the client? If both, do they share interface definitions?
- How does this interact with [[headless-game-server]]? If the server is a separate process, it has its own container with server-specific registrations (Prisma, WebSocket server). The client container has client-specific registrations (API client, WebSocket client).
- How does this interact with [[plugin-mechanic-architecture]]? Each plugin could register its own dependencies in the container, making plugins first-class container citizens.
- Is full IoC overkill? Could the benefits be achieved with a simpler pattern — e.g., passing dependencies as function parameters without a container?

## See also

- [[singleton-state-coupling]] — the problem this addresses
- [[composable-store-direct-coupling]] — eliminated by injection
- [[nuxt-framework-entanglement]] — reduced by making dependencies explicit
- [[composable-dependency-injection-pattern]] — the current incremental approach, superseded by a systematic container
- [[dependency-inversion-principle]] — the foundational principle
- [[singleton-pattern]] — the anti-pattern being replaced
- [[headless-game-server]] — compatible: separate containers for separate processes
- [[plugin-mechanic-architecture]] — compatible: plugins register in the container
- [[game-engine-extraction]] — compatible: the engine is a container registration
