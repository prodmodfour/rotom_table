# Vault-Sourced Data Repository

A destructive restructuring to destroy the 18 hardcoded constants files and replace them with a schema-driven data repository compiled from the PTR vault — making the vault the single source of truth for all game data and eliminating the manual synchronization between vault rules and app constants.

## The idea

The `app/constants/` directory contains 18 TypeScript files encoding game data: type effectiveness charts, nature modifier tables, equipment catalogs, status condition definitions, weather effect tables, ball type bonuses, move frequency rules, size categories, capability definitions, skill lists, and more. This data is compiled into the JavaScript bundle at build time. It cannot change without rebuilding the app. It duplicates information that already exists in the PTR vault. When a vault note is updated (a move changes frequency, a weather effect is tweaked), someone must manually find the corresponding constants file and update it — or the app silently diverges from the rules.

What if the app's game data is not code?

The PTR vault already describes every move, ability, equipment item, status condition, and game rule in structured markdown. A build step compiles vault notes into a typed JSON data index. The app loads this index at startup. Game data becomes queryable, hot-reloadable, and always vault-aligned.

```typescript
// === BUILD STEP: vault → compiled data index ===

// A build script reads the PTR vault and extracts structured data.
// Vault notes use frontmatter + structured body content.

// Example vault note: vaults/ptr/thunderbolt.md
// ---
// name: Thunderbolt
// type: Electric
// frequency: At-Will
// ac: 2
// db: 8
// class: Special
// range: 6, 1 Target
// effects:
//   - type: status
//     condition: paralysis
//     chance: 10
// ---
// Thunderbolt releases a strong bolt of electricity ...

// The build step extracts this into a typed record:
interface CompiledMove {
  id: string            // derived from filename
  name: string
  type: PokemonType
  frequency: MoveFrequency
  ac: number
  db: number
  damageClass: 'Physical' | 'Special' | 'Status'
  range: string
  effects: MoveEffect[]
}

// The build step produces a JSON index:
// dist/data/moves.json    — all moves
// dist/data/abilities.json — all abilities
// dist/data/equipment.json — all equipment
// dist/data/types.json     — type effectiveness chart
// dist/data/natures.json   — nature modifier table
// dist/data/conditions.json — status condition definitions
// dist/data/weather.json   — weather effect rules

// === RUNTIME: data repository ===

// The app loads compiled data at startup and provides a typed query API.

class DataRepository {
  private moves: Map<string, CompiledMove>
  private abilities: Map<string, CompiledAbility>
  private equipment: Map<string, CompiledEquipment>
  private typeChart: TypeEffectivenessChart
  private natures: Map<string, NatureModifiers>
  private conditions: Map<string, ConditionDefinition>
  private weather: Map<string, WeatherEffectDefinition>

  async initialize() {
    // Load all compiled data indexes
    this.moves = await loadIndex<CompiledMove>('data/moves.json')
    this.abilities = await loadIndex<CompiledAbility>('data/abilities.json')
    // ...
  }

  // Typed query methods
  getMove(id: string): CompiledMove | undefined
  getMovesByType(type: PokemonType): CompiledMove[]
  getMovesByFrequency(freq: MoveFrequency): CompiledMove[]
  getEquipmentBySlot(slot: EquipmentSlot): CompiledEquipment[]
  getTypeEffectiveness(attackType: PokemonType, defenseTypes: PokemonType[]): number
  getNatureModifiers(nature: string): NatureModifiers
  getConditionDefinition(condition: string): ConditionDefinition
}

// === USAGE IN APP ===

// Before (hardcoded constant):
// app/constants/equipment.ts
export const EQUIPMENT_CATALOG: Equipment[] = [
  { id: 'lucky-egg', name: 'Lucky Egg', slot: 'held', effect: { type: 'xp-boost', value: 1.5 } },
  { id: 'leftovers', name: 'Leftovers', slot: 'held', effect: { type: 'regen', value: '1/16' } },
  // ... 200 more entries manually maintained
]

// After (vault-compiled):
const repo = useDataRepository()
const heldItems = repo.getEquipmentBySlot('held')
// Data comes from vault notes, compiled at build time, loaded at runtime
```

## Why this is destructive

- **All 18 constants files are deleted.** `equipment.ts`, `typeEffectiveness.ts`, `natures.ts`, `statusConditions.ts`, `weather.ts`, `moves.ts`, `ballTypes.ts`, `sizeCategories.ts`, and the rest — all deleted. Their data was always a second-class copy of vault knowledge.
- **The PTR vault gains structured frontmatter.** Vault notes that currently contain free-form prose must gain structured frontmatter that the build step can parse. This is a significant change to vault authoring conventions.
- **A build step is introduced.** The project gains a `compile-vault` script that reads vault markdown, extracts structured data, validates it against schemas, and produces typed JSON indexes. This must run before the app builds.
- **The app gains a runtime data loading step.** Instead of importing constants at compile time, the app loads JSON indexes at startup. This changes the initialization sequence and may introduce a loading state.
- **All imports of constants files are rewritten.** Every file that does `import { EQUIPMENT_CATALOG } from '~/constants/equipment'` becomes `const catalog = dataRepo.getEquipmentBySlot('held')`. The static import pattern becomes a runtime query pattern.
- **Game data becomes environment-specific.** Different compiled indexes can be loaded for different environments (development with experimental rules, production with stable rules, testing with mock data). Currently, constants are baked into the bundle.
- **The vault becomes a dependency of the build.** The app cannot build without the vault. The vault's structure and frontmatter schema become a contract that the build step enforces.

## Principles improved

- [[single-responsibility-principle]] — the vault is responsible for defining game rules. The app is responsible for implementing game mechanics. Constants files were a confused middle ground — game data pretending to be code.
- [[open-closed-principle]] — adding a new move, equipment item, or ability means adding a vault note, not editing a TypeScript file. The app's code is closed for modification when game data changes.
- [[dependency-inversion-principle]] — the app depends on an abstract `DataRepository` interface, not on concrete constants files. The data source (vault, JSON, database, API) is an implementation detail.
- [[single-source-of-truth]] — the vault is the single source of truth for game data. The constants files were a second source that could (and did) diverge.
- Eliminates [[duplicate-code-smell]] — game data exists in exactly one place (the vault), not in both vault notes and constants files.
- Eliminates manual synchronization — vault changes automatically propagate to the app via the build step. No human must remember to update both.
- Advances the project's ultimate goal — PTR vault, Documentation vault, and App converge. The app literally reads its data from the vault.

## Patterns and techniques

- [[facade-pattern]] — the `DataRepository` presents a clean query API over the raw compiled data
- [[adapter-pattern]] — the build step adapts vault markdown into typed JSON; the repository adapts JSON into queryable data structures
- [[strategy-pattern]] — different data sources (vault, test fixtures, mock data) can be loaded via different compilation strategies
- [[flyweight-pattern]] — compiled data records are shared, immutable flyweights loaded once and referenced everywhere
- Repository pattern (Domain-Driven Design) — the `DataRepository` provides collection-like access to domain objects
- Build-time code generation — structured data compiled from a source of truth at build time

## Trade-offs

- **Vault authoring friction.** Vault notes must follow a strict frontmatter schema. Free-form prose is fine for human reading but useless for compilation. This constrains how vault notes are written and may conflict with the vault's Zettelkasten philosophy of organic, atomic notes.
- **Build step complexity.** The vault compilation script must handle parsing, validation, error reporting, incremental rebuilds, and schema evolution. This is a significant piece of infrastructure to build and maintain.
- **Loss of IDE support for constants.** Currently, TypeScript provides autocompletion and type checking for constants (`EQUIPMENT_CATALOG[0].effect.type`). With a runtime repository, the data is typed at the interface level but individual records are opaque until runtime.
- **Cold start latency.** Loading JSON indexes at startup adds initialization time. The current pattern (compile-time imports) has zero runtime cost. For a large dataset (1000+ moves, 200+ abilities), the loading time is non-trivial.
- **Schema migration complexity.** When the vault frontmatter schema changes (e.g., adding a new field to move definitions), all affected vault notes must be updated. With 1000+ move notes, this is a bulk edit.
- **Vault structure coupling.** The build step depends on the vault's file naming, directory structure, and frontmatter format. Reorganizing the vault becomes a potentially breaking change for the app.
- **Two-vault dependency.** The app needs data from the PTR vault (rules) and potentially the Documentation vault (implementation decisions). The build step must handle both sources.

## Open questions

- Which vault data should be compiled? All of it (moves, abilities, equipment, types, natures, conditions, weather, capabilities, skills, features, edges, trainer classes), or only the most-used subsets?
- Should the build step produce TypeScript constants (type-safe, IDE-friendly, but compiled into the bundle) or JSON indexes (runtime-loaded, hot-reloadable, but less type-safe)?
- How does the build step handle vault notes that are incomplete or have missing frontmatter? Strict validation (fail the build) or lenient (skip incomplete notes with a warning)?
- Should the `DataRepository` be server-only (data loaded once on the server, served via API) or shared (loaded on both client and server)? If shared, the JSON indexes must be in the public assets directory.
- How does this interact with [[game-engine-extraction]]? If the engine is a standalone package, does it embed compiled vault data, or does it receive a `DataRepository` via dependency injection?
- How does this interact with [[data-driven-rule-engine]]? If rules are data-driven, the vault is the ultimate rule source — vault notes define both the data AND the rules that operate on it.
- How does hot-reloading work in development? When a vault note is edited in Obsidian, does the build step re-compile automatically, and does the app pick up the new data without a full restart?
- Should the compiled data include provenance metadata (which vault note, which line, last modified date) for debugging and traceability?

## See also

- [[data-driven-rule-engine]] — compatible: vault-compiled data can be the input to a rule engine
- [[game-engine-extraction]] — compatible: the engine can consume vault-compiled data via dependency injection
- [[single-responsibility-principle]] — game data definition belongs to the vault, not to TypeScript constants
- [[open-closed-principle]] — new game data is vault notes, not code changes
- [[duplicate-code-smell]] — eliminated: game data exists in one place
- [[monolithic-mechanic-integration]] — partially addressed: game data extraction reduces mechanic coupling
