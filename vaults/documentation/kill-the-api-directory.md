# Kill the API Directory

A destructive restructuring to obliterate the 158 file-based API route handlers — replacing the one-file-per-endpoint convention with domain-scoped controller classes that co-locate related operations, share validation, and expose a discoverable action surface — addressing the fragmentation, duplication, and structural bloat of [[horizontal-layer-coupling|horizontal API organization]].

## The idea

The `server/api/` directory has 158 files across 16 subdirectories. Each file handles one HTTP endpoint. Each file independently: parses request parameters, reads the request body, validates input (sometimes), calls a service (or [[routes-bypass-service-layer|Prisma directly]]), serializes the response, and handles errors. Shared concerns — parameter parsing, encounter loading, combatant lookup, authorization — are duplicated across files or extracted into utilities that are inconsistently used.

This is the file-based routing trap. The convention forces one file per endpoint, but the domain has groups of related operations that share context: the 15 encounter combat endpoints all load the same encounter, parse the same combatants, and broadcast to the same WebSocket channel. They are artificially separated by the file system.

Collapse all 158 route files into ~12 domain controller classes. Each controller owns all operations for its domain, shares request context, and registers its routes explicitly.

```typescript
// === DOMAIN CONTROLLER — co-located related operations ===

class EncounterCombatController {
  constructor(
    private encounterRepo: EncounterRepository,
    private damageUseCase: DealDamageUseCase,
    private healingUseCase: ApplyHealingUseCase,
    private statusUseCase: ApplyStatusUseCase,
    private stageUseCase: ModifyStagesUseCase,
    private broadcaster: EncounterBroadcaster,
  ) {}

  // Shared context — loaded once, used by all operations
  private async loadContext(encounterId: string) {
    const encounter = await this.encounterRepo.findById(encounterId)
    if (!encounter) throw new NotFoundError('Encounter not found')
    return encounter
  }

  // Shared validation — applied consistently
  private validateCombatantExists(encounter: Encounter, combatantId: string) {
    const combatant = encounter.combatants.find(c => c.id === combatantId)
    if (!combatant) throw new NotFoundError('Combatant not found')
    return combatant
  }

  async dealDamage(req: { encounterId: string; targetId: string; amount: number; damageType: string }) {
    const encounter = await this.loadContext(req.encounterId)
    const target = this.validateCombatantExists(encounter, req.targetId)
    const result = this.damageUseCase.execute({ target, amount: req.amount, damageType: req.damageType })
    await this.encounterRepo.updateCombatant(req.encounterId, result.updatedTarget)
    this.broadcaster.broadcast(req.encounterId, { type: 'damage', data: result })
    return result
  }

  async applyHealing(req: { encounterId: string; targetId: string; amount: number }) {
    const encounter = await this.loadContext(req.encounterId)
    const target = this.validateCombatantExists(encounter, req.targetId)
    const result = this.healingUseCase.execute({ target, amount: req.amount })
    await this.encounterRepo.updateCombatant(req.encounterId, result.updatedTarget)
    this.broadcaster.broadcast(req.encounterId, { type: 'healing', data: result })
    return result
  }

  async addStatus(req: { encounterId: string; targetId: string; status: string; duration?: number }) {
    const encounter = await this.loadContext(req.encounterId)
    const target = this.validateCombatantExists(encounter, req.targetId)
    const result = this.statusUseCase.execute({ target, status: req.status, duration: req.duration })
    await this.encounterRepo.updateCombatant(req.encounterId, result.updatedTarget)
    this.broadcaster.broadcast(req.encounterId, { type: 'status', data: result })
    return result
  }

  async modifyStages(req: { encounterId: string; targetId: string; stages: Partial<CombatStages> }) {
    const encounter = await this.loadContext(req.encounterId)
    const target = this.validateCombatantExists(encounter, req.targetId)
    const result = this.stageUseCase.execute({ target, stages: req.stages })
    await this.encounterRepo.updateCombatant(req.encounterId, result.updatedTarget)
    this.broadcaster.broadcast(req.encounterId, { type: 'stages', data: result })
    return result
  }

  // Register all routes — the full action surface is visible in one place
  register(router: Router) {
    router.post('/encounters/:id/damage', (req) =>
      this.dealDamage({ encounterId: req.params.id, ...req.body }))
    router.post('/encounters/:id/healing', (req) =>
      this.applyHealing({ encounterId: req.params.id, ...req.body }))
    router.post('/encounters/:id/status', (req) =>
      this.addStatus({ encounterId: req.params.id, ...req.body }))
    router.post('/encounters/:id/stages', (req) =>
      this.modifyStages({ encounterId: req.params.id, ...req.body }))
  }
}

// === ROUTE REGISTRATION — all controllers registered in one place ===

function registerRoutes(router: Router, deps: Dependencies) {
  new EncounterCombatController(deps.encounterRepo, deps.damageUseCase, ...).register(router)
  new EncounterLifecycleController(deps.encounterRepo, deps.turnManager, ...).register(router)
  new EncounterGridController(deps.encounterRepo, deps.gridService, ...).register(router)
  new EncounterSwitchingController(deps.encounterRepo, deps.switchValidator, ...).register(router)
  new CaptureController(deps.encounterRepo, deps.captureCalculator, ...).register(router)
  new CharacterController(deps.characterRepo).register(router)
  new PokemonController(deps.pokemonRepo).register(router)
  new SceneController(deps.sceneRepo).register(router)
  new WeatherController(deps.encounterRepo, deps.weatherEngine).register(router)
  new MountingController(deps.encounterRepo, deps.mountValidator).register(router)
  new LivingWeaponController(deps.encounterRepo, deps.livingWeaponService).register(router)
  new EquipmentController(deps.characterRepo, deps.equipmentService).register(router)
}
// The full API surface: ~12 controller files, ~158 methods, all discoverable
```

## Why this is destructive

- **All 158 route files are deleted.** The `server/api/` directory is emptied. Every file — `damage.post.ts`, `healing.post.ts`, `status.post.ts`, `switch.post.ts`, `next-turn.post.ts` — is replaced by methods on controller classes.
- **The file-based routing convention is abandoned.** URLs are no longer discoverable by browsing the file system. They are registered explicitly in controller `register()` methods. The trade-off: you lose filesystem discoverability but gain code-level discoverability (read one file to see all combat endpoints).
- **Duplicated request handling is eliminated.** Currently, 15+ encounter endpoints each independently parse the encounter ID, load the encounter, and parse combatants. Controller methods share `loadContext()` and `validateCombatantExists()`. The duplication is structurally eliminated.
- **Error handling is centralized per domain.** Currently, each route file has its own try/catch or createError pattern. Controllers can implement shared error handling for all their operations.
- **The encounter loading hot path is consolidated.** Instead of 15 separate `prisma.encounter.findUnique()` calls in 15 files, the controller loads the encounter once via `loadContext()` and passes it to all operations. This naturally enables caching and is compatible with [[in-memory-encounter-state]].
- **The WebSocket broadcast pattern is consolidated.** Instead of each route file independently calling broadcast, the controller's shared `broadcaster` instance handles all broadcasting for its domain.
- **Nitro/Nuxt server dependency is eliminated.** Controllers use plain TypeScript classes with explicit dependency injection. No `defineEventHandler`, no `readBody`, no `getRouterParams`. Compatible with [[headless-game-server]] and [[explicit-vue-architecture]].

## Principles improved

- [[single-responsibility-principle]] — each controller is responsible for one domain's HTTP operations. Each method handles one operation. Currently, each file handles one endpoint but duplicates cross-cutting concerns.
- [[open-closed-principle]] — adding a new endpoint means adding a method to the appropriate controller and a line in `register()`. No existing methods change. Currently, adding an endpoint means creating a new file with duplicated boilerplate.
- [[dependency-inversion-principle]] — controllers receive repositories and use cases through constructor injection. No direct Prisma imports. Compatible with [[ioc-container-architecture]].
- Eliminates [[routes-bypass-service-layer]] — controllers call use cases, not Prisma directly. The constructor injection makes bypassing visible (you'd have to add `prisma` as a dependency).
- Eliminates [[horizontal-layer-coupling]] — related operations are co-located by domain, not separated into individual files.
- Eliminates the [[duplicate-code-smell]] — shared context loading, validation, and error handling are methods, not copy-pasted blocks.
- Reduces [[shotgun-surgery-smell]] — changing how encounter loading works means changing `loadContext()` in one class, not 15 files.

## Patterns and techniques

- Controller pattern (MVC) — grouping related HTTP operations into a class
- [[facade-pattern]] — each controller is a facade over its domain's use cases and repositories
- [[template-method-pattern]] — the shared orchestration pattern (load → validate → execute → persist → broadcast) is a template implemented per method
- [[mediator-pattern]] — controllers mediate between HTTP requests and domain operations
- [[strategy-pattern]] — each controller method is a strategy for handling its specific request
- Explicit route registration — URLs are code-defined objects, not filesystem conventions

## Trade-offs

- **Loss of filesystem discoverability.** Currently, `ls server/api/encounters/[id]/` reveals all encounter endpoints. With controllers, you must read the controller class. IDE navigation helps, but the filesystem is no longer a map of the API.
- **Controller bloat risk.** If a domain has many operations (encounters have 44), the controller class grows large. Mitigated by splitting into sub-controllers: `EncounterCombatController`, `EncounterLifecycleController`, `EncounterGridController`.
- **Nuxt compatibility lost.** If the app stays on Nuxt, file-based routing is Nuxt's convention. Abandoning it means fighting the framework. This proposal is most natural when combined with [[headless-game-server]] or [[explicit-vue-architecture]].
- **Constructor parameter explosion.** A controller that orchestrates 5 use cases, 2 repositories, and a broadcaster has 8 constructor parameters. Mitigated by grouping dependencies into context objects or using [[ioc-container-architecture]].
- **Testing requires controller instantiation.** Testing a single endpoint requires creating the controller with all its dependencies. This is more setup than testing a single route file — but the mocking is cleaner because dependencies are injected.

## Open questions

- How many controllers? One per domain (12) or finer-grained (30+)?
- Should controllers be classes (with constructor injection) or factory functions (more functional style)?
- How does this interact with [[typed-rpc-api-layer]]? Controllers could be the implementation behind tRPC procedures, combining both proposals.
- How does this interact with [[saga-orchestrated-turn-lifecycle]]? The lifecycle controller delegates to the saga orchestrator instead of containing transaction script logic.
- How does this interact with [[repository-use-case-architecture]]? Controllers call use cases and repositories — the three-layer pattern (controller → use case → repository) is Clean Architecture.
- Should controllers also handle WebSocket events, or should WebSocket remain a separate handler?

## See also

- [[horizontal-layer-coupling]] — the problem this addresses (API dimension)
- [[routes-bypass-service-layer]] — eliminated by constructor injection
- [[duplicate-code-smell]] — eliminated by shared controller methods
- [[shotgun-surgery-smell]] — reduced by co-locating related operations
- [[typed-rpc-api-layer]] — compatible: controllers implement RPC procedures
- [[headless-game-server]] — compatible: controllers register on the standalone server
- [[explicit-vue-architecture]] — compatible: no Nuxt file-based routing dependency
- [[ioc-container-architecture]] — compatible: controllers are container registrations
- [[repository-use-case-architecture]] — compatible: controllers orchestrate use cases and repositories
- [[saga-orchestrated-turn-lifecycle]] — compatible: lifecycle controller delegates to saga
