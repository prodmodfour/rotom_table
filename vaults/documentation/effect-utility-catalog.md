# Effect Utility Catalog

The shared utility functions that [[effect-handler-contract|handlers]] call to produce state changes. Each utility encapsulates one game operation — dealing damage, applying status, healing, displacing, etc. Handlers compose these utilities with standard TypeScript control flow. Part of the [[game-state-interface]].

## Design

Each utility is a typed function: `(ctx: EffectContext, params: P) => EffectResult` (or a subset of `EffectResult`). Utilities read from the context, compute deltas, and return structured results. Handlers call utilities, inspect their returns, and merge results with the `merge()` helper.

```typescript
// Handler calls utilities, composes with TypeScript
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

No atom registration, no type discriminant, no dispatch table. Utilities are functions; TypeScript parameter types provide the narrowing that `requires` declarations provided in the composition model.

## Damage utilities

### dealDamage

Runs the [[nine-step-damage-formula]]. Produces `hpDelta` and potentially `injuries` on the target.

```typescript
dealDamage(ctx: EffectContext, params: {
  db: number
  type: PokemonType
  class: 'physical' | 'special'
  dbModifiers?: number[]
  critBehavior?: CritBehavior
  bonusDamage?: number          // computed inline by the handler
  resistanceModifier?: number   // Light Screen: -1
  defenderStat?: 'def' | 'spdef'  // override: Psyshock targets Def with a Special move
  target?: EntityId | 'event-source'  // default: ctx.target
}): EffectResult
```

Modifiers (STAB, weather, type effectiveness, critical) are computed within the pipeline from context + params. The utility receives pre-rolled damage dice via [[resolution-context-inputs]].

**bonusDamage** — a flat bonus added to the damage roll, computed by the handler. Gyro Ball computes `targetSpd - userSpd` inline and passes the result. No formula DSL needed — the handler does the math.

**resistanceModifier** — shifts the damage resistance tier per `damage-resistance-tiers.md`. Default 0. Light Screen passes -1 (one step toward Resisted). The utility applies this as a multiplier in the pipeline.

**defenderStat** — overrides the default defender stat selection. Normally, Physical moves use Def and Special moves use SpDef. Psyshock is a Special move that targets Def, expressed as `defenderStat: 'def'`.

### dealTickDamage

Deals flat HP-fraction damage, optionally modified by type chart. A separate pathway from `dealDamage` — no attack stat, no defense stat, no STAB, no DB, no crit.

```typescript
dealTickDamage(ctx: EffectContext, params: {
  ticks: number                 // 1 tick = 1/10 max HP
  type?: PokemonType            // if present, apply type effectiveness
  target?: EntityId | 'event-source'
}): EffectResult
```

Used by Stealth Rock (typed tick damage), burn/poison tick damage, Vortex damage. Separating this from `dealDamage` eliminates the conflation identified in finding 61.

## Status utilities

### applyStatus

Adds a `StatusInstance` or `VolatileInstance` to the target. Handles type-based immunity checks internally (Electric immune to Paralysis, Poison immune to Poisoned, Fire immune to Burned) — the handler does NOT need to check these. This centralizes immunity logic per finding 60, eliminating [[shotgun-surgery-smell]].

```typescript
applyStatus(ctx: EffectContext, params: {
  category: 'persistent' | 'volatile'
  condition: StatusType
  source?: EffectSource
}): EffectResult
```

Status CS auto-application (Burn: -2 Def, Poison: -2 SpDef per [[status-cs-auto-apply-with-tracking]]) is bundled — applying Burned also produces a combat stage delta.

### removeStatus

Removes a condition. Handles cure CS reversal per [[condition-source-tracking]].

```typescript
removeStatus(ctx: EffectContext, params: {
  category: 'persistent' | 'volatile'
  condition: StatusType
}): EffectResult
```

## Stat utilities

### modifyCombatStages

Adds or subtracts from one or more combat stages. Stages are clamped to -6..+6 by the engine's application rules per [[state-delta-model]].

```typescript
modifyCombatStages(ctx: EffectContext, params: {
  stages: Partial<CombatStages>
  target?: 'self' | EntityId    // default: ctx.target
}): EffectResult
```

### effectiveStat

Computes a derived stat value (base × CS multiplier). Not a handler utility in the `EffectResult` sense — a pure computation helper that handlers call for inline math.

```typescript
effectiveStat(lens: CombatantLens, stat: StatKey): number
```

Used by Gyro Ball (`effectiveStat(ctx.target, 'spd') - effectiveStat(ctx.user, 'spd')`), Electro Ball, Heavy Slam, etc.

## Healing utilities

### healHP

Restores HP. Healing suppression (Heal Block) is handled centrally by the [[effect-trigger-event-bus]] — the engine emits a `healing-attempted` event before this utility's result is applied. The utility itself does not check for Heal Block.

```typescript
healHP(ctx: EffectContext, params: {
  amount?: number
  ticks?: number                // 1 tick = 1/10 max HP
  target?: 'self' | EntityId
}): EffectResult
```

### manageResource

Modifies energy, fatigue, mettle, or temp HP. Covers energy costs (move use), energy recovery (Volt Absorb), fatigue changes, and mettle point changes.

```typescript
manageResource(ctx: EffectContext, params: {
  resource: 'energy' | 'fatigue' | 'mettle' | 'tempHp'
  amount: number
  target?: 'self' | EntityId
}): EffectResult
```

## Position utilities

### displaceEntity

Modifies position. Covers push (Circle Throw), pull, reposition, and forced shift (Roar). Weight class and size interactions computed internally.

```typescript
displaceEntity(ctx: EffectContext, params: {
  direction: 'push' | 'pull' | 'away-from-user' | 'toward-user'
  distance: number | '6-weight-class' | 'highest-movement-trait'
  sizeInteraction?: boolean
  target?: EntityId
}): EffectResult
```

## Entity utilities

### mutateInventory

Steals, drops, or swaps held items. This is an [[entity-write-exception]] — produces an `EntityWriteDelta` alongside the `StateDelta`.

```typescript
mutateInventory(ctx: EffectContext, params: {
  op: 'steal' | 'drop' | 'swap'
}): EffectResult
```

## Action economy utilities

### modifyActionEconomy

Grants or consumes actions within the current turn.

```typescript
modifyActionEconomy(ctx: EffectContext, params: {
  budgetChanges?: Partial<ActionBudget>
  outOfTurnChanges?: Partial<OutOfTurnUsage>
  target?: 'self' | EntityId
}): EffectResult
```

### modifyInitiative

Manipulates turn order within the current round. Covers Quash (set to 0) and After You (target goes next after user).

```typescript
modifyInitiative(ctx: EffectContext, params: {
  op: 'set' | 'set-next-after'
  value?: number                // for 'set'
  relativeTo?: EntityId         // for 'set-next-after'
  target?: EntityId
}): EffectResult
```

## Active effect utilities

### applyActiveEffect

Adds or removes an [[active-effect-model|ActiveEffect]] to/from the target's lens.

```typescript
applyActiveEffect(ctx: EffectContext, params: {
  op: 'add' | 'remove'
  effect?: ActiveEffect         // for 'add'
  effectId?: string             // for 'remove'
  target?: 'self' | EntityId
}): EffectResult
```

### modifyMoveLegality

Applies restrictions on what moves the target can use (Taunt, Disable, Enraged).

```typescript
modifyMoveLegality(ctx: EffectContext, params: {
  restriction: MoveRestriction
  duration: Duration
  target?: EntityId
}): EffectResult
```

## Encounter utilities

### modifyFieldState

Sets or clears weather, terrain. Adds or removes hazards, blessings, coats, vortexes. Each field state type has its own mutation vocabulary per [[encounter-delta-model]].

```typescript
modifyFieldState(ctx: EffectContext, params: {
  field: FieldStateType
  op: 'set' | 'clear' | 'add' | 'remove' | 'consume'
  // ... field-specific params
}): EffectResult
```

### addBlessing

Creates a blessing with an associated trigger handler. The trigger is registered with the [[effect-trigger-event-bus]] when the blessing is created — not embedded as nested data in the field state params. This addresses finding 59.

```typescript
addBlessing(ctx: EffectContext, blessingType: string, params: {
  activations: number
  onStatusApplied?: TraitTriggerHandler   // Safeguard
  onDamageReceived?: TraitTriggerHandler  // Light Screen
}): EffectResult
```

### addHazard

Creates a hazard with an associated switch-in trigger handler. The trigger is registered with the [[effect-trigger-event-bus]] when the hazard is placed.

```typescript
addHazard(ctx: EffectContext, hazardType: string, params: {
  maxLayers: number
  onSwitchIn: TraitTriggerHandler  // Toxic Spikes: apply poison; Stealth Rock: deal tick damage
}): EffectResult
```

### addCoat

Creates a coat attached to a specific entity with a turn-timing trigger handler.

```typescript
addCoat(ctx: EffectContext, coatType: string, params: {
  target: 'self' | EntityId
  onTurnStart?: TraitTriggerHandler  // Aqua Ring: heal 1 tick
  onTurnEnd?: TraitTriggerHandler
}): EffectResult
```

### consumeBlessing

Decrements a blessing's remaining activations. If activations reach 0, the blessing is removed and its trigger handlers are unregistered from the [[effect-trigger-event-bus]].

```typescript
consumeBlessing(ctx: EffectContext, blessingType: string): EffectResult
```

### removeHazard

Removes a hazard by type and side. Used by Poison-type entry absorbing Toxic Spikes.

```typescript
removeHazard(ctx: EffectContext, hazardType: string, params?: { side?: Side }): EffectResult
```

### modifyDeployment

Handles switching. Moves entities between active/reserve/fainted per [[deployment-state-model]].

```typescript
modifyDeployment(ctx: EffectContext, params: {
  op: 'switch-out' | 'switch-in' | 'faint'
  trainerId: string
  entityId: string
}): EffectResult
```

## Resolution utilities

### rollAccuracy

Compares the accuracy roll against the target's evasion. Returns a result with `success: false` on miss, plus the raw roll value for threshold checks.

```typescript
rollAccuracy(ctx: EffectContext, params: {
  ac: number
}): { hit: boolean, roll: number, result: EffectResult }
```

### rollSkillCheck

1d20 + modifier vs DC. Used by combat maneuvers, training checks, social skill checks.

```typescript
rollSkillCheck(ctx: EffectContext, params: {
  skill: SkillType
  dc: number
  modifiers?: number[]
}): { success: boolean, result: EffectResult }
```

## Control flow utilities

### intercept

Sets the interception flag for before-triggers. When the engine sees `{ intercepted: true }`, it skips applying the original event's deltas. Used by Protect, Wide Guard, type-absorb traits.

```typescript
intercept(): EffectResult
```

### noEffect

Returns an empty `EffectResult`. Used in else-branches where no action is needed.

```typescript
noEffect(): EffectResult
```

### merge

Combines multiple `EffectResult` values into one. See [[effect-handler-contract]] for merging rules.

```typescript
merge(...results: EffectResult[]): EffectResult
```

### withUser

Switches the `user` in the context to a different entity. Used by Beat Up (allies attack through user's move), Helping Hand, Instruct, Dancer. This is the one-line solution to finding 58's context switching gap.

```typescript
withUser<T>(ctx: EffectContext, newUser: CombatantLens, fn: (ctx: EffectContext) => T): T
```

### choicePoint

Pauses evaluation to collect a player decision. The engine suspends, presents the choice to the UI, receives the answer, and resumes with the chosen branch.

```typescript
choicePoint(ctx: EffectContext, choiceId: string, options: {
  [key: string]: () => EffectResult
}): EffectResult
```

### embedAction

Wraps an effect result as a declarative action insertion for the turn system. The engine inserts the action into the current turn's resolution sequence at the specified action type slot.

```typescript
embedAction(result: EffectResult, actionType: 'swift' | 'attack-of-opportunity'): EffectResult
```

### requestReroll

Signals to the engine that the handler requests a reroll of the most recent resolution input (accuracy roll, damage roll, etc.). The engine handles re-invocation — this is a result marker, not a direct mutation.

```typescript
requestReroll(ctx: EffectContext): EffectResult
```

## Before-handler modification utilities

Utilities that produce [[before-handler-response-modes|PendingModification]] entries in the `EffectResult`. Only meaningful when called from before-handlers.

### scaleDamage

Returns a `PendingModification` of type `scale-damage`. Light Screen passes `0.5` to halve Special damage.

```typescript
scaleDamage(factor: number): EffectResult
```

### flatDamageReduction

Returns a `PendingModification` of type `flat-damage-reduction`. Floor 1 per [[non-immune-attacks-deal-damage]].

```typescript
flatDamageReduction(amount: number): EffectResult
```

### accuracyBonus

Returns a `PendingModification` of type `accuracy-bonus`. Teamwork passes `+2`.

```typescript
accuracyBonus(amount: number): EffectResult
```

## State query helpers

Pure functions that read from the context. Not utilities in the `EffectResult` sense — helpers for inline conditions.

```typescript
targetHasStatus(ctx: EffectContext, condition: StatusType): boolean
targetHasAnyStatus(ctx: EffectContext): boolean
weatherIs(ctx: EffectContext, type: WeatherType): boolean
terrainIs(ctx: EffectContext, type: TerrainType): boolean
targetTypeIs(ctx: EffectContext, type: PokemonType): boolean
allyFaintedByTarget(ctx: EffectContext, withinRounds: number): boolean
hasActiveEffect(lens: CombatantLens, effectId: string): boolean
getAdjacentAllies(ctx: EffectContext, params?: { max?: number }): CombatantLens[]
getEntitiesInRange(ctx: EffectContext, params: { scope: 'all' | 'enemies' | 'allies', aoe: string }): CombatantLens[]
isAlly(ctx: EffectContext, entityId: string): boolean
itemSlotEmpty(lens: CombatantLens): boolean
getResource(lens: CombatantLens, resourceType: 'energy' | 'mettle' | 'fatigue'): number
getScalingParam(ctx: EffectContext, paramName: string): number
targetHasActedThisRound(ctx: EffectContext): boolean
getHazardLayers(ctx: EffectContext, hazardType: string): number
modifyResolution(ctx: EffectContext, adjustments: { accuracyBonus?: number }): EffectResult
```

These replace the `ConditionPredicate` discriminated union from the composition model. Inline `if` statements with typed helper functions replace declarative data predicates.

`modifyResolution` is a hybrid — it produces a `PendingModification` via [[before-handler-response-modes]] when called from a before-handler (Teamwork), and it reads resolution context state when called as a query.

## Utility count

30 utilities total: 2 damage, 2 status, 2 stat, 2 healing, 1 position, 1 entity, 2 action economy, 2 active effect, 7 encounter (modifyFieldState, addBlessing, addHazard, addCoat, consumeBlessing, removeHazard, modifyDeployment), 2 resolution, 7 control flow (intercept, noEffect, merge, withUser, choicePoint, embedAction, requestReroll), 3 before-handler modification (scaleDamage, flatDamageReduction, accuracyBonus). Plus ~16 state query helpers.

## SE principles applied

- [[strategy-pattern]] — each utility is a strategy for producing specific state changes
- [[single-responsibility-principle]] — each utility has one job (deal damage, apply status, heal, etc.)
- [[interface-segregation-principle]] — utility function params are narrowly typed; callers pass only what the utility needs
- [[chain-of-responsibility-pattern]] — the damage pipeline within `dealDamage` is a chain of processing steps
- [[tell-dont-ask]] — utilities receive assembled context, produce results; they don't reach into state to query and compute
- [[law-of-demeter]] — handlers call utilities directly; utilities access the context they receive

## See also

- [[effect-handler-contract]] — the shared interface all handlers implement; utilities produce `EffectResult` values
- [[effect-handler-format]] — how handlers are structured; worked examples using these utilities
- [[state-delta-model]] — per-combatant deltas that utilities generate
- [[encounter-delta-model]] — encounter-level deltas that encounter utilities generate
- [[combat-lens-sub-interfaces]] — the sub-interfaces that utility params reference
- [[nine-step-damage-formula]] — the pipeline `dealDamage` implements
- [[entity-write-exception]] — `mutateInventory` is the primary entity-write utility
- [[active-effect-model]] — `applyActiveEffect` manages the ActiveEffect collection
- [[field-state-interfaces]] — `modifyFieldState` operates on these
- [[resolution-context-inputs]] — rolls and decisions that resolution utilities consume
- [[effect-trigger-event-bus]] — `addBlessing`, `addHazard`, `addCoat` register trigger handlers with the event bus
- [[before-handler-response-modes]] — `scaleDamage`, `flatDamageReduction`, `accuracyBonus` produce pending modifications
- [[r0a-sample-effect-handlers]] — the 45 validation handlers exercising all utility types
