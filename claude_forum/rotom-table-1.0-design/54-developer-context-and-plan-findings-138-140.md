# 2026-03-27 — Context Gather & Plan: Findings 138–140

## Phase 1 — Context Gather

### What exists

**Finding 138 — `healHP` undefined target path:**
- `combat.ts:117-120` — the `healHP` function has three semantic paths for `target`: `'self'`, `undefined`, and explicit `EntityId`.
- The `targetId` line correctly treats `undefined` as user-self via `params.target ?? ctx.user.id`.
- The `targetLens` line only special-cases `'self'`, not `undefined`. When `undefined`, it calls `resolveTargetLens(ctx, ctx.user.id, undefined)`.
- `resolve.ts:20` — `resolveTargetLens` returns `ctx.target` when `!target` — the opponent's lens.
- Result: delta written to correct ID (user), but tick computation uses opponent's HP stats.
- Existing test at `combat.test.ts:100-110` covers `target: 'self'` with asymmetric stats. No test for the `undefined` path.

**Finding 139 — Poison Coated reads `amount` as accuracy roll:**
- `traits.ts:240` — reads `ctx.event.amount` and compares to 18 as if it's the accuracy roll.
- `combat-event.ts:26-34` — `CombatEvent.amount` is a generic `number?`. For `damage-dealt` events, it's the damage value (set in `damage.ts:113`). For `accuracy-check` events, it's the roll value.
- `TriggerEvent` (`combat-event.ts:40-46`) has `moveType`, `isContact`, `damageClass`, `moveRange`, `sourceEntityId` — but no `accuracyRoll` field.
- The Poison Coated trigger fires on `damage-dealt` events, so `amount` is damage, not the accuracy roll.

**Finding 140 — Poison Coated bypasses `applyStatus`:**
- `traits.ts:245-258` — constructs raw `statusConditions` mutation via IIFE instead of calling `applyStatus`.
- `applyStatus` (`status.ts:39-113`) provides: type immunity checks (Poison/Steel immune to poisoned), auto-CS application (Poison: -2 SpDef), and `status-applied` event emission.
- `applyStatus` is already imported in `traits.ts` — wait, checking...

Let me verify:

The import line at `traits.ts:9-13`:
```typescript
import {
  dealTickDamage, healHP, manageResource,
  applyActiveEffect, modifyCombatStages, modifyFieldState,
  noEffect, intercept, merge, hasActiveEffect,
} from '../utilities'
```

`applyStatus` is **not** imported. It would need to be added.

### What's missing

1. **`accuracyRoll` field on `TriggerEvent`** — needed for finding 139. No current way for a `damage-dealt` trigger handler to access the accuracy roll that produced the hit.
2. **Test for `healHP` with `undefined` target** — the `'self'` path is tested, the `undefined` path is not.
3. **Tests for Poison Coated** — no existing test for this trait handler at all.

### What applies

- **[[primitive-obsession-smell]]** (finding 138) — `'self' | EntityId | undefined` overloading creates three semantic paths but only two are handled correctly.
- **[[inappropriate-intimacy-smell]]** (finding 139) — handler assumes knowledge about what `amount` contains based on a different event type.
- **[[duplicate-code-smell]]** / **[[single-source-of-truth]]** (finding 140) — reimplements subset of `applyStatus` while missing its invariants.
- **[[single-responsibility-principle]]** — `applyStatus` centralizes type immunity, auto-CS, and event emission. Bypassing it scatters these responsibilities.

---

## Phase 2 — Plan

### Finding 138 — Fix `healHP` undefined target lens resolution

**File:** `packages/engine/src/utilities/combat.ts` lines 117-120

**Change:** Extract an `isSelfTarget` boolean that covers both `'self'` and `undefined`:

```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const isSelfTarget = params.target === 'self' || params.target === undefined
const targetLens = isSelfTarget
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

**Test:** Add to `combat.test.ts` in the `healHP` describe block:

```typescript
it('heals user ticks when target is undefined (default)', () => {
  // User: level 15, HP stat 20 → maxHp = 145, tick = 14, 2 ticks = 28
  // Target: level 10, HP stat 10 → maxHp = 90, tick = 9, 2 ticks = 18
  const ctx = makeCtx({
    user: { stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 15 },
    target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 10 },
  })
  const result = healHP(ctx, { ticks: 2 })  // no target — defaults to self
  const delta = result.combatantDeltas.get('user-1')
  expect(delta!.hpDelta).toBe(28)  // user stats (145 maxHp), not target stats (90 maxHp)
})
```

**SE principle:** Eliminates the [[primitive-obsession-smell]] — all three paths (`'self'`, `undefined`, `EntityId`) now have consistent lens resolution.

### Finding 139 — Add `accuracyRoll` to `TriggerEvent`, fix handler

**File 1:** `packages/engine/src/types/combat-event.ts` — add `accuracyRoll?: number` to `TriggerEvent`

```typescript
export interface TriggerEvent extends CombatEvent {
  moveType?: PokemonType
  isContact?: boolean
  damageClass?: DamageClass
  moveRange?: 'melee' | 'ranged'
  sourceEntityId: EntityId
  accuracyRoll?: number  // the roll that produced this hit — populated by engine trigger emission
}
```

**File 2:** `packages/engine/src/handlers/traits.ts` lines 238-240 — change the handler to read `accuracyRoll`:

```typescript
// Poison on natural 18+ accuracy roll
if ((ctx.event.accuracyRoll ?? 0) < 18) return noEffect()
```

**File 3:** `packages/engine/tests/test-helpers.ts` — `makeTriggerCtx` already spreads `event` overrides into the TriggerEvent, so callers can pass `accuracyRoll` via the existing `event` parameter. No change needed.

**Test:** Add to `handlers.test.ts`:

```typescript
describe('Poison Coated (contact poison)', () => {
  it('applies poison on contact with accuracyRoll >= 18', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 19,
    })
    const result = trigger.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    expect(delta).toBeDefined()
    expect(delta!.statusConditions![0].condition).toBe('poisoned')
  })

  it('does nothing when accuracyRoll < 18', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 15,
    })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('does nothing on non-contact', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: false,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 20,
    })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })
})
```

**SE principle:** Eliminates [[inappropriate-intimacy-smell]] — the handler reads a semantically correct field (`accuracyRoll`) instead of misinterpreting a generic field (`amount`).

### Finding 140 — Replace raw mutation with `applyStatus` call

**File:** `packages/engine/src/handlers/traits.ts`

**Change 1:** Add `applyStatus` to the import:

```typescript
import {
  dealTickDamage, healHP, manageResource,
  applyActiveEffect, modifyCombatStages, modifyFieldState,
  applyStatus,
  noEffect, intercept, merge, hasActiveEffect,
} from '../utilities'
```

**Change 2:** Replace the IIFE block (lines 245-258) with:

```typescript
const target = ctx.allCombatants.find(c => c.id === ctx.event.targetId)
if (!target) return noEffect()
const targetCtx = { ...ctx, target }
return applyStatus(targetCtx, {
  category: 'persistent',
  condition: 'poisoned',
  source: { type: 'trait', id: 'poison-coated', entityId: ctx.user.id },
})
```

**Test:** Add to the Poison Coated describe block in `handlers.test.ts`:

```typescript
it('respects type immunity — Poison-type target is not poisoned', () => {
  const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
  const ctx = makeTriggerCtx(
    { target: { types: ['poison'] } },
    {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 20,
    },
  )
  const result = trigger.handler(ctx)
  expect(result.combatantDeltas.size).toBe(0) // immune
})

it('auto-applies -2 SpDef CS on successful poison', () => {
  const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
  const ctx = makeTriggerCtx({}, {
    type: 'damage-dealt', isContact: true,
    sourceEntityId: 'user-1', targetId: 'target-1',
    accuracyRoll: 20,
  })
  const result = trigger.handler(ctx)
  const delta = result.combatantDeltas.get('target-1')
  expect(delta!.combatStages!.spdef).toBe(-2)
})

it('emits status-applied event', () => {
  const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
  const ctx = makeTriggerCtx({}, {
    type: 'damage-dealt', isContact: true,
    sourceEntityId: 'user-1', targetId: 'target-1',
    accuracyRoll: 18,
  })
  const result = trigger.handler(ctx)
  expect(result.events.some(e => e.type === 'status-applied')).toBe(true)
})
```

**SE principle:** Eliminates [[duplicate-code-smell]] — uses the centralized `applyStatus` utility which provides type immunity, auto-CS, and event emission. Upholds [[single-responsibility-principle]] — status application logic lives in one place.

### Summary of changes

| File | Change | Finding |
|---|---|---|
| `src/utilities/combat.ts` | `healHP` handles `undefined` target same as `'self'` | 138 |
| `src/types/combat-event.ts` | Add `accuracyRoll?: number` to `TriggerEvent` | 139 |
| `src/handlers/traits.ts` | Import `applyStatus`; fix Poison Coated to use `accuracyRoll` and `applyStatus` | 139, 140 |
| `tests/combat.test.ts` | Regression test for `healHP` with `undefined` target | 138 |
| `tests/handlers.test.ts` | 6 new Poison Coated tests (accuracy roll threshold, non-contact, type immunity, auto-CS, event emission) | 139, 140 |

### Verification plan

1. `npx tsc --noEmit` — clean compile
2. `npx vitest run` — all existing 147 tests pass + 7 new tests pass

**Status:** Phase 1 and 2 complete. Awaiting plan review.
