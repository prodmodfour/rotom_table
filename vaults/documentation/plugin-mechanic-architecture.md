# Plugin-Based Mechanic Architecture

A destructive restructuring to decompose every game mechanic into a self-contained plugin that registers its own data model, API surface, rules, UI components, and store extensions — addressing [[monolithic-mechanic-integration|the inability to add, remove, or isolate game mechanics]].

## The idea

The app has ~12 game mechanics (combat, capture, switching, mounting, evolution, weather, equipment, healing, wild spawns, living weapons, flanking, status conditions) woven into shared infrastructure. Each mechanic touches types, constants, services, routes, stores, composables, and components. No mechanic can be understood, tested, or modified in isolation.

Define a mechanic plugin interface. Each mechanic is a self-contained module that declares everything it needs: its data schema, its API endpoints, its rules, its store slice, its components, and its WebSocket events. The app core becomes a thin shell — a plugin host that loads and composes mechanics.

```typescript
// The plugin contract — every mechanic implements this
interface MechanicPlugin {
  id: string
  name: string

  // Data model extension — what fields this mechanic adds to encounters/combatants
  schema: {
    encounterFields?: Record<string, FieldDefinition>
    combatantFields?: Record<string, FieldDefinition>
    globalFields?: Record<string, FieldDefinition>
  }

  // Server-side rules — pure functions the game server calls
  rules: {
    validators?: Record<string, ValidatorFn>
    effects?: Record<string, EffectFn>
    triggers?: Record<string, TriggerFn>
  }

  // API surface — routes this mechanic exposes
  routes: RouteDefinition[]

  // WebSocket events this mechanic emits/handles
  events: EventDefinition[]

  // Client-side store extension — reactive state for this mechanic
  storeSlice?: StoreSliceDefinition

  // Vue components this mechanic contributes to the UI
  components?: {
    combatantCardExtensions?: Component[]  // injected into combatant cards
    actionPanelSections?: Component[]      // injected into the action panel
    encounterToolbar?: Component[]         // injected into the toolbar
    settingsPanel?: Component[]            // injected into settings
  }
}

// Example: Weather mechanic as a plugin
const weatherPlugin: MechanicPlugin = {
  id: 'weather',
  name: 'Weather System',

  schema: {
    encounterFields: {
      weather: { type: 'enum', values: ['clear', 'rain', 'sandstorm', 'hail', 'sun', 'snow'], default: 'clear' },
      weatherDuration: { type: 'number', default: 0 },
    },
  },

  rules: {
    effects: {
      'weather:apply-damage-modifier': (ctx) => {
        if (ctx.encounter.weather === 'rain' && ctx.move.type === 'Water') return { damageMultiplier: 1.5 }
        if (ctx.encounter.weather === 'rain' && ctx.move.type === 'Fire') return { damageMultiplier: 0.5 }
        // ... other weather interactions
      },
      'weather:end-of-turn': (ctx) => {
        if (ctx.encounter.weather === 'sandstorm' && !ctx.combatant.types.includes('Rock')) {
          return { damage: calculateWeatherDamage(ctx.combatant) }
        }
      },
    },
    triggers: {
      'turn:end': ['weather:end-of-turn'],
      'damage:calculate': ['weather:apply-damage-modifier'],
    },
  },

  routes: [
    { method: 'PUT', path: '/encounters/:id/weather', handler: setWeather },
  ],

  events: [
    { name: 'weather:changed', schema: { weather: 'string', duration: 'number' } },
  ],

  components: {
    encounterToolbar: [WeatherIndicator],
    settingsPanel: [WeatherSettings],
  },
}

// The app core loads plugins and composes them
const app = createGameApp({
  plugins: [
    combatPlugin,          // core damage, turns, declarations
    capturePlugin,         // poke ball throwing, capture rate
    switchingPlugin,       // pokemon switching, recall, release
    mountingPlugin,        // mount/dismount, shared movement
    evolutionPlugin,       // evolution eligibility, stat recalc
    weatherPlugin,         // weather effects
    equipmentPlugin,       // equipment bonuses, held items
    healingPlugin,         // potions, pokemon center healing
    wildSpawnPlugin,       // wild pokemon generation
    livingWeaponPlugin,    // living weapon transformation
    flankingPlugin,        // flanking geometry, advantage
    statusConditionPlugin, // burn, paralysis, freeze, etc.
  ],
})
```

## Why this is destructive

- **The encounter model is shattered.** The `Encounter` table loses its 15+ hardcoded JSON columns. Each mechanic declares its own fields dynamically. The schema becomes `Encounter` (core fields only: id, name, round, turn) + plugin-contributed fields stored in a plugin data table.
- **All 17 constants files are dissolved.** `statusConditions.ts`, `pokeBalls.ts`, `combatManeuvers.ts`, `equipment.ts`, `healingItems.ts`, `livingWeapon.ts`, `weatherRules.ts` — each becomes data owned by its respective plugin.
- **All 23 services are decomposed.** `combatant.service.ts` (797 lines) is split into the combat plugin, status plugin, equipment plugin, and mounting plugin. `out-of-turn.service.ts` (752 lines) becomes the priority plugin and intercept plugin. Each service's code moves to the plugin that owns its domain.
- **The encounter store's proxy surface collapses.** The store no longer needs 30+ proxy methods for 12 mechanics. It exposes a plugin-extension API, and each plugin contributes its own reactive slice.
- **The 53-member WebSocket event union is dissolved.** Each plugin declares its own events. The union is composed dynamically from loaded plugins, not maintained as a monolithic type.
- **Component extension points replace hardcoded UI.** The combatant card doesn't hardcode weather badges, equipment slots, mount indicators, and status icons. It declares extension slots that plugins fill.
- **The damage pipeline becomes a plugin composition.** Weather modifiers, equipment bonuses, STAB, type effectiveness, critical hits, and status effects are each a plugin's contribution to a shared pipeline, not a hardcoded chain.

## Principles improved

- [[open-closed-principle]] — adding a new mechanic means writing a new plugin. Zero existing code changes. The core is closed for modification, open for extension via the plugin contract.
- [[single-responsibility-principle]] — each plugin owns exactly one mechanic end-to-end. No more scattered fragments across 6+ directories.
- [[interface-segregation-principle]] — the plugin contract is the only interface a mechanic must satisfy. Plugins don't depend on each other's internals.
- [[dependency-inversion-principle]] — the core depends on the plugin interface (an abstraction). Plugins depend on the core's hook points (abstractions). Neither depends on the other's implementation.
- Eliminates [[monolithic-mechanic-integration]] — mechanics are fully modular.
- Eliminates [[horizontal-layer-coupling]] — each plugin contains all its layers internally.
- Eliminates [[hardcoded-game-rule-proliferation]] — rules are encapsulated within the plugin that owns them.
- Reduces [[encounter-store-god-object-risk]] — the store becomes a plugin host, not a god object.

## Patterns and techniques

- Microkernel / plugin architecture — the foundational pattern: a small core with pluggable extensions
- [[strategy-pattern]] — each plugin's rules are strategies registered with the core's processing pipeline
- [[observer-pattern]] — plugins subscribe to game events (turn end, damage dealt, combatant fainted) via a hook system
- [[chain-of-responsibility-pattern]] — the damage pipeline, capture calculation, and other composite calculations are chains of plugin-contributed handlers
- [[composite-pattern]] — the UI is a composition of plugin-contributed components
- [[decorator-pattern]] — plugins decorate core behavior (e.g., weather decorates damage calculation)
- Extension points — predefined slots where plugins can inject behavior and UI
- Inversion of Control container — the core manages plugin lifecycle, dependency resolution, and hook dispatch

## Trade-offs

- **Plugin contract design is load-bearing.** The `MechanicPlugin` interface must be powerful enough to express every mechanic's needs but stable enough to not break existing plugins when extended. Designing this interface wrong poisons everything.
- **Cross-mechanic interactions are the hard part.** Weather affects damage. Equipment affects capture rate. Status conditions affect movement. Mounting affects switching. These cross-cutting interactions must be expressed through the plugin hook system, which may be harder to reason about than direct function calls.
- **Dynamic composition kills static analysis.** If the encounter schema is composed from plugin declarations, TypeScript cannot statically type the encounter object. The schema becomes runtime-defined, losing compile-time guarantees.
- **Plugin isolation is partially illusory.** In practice, the combat plugin, status plugin, and damage plugin are so tightly coupled that they're effectively one mega-plugin. True isolation only works for genuinely independent mechanics (weather, equipment, wild spawns).
- **Testing complexity shifts.** Individual plugins are testable in isolation (a strength), but integration testing — "does weather + equipment + status + damage work correctly together?" — requires loading the entire plugin graph.
- **Debugging through indirection.** When damage is calculated wrong, the developer must trace through the plugin hook chain to find which plugin contributed the wrong modifier. Direct function calls are easier to debug.
- **Over-engineering for 12 mechanics.** A plugin system shines when there are 50+ plugins or third-party extensions. For 12 first-party mechanics maintained by one developer, the abstraction overhead may exceed the organizational benefit.

## Open questions

- What is the minimum viable plugin contract? Should it start with just `rules` and `routes`, and grow to include UI and store extensions later?
- How do plugins declare dependencies on each other? The combat plugin needs status conditions. The mounting plugin needs movement. Should this be explicit (`dependencies: ['status', 'movement']`) or implicit (hook-based)?
- How does the dynamic schema interact with Prisma? Does each plugin get its own Prisma model, or is there a generic plugin data store?
- Should plugins be runtime-loadable (enabling/disabling mechanics via config), or compile-time composed (tree-shakeable but static)?
- How does this interact with [[game-engine-extraction]]? Is the engine a plugin host, or does each plugin contain its own engine logic?
- How does this interact with [[data-driven-rule-engine]]? A plugin's rules could be data-driven internally, making each plugin a mini rule engine.
- How does this interact with [[domain-module-architecture]]? Domain modules are structurally similar to plugins but without the dynamic registration interface. Is one a stepping stone to the other?

## See also

- [[monolithic-mechanic-integration]] — the problem this addresses
- [[hardcoded-game-rule-proliferation]] — eliminated by encapsulating rules within plugins
- [[horizontal-layer-coupling]] — eliminated by vertical plugin boundaries
- [[encounter-store-god-object-risk]] — the store becomes a plugin host with delegated surface
- [[data-driven-rule-engine]] — compatible: each plugin's rules can be data-driven
- [[game-engine-extraction]] — compatible: the engine becomes the shared rule execution runtime
- [[domain-module-architecture]] — a less destructive variant: modules without dynamic registration
- [[status-condition-registry]] — superseded: status conditions are the status plugin's internal registry
- [[trigger-validation-strategy-registry]] — superseded: the plugin hook system replaces ad-hoc strategy registries
