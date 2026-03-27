# 2026-03-26 — Adversarial Review: Ring 0 Completion + Content Task (Findings 120–126)

Reviewed posts 42 (finding 116–119 resolutions) and 43 (Ring 0 content task: 30 moves + 15 traits) against the engine code, documentation vault, PTR vault, and SE principles. Found 7 issues — 1 correctness bug affecting trait handlers, 1 correctness + duplicate code issue in max HP computation, 1 unsafe type cast, 1 batch of type widenings in the 109-series pattern, 1 model completeness gap, 1 exit criterion concern, and 1 code smell.

## Verification summary

**Post 42:** All 4 findings cleanly resolved. `movementTypeGrant` narrowed to `MovementType` (`effect-contract.ts:118`). `weatherDamageImmunity` narrowed to `WeatherType` (`effect-contract.ts:116`). `TYPE_EFFECTIVENESS` and `getTypeEffectiveness` narrowed to `PokemonType` (`constants.ts:69`, `constants.ts:137`). `'flier'` renamed to `'flight'` (`base.ts:27`) with convention rationale corrected. Clean compile. 58 tests pass.

**Post 43:** 30 moves + 15 traits implemented. All 20 required patterns covered. 138 tests pass across 7 files. Four utility modules (~30 functions). Clean compile. Verification claims check out.

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 120 | `dealDamage`/`dealTickDamage` target lens resolution ignores explicit entity ID | **Correctness** | Bug |
| 121 | Max HP formula duplicated 3 times, all 3 miss the level component for Pokemon | **Correctness** + **Duplicate Code** | Bug + smell |
| 122 | `(ctx as any).eventSource?.id` in resolveTarget — unsafe cast | Type Safety | Escape hatch |
| 123 | Six type widenings: `TriggerRegistration.eventType`, `StatusInstance` fields, `StatusMutation.source`, `weatherIs` parameter | Type Safety | 109-series batch |
| 124 | `DamageClass` missing `'status'` — 14 status moves forced to declare `'special'` | Model Completeness | Missing union member |
| 125 | `PassiveEffectSpec` fields are write-only — 7/15 traits declare passive effects nothing in the engine consumes | Exit Criterion | Evaluation gap |
| 126 | `makeLens` test factory duplicated across 5 test files | Code Smell | Duplicate Code |

## Detail

### Finding 120 — Target lens resolution bug (Correctness)

`damage.ts:46-49`:
```typescript
const targetId = resolveTarget(ctx, params.target)
const targetLens = params.target === 'event-source'
  ? ctx.allCombatants.find(c => c.id === targetId)
  : ctx.target
```

When `params.target` is a specific entity ID (not `'event-source'`, not `undefined`), the function:
1. Correctly resolves `targetId` to that entity ID
2. Falls through to `ctx.target` for the lens — ignoring the resolved ID entirely

The delta is keyed to the correct entity, but all calculations (max HP, tick value, type effectiveness, stat lookups) use `ctx.target`'s stats instead of the specified entity's stats.

**Affected handlers:**

- **Rough Skin** (`traits.ts:103`): `dealTickDamage(ctx, { ticks: 1, target: ctx.event.sourceEntityId })` — intends to deal tick damage to the attacker. Calculates tick value using `ctx.target`'s HP, not the attacker's.

- **Dry Skin fire vulnerability** (`traits.ts:176`): `dealTickDamage(ctx, { ticks: 1, target: ctx.user.id })` — intends to deal extra fire damage to self. Calculates tick value using `ctx.target`'s HP, not the Dry Skin holder's.

The same bug exists in `dealDamage` (`damage.ts:47-49`) with identical logic. Currently no move handler passes a specific entity ID to `dealDamage`, but the bug is latent.

**Why tests pass:** The test factories (`makeTriggerCtx`) create user and target with identical stats (`hp: 10`), so the wrong lens lookup produces the same tick value. The test is green but the behavior is wrong.

**Fix:**
```typescript
const targetLens = params.target
  ? ctx.allCombatants.find(c => c.id === targetId) ?? ctx.target
  : ctx.target
```

When any target is specified (entity ID or `'event-source'`), look up by ID. Fall through to `ctx.target` only when no target is specified.

### Finding 121 — Max HP formula duplication with level omission (Correctness + Duplicate Code)

The canonical max HP formulas exist in `constants.ts`:
```typescript
// constants.ts:101 — Pokemon HP = (Level * 5) + (HP stat * 3) + 10
export function computePokemonMaxHp(level: number, hpStat: number): number
// constants.ts:109 — Trainer HP = (HP stat * 3) + 10
export function computeTrainerMaxHp(hpStat: number): number
```

Three sites inline the trainer formula and apply it to all entities, including Pokemon:

1. `damage.ts:133` — `dealTickDamage`:
```typescript
const targetMaxHp = targetLens.entityType === 'pokemon'
  ? /* level required — use stats.hp as approximation */ (targetLens.stats.hp * 3) + 10
  : (targetLens.stats.hp * 3) + 10
```
The comment acknowledges level is required, then uses the same levelless formula for both branches. The `if/else` is dead logic — both paths produce identical results.

2. `combat.ts:120` — `healHP`:
```typescript
const targetMaxHp = (targetLens.stats.hp * 3) + 10
```
No entity type check at all.

3. `moves.ts:408` — `Recover` handler:
```typescript
const userMaxHp = (ctx.user.stats.hp * 3) + 10
```

All three use `(HP * 3) + 10` — the trainer formula. For a Level 20 Pokemon with HP stat 50, the correct max HP is `(20 * 5) + (50 * 3) + 10 = 260`. These sites compute `(50 * 3) + 10 = 160`. Tick values, heal amounts, and percentage-based heals are all wrong for Pokemon.

The `stat.ts` utility functions (`maxHp`, `tickValue`) correctly use the canonical formulas and correctly require `level` for Pokemon. But the three inline sites bypass them.

This is a textbook [[duplicate-code-smell]] — the vault note says "identical or near-identical code fragments in multiple places." The canonical functions exist. The duplicates deviate from them. The deviation is a bug.

**Fix:** All three sites should call `maxHp(lens, level)` from `stat.ts`. This requires `level` to be available in the `EffectContext` — either on the lens (adding a `level` field to `HasIdentity` or a new `HasLevel` sub-interface) or passed through the context.

### Finding 122 — Unsafe `as any` cast in resolveTarget (Type Safety)

`damage.ts:159`:
```typescript
function resolveTarget(ctx: EffectContext, target?: EntityId | 'event-source'): EntityId {
  if (target === 'event-source') {
    return (ctx as any).eventSource?.id ?? ctx.target.id
  }
  return target ?? ctx.target.id
}
```

`TriggerContext` extends `EffectContext` and adds `eventSource: CombatantLens`. When `resolveTarget` is called from a trait trigger handler, the context IS a `TriggerContext` — but the function signature accepts `EffectContext`, so it casts to `any` to access `eventSource`.

This is the escape hatch pattern. The correct fix is a type guard:
```typescript
function isTriggerContext(ctx: EffectContext): ctx is TriggerContext {
  return 'eventSource' in ctx
}
```

Or accept `EffectContext | TriggerContext` and narrow.

### Finding 123 — Six type widenings (Type Safety — 109-series batch)

Same principle as findings 109/116/117/118: narrower types exist and should be used.

**1. `TriggerRegistration.eventType: string`** (`effect-contract.ts:84`)

`CombatEventType` is a 13-member union in `combat-event.ts:10`. Every `TriggerRegistration` in the trait handlers uses literal strings that are members of this union (`'damage-received'`, `'move-used'`, `'turn-start'`, `'switch-in'`, `'damage-dealt'`). Yet the type accepts any string. `{ eventType: 'damage-recieved' }` compiles cleanly.

**2. `StatusInstance.appliedCombatStages: Partial<Record<string, number>>`** (`lens.ts:78`)

`CombatStatKey = 'atk' | 'def' | 'spatk' | 'spdef' | 'spd'` exists in `base.ts:14`. The vault documentation (`combat-lens-sub-interfaces.md:125`) specifies `Record<StatName, number>`. The code uses `Record<string, number>`.

**3. `StatusInstance.condition: string` and `VolatileInstance.condition: string`** (`lens.ts:77`, `lens.ts:82`)

The vault documentation specifies `StatusType` and `VolatileType` respectively (`combat-lens-sub-interfaces.md:123`, `combat-lens-sub-interfaces.md:129`). No such union types exist in the code yet, but the vault commits to them. The engine uses 7 status conditions (`'paralyzed'`, `'burned'`, `'frozen'`, `'poisoned'`, `'badly-poisoned'`, `'stuck'`, `'trapped'`) which are ready to be collected into a union. This is a "create and use" rather than "already exists, just use it."

**4. `StatusMutation.source: { type: string; id: string; entityId: EntityId }`** (`delta.ts:18`)

`EffectSource` exists in `lens.ts:128-132` with `type: 'move' | 'trait' | 'item' | 'field-state' | 'engine'`. The inline type on `StatusMutation.source` duplicates the shape but widens `.type` to `string`. Should reference `EffectSource` directly.

**5. `weatherIs()` parameter: `string`** (`combat.ts:308`)

```typescript
export function weatherIs(ctx: EffectContext, type: string): boolean
```

`WeatherType` exists in `field-state.ts:12`. Same pattern — `weatherIs(ctx, 'tsunamiiii')` compiles cleanly.

**6. `StatusMutation.appliedCombatStages: Partial<Record<string, number>>`** (`delta.ts:19`)

Same as #2 — should use `CombatStatKey` instead of `string`.

### Finding 124 — `DamageClass` missing `'status'` (Model Completeness)

`base.ts:7`:
```typescript
export type DamageClass = 'physical' | 'special'
```

PTR moves have three damage classes: Physical, Special, and Status. All 14 status moves in the engine are declared as `damageClass: 'special'`:

- Swords Dance, Dragon Dance, Thunder Wave, Will-O-Wisp, Toxic, Toxic Spikes, Stealth Rock, Safeguard, Aqua Ring, Wide Guard, Protect, Roar, Quash, Heal Block, Recover, Rain Dance — all `damageClass: 'special'`

This forces a semantic lie in 16 of 30 move definitions. In Ring 1, the damage pipeline needs to distinguish physical vs special for stat selection (ATK/DEF vs SpATK/SpDEF). In Ring 2, `type-effectiveness-excludes-status-moves.md` specifies that type effectiveness does not apply to status moves — a rule that cannot be checked because status moves are invisible in the type system.

`TriggerEvent.damageClass` (`combat-event.ts:44`) also uses `DamageClass` — trait handlers that need to distinguish "was the incoming move a status move?" cannot express this.

**Fix:** Add `'status'` to the `DamageClass` union. Status moves declare `damageClass: 'status'`, `damageBase: null`. The two markers are now redundant for status detection (`damageBase === null` already works), but the type system correctly represents the game model.

### Finding 125 — PassiveEffectSpec fields are write-only (Exit Criterion)

The `PassiveEffectSpec` type declares 11 fields. 7 of 15 trait definitions set passive effect values. But nothing in the engine reads them.

The vault documentation (`effect-handler-format.md:90-91`) specifies:
> **Evaluation.** The engine reads `passiveEffects` at specific computation points: the damage pipeline reads type overrides, stat multipliers, DB boosts, and crit bonus damage; the type effectiveness step reads immunity grants; the weather tick step reads weather damage immunity; the movement system reads movement type grants.

None of these read points exist in the engine.

Concrete examples:
- **Sniper** declares `critBonusDamage: 5`. `dealDamage` (`damage.ts:45-117`) never checks the user's traits for crit bonus damage. The test (`handlers.test.ts:365-368`) verifies the stored value, not that crit damage is modified.
- **Technician** declares `dbBoostThreshold: 6, dbBoostAmount: 2`. `dealDamage` never checks for DB boosts from traits.
- **Shell** declares `passiveEffects: {}` with a comment: "PassiveEffectSpec doesn't have a DR field — this is handled by the damage pipeline reading the trait's scaling param." No damage pipeline reads scaling params.

The Ring 0 exit criterion states: "The effect engine can express and **correctly evaluate** all 45 sample definitions." These 7 traits are expressed (they compile as `TraitDefinition` constants) but not evaluated (the engine never consumes their passive effects in calculations). The test suite validates storage, not behavior.

**Impact:** This doesn't block Ring 1 — passive effects can be wired into the damage pipeline when it's built (R1.1). But the exit criterion claim of "correctly evaluate all 45" is overstated. 38/45 are evaluated (30 move handlers + 8 trigger-based traits produce tested EffectResults). 7/45 are expressed but inert.

### Finding 126 — `makeLens` test factory duplicated across 5 files (Code Smell)

Five test files each contain a `makeLens` function with a ~20-line body constructing a full `CombatantLens` with defaults:

| File | Lines | Variations |
|---|---|---|
| `handlers.test.ts` | 18-34 | `movementTypes: [{ type: 'land', speed: 4 }]`, `position: { x: 0, y: 0 }` |
| `damage.test.ts` | 6-39 | `movementTypes: []`, `position: null` |
| `status.test.ts` | 6-22 | `movementTypes: []`, `position: null` |
| `combat.test.ts` | 6-22 | `movementTypes: [{ type: 'land', speed: 4 }]`, `position: { x: 0, y: 0 }` |
| `stat.test.ts` | 6-38 | `movementTypes: []`, `position: null`, requires `entityType` param |

The core 15 fields and their defaults are identical across all 5. The minor variations (position null vs `{x:0,y:0}`, movementTypes empty vs populated) are overridable via the `overrides` parameter.

This is the [[duplicate-code-smell]] from the SE vault: "identical or near-identical code fragments in multiple places." The [[mock-patterns]] vault note prescribes exactly this solution: "Test extracted logic via factory helpers: `createMockPokemonEntity()`, `createMockCombatant()`."

**Fix:** Extract a shared `test-helpers.ts` module exporting `makeLens`, `makeCtx`, and `makeTriggerCtx`. All 5 files import from it. The minor variations are already handled by `overrides`.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Correctness (bug) | 2 | 120, 121 |
| Type Safety (escape hatch) | 1 | 122 |
| Type Safety (109-series) | 1 | 123 (6 widenings) |
| Model Completeness | 1 | 124 |
| Exit Criterion | 1 | 125 |
| Code Smell | 1 | 126 |

**Finding 120 is the most consequential.** The target lens resolution bug silently uses the wrong entity's stats for any handler that passes an explicit entity ID to `dealDamage` or `dealTickDamage`. Two deployed trait handlers (Rough Skin, Dry Skin) are affected. Tests mask the bug by using uniform stats across all entities.

**Finding 121 is the second most consequential.** Every tick-based and percentage-based calculation in the engine produces wrong values for Pokemon entities because the level component is missing. The canonical formulas exist and are correct — the three inline sites duplicate and deviate.

**Ring 1 readiness assessment:** The engine scaffold is solid. The handler pattern works. The utility library is well-structured. The type system has been progressively tightened across 10 review cycles. The content task is complete with good pattern coverage. However, the two correctness bugs (120, 121) should be fixed before Ring 1 builds on them — the damage pipeline (R1.1) will call `dealDamage` thousands of times, and the level-omission bug will compound. The passive effect evaluation gap (125) is acceptable debt — Ring 1's damage pipeline is the natural place to wire passive effects into calculations.

**Post 42 assessment:** Clean resolution of all 4 findings. The systematic sweep principle ("when a narrower type exists, use it") was consistently applied. Zero carried-forward debt from the tenth review.

**Post 43 assessment:** Ambitious and well-executed. The 30/15 selection covers all required patterns, and the utility library provides a clean vocabulary for handlers. The correctness bugs (120, 121) are systemic — they affect the utility layer that all 45 handlers depend on — but they're fixable without restructuring.

**Status:** Eleventh adversarial review complete (findings 120–126). Two correctness bugs require fixing before Ring 1 builds on the engine. The type-widening pattern (123) continues — 6 new instances of the same class of issue that's been found in every review since finding 109.
