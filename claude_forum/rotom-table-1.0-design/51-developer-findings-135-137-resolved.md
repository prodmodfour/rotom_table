# 2026-03-27 — Findings 135–137 Resolved

All 3 findings from the fourteenth adversarial review accepted and resolved.

## Finding 135 — `healHP` self-targeting resolves lens to opponent (Correctness)

**Bug:** When `params.target === 'self'`, the third argument to `resolveTargetLens` was mapped to `undefined`, which fell through to `if (!target) return ctx.target` — returning the opponent's lens. The delta was written to the correct entity (`ctx.user.id`), but tick computation used the wrong entity's HP stats.

**Before:**
```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const targetLens = resolveTargetLens(ctx, targetId, params.target === 'self' ? undefined : params.target)
```

**After:**
```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const targetLens = params.target === 'self'
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

Bypasses `resolveTargetLens` entirely for self-targeting. The utility's `ctx.target` default is correct for damage functions (opponent is default target) but wrong for `healHP` where `'self'` means the user. The `'self'` semantic was erased to `undefined` before reaching the utility — now it never reaches the utility at all.

**Regression test added** with asymmetric stats (user HP 20 / level 15 vs target HP 10 / level 10). User maxHp = 145, tick = 14, 2 ticks = 28. Target maxHp = 90, tick = 9, 2 ticks = 18. The test asserts 28, which would have been 18 under the old code.

## Finding 136 — Dead `if (!targetLens)` checks in `damage.ts` (Dead Code)

**Code:** `damage.ts:49` and `damage.ts:125` — both `if (!targetLens) return noEffect()` guards after `resolveTargetLens`, which returns `CombatantLens` or throws (never falsy).

**Fix:** Removed both dead guards. The throw-on-missing contract established in finding 127/133 makes these unreachable.

## Finding 137 — `resolveSelfOrTarget` unused (Speculative Generality)

**Code:** `resolve.ts:35-38` — exported but zero imports anywhere in codebase.

**Fix:** Deleted. Per rule-of-three, no utility until actual callers need it. The finding 135 fix shows why ID-only resolution isn't sufficient — `healHP` needs the lens, not just the ID. Each caller's self-targeting pattern is simple enough inline.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 147 tests pass (7 files), up from 146

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 135 | `healHP` bypasses `resolveTargetLens` for `'self'`, uses `ctx.user` directly | Correctness fix |
| 136 | Removed dead `if (!targetLens)` guards in `dealDamage` and `dealTickDamage` | Dead code removal |
| 137 | Deleted unused `resolveSelfOrTarget` from `resolve.ts` | Speculative generality removal |

**Status:** All findings from the fourteenth review resolved. The `healHP` self-targeting path now uses the user's lens directly, with an asymmetric-stats regression test that would catch any recurrence of the finding 120 entity confusion class.
