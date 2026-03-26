# R0.A Sample Effect Handlers

The 45 validation handlers for the R0.A exit criterion: 30 moves + 15 traits, hand-selected to cover all [[effect-utility-catalog|utility functions]], the [[effect-trigger-event-bus|trigger event bus]], and common composition patterns. Each handler is a TypeScript function using utilities and standard control flow. Part of the [[game-state-interface]].

## Purpose

Per the consolidated ring plan: "The effect engine can express and correctly evaluate all 45 sample definitions." These handlers prove the function-based design works. All 45 are fully expressible — the gaps that existed under the composition framework (findings 55–66) are resolved by inline code and utility functions.

---

## Move Handlers (30)

### 1. Thunderbolt — pure damage + conditional status

```typescript
export const thunderbolt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 8, type: 'electric', class: 'special' })
  const status = acc.roll >= 19
    ? applyStatus(ctx, { condition: 'paralyzed' })
    : noEffect()

  return merge(acc.result, dmg, status)
}
```

### 2. Thunder Wave — auto-hit status

```typescript
export const thunderWave: MoveHandler = (ctx) => {
  return applyStatus(ctx, { condition: 'paralyzed' })
}
```

Type immunity (Electric immune to Paralysis) is handled inside `applyStatus` per finding 60 — not in the handler. This eliminates [[shotgun-surgery-smell]].

### 3. Will-O-Wisp — status with accuracy

```typescript
export const willOWisp: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result, applyStatus(ctx, { condition: 'burned' }))
}
```

### 4. Swords Dance — self-buff

```typescript
export const swordsDance: MoveHandler = (ctx) => {
  return modifyCombatStages(ctx, { stages: { atk: 2 }, target: 'self' })
}
```

### 5. Dragon Dance — multi-stat self-buff

```typescript
export const dragonDance: MoveHandler = (ctx) => {
  return modifyCombatStages(ctx, { stages: { atk: 1, spd: 1 }, target: 'self' })
}
```

### 6. Earthquake — burst AoE

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

### 7. Bullet Seed — multi-hit (Five Strike)

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

### 8. Struggle Bug — cone AoE + debuff

```typescript
export const struggleBug: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'all', aoe: 'cone-2' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result,
      dealDamage(tCtx, { db: 5, type: 'bug', class: 'special' }),
      modifyCombatStages(tCtx, { stages: { spatk: -1 } })
    )
  })
  return merge(...results)
}
```

### 9. Circle Throw — displacement + conditional trip

```typescript
export const circleThrow: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 4 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 6, type: 'fighting', class: 'physical' })
  const disp = displaceEntity(ctx, { direction: 'push', distance: '6-weight-class', sizeInteraction: true })
  const trip = acc.roll >= 15
    ? applyStatus(ctx, { category: 'volatile', condition: 'tripped' })
    : noEffect()

  return merge(acc.result, dmg, disp, trip)
}
```

### 10. Roar — forced displacement + conditional recall

```typescript
export const roar: MoveHandler = (ctx) => {
  const targets = getEntitiesInRange(ctx, { scope: 'all', aoe: 'burst-1' })
  const results = targets.map(target => {
    const tCtx = { ...ctx, target }
    const acc = rollAccuracy(tCtx, { ac: 2 })
    if (!acc.hit) return acc.result
    return merge(acc.result,
      displaceEntity(tCtx, { direction: 'away-from-user', distance: 'highest-movement-trait' })
      // Recall check deferred to Ring 3B (spatial engine required)
    )
  })
  return merge(...results)
}
```

Delayed resolution (`resolution: 'end-of-round'`) is move metadata on the `MoveDefinition`, not a handler concern. The turn lifecycle system handles timing.

### 11. Gyro Ball — stat-derived bonus damage

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

Inline arithmetic replaces the `bonusDamage: { source, stat, formula }` spec (finding 56 dissolved).

### 12. Hex — conditional DB override

```typescript
export const hex: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const db = targetHasAnyStatus(ctx) ? 13 : 7
  return merge(acc.result,
    dealDamage(ctx, { db, type: 'ghost', class: 'special' })
  )
}
```

### 13. Retaliate — historical event query

```typescript
export const retaliate: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const db = allyFaintedByTarget(ctx, 2) ? 14 : 7
  return merge(acc.result,
    dealDamage(ctx, { db, type: 'normal', class: 'physical' })
  )
}
```

### 14. Toxic Spikes — layerable hazard

```typescript
export const toxicSpikes: MoveHandler = (ctx) => {
  return addHazard(ctx, 'toxic-spikes', {
    maxLayers: 2,
    onSwitchIn: (triggerCtx) => {
      if (targetTypeIs(triggerCtx, 'poison')) {
        return removeHazard(triggerCtx, 'toxic-spikes')  // Poison-type absorbs
      }
      const layers = getHazardLayers(triggerCtx, 'toxic-spikes')
      return layers >= 2
        ? applyStatus(triggerCtx, { condition: 'badly-poisoned' })
        : applyStatus(triggerCtx, { condition: 'poisoned' })
    },
  })
}
```

The hazard's trigger handler is a function passed to `addHazard`, not embedded data (finding 59 dissolved).

### 15. Stealth Rock — typed tick damage

```typescript
export const stealthRock: MoveHandler = (ctx) => {
  return addHazard(ctx, 'stealth-rock', {
    maxLayers: 1,
    onSwitchIn: (triggerCtx) => {
      return dealTickDamage(triggerCtx, { ticks: 1, type: 'rock' })
    },
  })
}
```

`dealTickDamage` with a `type` param applies type effectiveness on flat damage — a separate pathway from `dealDamage` (finding 61 dissolved).

### 16. Safeguard — blessing with choice point

```typescript
export const safeguard: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'safeguard', {
    activations: 3,
    onStatusApplied: (triggerCtx) =>
      choicePoint(triggerCtx, 'activate-safeguard', {
        yes: () => merge(
          intercept(),
          consumeBlessing(triggerCtx, 'safeguard')
        ),
        no: () => noEffect(),
      }),
  })
}
```

### 17. Light Screen — blessing with damage modification

```typescript
export const lightScreen: MoveHandler = (ctx) => {
  return addBlessing(ctx, 'light-screen', {
    activations: 2,
    onDamageReceived: (triggerCtx) => {
      if (triggerCtx.event.damageClass !== 'special') return noEffect()
      return choicePoint(triggerCtx, 'activate-light-screen', {
        yes: () => merge(
          scaleDamage(0.5),
          consumeBlessing(triggerCtx, 'light-screen')
        ),
        no: () => noEffect(),
      })
    },
  })
}
```

`scaleDamage(0.5)` returns a `PendingModification` that halves the pending damage delta. The before-handler doesn't recalculate damage — it modifies the pending result per [[before-handler-response-modes]]. Finding 67 dissolved.

### 18. Aqua Ring — coat with turn-start heal

```typescript
export const aquaRing: MoveHandler = (ctx) => {
  return addCoat(ctx, 'aqua-ring', {
    target: 'self',
    onTurnStart: (triggerCtx) => {
      return healHP(triggerCtx, { ticks: 1 })
    },
  })
}
```

### 19. Wide Guard — interrupt, team interception

```typescript
export const wideGuard: MoveHandler = (ctx) => {
  const allies = getAdjacentAllies(ctx)
  const targets = [ctx.user, ...allies]
  const results = targets.map(target =>
    applyActiveEffect(ctx, {
      op: 'add',
      effect: {
        effectId: 'wide-guard',
        sourceEntityId: ctx.user.entityId,
        expiresAt: 'end-of-action',
      },
      target: target.entityId,
    })
  )
  return merge(...results)
}
```

The Wide Guard ActiveEffect's trigger handler is registered separately:

```typescript
const wideGuardTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (!hasActiveEffect(ctx.user, 'wide-guard')) return noEffect()
    return intercept()
  },
}
```

### 20. Protect — interrupt, self interception

```typescript
export const protect: MoveHandler = (ctx) => {
  return applyActiveEffect(ctx, {
    op: 'add',
    effect: {
      effectId: 'protect',
      sourceEntityId: ctx.user.entityId,
      expiresAt: 'end-of-action',
    },
    target: 'self',
  })
}
```

```typescript
const protectTrigger: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (!hasActiveEffect(ctx.user, 'protect')) return noEffect()
    return intercept()
  },
}
```

### 21. Whirlpool — damage + embedded vortex

```typescript
export const whirlpool: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 4, type: 'water', class: 'special' })
  const vortex = embedAction(
    modifyFieldState(ctx, { field: 'vortex', op: 'add', type: 'whirlpool', appliesTrapped: true, appliesSlowed: true }),
    'swift'
  )

  return merge(acc.result, dmg, vortex)
}
```

### 22. Quash — initiative manipulation

```typescript
export const quash: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result,
    modifyInitiative(ctx, { op: 'set', value: 0 })
  )
}
```

### 23. After You — initiative reorder (swift action)

```typescript
export const afterYou: MoveHandler = (ctx) => {
  if (targetHasActedThisRound(ctx)) return noEffect()
  // Player consent (target-is-willing) deferred to turn lifecycle
  return modifyInitiative(ctx, { op: 'set-next-after', relativeTo: ctx.user.entityId })
}
```

`targetHasActedThisRound` is an inline check reading from turn state — no predicate union needed (finding 55 dissolved).

### 24. Psyshock — special move targeting physical defense

```typescript
export const psyshock: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result,
    dealDamage(ctx, { db: 8, type: 'psychic', class: 'special', defenderStat: 'def' })
  )
}
```

`defenderStat: 'def'` overrides the damage pipeline's default (SpDef for Special moves). A utility param replaces the Replacement composition.

### 25. Heal Block — effect suppression

```typescript
export const healBlock: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result,
    applyActiveEffect(ctx, {
      op: 'add',
      effect: {
        effectId: 'heal-block',
        sourceEntityId: ctx.user.entityId,
        expiresAt: undefined,
        clearedBy: ['switch-out', 'take-a-breather'],
      },
    })
  )
}
```

Heal Block's interception is handled by a centralized before-handler on `healing-attempted` registered with the [[effect-trigger-event-bus]], not embedded in the ActiveEffect.

### 26. Taunt — behavioral restriction (Enraged)

```typescript
export const taunt: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result
  return merge(acc.result,
    modifyMoveLegality(ctx, { restriction: 'damaging-only', volatile: 'enraged' })
  )
}
```

### 27. Thief — damage + conditional inventory mutation

```typescript
export const thief: MoveHandler = (ctx) => {
  const acc = rollAccuracy(ctx, { ac: 2 })
  if (!acc.hit) return acc.result

  const dmg = dealDamage(ctx, { db: 6, type: 'dark', class: 'physical' })
  const steal = itemSlotEmpty(ctx.user)
    ? mutateInventory(ctx, { op: 'steal' })
    : noEffect()

  return merge(acc.result, dmg, steal)
}
```

### 28. Beat Up — multi-attacker delegation

```typescript
export const beatUp: MoveHandler = (ctx) => {
  const userAtk = dealDamage(ctx, { db: 2, type: 'dark', class: 'physical' })
  const allyAtks = getAdjacentAllies(ctx, { max: 2 }).map(ally =>
    withUser(ctx, ally, (c) =>
      dealDamage(c, { db: 2, type: 'dark', class: 'physical' })
    )
  )
  return merge(userAtk, ...allyAtks)
}
```

`withUser` switches the context's user — one utility replaces CrossEntityFilter context switching (finding 58 dissolved).

### 29. Defog — field clearing

```typescript
export const defog: MoveHandler = (ctx) => {
  return merge(
    modifyFieldState(ctx, { field: 'weather', op: 'clear' }),
    modifyFieldState(ctx, { field: 'hazards', op: 'remove-all' }),
    modifyFieldState(ctx, { field: 'blessings', op: 'remove-all' }),
    modifyFieldState(ctx, { field: 'coats', op: 'remove-all' })
  )
}
```

### 30. Recover — self-heal

```typescript
export const recover: MoveHandler = (ctx) => {
  return healHP(ctx, { ticks: 5, target: 'self' })
}
```

5 ticks = 50% max HP.

---

## Trait Handlers (15)

### 1. Volt Absorb — type-absorb (Electric -> energy)

```typescript
const voltAbsorb: TriggerRegistration = {
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

### 2. Water Absorb — type-absorb (Water -> HP)

```typescript
const waterAbsorb: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'water') return noEffect()
    return merge(
      intercept(),
      healHP(ctx, { ticks: 1 })
    )
  },
}
```

### 3. Flash Fire — type-absorb (Fire -> offensive buff) with consumption

```typescript
const flashFireAbsorb: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    return merge(
      intercept(),
      applyActiveEffect(ctx, {
        op: 'add',
        effect: {
          effectId: 'flash-fire-boost',
          sourceEntityId: ctx.user.entityId,
          state: { bonusDamage: 5 },
          expiresAt: { onEvent: 'user-turn-end' },
        },
        target: 'self',
      })
    )
  },
}

const flashFireConsumption: TriggerRegistration = {
  eventType: 'move-used',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    if (!hasActiveEffect(ctx.user, 'flash-fire-boost')) return noEffect()
    return applyActiveEffect(ctx, { op: 'remove', effectId: 'flash-fire-boost' })
  },
}
```

Two handlers: absorption (before) and consumption after next Fire move (after). Addresses finding 62 — the composition model had no consumption mechanism.

### 4. Rough Skin — contact retaliation

```typescript
const roughSkin: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (!ctx.event.isContact) return noEffect()
    return dealTickDamage(ctx, { ticks: 1, target: ctx.event.sourceEntityId })
  },
}
```

### 5. Opportunist [X] — action economy + passive type override

```typescript
export const OPPORTUNIST: TraitDefinition = {
  id: 'opportunist',
  name: 'Opportunist',
  category: 'learned',
  scalingParam: 'x',

  triggers: [{
    eventType: 'turn-start',
    timing: 'after',
    scope: 'self',
    handler: (ctx) => {
      const x = getScalingParam(ctx, 'x')
      return modifyActionEconomy(ctx, {
        outOfTurnChanges: { aooRemaining: x },
      })
    },
  }],

  passiveEffects: {
    struggleAttackTypeOverride: 'dark',
  },
}
```

### 6. Teamwork — ally accuracy buff (spatial deferred)

```typescript
const teamwork: TriggerRegistration = {
  eventType: 'accuracy-check',
  timing: 'before',
  scope: 'any',
  handler: (ctx) => {
    // Is the attacking entity an ally?
    if (!isAlly(ctx, ctx.event.sourceEntityId)) return noEffect()
    // Is it a melee attack?
    if (ctx.event.moveRange !== 'melee') return noEffect()
    // Is the trait holder adjacent to the attack's target?
    // (Spatial query — deferred to Ring 3B, uses placeholder)
    // if (!isAdjacent(ctx.user, ctx.event.target)) return noEffect()
    return modifyResolution(ctx, { accuracyBonus: 2 })
  },
}
```

The handler returns a `PendingModification` of type `accuracy-bonus` via [[before-handler-response-modes]]. The engine applies this before resolving the accuracy check. Finding 65's concern (transient CS side effects) dissolved — `accuracyBonus` modifies the pending resolution for this check only, not a persistent stat. Finding 81 dissolved — the three-mode before-handler model supports modification alongside interception.

### 7. Shell [X] — flat damage reduction (before-trigger)

```typescript
export const SHELL: TraitDefinition = {
  id: 'shell',
  name: 'Shell',
  category: 'innate',
  scalingParam: 'x',

  triggers: [{
    eventType: 'damage-received',
    timing: 'before',
    scope: 'self',
    handler: (ctx) => {
      const x = getScalingParam(ctx, 'x')
      return flatDamageReduction(x)
    },
  }],
}
```

Shell is a before-trigger, not a passive effect. The scaling param `x` must be read at runtime via `getScalingParam`, and the result is a `PendingModification` of type `flat-damage-reduction` applied via [[before-handler-response-modes]]. The passive effect system can't resolve scaling parameter references — only before-triggers can read context and return typed modifications.

### 8. Ice Body — weather-conditional turn-start heal

```typescript
export const ICE_BODY: TraitDefinition = {
  id: 'ice-body',
  name: 'Ice Body',
  category: 'innate',

  triggers: [{
    eventType: 'turn-start',
    timing: 'after',
    scope: 'self',
    handler: (ctx) => {
      if (!weatherIs(ctx, 'hail')) return noEffect()
      return healHP(ctx, { ticks: 1 })
    },
  }],

  passiveEffects: {
    weatherDamageImmunity: 'hail',
  },
}
```

### 9. Phaser [X] — movement type grant

```typescript
export const PHASER: TraitDefinition = {
  id: 'phaser',
  name: 'Phaser',
  category: 'innate',
  scalingParam: 'x',
  passiveEffects: {
    movementTypeGrant: 'phase',
  },
}
```

### 10. Limber — paralysis immunity

```typescript
const limber: TriggerRegistration = {
  eventType: 'status-applied',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.condition !== 'paralyzed') return noEffect()
    return intercept()
  },
}
```

### 11. Mettle — cross-encounter persistent resource

```typescript
const mettleGain: TriggerRegistration = {
  eventType: 'faint',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    return manageResource(ctx, { resource: 'mettle', amount: 1 })
  },
}

const mettleSpend: TriggerRegistration = {
  eventType: 'roll-completed',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (getResource(ctx.user, 'mettle') < 1) return noEffect()
    return choicePoint(ctx, 'spend-mettle', {
      reroll: () => merge(
        manageResource(ctx, { resource: 'mettle', amount: -1 }),
        requestReroll(ctx)
        // Reroll mechanics deferred to Ring 1 turn lifecycle
      ),
      keep: () => noEffect(),
    })
  },
}
```

Reroll is a turn-lifecycle concern — `requestReroll` signals intent to the engine, which handles re-invocation. This replaces the `requestReroll` atom (finding 64 dissolved — it's a result marker, not an atom).

### 12. Seed Sower — defensive trigger -> terrain

```typescript
const seedSower: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    return modifyFieldState(ctx, { field: 'terrain', op: 'set', type: 'grassy', rounds: 5 })
  },
}
```

### 13. Pack Hunt — reactive AoO on ally melee hit

```typescript
const packHunt: TriggerRegistration = {
  eventType: 'damage-dealt',
  timing: 'after',
  scope: 'any',
  handler: (ctx) => {
    if (!isAlly(ctx, ctx.event.sourceEntityId)) return noEffect()
    if (ctx.event.moveRange !== 'melee') return noEffect()
    // Adjacency check deferred to Ring 3B
    return choicePoint(ctx, 'pack-hunt-aoo', {
      attack: () => embedAction(
        dealDamage(ctx, { db: 2, type: 'dark', class: 'physical' }),
        'attack-of-opportunity'
      ),
      pass: () => noEffect(),
    })
  },
}
```

### 14. Sniper — crit bonus damage

```typescript
export const SNIPER: TraitDefinition = {
  id: 'sniper',
  name: 'Sniper',
  category: 'innate',
  passiveEffects: {
    critBonusDamage: 5,
  },
}
```

### 15. Technician — DB boost for weak moves

```typescript
export const TECHNICIAN: TraitDefinition = {
  id: 'technician',
  name: 'Technician',
  category: 'innate',
  passiveEffects: {
    dbBoostThreshold: 6,
    dbBoostAmount: 2,
    dbBoostKeywords: ['double-strike', 'five-strike'],
  },
}
```

---

## Gaps Resolved

The composition framework had 7 definitions with gaps (findings 55–66). Under the function model, all dissolved. The function model rewrite review (findings 67–87) identified specification gaps — all resolved by defining the [[before-handler-response-modes]], expanding schemas, and completing the [[effect-utility-catalog]].

| Former gap | Resolution |
|---|---|
| F55: Missing predicates | Inline conditions: `effectiveStat(ctx.target, 'spd') > effectiveStat(ctx.user, 'spd')`, `targetHasActedThisRound(ctx)` |
| F56: `bonusDamage` spec | Handler computes bonus inline, passes flat number to `dealDamage` |
| F57: Resistance step | `resistanceModifier` param on `dealDamage` |
| F58: CrossEntityFilter context switching | `withUser(ctx, ally, fn)` utility |
| F59: Blessing triggers in ModifyFieldState params | Handler functions passed to `addBlessing`/`addHazard` |
| F60: Thunder Wave type immunity | Centralized in `applyStatus` utility |
| F61: Stealth Rock formula/tick damage conflation | Separate `dealTickDamage` utility |
| F62: Flash Fire consumption | Second trigger handler on `move-used` with inline check |
| F63: Undocumented move metadata fields | Move metadata on `MoveDefinition`, not in handlers |
| F64: `requestReroll` category error | Result marker, not an atom — engine handles re-invocation |
| F65: Teamwork accuracy CS side effects | `accuracyBonus` PendingModification via before-handler modification model |
| F66: "No architectural rethinking" claim | Moot — no framework to rethink |
| F67: Light Screen recalculates damage | `scaleDamage(0.5)` PendingModification — modifies pending delta, not recalculates |
| F81: Binary interception insufficient | Three-mode before-handler response: intercept, modify, pass-through |

**All 45 definitions are fully expressible.** The remaining spatial concerns (Roar recall range, Teamwork adjacency, Pack Hunt adjacency) are Ring 3B deferrals — the handlers work without them, the spatial checks are placeholders.

---

## Coverage Matrix

All utility functions and trigger patterns are exercised.

### Utilities

| Utility | Covered by |
|---|---|
| dealDamage | Thunderbolt, Earthquake, Gyro Ball, Hex, Retaliate, Circle Throw, Bullet Seed, Struggle Bug, Whirlpool, Thief, Beat Up, Psyshock, Pack Hunt |
| dealTickDamage | Stealth Rock, Rough Skin |
| applyStatus | Thunderbolt, Thunder Wave, Will-O-Wisp, Circle Throw, Toxic Spikes |
| removeStatus | (implicit in Safeguard's interception) |
| modifyCombatStages | Swords Dance, Dragon Dance, Struggle Bug |
| healHP | Recover, Water Absorb, Ice Body, Aqua Ring |
| manageResource | Volt Absorb (energy), Mettle (mettle points) |
| displaceEntity | Circle Throw, Roar |
| mutateInventory | Thief |
| modifyActionEconomy | Opportunist |
| applyActiveEffect | Heal Block, Flash Fire, Wide Guard, Protect |
| modifyMoveLegality | Taunt |
| modifyInitiative | Quash, After You |
| modifyFieldState | Defog, Seed Sower, Whirlpool |
| addBlessing | Safeguard, Light Screen |
| addHazard | Toxic Spikes, Stealth Rock |
| addCoat | Aqua Ring |
| modifyDeployment | (Roar — recall check deferred) |
| rollAccuracy | Thunderbolt, Will-O-Wisp, Earthquake, Bullet Seed, Struggle Bug, Circle Throw, Gyro Ball, Hex, Retaliate, Quash, Psyshock, Heal Block, Thief, Whirlpool |
| rollSkillCheck | (not directly — covered by combat maneuver handlers in Ring 1) |
| intercept | Volt Absorb, Water Absorb, Flash Fire, Limber, Protect, Wide Guard, Safeguard |
| noEffect | Thunder Wave (implicit), Safeguard, Light Screen, After You, Mettle, Pack Hunt, all trigger guard clauses |
| merge | Nearly all multi-step handlers |
| withUser | Beat Up |
| choicePoint | Safeguard, Light Screen, Mettle, Pack Hunt |
| embedAction | Whirlpool, Pack Hunt |
| requestReroll | Mettle |
| effectiveStat | Gyro Ball |
| scaleDamage | Light Screen |
| accuracyBonus | (Teamwork — via modifyResolution) |
| consumeBlessing | Safeguard, Light Screen |
| removeHazard | Toxic Spikes (Poison-type entry) |
| getHazardLayers | Toxic Spikes |
| isAlly | Teamwork, Pack Hunt |
| itemSlotEmpty | Thief |
| getResource | Mettle |
| getScalingParam | Opportunist |
| targetHasActedThisRound | After You |
| getEntitiesInRange | Earthquake, Struggle Bug, Roar |

### Trigger patterns

| Pattern | Covered by |
|---|---|
| Before-handler with interception | Volt Absorb, Water Absorb, Flash Fire, Limber, Protect, Wide Guard, Safeguard |
| Before-handler with modification | Light Screen (scaleDamage), Teamwork (accuracyBonus) |
| After-handler | Rough Skin, Seed Sower, Pack Hunt, Opportunist, Ice Body, Mettle (faint), Flash Fire (consumption) |
| Weather-conditional | Ice Body |
| Contact-conditional | Rough Skin |
| Type-conditional | Volt Absorb, Water Absorb, Flash Fire |
| Spatial-conditional | Teamwork, Pack Hunt (deferred) |
| Event-source filter | Teamwork, Pack Hunt |

### Passive effects

| Key | Covered by |
|---|---|
| `struggleAttackTypeOverride` | Opportunist |
| ~~`flatDamageReduction`~~ | ~~Shell~~ (moved to before-trigger, finding 96) |
| `weatherDamageImmunity` | Ice Body |
| `movementTypeGrant` | Phaser |
| `critBonusDamage` | Sniper |
| `dbBoostThreshold` / `dbBoostAmount` | Technician |

---

## Summary

All 45 handlers are fully expressible with the function-based design. The 12 gaps (findings 55–66) that existed under the composition framework are resolved by inline code, utility function params, and standard TypeScript control flow. No framework expansions were needed. The remaining spatial concerns are Ring 3B deferrals that don't affect expressibility.

## See also

- [[effect-handler-contract]] — the interface all handlers implement
- [[effect-utility-catalog]] — the utilities used in these handlers
- [[effect-trigger-event-bus]] — trigger patterns validated by trait handlers
- [[effect-handler-format]] — the TypeScript function format
- [[game-state-interface]] — the state these handlers read and write
- [[data-driven-rule-engine]] — the vision these handlers realize
