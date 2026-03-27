# 2026-03-27 — Adversarial Review: Findings 127–131 Resolutions (Findings 132–134)

Reviewed post 47 (findings 127–131 resolutions) against the engine code, documentation vault, and SE principles. Verified all 5 resolutions against the actual code. Found 3 issues — 1 primitive obsession survivor from the 123-series, 1 consistency gap where the new defensive pattern from 127 wasn't applied to analogous functions, and 1 type-widening leftover in the delta model.

## Verification summary

**Finding 127 (silent fallback → throw):** Fix verified. `resolveTargetLens` at `damage.ts:154-158` throws on lookup failure. Both `dealDamage` (line 48) and `dealTickDamage` (line 124) call it. Comment at line 153 documents the rationale ("silent substitution masked finding 120"). Semantics correct.

**Finding 128 (`STATUS_TYPE_IMMUNITIES` key type):** Fix verified. `status.ts:28` declares `Partial<Record<StatusType, PokemonType[]>>`. `Partial` is correct — not every `StatusType` has an immunity entry. `STATUS_TYPE_IMMUNITIES['burnned']` is now a compile error.

**Finding 129 (discriminated unions for status params):** Fix verified. `ApplyStatusParams` at `status.ts:14-16` and `RemoveStatusParams` at `status.ts:18-20` are both discriminated unions. Zero `as StatusType` or `as VolatileType` casts remain. The type immunity check is correctly scoped to `params.category === 'persistent'` (line 44), which both matches the game rule (only persistent conditions have type immunities per `type-grants-status-immunity.md`) and satisfies the type system (`params.condition` narrows to `StatusType` inside that branch).

**Finding 130 (discriminated union for field state params):** Fix verified. `ModifyFieldStateParams` at `field-state.ts:15-18` is a three-variant discriminated union. The function body at lines 23-37 branches on `params.op` first (clear vs set), then on `params.field` — clean and readable. Zero `as` casts.

**Finding 131 (regression tests for finding 120):** Fix verified. `damage.test.ts:106-123` creates a specified target with HP stat 50 (max HP = 210, tick = 21) while `ctx.target` has HP stat 10 (max HP = 90, tick = 9). The test asserts `dmg === 21`, which fails if `ctx.target` stats are used instead. `damage.test.ts:126-131` verifies the throw on nonexistent ID. Both tests are well-constructed — they would have caught finding 120 immediately.

**Compile + tests:** `npx tsc --noEmit` — clean. `npx vitest run` — 140 tests pass (7 files).

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 132 | `targetHasStatus` parameter `condition: string` — survived the 123-series type narrowing | Type Safety | 123-series survivor |
| 133 | `healHP` and `displaceEntity` silently return `noEffect()` on target lookup failure — inconsistent with `resolveTargetLens` pattern from finding 127 | Consistency | Defensive coding gap |
| 134 | `StatusMutation.category` typed `'persistent' \| 'volatile'` but only used for persistent — type allows nonsensical `{ category: 'volatile', condition: 'burned' }` | Type Safety | Widening leftover |

## Detail

### Finding 132 — `targetHasStatus` condition param is `string` (Type Safety — 123-series)

`combat.ts:301`:
```typescript
export function targetHasStatus(ctx: EffectContext, condition: string): boolean {
  return ctx.target.statusConditions.some(s => s.condition === condition)
}
```

The function compares `condition` against `StatusInstance.condition`, which is typed `StatusType`. The `string` parameter accepts any string, including misspelled conditions: `targetHasStatus(ctx, 'paralysed')` compiles with no error and silently returns `false`.

This is [[primitive-obsession-smell]] — the SE vault note says "using primitive types (strings, numbers, booleans) instead of small objects for domain concepts." `StatusType` is the domain concept; `string` is the primitive standing in for it. Same class of issue as finding 128 (`STATUS_TYPE_IMMUNITIES` keyed by `string`).

Additionally, the function only checks `statusConditions` (persistent), not `volatileConditions`. The name `targetHasStatus` is ambiguous about which category it queries. If volatile support is intended later, the signature should be `condition: StatusType | VolatileType` with both arrays checked. If it's persistent-only, the parameter should be `StatusType` and the name could be more precise.

**Severity:** Low. The function is currently exported but unused in handlers — no caller can trigger the misspelling bug today. But as a public API surface, it should match the type-safety standard established by the rest of the utility layer.

**Fix:** `condition: StatusType` if persistent-only. If both categories: overloaded or union-based, with both arrays queried.

### Finding 133 — `healHP` and `displaceEntity` silent `noEffect()` on target lookup failure (Consistency)

`combat.ts:117-118`:
```typescript
const targetLens = ctx.allCombatants.find(c => c.id === targetId)
if (!targetLens) return noEffect()
```

`combat.ts:179-180`:
```typescript
const targetLens = ctx.allCombatants.find(c => c.id === targetId)
if (!targetLens) return noEffect()
```

Finding 127 established the principle that silent fallback on target lookup masks bugs — it was the pattern that allowed finding 120 to exist undetected. The developer's post states: "Same pattern as `maxHp` throwing on missing level — impossible states produce errors, not silent wrong answers." The `resolveTargetLens` helper in `damage.ts:154-158` implements this correctly by throwing.

But `healHP` and `displaceEntity` in `combat.ts` perform the same operation — look up a combatant by ID in `allCombatants` — and silently return `noEffect()` when the ID isn't found. If a move handler calls `healHP(ctx, { target: someId })` with an ID that isn't in `allCombatants`, the heal silently does nothing. No error, no event, no indication that the intended target wasn't found.

This is the same masking problem from finding 120 with a different failure mode: instead of using the wrong entity's stats (which produced wrong damage), it produces no effect at all. A test asserting "heal occurred" would catch it, but a test asserting "no error occurred" would pass silently — exactly the class of test-masking that findings 120 and 131 addressed.

The inconsistency also creates a [[shotgun-surgery-smell]] risk: if the team decides to change the target lookup strategy (e.g., adding logging, changing the error mode), `damage.ts` has the correct pattern and `combat.ts` has the old pattern. The lookup logic is duplicated rather than shared.

**Severity:** Low. Both `healHP` and `displaceEntity` default to `ctx.user.id` or `ctx.target.id` when no explicit target is provided, so the `find()` failure path only triggers on explicit IDs — which is the same "impossible in current usage" argument that was made for finding 127. But the 127 rationale accepted that impossible cases should throw precisely because "impossible" was wrong once before.

**Fix:** Extract `resolveTargetLens` to a shared utility (e.g., `utilities/resolve.ts` or added to `utilities/stat.ts`) and use it in `healHP` and `displaceEntity`. Both functions accept `'self' | EntityId`, so the resolution step would be: resolve `'self'` to `ctx.user.id`, then call `resolveTargetLens` for the ID lookup. The `noEffect()` path remains for genuinely optional targets, but explicit IDs that don't match should throw.

### Finding 134 — `StatusMutation.category` allows invalid `'volatile'` (Type Safety)

`delta.ts:14-20`:
```typescript
export interface StatusMutation {
  op: 'add' | 'remove'
  category: 'persistent' | 'volatile'
  condition: StatusType
  source?: EffectSource
  appliedCombatStages?: Partial<Record<CombatStatKey, number>>
}
```

`StatusMutation` is used exclusively in the `statusConditions` array of `StateDelta` (line 55). It represents mutations to persistent status conditions — volatile conditions have their own `VolatileMutation` type (lines 22-26) used in the separate `volatileConditions` array (line 56).

The `category: 'persistent' | 'volatile'` field allows `{ category: 'volatile', condition: 'burned' }` to compile — a persistent condition (`StatusType`) paired with a volatile category. This is the same class of "the type system allows a nonsensical combination" that finding 129 fixed for `ApplyStatusParams`.

Compare with `VolatileMutation`:
```typescript
export interface VolatileMutation {
  op: 'add' | 'remove'
  condition: VolatileType
  source?: EffectSource
}
```

`VolatileMutation` has no `category` field — it's implicitly volatile by virtue of being in the `volatileConditions` array. `StatusMutation` should follow the same design: either remove the `category` field (since the array name `statusConditions` already conveys "persistent"), or narrow it to `category: 'persistent'` as a literal type. The removal option is cleaner — it eliminates a redundant field that can only have one correct value, following the same principle that made `VolatileMutation` not carry a `category`.

**Severity:** Low. The `category` field is set correctly everywhere it's used (`status.ts:88` always sets `'persistent'`). The widening cannot produce a runtime bug in current code. But it's an asymmetry with `VolatileMutation` and a type-level invitation to construct invalid data.

**Fix:** Remove `category` from `StatusMutation`, or narrow to `category: 'persistent'`. If removed, update `status.ts:88` and `status.ts:132` to drop the `category` field from the mutation literal.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Type Safety (123-series survivor) | 1 | 132 |
| Consistency (defensive coding gap) | 1 | 133 |
| Type Safety (widening leftover) | 1 | 134 |

**Overall assessment:** All 5 findings from the twelfth review are genuinely resolved. The discriminated union work is well-executed — `ApplyStatusParams`, `RemoveStatusParams`, and `ModifyFieldStateParams` all correctly mirror their runtime branches at the type level. The `resolveTargetLens` helper and its regression tests close the most consequential bug in the cycle.

The findings in this review are the lowest severity yet. Finding 132 is a string survivor that slipped through the 123-series sweep. Finding 133 is a consistency observation — the principle from 127 is correct but incompletely applied. Finding 134 is a minor asymmetry in the delta model.

**Ring 1 readiness:** Unblocked. The type-safety surface is now clean — zero `as` casts, discriminated unions on all branching params, domain unions on all condition/weather/terrain types. The remaining findings are hygiene items that don't affect correctness. The engine's public API correctly rejects invalid inputs at compile time for the critical paths (damage, status, field state).

**Status:** Thirteenth adversarial review complete (findings 132–134). Zero correctness bugs. The type-tightening campaign is reaching natural completion — the remaining widenings are in secondary utility functions and delta model internals, not in the handler-facing API or core formulas.
