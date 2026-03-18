# Entity-Component-System Architecture

A destructive restructuring to replace the rigid Pokemon/HumanCharacter/Combatant type hierarchy with a composition-based Entity-Component-System (ECS) model — addressing the [[entity-data-model-rigidity|fundamental rigidity of the entity data model]].

## The idea

The app models combat participants through inheritance-like types: `Pokemon` and `HumanCharacter` are distinct database models with distinct schemas, shoved into a `Combatant` wrapper that flattens them via a discriminated union. This creates 144 unsafe casts, a 35-field mega-interface, three separate serialization paths, and type-checking branches in every consumer. The hierarchy is load-bearing — adding a new entity type (a Wild NPC, a Trap, a Terrain Hazard) requires changes across 45+ files.

Replace this with Entity-Component-System architecture. Entities are just UUIDs. Components are typed data bags that can be attached to any entity. Systems are pure functions that query for entities with specific component combinations.

```typescript
// Components — typed data bags, no behavior
interface HealthComponent { currentHp: number; maxHp: number; tempHp: number; injuries: number }
interface MoveSetComponent { moves: Move[]; usedMoves: Map<string, number> }
interface TypeComponent { types: PokemonType[]; }
interface PositionComponent { x: number; y: number; elevation: number; facing: Direction }
interface StatusComponent { conditions: StatusCondition[]; stageModifiers: StageModifiers }
interface StatsComponent { atk: number; def: number; spatk: number; spdef: number; spd: number }
interface EquipmentComponent { heldItem: Item | null; equipment: Equipment[] }
interface TrainerComponent { trainerClasses: TrainerClass[]; skills: Skill[]; features: Feature[] }
interface SpeciesComponent { species: string; nature: Nature; abilities: Ability[] }
interface MountComponent { mountId: string | null; riderId: string | null }
interface TurnStateComponent { hasActed: boolean; hasMoved: boolean; declaration: Declaration | null }
interface VisibilityComponent { visibleTo: string[]; darkvision: number }

// An entity is just an ID with attached components
interface Entity {
  id: string
  components: Map<ComponentType, Component>
}

// Systems are pure functions that process entities with required components
function damageSystem(
  entities: EntityQuery<[HealthComponent, StatusComponent]>,
  damage: DamageEvent
): StateChange[] {
  const target = entities.get(damage.targetId)
  const health = target.get(HealthComponent)
  const status = target.get(StatusComponent)
  // Pure calculation — no casts, no type checks, no entity-type branching
  const absorbed = Math.min(health.tempHp, damage.amount)
  return [
    { entity: damage.targetId, component: HealthComponent,
      patch: { tempHp: health.tempHp - absorbed, currentHp: Math.max(0, health.currentHp - (damage.amount - absorbed)) } }
  ]
}
```

A Pokemon is an entity with `HealthComponent + MoveSetComponent + TypeComponent + SpeciesComponent + StatsComponent + StatusComponent`. A Trainer is an entity with `HealthComponent + TrainerComponent + EquipmentComponent + StatsComponent + StatusComponent`. A Trap is an entity with `PositionComponent + HealthComponent`. The system doesn't know or care what "kind" of thing it's processing — it queries by capability.

The database stores components in a normalized `EntityComponent` table:

```sql
CREATE TABLE Entity (id TEXT PRIMARY KEY, encounterId TEXT, label TEXT);
CREATE TABLE EntityComponent (
  entityId TEXT, componentType TEXT, data TEXT,
  PRIMARY KEY (entityId, componentType)
);
```

## Why this is destructive

- **The entire type system is rewritten.** `Pokemon`, `HumanCharacter`, `Combatant`, and all their subtypes are deleted. Every file that references these types changes.
- **Both Prisma models (`Pokemon`, `HumanCharacter`) are deleted** and replaced with the `Entity` + `EntityComponent` tables. All seed data, all character/Pokemon creation flows, all detail views are rewritten.
- **All 23 services are rewritten.** Services no longer operate on typed entity objects — they operate on component queries. `combatant.service.ts` is dissolved; its 5 mixed domains become 5 separate systems.
- **The three serialization paths are eliminated.** There's one path: query components for an entity, compose them into a response. No more `serializers.ts`, no more `buildEncounterResponse`, no more `entity-builder.service.ts`.
- **All 158 components that render entity data are rewritten.** Instead of `<PokemonCard :pokemon="entity as Pokemon">`, components bind to component queries: `<HealthBar :health="entity.get(HealthComponent)">`.
- **The encounter store's combatant model is replaced.** Combatants become entity references with component state, not embedded snapshots.

## Principles improved

- [[liskov-substitution-principle]] — eliminated entirely as a concern. There is no entity hierarchy; there are only component queries. Any entity with `HealthComponent` can be damaged, regardless of what else it has.
- [[interface-segregation-principle]] — consumers depend only on the components they need, not the entire entity union. A damage system depends on `HealthComponent`, not on `Pokemon | HumanCharacter`.
- [[open-closed-principle]] — adding a new entity type means composing existing components — zero code changes. Adding a new component type means adding a new data definition and new systems that query it — existing systems are untouched.
- [[single-responsibility-principle]] — each system processes one concern. Damage system handles damage. Status system handles status. No mixed-domain services.
- [[dependency-inversion-principle]] — systems depend on component interfaces, not concrete entity types.
- Eliminates [[entity-union-unsafe-downcasts]] — there are no unions to downcast. There are only component queries with compile-time guarantees.
- Eliminates [[combatant-interface-breadth]] — there is no 35-field mega-interface. Each component is 3–8 fields.

## Patterns and techniques

- [[composite-pattern]] — entities are compositions of components, not monolithic objects
- [[strategy-pattern]] — systems are interchangeable processors for component combinations
- [[visitor-pattern]] — systems visit entities with matching component signatures
- Entity-Component-System (game engine architecture) — the canonical pattern for flexible entity modeling in game development
- Data-oriented design — components are contiguous data bags optimized for processing, not objects with behavior

## Trade-offs

- **Paradigm shift.** ECS is fundamentally different from OOP-style type hierarchies. Every developer working on the project must understand component composition, entity queries, and system pipelines. The learning curve is steep.
- **Query overhead.** Instead of accessing `combatant.hp` directly, code must query the entity's `HealthComponent`. This adds indirection. Dynamic component lookups may have runtime cost compared to static property access.
- **Loss of Prisma type safety.** The current Prisma models generate typed objects (`Pokemon`, `HumanCharacter`) with compile-time property access. A generic `EntityComponent` table with JSON data requires runtime type checking on component data.
- **Component boundary decisions.** Which fields belong to which component? Should `injuries` be part of `HealthComponent` or a separate `InjuryComponent`? These boundaries are debatable and affect every query.
- **Tooling vacuum.** There is no TypeScript ECS framework designed for web apps with Prisma/SQLite backends. This would be entirely hand-rolled. Game ECS frameworks (bitECS, miniplex) are designed for high-frequency game loops, not request-response web apps.
- **Relational integrity.** The `EntityComponent` table stores component data as JSON. This is the same JSON-in-SQLite pattern that [[denormalized-encounter-combatants]] identifies as problematic — just moved to a different abstraction level. Individual components would need their own tables to achieve true normalization.
- **Debugging opacity.** "Show me Pikachu's data" now means querying 8–10 component rows and mentally assembling them, rather than reading one Prisma record.

## Open questions

- Should components be stored as separate relational tables (`HealthComponent` table, `MoveSetComponent` table) or as JSON in a generic `EntityComponent` table?
- Is the ECS architecture applied only to combat (the `Combatant` replacement) or also to the persistent data model (replacing `Pokemon` and `HumanCharacter` tables)?
- How does this interact with [[game-engine-extraction]]? If the engine uses ECS internally, the app could still present a simpler interface. If the app uses ECS at the persistence level, the engine must be ECS-aware.
- How does this interact with [[event-sourced-encounter-state]]? Events would target components on entities rather than mutating combatant objects. The combination could be very powerful — or very complex.
- How are entity "archetypes" (the common component bundles like "a standard Pokemon") defined? Is there a template/factory system, or are entities assembled ad-hoc?
- What happens to the Prisma schema? Does Prisma model the component tables, or does the app use raw SQL for the ECS layer?

## See also

- [[entity-data-model-rigidity]] — the problem this addresses
- [[entity-union-unsafe-downcasts]] — eliminated by removing the union entirely
- [[combatant-interface-breadth]] — eliminated by decomposing into components
- [[combatant-type-segregation]] — the incremental approach (split into sub-interfaces) that this supersedes
- [[combat-entity-base-interface]] — the type-level approach that this makes unnecessary
- [[combatant-service-decomposition]] — service decomposition happens naturally (each system is focused)
- [[game-engine-extraction]] — the engine would operate on components, not entity types
- [[trait-composed-domain-model]] — the compile-time alternative: TypeScript intersection types instead of runtime ECS
