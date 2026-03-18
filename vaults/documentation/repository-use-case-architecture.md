# Repository + Use Case Architecture

A destructive restructuring to annihilate the service layer and replace it with two cleanly separated layers — repositories (pure data access, zero business logic) and use cases (pure business logic, zero data access) — addressing the [[service-responsibility-conflation|conflation of business logic, persistence, and orchestration]] in the current 24 services.

## The idea

The current services are hybrids. `combatant.service.ts` (791 lines) calculates damage (business logic), queries Prisma (data access), serializes JSON (persistence concern), and broadcasts WebSocket events (infrastructure concern) — all in the same functions. There is no layer that is purely rules and no layer that is purely persistence. Testing damage calculation requires a database. Changing the database requires modifying game logic files.

Split every service into two layers:

1. **Repositories** — know how to read and write data. They know Prisma, JSON serialization, SQL. They know nothing about game rules. They provide typed domain objects from raw storage.

2. **Use cases** — know game rules. They accept domain objects, validate, compute, and return results. They know nothing about databases, HTTP, or WebSocket. They are pure functions of their inputs.

API routes become thin orchestrators: call a repository, pass data to a use case, write results through a repository, broadcast.

```typescript
// === REPOSITORY — pure data access, zero game logic ===

interface EncounterRepository {
  findById(id: string): Promise<Encounter>
  getCombatant(encounterId: string, combatantId: string): Promise<FullCombatant>
  updateCombatant(encounterId: string, combatant: FullCombatant): Promise<void>
  getWeather(encounterId: string): Promise<WeatherState>
  updateWeather(encounterId: string, weather: WeatherState): Promise<void>
}

class PrismaEncounterRepository implements EncounterRepository {
  constructor(private prisma: PrismaClient) {}

  async getCombatant(encounterId: string, combatantId: string): Promise<FullCombatant> {
    const row = await this.prisma.encounter.findUnique({ where: { id: encounterId } })
    const combatants: FullCombatant[] = JSON.parse(row.combatants)
    return combatants.find(c => c.id === combatantId)!
  }

  async updateCombatant(encounterId: string, combatant: FullCombatant): Promise<void> {
    const row = await this.prisma.encounter.findUnique({ where: { id: encounterId } })
    const combatants: FullCombatant[] = JSON.parse(row.combatants)
    const index = combatants.findIndex(c => c.id === combatant.id)
    combatants[index] = combatant
    await this.prisma.encounter.update({
      where: { id: encounterId },
      data: { combatants: JSON.stringify(combatants) }
    })
  }
}

// === USE CASE — pure business logic, zero data access ===

interface DealDamageInput {
  target: DamageTarget      // trait-composed type, not full Combatant
  amount: number
  damageType: 'physical' | 'special' | 'untyped'
}

interface DealDamageResult {
  updatedTarget: DamageTarget
  tempHpAbsorbed: number
  actualDamage: number
  wasKnockedOut: boolean
  triggeredHeavilyInjured: boolean
  injuries: number
}

// Pure function — no database, no HTTP, no side effects
function dealDamage(input: DealDamageInput): DealDamageResult {
  const { target, amount, damageType } = input

  const tempHpAbsorbed = Math.min(target.tempHp, amount)
  const remaining = amount - tempHpAbsorbed
  const newHp = Math.max(0, target.hp - remaining)
  const wasKnockedOut = newHp === 0 && target.hp > 0

  const triggeredHeavilyInjured = !wasKnockedOut
    && newHp <= target.maxHp / 2
    && target.hp > target.maxHp / 2

  const newInjuries = wasKnockedOut
    ? target.injuries + 1
    : triggeredHeavilyInjured
      ? target.injuries + 1
      : target.injuries

  return {
    updatedTarget: {
      ...target,
      hp: newHp,
      tempHp: target.tempHp - tempHpAbsorbed,
      injuries: newInjuries,
    },
    tempHpAbsorbed,
    actualDamage: remaining,
    wasKnockedOut,
    triggeredHeavilyInjured,
    injuries: newInjuries,
  }
}

// Another use case — switching validation
interface ValidateSwitchInput {
  combatant: TurnParticipant & HasHealth
  replacement: HasHealth
  encounterPhase: EncounterPhase
  hasUsedSwitch: boolean
}

interface ValidateSwitchResult {
  valid: boolean
  reason?: string
}

function validateSwitch(input: ValidateSwitchInput): ValidateSwitchResult {
  if (input.combatant.hp <= 0 && input.replacement.hp <= 0) {
    return { valid: false, reason: 'Replacement is fainted' }
  }
  if (input.encounterPhase !== 'declaration' && !input.combatant.hp) {
    return { valid: false, reason: 'Can only switch during declaration phase unless fainted' }
  }
  return { valid: true }
}

// === API ROUTE — thin orchestrator ===
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { targetId, amount, damageType } = await readBody(event)

  // 1. Load data through repository
  const target = await encounterRepo.getCombatant(id, targetId)

  // 2. Execute business logic through use case (pure function)
  const result = dealDamage({ target, amount, damageType })

  // 3. Persist through repository
  await encounterRepo.updateCombatant(id, result.updatedTarget)

  // 4. Broadcast
  broadcast(id, { type: 'combatant-updated', data: result })

  return result
})
```

## Why this is destructive

- **All 24 services are deleted.** Every service file in `server/services/` is split into repository implementations and use case functions. `combatant.service.ts` (791 lines) becomes `encounter.repository.ts` (~200 lines of data access) and 5+ use case files (`deal-damage.ts`, `apply-healing.ts`, `apply-status.ts`, `modify-stages.ts`, `calculate-initiative.ts` — each 30–80 lines).
- **`encounter.service.ts` (514 lines) is split.** The `buildEncounterResponse` function and JSON parsing logic move to the repository. The encounter lifecycle logic moves to use cases.
- **`out-of-turn.service.ts` (752 lines) is split.** Turn validation moves to a use case. Hold queue management moves to a use case. Intercept processing moves to a use case. Database operations move to the repository.
- **All 158 API routes are restructured.** Every route that currently calls `someService.doThing()` is rewritten to: load data from repository, call use case, save through repository, broadcast. The three-step orchestration pattern is explicit in every route.
- **Prisma is no longer imported in business logic.** Use cases have zero imports from `@prisma/client`. Testing a use case requires only creating input objects and asserting output objects — no database, no mocking, no setup.
- **`JSON.parse` and `JSON.stringify` are confined to repositories.** The serialization concern is fully encapsulated. If the storage format changes (e.g., [[encounter-schema-normalization|normalizing to relational tables]]), only repository implementations change.
- **The shared `utils/` directory may be absorbed.** Pure utility functions like `damageCalculation.ts`, `equipmentBonuses.ts`, and `typeChart.ts` are already use-case-like. They may become use cases directly or be consumed by use cases.

## Principles improved

- [[single-responsibility-principle]] — repositories have one job (data access). Use cases have one job (business logic). Routes have one job (orchestration). The current services have three jobs.
- [[dependency-inversion-principle]] — use cases depend on domain types, not on Prisma models. Routes depend on repository interfaces, not on Prisma directly. Swapping persistence (SQLite → PostgreSQL, JSON blobs → normalized tables) requires changing only repository implementations.
- [[open-closed-principle]] — adding a new game rule means adding a new use case. No existing use case changes. Adding a new data access pattern means adding a new repository method. No existing methods change.
- [[liskov-substitution-principle]] — `InMemoryEncounterRepository` substitutes for `PrismaEncounterRepository` in tests. Use cases are unaware of the difference.
- Eliminates [[service-responsibility-conflation]] — the conflation is structurally impossible. Use cases cannot import Prisma. Repositories cannot compute game rules.
- Eliminates [[game-logic-boundary-absence]] — use cases ARE the game logic boundary. They are pure functions with no framework dependencies.
- Eliminates [[routes-bypass-service-layer]] — routes call repositories and use cases. There is no service to bypass.
- Eliminates [[persistence-hot-path-overhead]] — the JSON parsing overhead is isolated in repositories, making it visible and replaceable.

## Patterns and techniques

- Repository pattern — data access abstraction with interface + implementation
- Use Case pattern (Clean Architecture) — single-purpose business logic operations
- [[adapter-pattern]] — `PrismaEncounterRepository` adapts Prisma to the domain's `EncounterRepository` interface
- [[facade-pattern]] — repositories present a domain-oriented facade over the underlying storage mechanism
- [[strategy-pattern]] — repository implementations are strategies for data access (Prisma, in-memory, file-based)
- [[template-method-pattern]] — the route's orchestration flow (load → compute → save → broadcast) is a template
- Hexagonal architecture — use cases are the domain core; repositories are the persistence port; routes are the HTTP port

## Trade-offs

- **File count explosion.** 24 services become ~24 repository methods + ~60 use case files. The total file count increases significantly. Each file is small and focused, but navigating the codebase requires understanding the repository/use-case convention.
- **Boilerplate in routes.** Every route follows the same pattern: load, compute, save, broadcast. This repetition is intentional (explicit orchestration) but verbose. A generic route handler could reduce this, at the cost of magic.
- **Over-decomposition risk.** Some services are genuinely simple (e.g., a service that reads a character by ID). Splitting them into a repository + use case adds a layer of indirection with no benefit. Not everything needs a use case — some operations are purely CRUD.
- **Cross-use-case transactions.** When one operation requires multiple use cases (e.g., damage + faint check + dismount), the route must orchestrate them. If any step fails, rollback is the route's responsibility. The current monolithic service handles this implicitly.
- **Repository interface design is critical.** If repositories are too generic (`findById`, `save`), they don't express the domain's query patterns. If too specific (`getCombatantWithMountState`), they proliferate methods. Finding the right abstraction level is a design challenge.
- **Premature interface extraction.** Defining `EncounterRepository` as an interface with one implementation (`PrismaEncounterRepository`) is technically over-engineering — the interface exists only for testability. This is acceptable if testing is a priority, but it's still indirection.

## Open questions

- Should repositories return domain types (requiring mapping from Prisma types) or Prisma types (leaking persistence into the domain)?
- Should use cases be classes (with injected dependencies) or pure functions (with explicit parameters)?
- How does this interact with [[ioc-container-architecture]]? Repositories and use cases are natural container registrations — the container wires them together.
- How does this interact with [[game-engine-extraction]]? Use cases could BE the engine's functions. The engine package is just the use case layer, extracted.
- How does this interact with [[encounter-dissolution]]? Each container (roster, turns, weather) has its own repository and use cases.
- How does this interact with [[in-memory-encounter-state]]? The repository's `findById` could return an in-memory object instead of querying the database. The use case doesn't care.
- Should there be a `UnitOfWork` pattern to coordinate cross-repository transactions?
- Are use cases overkill for simple CRUD operations (read character, list Pokemon)?

## See also

- [[service-responsibility-conflation]] — the problem this addresses
- [[game-logic-boundary-absence]] — eliminated: use cases are the boundary
- [[routes-bypass-service-layer]] — eliminated: the service layer is gone; routes call repositories and use cases directly
- [[service-pattern-classification]] — superseded: the four service types are replaced by two layers
- [[service-layer-pattern]] — superseded by the repository + use case split
- [[service-inventory]] — the services that would be decomposed
- [[ioc-container-architecture]] — compatible: repositories and use cases are container registrations
- [[game-engine-extraction]] — compatible: use cases can become the engine's public API
- [[encounter-dissolution]] — compatible: per-container repositories and use cases
- [[domain-driven-persistence-adapter]] — the radical extension: invert schema authority so domain types define the model, not Prisma
