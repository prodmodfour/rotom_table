# 2026-03-27 — Findings 132–134 Resolved

All 3 findings from the thirteenth adversarial review accepted and resolved.

## Finding 132 — `targetHasStatus` typed `StatusType | VolatileType`, checks both arrays

**Code:** `combat.ts:301` — `condition: string` accepted any string, including misspellings.

**Before:**
```typescript
export function targetHasStatus(ctx: EffectContext, condition: string): boolean {
  return ctx.target.statusConditions.some(s => s.condition === condition)
}

export function targetHasAnyStatus(ctx: EffectContext): boolean {
  return ctx.target.statusConditions.length > 0
}
```

**After:**
```typescript
export function targetHasStatus(ctx: EffectContext, condition: StatusType | VolatileType): boolean {
  return ctx.target.statusConditions.some(s => s.condition === condition)
    || ctx.target.volatileConditions.some(v => v.condition === condition)
}

export function targetHasAnyStatus(ctx: EffectContext): boolean {
  return ctx.target.statusConditions.length > 0
    || ctx.target.volatileConditions.length > 0
}
```

Chose the union approach — handlers asking "does the target have Confused?" shouldn't need to know which category Confused lives in. Both functions now check both arrays. `targetHasStatus(ctx, 'paralysed')` is now a compile error.

**Tests added:** 3 new tests — `targetHasStatus` finds persistent conditions, finds volatile conditions, and returns false when absent. `targetHasAnyStatus` updated to also test volatile-only case.

## Finding 133 — `resolveTargetLens` extracted to shared utility

**Code:** `combat.ts:117-118` (`healHP`) and `combat.ts:179-180` (`displaceEntity`) silently returned `noEffect()` on target lookup failure.

**Fix:** Extracted `resolveTargetLens` and `resolveTarget` from `damage.ts` into new `utilities/resolve.ts`. Both `healHP` and `displaceEntity` now call `resolveTargetLens`, which throws on lookup failure. `damage.ts` imports from the shared utility instead of defining local copies.

The `damage.ts` local `isTriggerContext` helper also moved to `resolve.ts` as it's used by `resolveTarget`.

**Tests added:** 2 new tests — `healHP` throws on nonexistent ID, `displaceEntity` throws on nonexistent ID.

## Finding 134 — `category` removed from `StatusMutation`

**Code:** `delta.ts:16` — `category: 'persistent' | 'volatile'` was redundant since `StatusMutation` is used exclusively in the `statusConditions` array.

**Before:**
```typescript
export interface StatusMutation {
  op: 'add' | 'remove'
  category: 'persistent' | 'volatile'
  condition: StatusType
  source?: EffectSource
  appliedCombatStages?: Partial<Record<CombatStatKey, number>>
}
```

**After:**
```typescript
export interface StatusMutation {
  op: 'add' | 'remove'
  condition: StatusType
  source?: EffectSource
  appliedCombatStages?: Partial<Record<CombatStatKey, number>>
}
```

Removed rather than narrowed — a field that can only have one correct value carries no information. Now symmetric with `VolatileMutation` (which never had a `category` field). Updated 3 sites: `status.ts:88`, `status.ts:132`, and `traits.ts:252`.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 146 tests pass (7 files), up from 140

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 132 | `condition: string` → `StatusType \| VolatileType`, both arrays checked | Type safety fix |
| 133 | `resolveTargetLens` extracted to shared `resolve.ts`, `healHP` + `displaceEntity` throw on missing target | Consistency fix |
| 134 | `category` removed from `StatusMutation` — symmetric with `VolatileMutation` | Type safety fix |

**Status:** All findings from the thirteenth review resolved. The utility layer now has zero `string`-typed condition parameters, consistent throw-on-missing-target across all target-resolving functions, and symmetric mutation types in the delta model.
