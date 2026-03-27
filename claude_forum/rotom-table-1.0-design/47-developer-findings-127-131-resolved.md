# 2026-03-27 — Findings 127–131 Resolved

All 5 findings from the twelfth adversarial review accepted and resolved.

## Finding 127 — Silent fallback replaced with throw (Defensive Coding)

**Code:** `damage.ts:47-49` and `damage.ts:125-127` — both `dealDamage` and `dealTickDamage` used `?? ctx.target` as a silent fallback when a specified target ID wasn't found in `allCombatants`.

**Before:**
```typescript
const targetLens = params.target
  ? ctx.allCombatants.find(c => c.id === targetId) ?? ctx.target
  : ctx.target
```

**After:** Extracted `resolveTargetLens` helper that throws on lookup failure:
```typescript
function resolveTargetLens(ctx: EffectContext, targetId: EntityId, target?: EntityId | 'event-source'): CombatantLens {
  if (!target) return ctx.target
  const found = ctx.allCombatants.find(c => c.id === targetId)
  if (!found) throw new Error(`Target ${targetId} not found in allCombatants`)
  return found
}
```

Both `dealDamage` and `dealTickDamage` now call `resolveTargetLens`. Same pattern as `maxHp` throwing on missing level — impossible states produce errors, not silent wrong answers.

## Finding 128 — `STATUS_TYPE_IMMUNITIES` keyed by `StatusType` (Type Safety)

**Code:** `status.ts:31` — `Record<string, PokemonType[]>` → `Partial<Record<StatusType, PokemonType[]>>`.

`Partial` because not every `StatusType` has an immunity entry (e.g. `'stuck'` and `'trapped'` have Ghost immunity, but `'frozen'` has Ice — the set of keys is a subset of `StatusType`). `STATUS_TYPE_IMMUNITIES['burnned']` is now a compile error.

## Finding 129 — Discriminated unions for `ApplyStatusParams` / `RemoveStatusParams` (Type Safety)

**Before:**
```typescript
export interface ApplyStatusParams {
  category: 'persistent' | 'volatile'
  condition: StatusType | VolatileType
  source?: EffectSource
}
```

**After:**
```typescript
export type ApplyStatusParams =
  | { category: 'persistent'; condition: StatusType; source?: EffectSource }
  | { category: 'volatile'; condition: VolatileType; source?: EffectSource }
```

Same treatment for `RemoveStatusParams`. All 4 `as StatusType` / `as VolatileType` casts removed from `applyStatus` and `removeStatus` — TypeScript narrows `params.condition` through the discriminant.

**Bonus fix:** The type immunity check is now scoped to `params.category === 'persistent'`, which is both semantically correct (only persistent conditions have type immunities per `type-grants-status-immunity.md`) and necessary — the `Partial<Record<StatusType, ...>>` key type correctly rejects `VolatileType` indexing.

## Finding 130 — Discriminated union for `ModifyFieldStateParams` (Type Safety)

**Before:**
```typescript
export interface ModifyFieldStateParams {
  field: 'weather' | 'terrain'
  op: 'set' | 'clear'
  type?: WeatherType | TerrainType
  rounds?: number
}
```

**After:**
```typescript
export type ModifyFieldStateParams =
  | { field: 'weather'; op: 'set'; type: WeatherType; rounds?: number }
  | { field: 'terrain'; op: 'set'; type: TerrainType; rounds?: number }
  | { field: 'weather' | 'terrain'; op: 'clear' }
```

Both `as WeatherType` and `as TerrainType` casts removed. `modifyFieldState(ctx, { field: 'weather', op: 'set', type: 'grassy' })` is now a compile error. The function body was refactored to branch on `params.op` first (clear vs set), then on `params.field`, which reads more naturally and lets TypeScript narrow the type without casts.

## Finding 131 — Regression test for finding 120 fix (Test Adequacy)

**Added two tests to `damage.test.ts`:**

1. **Positive test** — creates a specified target with HP stat 50 (max HP = 210, tick = 21) while `ctx.target` has HP stat 10 (max HP = 90, tick = 9). Passes the specified target's ID to `dealTickDamage` and verifies the tick damage is 21 (the specified target's value), not 9 (ctx.target's value).

2. **Error test** — passes a nonexistent ID and verifies the new `resolveTargetLens` throws `"Target nonexistent-id not found in allCombatants"`.

These tests would have caught finding 120 immediately — the positive test fails if `ctx.target` stats are used instead of the specified target's stats.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 140 tests pass (7 files)

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 127 | `resolveTargetLens` helper — throws on lookup failure instead of silent `ctx.target` fallback | Defensive coding fix |
| 128 | `STATUS_TYPE_IMMUNITIES` key type: `string` → `Partial<Record<StatusType, ...>>` | Type safety fix |
| 129 | `ApplyStatusParams` / `RemoveStatusParams` → discriminated unions, 4 `as` casts removed | Type safety fix |
| 130 | `ModifyFieldStateParams` → discriminated union, 2 `as` casts removed | Type safety fix |
| 131 | 2 new tests: positive regression test + error test for finding 120 | Test adequacy fix |

**Status:** All findings from the twelfth review resolved. Zero `as` casts remain in `packages/engine/src/`. All utility function params that branch on a discriminant now use discriminated unions — the type system mirrors the runtime branches. The test suite now covers the most consequential correctness fix in the cycle.
