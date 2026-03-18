# Domain-Driven Persistence Adapter

A destructive restructuring to burn the Prisma schema as the domain model definition and invert the dependency — making TypeScript domain types the source of truth and persistence a replaceable adapter that conforms to them — addressing the [[dependency-inversion-principle]] violation at the foundation of the entire data layer.

## The idea

The current data architecture has an inverted dependency chain. The Prisma schema defines 11 models with 100+ columns. The `prisma generate` command produces TypeScript types. The app's type files (`types/character.ts`, `types/encounter.ts`) are manually maintained shadows of the Prisma-generated types, with JSON parsing transformations layered on top. The serializer layer (`server/utils/serializers.ts`) bridges the gap between Prisma's flat string columns and the app's structured types. The domain model is downstream of the persistence schema.

This is backwards. The persistence layer should adapt to the domain model, not the other way around.

Delete the Prisma schema as the domain authority. Define canonical domain types in pure TypeScript. Build a persistence adapter that maps domain objects to storage and back. The adapter can use Prisma, raw SQL, a document store, or an in-memory map — the domain model doesn't know and doesn't care. Schema changes start as TypeScript type changes and flow downstream to persistence, not the other way around.

```typescript
// === DOMAIN TYPES: THE SOURCE OF TRUTH ===
// Pure TypeScript. No Prisma annotations. No JSON workarounds.
// These types define what the domain IS, not how it's stored.

interface Pokemon {
  id: string
  species: string
  nickname: string | null
  level: number
  experience: number
  nature: Nature
  gender: Gender
  stats: StatBlock
  moves: Move[]            // structured, not JSON string
  abilities: Ability[]     // structured, not JSON string
  capabilities: Capability[]
  statusConditions: StatusCondition[]
  heldItem: Item | null    // typed reference, not string
  loyalty: number
  ownerId: string
}

interface StatBlock {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

interface Move {
  id: string
  name: string
  type: PokemonType
  frequency: MoveFrequency
  ac: number
  db: number
  damageClass: DamageClass
  range: MoveRange
  effects: MoveEffect[]
}

// === PERSISTENCE PORT (domain side) ===
// The domain defines what it needs from persistence.
// It does NOT define how persistence works.

interface PokemonRepository {
  findById(id: string): Promise<Pokemon | null>
  findByOwnerId(ownerId: string): Promise<Pokemon[]>
  save(pokemon: Pokemon): Promise<void>
  delete(id: string): Promise<void>
}

interface CharacterRepository {
  findById(id: string): Promise<HumanCharacter | null>
  findByCampaignId(campaignId: string): Promise<HumanCharacter[]>
  save(character: HumanCharacter): Promise<void>
  delete(id: string): Promise<void>
}

interface EncounterRepository {
  findById(id: string): Promise<EncounterState | null>
  save(encounter: EncounterState): Promise<void>
  // No Prisma types leak into the domain
}

// === PERSISTENCE ADAPTER (infrastructure side) ===
// The adapter implements the domain's port using a specific technology.
// Currently: Prisma + SQLite. Could be anything.

class PrismaPokemonRepository implements PokemonRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Pokemon | null> {
    const record = await this.prisma.pokemon.findUnique({ where: { id } })
    if (!record) return null
    return this.toDomain(record)
  }

  async save(pokemon: Pokemon): Promise<void> {
    const record = this.toPrisma(pokemon)
    await this.prisma.pokemon.upsert({
      where: { id: pokemon.id },
      create: record,
      update: record,
    })
  }

  // === MAPPING LOGIC LIVES HERE, NOT IN SERIALIZERS ===

  private toDomain(record: PrismaModel.Pokemon): Pokemon {
    return {
      id: record.id,
      species: record.species,
      nickname: record.nickname,
      level: record.level,
      experience: record.experience,
      nature: record.nature as Nature,
      gender: record.gender as Gender,
      stats: {
        hp: record.hp, attack: record.attack, defense: record.defense,
        specialAttack: record.specialAttack, specialDefense: record.specialDefense,
        speed: record.speed,
      },
      moves: JSON.parse(record.moves),          // JSON → structured
      abilities: JSON.parse(record.abilities),
      capabilities: JSON.parse(record.capabilities),
      statusConditions: JSON.parse(record.statusConditions),
      heldItem: record.heldItem ? JSON.parse(record.heldItem) : null,
      loyalty: record.loyalty,
      ownerId: record.humanCharacterId,
    }
  }

  private toPrisma(pokemon: Pokemon): Prisma.PokemonCreateInput {
    return {
      id: pokemon.id,
      species: pokemon.species,
      // ... map structured types to Prisma's flat schema
      moves: JSON.stringify(pokemon.moves),      // structured → JSON
      abilities: JSON.stringify(pokemon.abilities),
      // The ugliness of JSON serialization is CONTAINED HERE
      // It does not leak into services, composables, or components
    }
  }
}

// === ALTERNATIVE ADAPTER (swap persistence without touching domain) ===

class InMemoryPokemonRepository implements PokemonRepository {
  private store = new Map<string, Pokemon>()

  async findById(id: string): Promise<Pokemon | null> {
    return this.store.get(id) ?? null
  }

  async save(pokemon: Pokemon): Promise<void> {
    this.store.set(pokemon.id, structuredClone(pokemon))
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }
}

// === COMPOSITION ROOT ===
// One place wires the adapters. Everything else receives interfaces.

function createRepositories(prisma: PrismaClient): Repositories {
  return {
    pokemon: new PrismaPokemonRepository(prisma),
    characters: new PrismaCharacterRepository(prisma),
    encounters: new PrismaEncounterRepository(prisma),
    campaigns: new PrismaCampaignRepository(prisma),
    scenes: new PrismaSceneRepository(prisma),
  }
}

// In tests:
function createTestRepositories(): Repositories {
  return {
    pokemon: new InMemoryPokemonRepository(),
    characters: new InMemoryCharacterRepository(),
    encounters: new InMemoryEncounterRepository(),
    campaigns: new InMemoryCampaignRepository(),
    scenes: new InMemorySceneRepository(),
  }
}
```

## Why this is destructive

- **The Prisma schema loses its authority.** It remains as a database definition file, but it no longer defines the domain model. The source of truth shifts from `prisma/schema.prisma` to `types/*.ts`. This is a philosophical inversion, not just a refactor.
- **`server/utils/serializers.ts` is deleted.** The serializer was a translation layer between Prisma types and domain types. With repository adapters, that translation is encapsulated inside each adapter. The shared serializer has no reason to exist.
- **All 158 API routes that import Prisma directly are rewritten.** Routes receive repository interfaces via dependency injection. No route imports `prisma` from `~/server/utils/prisma`. The [[routes-bypass-service-layer]] problem is structurally prevented — there is no `prisma` global to bypass.
- **All 25 services that import Prisma are rewritten.** Services receive repositories via constructor or parameter injection. `combatant.service.ts` receives `PokemonRepository` and `EncounterRepository`, not `PrismaClient`.
- **The JSON parse/stringify horror is contained.** Currently, JSON parsing is scattered across services and serializers. With adapters, it exists in exactly one place: the `toDomain` and `toPrisma` methods of each adapter. If Prisma is ever replaced (e.g., with a normalized schema that doesn't need JSON columns), only the adapters change.
- **Testing becomes trivial.** Services and game logic can be tested with `InMemoryRepository` implementations — no database, no migrations, no test fixtures, no cleanup. Currently, testing services requires either mocking Prisma or running against a real database.
- **The door to changing persistence technology opens.** Replace SQLite with PostgreSQL? Write new adapters. Replace JSON columns with normalized tables? Rewrite adapters. Replace Prisma with Drizzle? Rewrite adapters. The domain model and all business logic are untouched.

## Principles improved

- [[dependency-inversion-principle]] — the foundational principle. The domain defines ports (repository interfaces). Infrastructure provides adapters. The dependency arrow points from infrastructure toward domain, not the reverse. Currently, the domain is downstream of Prisma — a textbook DIP violation.
- [[single-responsibility-principle]] — the domain model is responsible for business rules. The persistence adapter is responsible for storage mapping. The Prisma schema is responsible for database structure. Currently, Prisma types are used as domain types, conflating three responsibilities.
- [[open-closed-principle]] — new domain fields mean new TypeScript type fields. The persistence adapter maps them. The Prisma schema adds a column. Each layer changes independently. Currently, a new field requires coordinated changes across Prisma schema, generated types, serializers, services, and components.
- [[liskov-substitution-principle]] — any `PokemonRepository` implementation (Prisma, in-memory, file-based) is substitutable. Services work identically regardless of which adapter backs them.
- [[interface-segregation-principle]] — repositories expose only the operations the domain needs (`findById`, `save`, `delete`). They don't expose Prisma's full query API (`findMany`, `aggregate`, `groupBy`). The domain can't accidentally depend on persistence-specific features.
- Eliminates [[routes-bypass-service-layer]] — structurally prevented. There is no global `prisma` to import. Repositories are injected.
- Eliminates [[service-responsibility-conflation]] — services don't know about persistence. They call repository methods.
- Eliminates [[persistence-hot-path-overhead]] — the JSON parse/stringify ugliness is contained in adapters. Optimizing it means optimizing one file, not hunting across 25 services.

## Patterns and techniques

- [[adapter-pattern]] — the core pattern. Each repository adapter adapts between domain types and storage types.
- [[facade-pattern]] — repository interfaces present a clean facade over the underlying persistence technology.
- [[strategy-pattern]] — different persistence strategies (Prisma, in-memory, file) implement the same repository interface.
- [[factory-method-pattern]] — the composition root uses factory functions to create repository implementations.
- [[bridge-pattern]] — the domain model and the persistence model can vary independently, bridged by the adapter.
- Hexagonal Architecture (Ports & Adapters) — repositories are ports defined by the domain; adapters are infrastructure implementations.
- Repository pattern (Domain-Driven Design) — collection-like access to domain aggregates.
- Dependency Injection — repositories are injected into services, not imported as globals.

## Trade-offs

- **Mapping boilerplate.** Every domain type needs a `toDomain` and `toPrisma` mapper. For 11 models with 100+ fields, this is significant boilerplate. The current system avoids this by using Prisma types directly — convenient but architecturally unsound.
- **Loss of Prisma query power.** Prisma's query API supports filtering, pagination, relation loading, aggregation, and transactions. Behind a repository interface, these must be exposed as specific methods or ignored. Complex queries become harder.
- **Two type systems to maintain.** The Prisma schema and the TypeScript domain types must stay aligned manually. A new field added to the domain type but not to the Prisma schema will compile but fail at runtime. Code generation or validation scripts can mitigate this.
- **Repository method explosion.** As features grow, repositories accumulate methods: `findById`, `findByOwnerId`, `findByCampaignId`, `findBySpecies`, `findByLevel`, etc. The specification pattern or a query object pattern can contain this, but adds abstraction.
- **Performance overhead from mapping.** Every database read and write goes through a mapping function. For hot paths (encounter actions with 10+ combatants), the mapping cost may be measurable. Lazy mapping or view objects can mitigate this.
- **Incremental migration difficulty.** The system cannot be partially migrated — some services using repositories while others use Prisma directly would create two persistence paths. This is all-or-nothing within the service layer.

## Open questions

- Should the Prisma schema be auto-generated from the TypeScript domain types (inverting the current flow), or should both be maintained manually with a validation check?
- How do database transactions work through repository interfaces? A `UnitOfWork` pattern? Or transaction-aware repository methods?
- How does this interact with [[repository-use-case-architecture]]? That proposal already proposes repositories + use cases. This proposal goes further by making the domain model the schema authority and introducing adapter-based persistence.
- How does this interact with [[universal-event-journal]]? If the event journal replaces CRUD, the repository adapter appends events instead of updating rows. The repository interface remains the same.
- How does this interact with [[encounter-dissolution]]? Each state container could have its own repository adapter, with the domain defining container interfaces and the adapter handling persistence.
- Should repositories handle caching internally (repository-level cache) or should caching be a separate concern (cache decorator over the repository)?
- How do migration scripts work? Currently, `prisma migrate` handles schema changes. With domain-driven types, who generates migrations? A diff tool that compares domain types to the Prisma schema?

## See also

- [[dependency-inversion-principle]] — the principle this proposal enforces at the architecture level
- [[routes-bypass-service-layer]] — structurally prevented: no Prisma global to bypass
- [[service-responsibility-conflation]] — eliminated: services call repositories, not Prisma
- [[persistence-hot-path-overhead]] — contained: JSON mapping is in one place per adapter
- [[repository-use-case-architecture]] — compatible but more radical: this proposal adds schema authority inversion
- [[encounter-schema-normalization]] — compatible: schema normalization happens in the adapter, not in the domain
- [[universal-event-journal]] — compatible: the repository adapter can append events instead of updating rows
- [[ioc-container-architecture]] — compatible: repositories are injected via an IoC container
- [[adapter-pattern]] — the core pattern
- [[bridge-pattern]] — domain and persistence vary independently
