# Game Engine Extraction

A destructive restructuring to extract all game rule logic from the app into a standalone, framework-agnostic game engine package — addressing the absence of a game logic boundary.

## The idea

The app's game rules are currently scattered across three layers with no isolation boundary. Utils encode formulas, services embed rules alongside persistence, composables duplicate server-side logic for client-side preview. There is no single package or module that answers "here are the game rules."

Extract a standalone `@rotom/engine` package that owns ALL game rule logic — every formula, every validation, every state transition. The engine has zero dependencies on Vue, Nuxt, Prisma, or any framework. It operates on pure data structures.

```
@rotom/engine/
  damage/        — damage formulas, type effectiveness, STAB, criticals
  capture/       — capture rate calculation, ball modifiers
  combat/        — initiative, turn order, action economy, heavily injured
  movement/      — speed, pathfinding, flanking, terrain costs
  evolution/     — evolution eligibility, stat recalculation
  mounting/      — mount/dismount rules, shared movement
  weather/       — weather effects, ability interactions
  status/        — status conditions, stage modifiers, duration
  equipment/     — equipment bonuses, held items
  types.ts       — all domain types (Combatant, Pokemon, Move, etc.)
```

The app becomes a thin UI and persistence layer that calls engine functions:

```typescript
// Before (service with embedded logic):
function dealDamage(combatant, damage) {
  const tempHpAbsorbed = Math.min(combatant.tempHp, damage)
  combatant.tempHp -= tempHpAbsorbed
  const remaining = damage - tempHpAbsorbed
  combatant.hp = Math.max(0, combatant.hp - remaining)
}

// After (service delegates to engine):
import { applyDamage } from '@rotom/engine/damage'

function dealDamage(combatant, damage) {
  const result = applyDamage(combatant, damage)
  await persist(result)
}
```

## Why this is destructive

- All 38 utils are dissolved — their logic moves to the engine
- All 23 services in the service inventory are gutted — they become thin orchestrators calling engine functions and persisting results
- Composables that duplicate service logic are simplified — they call the same engine functions the server uses
- The type system is rewritten — the engine defines canonical domain types, and the app's types become aliases or persistence-specific extensions
- The project structure changes from a single Nuxt app to a monorepo with `packages/engine/` and `apps/rotom-table/`

## Principles improved

- [[single-responsibility-principle]] — the engine's only job is game rules; the app's only job is UI and persistence
- [[dependency-inversion-principle]] — the app depends on the engine's abstractions, not on scattered utils
- [[open-closed-principle]] — new game mechanics are added to the engine without touching the app
- Eliminates the [[duplicate-code-smell]] — client/server rule duplication eliminated (both call the same engine)
- Eliminates the [[feature-envy-smell]] — services no longer reach into utils for formulas; they call the engine's domain API
- Testability — the engine is 100% pure functions, testable without any framework, database, or browser

## Patterns and techniques

- [[facade-pattern]] — each engine module presents a clean API over complex rule interactions
- [[strategy-pattern]] — game rule variants (e.g., weather effects by type) become strategies within the engine
- [[chain-of-responsibility-pattern]] — the [[damage-pipeline-as-chain-of-responsibility|damage pipeline]] is formalized as a chain within the engine
- Hexagonal architecture — the engine becomes the domain core with ports that the app implements as adapters

## Trade-offs

- **Monorepo overhead.** The project gains build complexity — workspace management, package linking, shared TypeScript configs. The current single-app simplicity is lost.
- **Type duplication risk.** The engine defines pure domain types; Prisma generates persistence types. Mapping between them adds boilerplate at the boundary.
- **Over-extraction risk.** Some utils are trivially small (2–3 lines). Extracting them into a separate package may be over-engineering for functions called in one place.
- **Composable translation layer.** Currently, composables freely mix game logic with Vue reactivity. After extraction, composables become thin wrappers calling engine functions and wrapping results in `ref()`/`computed()`.
- **Incremental feature work friction.** Currently, adding a game mechanic means editing a util, a service, and a composable in one commit. With the engine, it spans two packages.

## Open questions

- Does the engine ship as a real npm package, or is it just a workspace package within the monorepo?
- Should the engine be stateless (pure functions operating on data) or stateful (maintaining an encounter state machine internally)?
- How does this interact with [[event-sourced-encounter-state]]? If the engine is event-sourced, it manages state transitions; if stateless, the app handles state.
- What's the migration strategy — extract one domain at a time (damage first, then capture, etc.) or extract everything at once?
- Should the engine include its own test suite with PTR rulebook assertions, making it the single source of truth for rule correctness?

## See also

- [[damage-pipeline-as-chain-of-responsibility]] — a pipeline formalized within the engine
