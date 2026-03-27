# 2026-03-27 — Adversarial Review: Findings 135–137 Resolutions (Findings 138–140)

Reviewed post 51 (findings 135–137 resolutions) against the engine code, documentation vault, and SE principles. Verified all 3 resolutions against the actual code. Found 3 issues — 1 incomplete fix in the same entity confusion class as findings 120/135, and 2 correctness bugs in the Poison Coated Natural Weapon trait handler.

## Verification summary

**Finding 135 (`healHP` self-targeting resolved to opponent):** Fix verified for the `'self'` path. `combat.ts:118-120` — when `params.target === 'self'`, the function now uses `ctx.user` directly, bypassing `resolveTargetLens`. Regression test at `combat.test.ts:100-110` uses asymmetric stats (user HP 20 / level 15 vs target HP 10 / level 10) and correctly asserts tick computation from user stats (28, not 18). However, the fix is incomplete — the `undefined` path has the same bug. See finding 138.

**Finding 136 (dead `if (!targetLens)` guards in `damage.ts`):** Fix verified. `damage.ts:48` and `damage.ts:123` — both lines now read `const targetLens = resolveTargetLens(...)` with no subsequent null check. Clean.

**Finding 137 (`resolveSelfOrTarget` unused):** Fix verified. `resolve.ts` exports only `resolveTargetLens` and `resolveTarget`. No `resolveSelfOrTarget` function. Grep confirms zero references. Clean.

**Compile + tests:** `npx tsc --noEmit` — clean. `npx vitest run` — 147 tests pass (7 files).

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 138 | `healHP` with `undefined` target resolves `targetLens` to `ctx.target` (opponent) — the finding 135 fix only covered `'self'`, not the semantically equivalent `undefined` default | Correctness | Finding 120/135 regression class |
| 139 | Poison Coated Natural Weapon reads `ctx.event.amount` (damage dealt) as the accuracy roll — `damage-dealt` events store damage in `amount`, not the accuracy roll | Correctness | Event schema misinterpretation |
| 140 | Poison Coated Natural Weapon bypasses `applyStatus`, skipping type immunity check, status CS auto-application, and `status-applied` event emission | Correctness | Status application bypass |

## Detail

### Finding 138 — `healHP` undefined target resolves lens to opponent (Correctness)

`combat.ts:117-120`:
```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const targetLens = params.target === 'self'
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

The finding 135 fix added the ternary for the lens: when `params.target === 'self'`, use `ctx.user` directly. But `HealHPParams.target` is `'self' | EntityId | undefined` — the field is optional. The `targetId` line treats `undefined` as equivalent to `'self'` via `params.target ?? ctx.user.id`, giving the correct ID (`ctx.user.id`). But the `targetLens` line only special-cases `'self'`, not `undefined`:

Trace when `params.target` is `undefined`:

1. `targetId = undefined ?? ctx.user.id` → `ctx.user.id` (correct)
2. `params.target === 'self'` → false, takes else branch
3. `resolveTargetLens(ctx, ctx.user.id, undefined)` → `if (!target) return ctx.target` → **opponent's lens**
4. `tickValue(targetLens, ...)` → computes tick from **opponent's** HP stats

The delta is written to `ctx.user.id` (correct), but tick computation uses `ctx.target`'s stats (wrong). This is the exact same entity confusion as finding 135, just via the `undefined` path instead of the `'self'` path.

No current handler triggers this — all 5 `healHP` callers (Recover, Aqua Ring, Water Absorb, Dry Skin, Ice Body) pass explicit `target: 'self'`. But the function's API explicitly supports `undefined` as a valid input with user-self-healing semantics (the `?? ctx.user.id` fallback proves the designer's intent). A future handler calling `healHP(ctx, { ticks: 2 })` would silently compute ticks from the opponent.

The function has two representations of "default target" — the ID fallback (`?? ctx.user.id`, points to user) and the lens fallback (`resolveTargetLens(..., undefined)`, points to opponent). This divergence is [[primitive-obsession-smell]] — the `'self' | EntityId | undefined` overloading on a single optional field creates three semantic paths (`'self'` = user, `undefined` = user, `EntityId` = explicit) but only two of them are handled correctly for lens resolution.

**Severity:** Medium. Latent correctness bug — not triggered by any current handler, but the API explicitly accepts the broken path. Same finding class as 120 and 135.

**Fix:** Extend the self-targeting branch to cover both `'self'` and `undefined`:
```typescript
const targetId = params.target === 'self' ? ctx.user.id : (params.target ?? ctx.user.id)
const isSelfTarget = params.target === 'self' || params.target === undefined
const targetLens = isSelfTarget
  ? ctx.user
  : resolveTargetLens(ctx, targetId, params.target)
```

Add a regression test with asymmetric stats and `undefined` target:
```typescript
it('heals user ticks when target is undefined (default)', () => {
  const ctx = makeCtx({
    user: { stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 15 },
    target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 10 },
  })
  const result = healHP(ctx, { ticks: 2 })  // no target — defaults to self
  const delta = result.combatantDeltas.get('user-1')
  expect(delta!.hpDelta).toBe(28)  // user stats, not target stats
})
```

### Finding 139 — Poison Coated reads damage amount as accuracy roll (Correctness)

`traits.ts:239-240`:
```typescript
// Poison on 18+ during accuracy check
// We read the accuracy roll from the triggering event's amount field
if ((ctx.event.amount ?? 0) < 18) return noEffect()
```

The handler fires on `damage-dealt` events (`eventType: 'damage-dealt'`). Per `combat-event.ts:26-34`, `CombatEvent.amount` is a generic numeric field. For `damage-dealt` events, `amount` is the **damage dealt** — set in `damage.ts:113`:
```typescript
events: [{ ..., type: 'damage-dealt', amount: damage }]
```

For `accuracy-check` events, `amount` is the **accuracy roll** — set in `combat.ts:74`:
```typescript
events: [{ ..., type: 'accuracy-check', amount: roll }]
```

The handler's comment says "we read the accuracy roll from the triggering event's amount field," but the triggering event is `damage-dealt`, not `accuracy-check`. The `amount` field contains damage, not the accuracy roll. These are completely different values.

Consequences:
- A weak hit dealing 5 damage with a nat-20 accuracy roll → `5 < 18` → no poison (should trigger)
- A strong hit dealing 25 damage with a barely-hit roll of 4 → `25 >= 18` → poison triggers (should not)

The trait's intent is to poison on high accuracy rolls, but it actually poisons on high damage numbers. `TriggerEvent` does not carry `accuracyRoll` for `damage-dealt` events — it has `moveType`, `isContact`, `damageClass`, and `moveRange`, but not the accuracy roll that produced the hit.

This is [[inappropriate-intimacy-smell]] — the handler assumes knowledge about what `amount` contains based on how a different event type (`accuracy-check`) uses it, but the `damage-dealt` event uses `amount` for an entirely different purpose. The handler reaches into the event structure and misinterprets what it finds.

**Severity:** Medium. This is a correctness bug. The poison threshold is evaluated against the wrong value. Every Poison Coated contact trigger produces wrong results unless damage and accuracy roll happen to coincide.

**Fix:** Add `accuracyRoll?: number` to `TriggerEvent` so damage-dealt triggers can access the roll that produced the hit:
```typescript
export interface TriggerEvent extends CombatEvent {
  moveType?: PokemonType
  isContact?: boolean
  damageClass?: DamageClass
  moveRange?: 'melee' | 'ranged'
  sourceEntityId: EntityId
  accuracyRoll?: number  // the roll that produced this hit
}
```

Then fix the handler:
```typescript
if ((ctx.event.accuracyRoll ?? 0) < 18) return noEffect()
```

The engine's trigger emission (Ring 1) would populate `accuracyRoll` when constructing `TriggerEvent` for `damage-dealt` events. Since trigger emission doesn't exist yet, the fix is to: (1) add the field to the type now, (2) update the handler to read it, and (3) document that the engine must populate it.

### Finding 140 — Poison Coated bypasses `applyStatus` (Correctness)

`traits.ts:245-258`:
```typescript
const targetCtx = { ...ctx, target }
return merge(
  { ...noEffect() },
  (() => {
    const result = noEffect()
    result.combatantDeltas.set(target.id, {
      statusConditions: [{
        op: 'add',
        condition: 'poisoned',
        source: { type: 'trait', id: 'poison-coated', entityId: ctx.user.id },
      }],
    })
    return result
  })(),
)
```

The handler constructs `targetCtx` with the correct target (line 244) but then bypasses `applyStatus` entirely, building a raw `statusConditions` mutation via an IIFE. `applyStatus` provides three services that the raw mutation skips:

1. **Type immunity check.** `status.ts:44-51` — `applyStatus` checks `STATUS_TYPE_IMMUNITIES`: Poison and Steel types are immune to `poisoned`. The raw mutation does not check. A Steel-type or Poison-type hit with contact damage from a Poison Coated user would be incorrectly poisoned.

2. **Status CS auto-application.** `status.ts:79-84` — `applyStatus` auto-applies -2 SpDef for `poisoned` per `status-cs-auto-apply-with-tracking.md`. The raw mutation includes no `appliedCombatStages` field and no `combatStages` delta.

3. **Event emission.** `status.ts:63-68` — `applyStatus` emits a `status-applied` CombatEvent. The raw mutation produces no events. Downstream triggers listening for `status-applied` (e.g., Safeguard's blessing consumption) won't fire.

This is [[duplicate-code-smell]] — the handler reimplements a subset of `applyStatus`'s mutation construction while missing the immunity, auto-CS, and event logic that the utility centralizes. The utility exists precisely to enforce these invariants; bypassing it creates a correctness gap per [[single-source-of-truth]].

**Severity:** Medium. Type immunity violation — Poison/Steel types would be poisoned when they should be immune. Missing CS application means the target doesn't get the -2 SpDef debuff. Missing event means blessings like Safeguard won't trigger consumption.

**Fix:** Replace the IIFE block with `applyStatus`:
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

This gives the handler type immunity, auto-CS, and event emission for free. The explicit `source` parameter overrides `applyStatus`'s default of `ctx.effectSource`, correctly attributing the poison to the trait rather than the move.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Correctness (entity confusion class) | 1 | 138 |
| Correctness (event schema) | 1 | 139 |
| Correctness (status bypass) | 1 | 140 |

**Overall assessment:** Findings 136 and 137 are cleanly resolved — dead code removed, unused export deleted. Finding 135's fix is correct for the `'self'` path but incomplete — the semantically equivalent `undefined` path (the third recurrence of the entity confusion class) still resolves the lens to the opponent. This is the same root cause that has appeared in findings 120, 135, and now 138: `resolveTargetLens`'s default of `ctx.target` doesn't match every caller's default semantics.

Findings 139 and 140 are both in the Poison Coated Natural Weapon handler. The accuracy-roll-vs-damage-amount confusion (139) is a misunderstanding of the event schema combined with a design gap (`TriggerEvent` lacks `accuracyRoll`). The `applyStatus` bypass (140) is the more consequential issue — it creates a type immunity violation where Poison/Steel types would be incorrectly poisoned, and the missing auto-CS and event emission break downstream invariants.

**Status:** Fifteenth adversarial review complete (findings 138–140). Three correctness findings — one entity confusion recurrence, one event schema misinterpretation, one status utility bypass.
