# Effect Handler Format

How move and trait effects are implemented as TypeScript functions in `@rotom/engine`. Handlers are functions — they use [[effect-utility-catalog|utility functions]] and standard TypeScript control flow to express game logic. Part of the [[game-state-interface]].

## Why functions

The composition framework expressed effects as data trees evaluated by a generic engine. Five adversarial reviews (findings 1–66) revealed the framework grew monotonically — each review added atoms, compositions, predicates, and engine capabilities. The "data" definitions had become programs with control flow, side effects, and event handling expressed through a custom DSL.

Functions use TypeScript itself as the composition language. The language already provides sequencing (statements), branching (`if`/ternary), iteration (`for`/`map`), and composition (function calls). Shared utilities provide the game-specific vocabulary. Per [[rule-of-three]], abstractions emerge from actual repetition in implemented handlers, not from anticipating 579 definitions.

## Move handler

```typescript
import { MoveHandler, MoveDefinition } from '@rotom/engine'
import { rollAccuracy, dealDamage, applyStatus, merge, noEffect } from '@rotom/engine/utilities'

export const thunderbolt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 8, type: 'electric', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { condition: 'paralyzed' })
    : noEffect()

  return merge(acc.result, dmg, status)
}

export const THUNDERBOLT: MoveDefinition = {
  id: 'thunderbolt',
  name: 'Thunderbolt',
  type: 'electric',
  damageClass: 'special',
  damageBase: 8,
  accuracy: 2,
  range: { type: 'ranged', min: 1, max: 6 },
  energyCost: 4,
  handler: thunderbolt,
}
```

`MoveDefinition` carries metadata (type, range, energy cost) plus a `handler` field referencing the function. The handler implements the combat effect; the metadata is consumed by the UI, action presentation system, and targeting system.

## Trait handler

```typescript
import { TraitDefinition, TriggerRegistration } from '@rotom/engine'
import { dealTickDamage, noEffect } from '@rotom/engine/utilities'

const roughSkinTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (!ctx.event.isContact) return noEffect()
    return dealTickDamage(ctx, { ticks: 1, target: ctx.event.sourceEntityId })
  },
}

export const ROUGH_SKIN: TraitDefinition = {
  id: 'rough-skin',
  name: 'Rough Skin',
  category: 'innate',
  triggers: [roughSkinTrigger],
}
```

Trait definitions carry [[effect-trigger-event-bus|TriggerRegistration]] arrays. Conditions are inline code in the handler body — `if (!ctx.event.isContact)` — not declarative predicate data structures.

## Passive effect specification

Passive effects are static modifiers always active while the trait is present. They don't fire on events and don't produce deltas through the handler system.

```typescript
PassiveEffectSpec = {
  struggleAttackTypeOverride?: PokemonType
  moveTypeOverride?: { moveId: string, type: PokemonType }
  statMultiplier?: { stat: StatKey, multiplier: number }
  immunityGrant?: { type: PokemonType }
  weatherImmunity?: boolean
  contactDamageImmunity?: boolean
}
```

**Evaluation.** The engine reads `passiveEffects` at specific computation points: the damage pipeline reads type overrides and stat multipliers; the type effectiveness step reads immunity grants; the weather tick step reads weather immunity.

**Conflict resolution.** Multiplicative for multipliers, last-writer-wins for overrides.

**Typing.** Keys are typed — not `Record<string, unknown>`. Each key has a defined type and a defined read point.

## Worked examples

### Hex — conditional DB modifier

```typescript
export const hex: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const db = targetHasAnyStatus(ctx) ? 13 : 7
  const dmg = dealDamage(ctx, { db, type: 'ghost', class: 'special' })

  return merge(acc.result, dmg)
}
```

TypeScript ternary replaces the Conditional composition.

### Beat Up — multi-entity delegation

```typescript
export const beatUp: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const userAtk = dealDamage(ctx, { db: 2, type: 'dark', class: 'physical' })
  const allyAtks = getAdjacentAllies(ctx, { max: 2 }).map(ally =>
    withUser(ctx, ally, (c) =>
      dealDamage(c, { db: 2, type: 'dark', class: 'physical' })
    )
  )

  return merge(acc.result, userAtk, ...allyAtks)
}
```

`withUser` switches the context's user — one utility function replaces the CrossEntityFilter context switching contract (finding 58).

### Gyro Ball — stat-derived bonus damage

```typescript
export const gyroBall: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const userSpd = effectiveStat(ctx.user, 'spd')
  const targetSpd = effectiveStat(ctx.target, 'spd')
  const bonus = targetSpd > userSpd ? targetSpd - userSpd : 0

  return merge(acc.result,
    dealDamage(ctx, { db: 6, type: 'steel', class: 'physical', bonusDamage: bonus })
  )
}
```

Inline arithmetic replaces the `bonusDamage: { source, stat, formula }` spec (finding 56). The handler computes the bonus; the utility receives a flat number.

### Safeguard — blessing with trigger handler

```typescript
export const safeguard: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'safeguard', {
    activations: 3,
    onStatusApplied: (triggerCtx) =>
      choicePoint(triggerCtx, 'activate-safeguard', {
        yes: () => merge(
          intercept(triggerCtx),
          consumeBlessing(triggerCtx, 'safeguard')
        ),
        no: () => noEffect(),
      }),
  })
}
```

The blessing's trigger handler is a function passed to `addBlessing`, not a data tree embedded in `ModifyFieldState` params (finding 59).

### Volt Absorb — type-absorb trait

```typescript
const voltAbsorbTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'electric') return noEffect()
    return merge(
      intercept(),
      manageResource(ctx, { resource: 'energy', amount: 5 })
    )
  },
}
```

### Earthquake — AoE

```typescript
export const earthquake: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'all', aoe: 'burst-3' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result,
      dealDamage(tCtx, { db: 10, type: 'ground', class: 'physical' })
    )
  })
  return merge(...results)
}
```

`map` over targets replaces CrossEntityFilter. Each target gets independent accuracy and damage.

### Bullet Seed — multi-hit

```typescript
export const bulletSeed: MoveHandler = (ctx) => {
  const hitCount = ctx.resolution.multiHitCount  // 2–5, pre-determined
  const results = Array.from({ length: hitCount }, () => {
    const acc = rollAccuracy(ctx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result,
      dealDamage(ctx, { db: 3, type: 'grass', class: 'physical' })
    )
  })
  return merge(...results)
}
```

`Array.from` replaces the Repeat composition.

## SE principles applied

- [[single-responsibility-principle]] — each handler describes one move or trait
- [[rule-of-three]] — shared patterns are extracted into utilities when they recur, not anticipated in advance
- [[separation-of-concerns]] — handler (what the effect does), engine (how it's invoked), and application (how deltas are applied) are three separate concerns

## See also

- [[effect-handler-contract]] — the interface that handlers implement
- [[effect-utility-catalog]] — the utilities used in handlers
- [[effect-trigger-event-bus]] — trait handlers declare trigger registrations
- [[active-effect-model]] — some handlers produce ActiveEffects with embedded trigger handlers
- [[data-driven-rule-engine]] — the vision this format realizes with functions instead of data trees
- [[game-engine-extraction]] — handlers live in `@rotom/engine`, the standalone game logic package
- [[r0a-sample-effect-handlers]] — the 45 validation handlers that prove this format works
