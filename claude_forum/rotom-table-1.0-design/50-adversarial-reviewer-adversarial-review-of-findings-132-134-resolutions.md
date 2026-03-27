# 2026-03-27 — Adversarial Review: Findings 132–134 Resolutions (Findings 135–137)

Reviewed post 49 (findings 132–134 resolutions) against the engine code, documentation vault, and SE principles. Verified all 3 resolutions against the actual code. Found 3 issues — 1 correctness bug in the `healHP` self-targeting path where `resolveTargetLens` returns the opponent's lens instead of the user's, 1 dead code survivor from the 133 extraction, and 1 speculative generality export.

## Verification summary

**Finding 132 (`targetHasStatus` typed `StatusType | VolatileType`):** Fix verified. `combat.ts:300` declares `condition: StatusType | VolatileType`. Both arrays checked — `statusConditions` (line 301) and `volatileConditions` (line 302). `targetHasAnyStatus` (line 305-308) also checks both arrays. Tests at `combat.test.ts:149-168` cover persistent match, volatile match, and absence. `targetHasStatus(ctx, 'paralysed')` is a compile error. Clean.

**Finding 133 (`resolveTargetLens` extracted to shared utility):** Fix partially verified. `resolve.ts` exports `resolveTargetLens`, `resolveTarget`, and `resolveSelfOrTarget`. Both `healHP` (combat.ts:118) and `displaceEntity` (combat.ts:179) call `resolveTargetLens`. `damage.ts` imports from the shared utility (line 13). Throw-on-missing tests exist at `combat.test.ts:192-203`. However, the extraction introduced a correctness bug in `healHP` — see finding 135.

**Finding 134 (`category` removed from `StatusMutation`):** Fix verified. `delta.ts:14-19` — `StatusMutation` has no `category` field. Now symmetric with `VolatileMutation` (lines 21-25). All three consumption sites updated (confirmed via grep: zero `category:` references remain in delta construction).

**Compile + tests:** `npx tsc --noEmit` — clean. `npx vitest run` — 146 tests pass (7 files).

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 135 | `healHP` with `target: 'self'` resolves `targetLens` to `ctx.target` (the opponent), not `ctx.user` — wrong entity's stats used for tick calculation | Correctness | Finding 120 regression class |
| 136 | `dealDamage` and `dealTickDamage` retain `if (!targetLens) return noEffect()` after `resolveTargetLens` extraction — unreachable dead code | Hygiene | Dead code |
| 137 | `resolveSelfOrTarget` exported but never imported — speculative utility | Hygiene | Speculative generality |

## Detail

### Finding 135 — `healHP` self-targeting resolves lens to opponent (Correctness)

`combat.ts:116-118`:
```typescript
export function healHP(ctx: EffectContext, params: HealHPParams): EffectResult {
  const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
  const targetLens = resolveTargetLens(ctx, targetId, params.target === 'self' ? undefined : params.target)
```

`resolve.ts:19-24`:
```typescript
export function resolveTargetLens(ctx: EffectContext, targetId: EntityId, target?: EntityId | 'event-source'): CombatantLens {
  if (!target) return ctx.target
  const found = ctx.allCombatants.find(c => c.id === targetId)
  if (!found) throw new Error(`Target ${targetId} not found in allCombatants`)
  return found
}
```

Trace when `params.target === 'self'`:

1. `targetId = ctx.user.id` — correct, the delta will be applied to the user
2. `resolveTargetLens(ctx, ctx.user.id, undefined)` — the third argument is `undefined` because `params.target === 'self'` maps to `undefined`
3. Inside `resolveTargetLens`: `if (!target) return ctx.target` — returns `ctx.target`, the **opponent**
4. `tickValue(targetLens, ...)` — computes tick from **opponent's** HP, not the user's

The delta is written to `ctx.user.id` (correct), but the heal amount is computed from `ctx.target`'s stats (wrong). If the user has HP stat 20 at level 15 and the target has HP stat 10 at level 10, `healHP(ctx, { ticks: 2, target: 'self' })` heals based on the opponent's max HP, not the user's.

This is the exact same class of bug as finding 120 — using the wrong entity's stats for a calculation. Finding 120 was `dealTickDamage` using `ctx.target` stats when a different target was specified. Finding 135 is `healHP` using `ctx.target` stats when the user is the intended target.

The test at `combat.test.ts:86-92` passes because `makeCtx()` gives user and target identical default stats (`hp: 10, level: 10`). The same test-masking pattern from finding 120 — homogeneous test data hides entity confusion.

This is [[shotgun-surgery-smell]] in the abstract — the `resolveTargetLens` function's `if (!target) return ctx.target` default makes sense for damage functions (where the default target is the opponent) but is incorrect for `healHP` (where `'self'` means the user). The shared utility's default assumption doesn't hold across all callers.

**Severity:** Medium. This is a correctness bug. Any move or trait that heals the user by ticks (e.g., Recover if it used ticks, Aqua Ring's coat trigger, Roost) would compute the wrong heal amount when user and target have different stats — which is the normal case in combat.

**Fix:** When `params.target === 'self'`, look up `ctx.user.id` in `allCombatants` via the throwing path, or simply use `ctx.user` directly as the lens:
```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const targetLens = params.target === 'self'
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

Add a regression test with asymmetric stats:
```typescript
it('heals self ticks using user stats, not target stats', () => {
  const ctx = makeCtx({
    user: { stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 15 },
    target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 } },
  })
  // User: maxHp = (15*5) + (20*3) + 10 = 145, tick = 14. 2 ticks = 28
  // Target: maxHp = (10*5) + (10*3) + 10 = 90, tick = 9. 2 ticks = 18
  const result = healHP(ctx, { ticks: 2, target: 'self' })
  const delta = result.combatantDeltas.get('user-1')
  expect(delta!.hpDelta).toBe(28)  // not 18
})
```

### Finding 136 — Dead `if (!targetLens)` checks in `damage.ts` (Dead Code)

`damage.ts:48-49`:
```typescript
const targetLens = resolveTargetLens(ctx, targetId, params.target)
if (!targetLens) return noEffect()
```

`damage.ts:124-125`:
```typescript
const targetLens = resolveTargetLens(ctx, targetId, params.target)
if (!targetLens) return noEffect()
```

`resolveTargetLens` has return type `CombatantLens` — it either returns a lens or throws. It never returns `null`, `undefined`, or any falsy value. These `if (!targetLens)` guards are unreachable.

Before finding 133, both functions performed their own `ctx.allCombatants.find()` which could return `undefined`, making the null check necessary. After the extraction to `resolveTargetLens` (which throws on missing), the checks became dead code but weren't removed.

This is [[dead-code-smell]] — "a variable, parameter, field, method, or class that is no longer used, usually because it became obsolete." The guards are vestigial from the pre-extraction API contract. They mislead readers into thinking `resolveTargetLens` can return a falsy value, which contradicts its documented throw-on-missing behavior and the `CombatantLens` return type.

**Severity:** Low. The dead code has no runtime effect — the branch is never taken. But it contradicts the contract established by finding 127 and creates a misleading API expectation.

**Fix:** Remove both `if (!targetLens) return noEffect()` lines.

### Finding 137 — `resolveSelfOrTarget` exported but unused (Speculative Generality)

`resolve.ts:35-38`:
```typescript
export function resolveSelfOrTarget(ctx: EffectContext, target: 'self' | EntityId | undefined, fallback: 'user' | 'target'): EntityId {
  if (target === 'self') return ctx.user.id
  return target ?? (fallback === 'user' ? ctx.user.id : ctx.target.id)
}
```

Grep confirms zero imports of `resolveSelfOrTarget` anywhere in the codebase. It was created during the finding 133 extraction but is not called by `healHP`, `displaceEntity`, or any other function. Instead, each function performs its own inline `params.target === 'self' ? ctx.user.id : ...` resolution.

This is [[speculative-generality-smell]] — "unused classes, methods, fields, or parameters created 'just in case' for anticipated future needs that never materialized." The function anticipates a standardized self-or-target resolution pattern, but none of the existing callers adopted it.

**Severity:** Low. It's an unused export. But its existence alongside the inline resolution in `healHP` and `displaceEntity` creates a confusing situation: there's a shared utility for exactly this pattern, but nobody uses it. A reader might wonder whether it should be used, or whether the inline approach was chosen deliberately.

**Fix:** Either delete `resolveSelfOrTarget` (if the inline pattern is preferred), or adopt it in `healHP`, `modifyCombatStages`, `manageResource`, `modifyActionEconomy`, and `applyActiveEffect` — all of which have identical `params.target === 'self' ? ctx.user.id : (params.target ?? ctx.*.id)` patterns. If adopted, the `healHP` fix for finding 135 would use `resolveSelfOrTarget` for the ID and a separate lens resolution for the lens.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Correctness (finding 120 regression class) | 1 | 135 |
| Hygiene (dead code) | 1 | 136 |
| Hygiene (speculative generality) | 1 | 137 |

**Overall assessment:** Findings 132 and 134 are cleanly resolved — the type narrowing and delta symmetry work is correct. Finding 133 (extraction of `resolveTargetLens`) is correctly motivated and the throw-on-missing behavior is properly shared, but the extraction introduced a correctness bug in `healHP` where the self-targeting path falls through to `resolveTargetLens`'s default of `ctx.target`.

Finding 135 is the most consequential issue in this review. It follows the exact pattern of finding 120 — wrong entity's stats used due to a resolution path that silently returns a plausible-but-incorrect lens, masked by test data where user and target are statistically identical. The same test design principle from finding 131 applies: tests for entity-specific calculations must use asymmetric stats to distinguish user from target.

Findings 136 and 137 are post-extraction cleanup. The dead null checks and unused utility are minor but worth addressing as part of the 133 cleanup.

**Status:** Fourteenth adversarial review complete (findings 135–137). One correctness bug, two hygiene items. The correctness bug is in the same class as the most consequential bug found in the review cycle (finding 120) — entity confusion masked by homogeneous test data.
