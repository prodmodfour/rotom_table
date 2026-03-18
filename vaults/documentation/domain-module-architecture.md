# Domain Module Architecture

A destructive restructuring to replace the app's [[horizontal-layer-coupling|horizontal layer directories]] with self-contained vertical domain modules.

## The idea

The app organizes code by technical layer — `components/`, `composables/`, `stores/`, `utils/`, `types/`, `constants/`, `server/api/`, `server/services/`. A developer working on Pokemon switching must touch files in 6+ directories. Finding all related code requires knowing naming conventions and grepping.

Reorganize into vertical domain modules where each module owns everything related to its domain:

```
app/
  modules/
    combat/
      components/     CombatantCard.vue, DamageModal.vue, GMActionModal.vue
      composables/    useCombat.ts, useDamageCalculation.ts, useMoveCalculation.ts
      server/
        api/          damage.post.ts, move.post.ts, action.post.ts
        services/     combatant.service.ts, status-automation.service.ts
      types/          combat.types.ts
      utils/          damage.ts, type-effectiveness.ts
      constants/      status-conditions.ts, combat-maneuvers.ts
      store/          combat.store.ts
      index.ts        public API for other modules

    switching/
      components/     SwitchModal.vue, SwitchButton.vue
      composables/    useSwitching.ts, useSwitchModalState.ts
      server/
        api/          switch.post.ts, recall.post.ts, release.post.ts
        services/     switching.service.ts
      types/          switching.types.ts
      index.ts

    capture/        ...
    grid/           ...
    character/      ...
    encounter/      ...
    mounting/       ...
    player-view/    ...

  shared/             Cross-cutting concerns only
    components/       ConfirmModal.vue, HealthBar.vue
    types/            base.types.ts
    utils/            formatting.ts
```

Each module's `index.ts` defines its public API. Cross-module imports go through the public API only — no reaching into another module's internals.

## Why this is destructive

- **Every file in the app moves.** 158 components, 64 composables, 38 utils, 16 stores, 16 type files, 18 constant files, 158 routes, 23 services — all relocated.
- **Import paths across the entire codebase change.** Nuxt's auto-import for components and composables must be reconfigured or abandoned.
- **Module boundaries must be defined.** Currently, code freely imports across domains. After restructuring, cross-domain imports go through explicit public APIs, which will reveal hidden coupling.
- **Nuxt's file-based conventions are disrupted.** Nuxt auto-imports from `components/` and `composables/`. A custom module structure requires explicit configuration or a Nuxt Layers approach.

## Principles improved

- [[single-responsibility-principle]] — each module has one domain reason to change
- [[interface-segregation-principle]] — modules expose only what other modules need via `index.ts`
- [[dependency-inversion-principle]] — modules depend on each other's public APIs, not internal implementations
- Eliminates the [[shotgun-surgery-smell]] — a domain change is localized to one module directory
- Eliminates the [[divergent-change-smell]] — the same module doesn't change for unrelated domain reasons

## Patterns and techniques

- [[facade-pattern]] — each module's `index.ts` is a facade over its internals
- Bounded Context (DDD) — each module represents a bounded context within the encounter domain
- Nuxt Layers — Nuxt 3's layer system can enforce module boundaries at the framework level

## Trade-offs

- **Boundary ambiguity.** Some code doesn't have a clear home. Does `useEncounterActions` belong in `encounter/` or `combat/`? Does `useMoveCalculation` belong in `combat/` or a `moves/` module? Boundary decisions are hard and contentious.
- **Cross-cutting concerns multiply.** The [[encounter-store-god-object-risk|encounter store]] currently coordinates combat, switching, grid, weather, and more. After modularization, this coordination must live somewhere — either a thin orchestration module or event-based coordination.
- **Nuxt friction.** Nuxt's auto-import and file-based routing assume conventional directory structures. Custom module layouts require explicit registration, which fights the framework.
- **Discovery difficulty.** New developers must learn the module structure before finding anything. The current flat structure, while sprawling, is at least greppable.
- **Shared types explosion.** If `combat/` needs `CombatantWithGrid` and `grid/` needs `GridCombatant`, the types either live in `shared/` (defeating the purpose) or create circular dependencies.

## Open questions

- How many modules? Too few (3–5) doesn't solve the problem. Too many (15+) creates a maze.
- Should Nuxt Layers be used for module isolation, or is this purely a directory convention?
- How to handle the encounter store, which currently coordinates everything? Does it become a thin orchestrator importing from module stores?
- What module owns the WebSocket handler, which touches all domains?
- Is this compatible with Nuxt's auto-import system, or does auto-import need to be abandoned?
- How does this interact with [[game-engine-extraction]]? If game logic moves to the engine, modules become thinner — but the question of UI/persistence module boundaries remains.

## See also

- [[horizontal-layer-coupling]] — the problem this addresses
- [[composable-domain-grouping]] — the current informal domain classification, which becomes formal module boundaries
- [[encounter-store-god-object-risk]] — the cross-cutting coordinator that resists modularization
- [[service-inventory]] — services would be distributed across modules
- [[api-endpoint-layout]] — routes would be reorganized by module
- [[explicit-vue-architecture]] — compatible: without file-based routing, domain modules can organize freely
