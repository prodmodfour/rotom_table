# Trait-Composed Domain Model

A destructive restructuring to shatter the monolithic Combatant interface into a composition of narrow, independently-owned trait interfaces — where each game subsystem defines, extends, and consumes only its own trait — addressing [[combatant-interface-bloat|the bloated Combatant interface]] and the [[entity-data-model-rigidity|rigid entity data model]].

## The idea

The Combatant has 30+ fields because every subsystem grafts its own concerns onto a shared interface: mount state, living weapon state, vision state, out-of-turn actions, hold queue, forecast type, feature usage counters. Adding a new subsystem means adding fields to the Combatant, modifying the type file, updating the serialization, and touching the encounter builder. Every consumer receives the full 30-field interface even when it needs 3 fields.

Shatter the Combatant into traits. Each trait is a narrow interface owned by one subsystem. A combatant's full type is the intersection of all traits it possesses. Subsystems accept only their own traits — they cannot see or depend on traits owned by other systems.

```typescript
// === CORE TRAIT — always present ===
interface Identifiable {
  id: string
  name: string
  side: 'allies' | 'enemies' | 'neutral'
}

// === OWNED BY: combat system ===
interface HasHealth {
  hp: number
  maxHp: number
  tempHp: number
  injuries: number
  maxInjuries: number
}

interface HasCombatStats {
  combatStages: CombatStages
  evasionStages: EvasionStages
}

interface HasStatusConditions {
  statusConditions: StatusCondition[]
  persistentConditions: PersistentCondition[]
  volatileConditions: VolatileCondition[]
}

// === OWNED BY: movement system ===
interface HasPosition {
  position: GridPosition | null
  speed: number
  movementTraits: MovementTrait[]
}

// === OWNED BY: mounting system ===
interface HasMountState {
  mountedOn: string | null
  riddenBy: string | null
  canMount: boolean
  mountSpeed: number | null
}

// === OWNED BY: living weapon system ===
interface HasLivingWeaponState {
  engagedWith: string | null
  wieldedBy: string | null
  isEngaged: boolean
}

// === OWNED BY: vision system ===
interface HasVision {
  visionRange: number
  darkvision: number | null
  blindsenseRange: number | null
}

// === OWNED BY: action economy system ===
interface HasActions {
  outOfTurnUsage: OutOfTurnUsage
  holdAction: HoldAction | null
  featureUsage: Map<string, number>
}

// === OWNED BY: weather system ===
interface HasWeatherInteraction {
  weatherAbilities: string[]
  forecastOriginalType: string | null
}

// === OWNED BY: turn system ===
interface HasInitiative {
  initiative: number
  initiativeModifier: number
}

// === COMPOSED TYPES — for contexts that need multiple traits ===

// Full combatant — used ONLY at the boundary (serialization, encounter builder)
type FullCombatant = Identifiable
  & HasHealth
  & HasCombatStats
  & HasStatusConditions
  & HasPosition
  & HasMountState
  & HasLivingWeaponState
  & HasVision
  & HasActions
  & HasWeatherInteraction
  & HasInitiative
  & HasEntity

// Subsystem-specific types — used by each system
type DamageTarget = Identifiable & HasHealth & HasCombatStats & HasStatusConditions
type MovableToken = Identifiable & HasPosition & HasMountState
type WeatherSubject = Identifiable & HasHealth & HasWeatherInteraction & HasStatusConditions
type TurnParticipant = Identifiable & HasInitiative & HasActions
type VisionSource = Identifiable & HasPosition & HasVision

// === SUBSYSTEMS CONSUME ONLY THEIR TRAITS ===

// Damage system — cannot see mount state, vision, or action economy
function calculateDamage(attacker: DamageTarget, defender: DamageTarget, move: Move): number {
  // Has access to hp, combatStages, statusConditions — nothing else
}

// Movement system — cannot see combat stats, status conditions, or weather
function calculateMovementRange(token: MovableToken, terrain: TerrainMap): GridPosition[] {
  // Has access to position, speed, mountedOn — nothing else
}

// Weather system — cannot see position, mount state, or action economy
function applyWeatherEffect(subject: WeatherSubject, weather: WeatherType): void {
  // Has access to hp, weatherAbilities, forecastOriginalType — nothing else
}

// Vision system — cannot see combat stats, actions, or weather
function calculateVisibleTiles(source: VisionSource, grid: Grid): Set<string> {
  // Has access to position, visionRange, darkvision — nothing else
}
```

## Why this is destructive

- **The `Combatant` type is deleted.** The 30-field interface is replaced by ~10 trait interfaces and ~6 composed types. Every file that imports `Combatant` is rewritten to import the specific trait or composed type it needs.
- **All 17 type files are restructured.** Trait definitions are co-located with their owning subsystem, not in a shared types directory. The `types/encounter.ts` file that currently defines Combatant is dissolved.
- **Every function that accepts a `Combatant` is narrowed.** Functions must declare which traits they need. A damage function that currently accepts `Combatant` (and could accidentally read `mountedOn`) now accepts `DamageTarget` (and structurally cannot see mount state).
- **Serialization changes.** The encounter builder that constructs `FullCombatant` objects must compose traits from their respective data sources. Trait-specific data may come from different database columns or containers.
- **Component props change.** Vue components that receive a `Combatant` prop must specify which traits they need. A health bar component receives `HasHealth`, not `FullCombatant`.
- **The Prisma JSON blob columns become trait-specific.** Instead of one `combatants` JSON column holding full combatant objects, each trait's data could live in its own column or table — aligning with [[encounter-dissolution|encounter dissolution]].

## How this differs from [[entity-component-system-architecture]]

The [[entity-component-system-architecture]] proposal uses a **runtime** ECS: entities are UUIDs, components are typed data bags stored in a registry, systems query by component type at runtime. It requires a runtime ECS framework, component storage, and query engine.

Traits use **compile-time** composition: TypeScript intersection types, static narrowing, and structural typing. There is no runtime framework. The type checker enforces that a function consuming `DamageTarget` cannot access `HasMountState`. The enforcement happens at build time, not runtime.

ECS is more powerful (dynamic component addition/removal, runtime queries). Traits are simpler (pure TypeScript, no framework, no runtime cost). The trade-off is flexibility vs. simplicity.

## Principles improved

- [[interface-segregation-principle]] — the foundational principle. Every subsystem depends on the narrowest possible interface. No consumer sees fields it doesn't use. This is the most direct ISP application in any proposal.
- [[single-responsibility-principle]] — each trait interface has one reason to change. `HasHealth` changes only when health mechanics change. `HasMountState` changes only when mounting mechanics change. Currently, the Combatant interface changes whenever any subsystem changes.
- [[open-closed-principle]] — adding a new subsystem (e.g., aura effects) means defining a new trait (`HasAura`) and a new composed type (`AuraSource = Identifiable & HasPosition & HasAura`). No existing traits change.
- [[dependency-inversion-principle]] — subsystems depend on trait abstractions, not on the concrete `FullCombatant`. The full type exists only at the boundary.
- [[liskov-substitution-principle]] — any value that satisfies `HasHealth & HasCombatStats` can be used where `DamageTarget` is expected, regardless of what other traits it has. Substitutability is structural, not nominal.
- Eliminates [[combatant-interface-bloat]] — the bloated interface is shattered into focused traits.
- Reduces [[entity-data-model-rigidity]] — traits can be composed differently for different entity types (Pokemon combatants have `HasEntity<Pokemon>`, trainer combatants have `HasEntity<HumanCharacter>`).
- Eliminates [[temporary-field-smell]] — fields that are only meaningful in certain contexts (e.g., `forecastOriginalType`) live in trait interfaces that are only attached when relevant.

## Patterns and techniques

- [[strategy-pattern]] — subsystem functions are strategies parameterized by their trait interfaces
- [[adapter-pattern]] — at the boundary, full combatant data is adapted into trait-specific views
- [[facade-pattern]] — `FullCombatant` is a facade that exposes the composed surface to the boundary
- [[decorator-pattern]] — traits can be thought of as decorators that add capabilities to a base entity
- TypeScript structural typing — the type system enforces trait boundaries at compile time
- Mixin/trait pattern — a well-known OO pattern applied to TypeScript interfaces via intersection types

## Trade-offs

- **Type complexity explosion.** Composed types like `DamageTarget = Identifiable & HasHealth & HasCombatStats & HasStatusConditions` must be defined and maintained. If a function needs one more field, it might need a new composed type or must add another trait to the intersection. This can lead to a proliferation of composed types.
- **Boundary mapping cost.** At the serialization boundary (loading from DB, sending via WebSocket), full combatant objects must be decomposed into traits and recomposed. This is mapping boilerplate that didn't exist with a single interface.
- **Discoverability loss.** Currently, "what data does a combatant have?" is answered by reading one interface. With traits, the answer is "search for all `Has*` interfaces and figure out which ones apply." IDE support helps (hover over `FullCombatant` to see the intersection) but it's noisier.
- **Refactoring coordination.** If two subsystems discover they share a need (e.g., both damage and weather need `entity.abilities`), they must agree on a shared trait — introducing coupling between subsystems that were supposed to be independent.
- **Vue template ergonomics.** Templates that render multiple aspects of a combatant (HP bar + position + status icons) must receive multiple trait props or a composed type. This may be more verbose than a single `combatant` prop.
- **Testing simplification vs. setup complexity.** Individual trait-consuming functions are trivially testable (create a minimal object satisfying the trait). But integration tests that need a full combatant must construct an intersection of all traits — more setup than the current `createMockCombatant()`.

## Open questions

- How many traits? Too many (one per field) makes composition unwieldy. Too few (3–4 broad traits) provides weak isolation. What's the right granularity?
- Should `HasEntity` be generic (`HasEntity<T extends Pokemon | HumanCharacter>`) to distinguish Pokemon combatants from trainer combatants at the type level?
- How do traits interact with the Prisma schema? Are traits mapped to database columns, or is `FullCombatant` still serialized as a single JSON blob?
- How does this interact with [[encounter-dissolution]]? If each container owns certain traits, the container boundary aligns with the trait boundary — containers store trait-specific data, not full combatants.
- How does this interact with [[entity-component-system-architecture]]? Could traits be the compile-time definition of ECS components, with a runtime registry for dynamic queries?
- Should Vue components receive traits as individual props (`<CombatantCard :health="c" :status="c" />`) or as a composed type (`<CombatantCard :combatant="c as DamageTarget" />`)?

## See also

- [[combatant-interface-bloat]] — the problem this addresses
- [[entity-data-model-rigidity]] — the related type hierarchy problem
- [[entity-component-system-architecture]] — the runtime alternative (ECS vs. compile-time traits)
- [[encounter-dissolution]] — compatible: container boundaries can align with trait ownership
- [[interface-segregation-principle]] — the foundational principle driving this restructuring
- [[temporary-field-smell]] — eliminated by isolating context-specific fields into optional traits
- [[data-driven-rule-engine]] — compatible: rule definitions could reference traits by name
- [[plugin-mechanic-architecture]] — compatible: each plugin defines and owns its traits
- [[combatant-as-lens]] — the radical alternative: don't decompose the Combatant, eliminate it entirely
- [[game-state-interface]] — the formal interface design that applies this ISP decomposition to the lens
- [[combat-lens-sub-interfaces]] — the concrete sub-interfaces derived from this approach
