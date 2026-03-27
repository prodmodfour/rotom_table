# 2026-03-26 — Adversarial Review: Findings 120–126 Resolutions (Findings 127–131)

Reviewed post 45 (findings 120–126 resolutions) against the engine code, documentation vault, PTR vault, and SE principles. Verified all 7 resolutions against the actual code. Found 5 issues — 1 type safety regression introduced by the fix for 120, 1 type-widening survivor from 123, 2 type cast escapes that emerged from the 123 narrowing work, and 1 test adequacy gap in the 120 fix.

## Verification summary

**Finding 120 (target lens resolution):** Fix verified. `damage.ts:47-49` and `damage.ts:125-127` both use `params.target ? ctx.allCombatants.find(...) ?? ctx.target : ctx.target`. The ternary correctly falls through to `ctx.target` only when no target is specified. Semantics correct.

**Finding 121 (max HP / level):** Fix verified. `level: number | null` added to `HasIdentity` (`lens.ts:31`). Pokemon lenses carry level; trainers carry `null`. All three inline sites replaced: `damage.ts:130` calls `tickValue(targetLens, targetLens.level ?? undefined)`, `combat.ts:122` calls `tickValue(targetLens, targetLens.level ?? undefined)`, `moves.ts:408` calls `maxHp(ctx.user, ctx.user.level ?? undefined)`. The `stat.ts` functions `maxHp` and `tickValue` correctly dispatch on `entityType`. `stat.test.ts` confirms Pokemon HP = `(Level * 5) + (HP stat * 3) + 10` and Trainer HP = `(HP stat * 3) + 10`. Throws on Pokemon without level.

**Finding 122 (as any cast):** Fix verified. `isTriggerContext` type guard at `damage.ts:151-153`. `resolveTarget` at `damage.ts:155-160` uses narrowing instead of `as any`. No `as any` casts remain anywhere in `packages/engine/src/`.

**Finding 123 (six type widenings):** Fix verified for 5 of 6. `TriggerRegistration.eventType` → `CombatEventType` (`effect-contract.ts:84`). `StatusInstance.appliedCombatStages` → `Record<CombatStatKey, number>` (`lens.ts:84`). `StatusInstance.condition` → `StatusType` (`lens.ts:82`). `VolatileInstance.condition` → `VolatileType` (`lens.ts:88`). `weatherIs` parameter → `WeatherType` (`combat.ts:309`). New `StatusType` and `VolatileType` unions created (`lens.ts:77-79`). Sixth widening (see finding 128).

**Finding 124 (DamageClass + 'status'):** Fix verified. `base.ts:7` declares `'physical' | 'special' | 'status'`. All 16 status moves in `moves.ts` declare `damageClass: 'status'`. Beat Up retains `'physical'`.

**Finding 125 (PassiveEffectSpec write-only):** Accepted as debt per the developer's post. Exit criterion revised to 38/45 evaluated + 7/45 expressed-but-inert. Consistent with the deferral to R1.1.

**Finding 126 (test factory dedup):** Fix verified. `tests/test-helpers.ts` exports `makeLens`, `makeCtx`, `makeTriggerCtx`, `makeEncounter`, `makeResolution`. All 5 test files import from `./test-helpers`. No local `makeLens`, `makeCtx`, or `makeTriggerCtx` definitions remain in any test file. Default lens includes `level: 10`.

**Compile + tests:** `npx tsc --noEmit` — clean. `npx vitest run` — 138 tests pass (7 files).

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 127 | `dealDamage` / `dealTickDamage` target lens lookup returns `undefined` when `allCombatants` doesn't contain the ID — `find()` returns `CombatantLens | undefined`, but `targetLens` is typed as `CombatantLens` via fallback | Type Safety | Narrowing gap |
| 128 | `STATUS_TYPE_IMMUNITIES` keyed by `Record<string, PokemonType[]>` — survived finding 123 | Type Safety | 123-series survivor |
| 129 | `applyStatus` casts `params.condition as StatusType` and `as VolatileType` — unsafe when `condition` is already the union `StatusType \| VolatileType` | Type Safety | Cast escape |
| 130 | `modifyFieldState` casts `params.type as WeatherType` and `as TerrainType` — a union param split by runtime branch | Type Safety | Cast escape |
| 131 | No test exercises the finding 120 fix — all tests still use uniform stats or default `params.target` | Test Adequacy | Missing coverage |

## Detail

### Finding 127 — Target lens lookup fallback masks `undefined` (Type Safety)

`damage.ts:47-49`:
```typescript
const targetLens = params.target
  ? ctx.allCombatants.find(c => c.id === targetId) ?? ctx.target
  : ctx.target
```

The `?? ctx.target` fallback silently substitutes the wrong entity when a specified target ID doesn't match any combatant in `allCombatants`. The developer's post describes this as handling "the impossible case where the ID doesn't match any combatant." If it's impossible, the correct response is an error, not silent substitution.

This is the [[null-object-pattern]] SE note's "key constraint": "A Null Object does not transform into a Real Object. If the object may later start providing real behavior, use State or Proxy instead." Here, `ctx.target` acts as a null object fallback — but it IS a real entity with real stats. Using it silently produces wrong damage calculations with no error trail, which is exactly the class of bug that finding 120 was about.

The identical pattern exists at `damage.ts:125-127` (dealTickDamage).

**Severity:** Low. The post correctly identifies this as an impossible case in current code. But the "impossible" case was also what masked the original bug (finding 120) — tests passed because the wrong entity happened to have the same stats. A defensive `throw` on lookup failure would have caught finding 120 immediately.

**Proposed fix:**
```typescript
const targetLens = params.target
  ? ctx.allCombatants.find(c => c.id === targetId)
    ?? (() => { throw new Error(`Target ${targetId} not found in allCombatants`) })()
  : ctx.target
```

Or extract as a helper that returns `CombatantLens` or throws, following the same pattern as `maxHp` which throws on missing level.

### Finding 128 — `STATUS_TYPE_IMMUNITIES` key type is `string` (Type Safety — 123-series)

`status.ts:31`:
```typescript
const STATUS_TYPE_IMMUNITIES: Record<string, PokemonType[]> = {
  paralyzed: ['electric'],
  burned: ['fire'],
  frozen: ['ice'],
  poisoned: ['poison', 'steel'],
  'badly-poisoned': ['poison', 'steel'],
  stuck: ['ghost'],
  trapped: ['ghost'],
}
```

Finding 123 narrowed `StatusInstance.condition` to `StatusType` and `VolatileInstance.condition` to `VolatileType`. This constant maps conditions to their immune types — it should be keyed by `StatusType`, not `string`. Currently `STATUS_TYPE_IMMUNITIES['burnned']` compiles with no error.

This is [[primitive-obsession-smell]] — the SE vault note says "using primitive types (strings, numbers, booleans) instead of small objects for domain concepts." `StatusType` is the domain concept; `string` is the primitive standing in for it.

**Fix:** `Record<StatusType, PokemonType[]>` — the values align exactly with the `StatusType` union members. The `stuck` and `trapped` entries are for the `StatusType` union (persistent conditions with Ghost immunity), not volatiles, so the key type is `StatusType` alone.

### Finding 129 — Unsafe `as StatusType` / `as VolatileType` casts in `applyStatus` (Type Safety)

`status.ts:90`:
```typescript
condition: params.condition as StatusType,
```

`status.ts:105`:
```typescript
condition: params.condition as VolatileType,
```

`ApplyStatusParams.condition` is `StatusType | VolatileType`. The function branches on `params.category` to decide whether to create a `StatusMutation` or `VolatileMutation`, and casts the condition to the narrower type. The same pattern at `status.ts:133` and `status.ts:137` in `removeStatus`.

The cast is unsafe — nothing prevents `applyStatus({ category: 'persistent', condition: 'confused' })` from compiling. `'confused'` is a `VolatileType` member, not a `StatusType` member, but the cast silently accepts it.

This is the same class of escape hatch that finding 122 fixed for `as any`. The `as` keyword overrides TypeScript's type narrowing — per [[typescript-pattern-techniques]], the correct approach is a type guard or overloaded signatures.

**Fix option A — overloaded function signatures:**
```typescript
export function applyStatus(ctx: EffectContext, params: { category: 'persistent'; condition: StatusType; source?: EffectSource }): EffectResult
export function applyStatus(ctx: EffectContext, params: { category: 'volatile'; condition: VolatileType; source?: EffectSource }): EffectResult
export function applyStatus(ctx: EffectContext, params: ApplyStatusParams): EffectResult {
  // implementation unchanged
}
```

**Fix option B — discriminated union for params:**
```typescript
type ApplyStatusParams =
  | { category: 'persistent'; condition: StatusType; source?: EffectSource }
  | { category: 'volatile'; condition: VolatileType; source?: EffectSource }
```

Either approach eliminates the cast and makes `applyStatus({ category: 'persistent', condition: 'confused' })` a compile error. The same treatment applies to `removeStatus`.

### Finding 130 — Unsafe `as WeatherType` / `as TerrainType` casts in `modifyFieldState` (Type Safety)

`field-state.ts:28`:
```typescript
weather: { op: 'set', type: params.type as WeatherType, roundsRemaining: params.rounds ?? 5 },
```

`field-state.ts:34`:
```typescript
terrain: { op: 'set', type: params.type as TerrainType, roundsRemaining: params.rounds ?? 5 },
```

`ModifyFieldStateParams.type` is `WeatherType | TerrainType | undefined`. The function branches on `params.field` and casts to the narrower type. Same pattern as finding 129 — the cast allows `modifyFieldState(ctx, { field: 'weather', op: 'set', type: 'grassy' })` to compile even though `'grassy'` is a `TerrainType`, not a `WeatherType`.

**Fix — discriminated union:**
```typescript
type ModifyFieldStateParams =
  | { field: 'weather'; op: 'set'; type: WeatherType; rounds?: number }
  | { field: 'terrain'; op: 'set'; type: TerrainType; rounds?: number }
  | { field: 'weather' | 'terrain'; op: 'clear' }
```

The runtime branches already exist. The type system should mirror them.

### Finding 131 — Finding 120 fix has no targeted test (Test Adequacy)

Finding 120 was a correctness bug where `dealDamage` and `dealTickDamage` ignored explicit target entity IDs and used `ctx.target`'s stats instead. The fix changes the ternary condition from `params.target === 'event-source'` to `params.target` (truthy check).

No test in the suite exercises this specific behavior — passing an explicit entity ID that differs from `ctx.target` and verifying the correct entity's stats are used. The tests that existed before the fix (Rough Skin, Dry Skin in `handlers.test.ts`) still use `makeTriggerCtx` which creates user and target with **identical stats** (`hp: 10` for both). The original review (finding 120) noted this exact masking problem: "The test factories create user and target with identical stats, so the wrong lens lookup produces the same tick value."

The fix is correct (verified by code reading), but the test suite still cannot distinguish between "uses correct entity's stats" and "uses `ctx.target`'s stats" because both entities have HP stat 10. This is [[dead-code-smell]] applied to test assertions — the assertion passes regardless of whether the fix works.

This is the same test-masking pattern that allowed finding 120 to exist in the first place. If the fix regresses, no test will catch it.

**Fix:** Add a test where user and target have different HP stats, pass an explicit target to `dealTickDamage`, and verify the tick damage is computed from the specified target's max HP, not `ctx.target`'s max HP:

```typescript
it('uses specified target stats, not ctx.target stats', () => {
  const specifiedTarget = makeLens({ id: 'specified', hp: 50, level: 10 })
  const ctx = makeCtx({
    target: { stats: { hp: 10, /* ... */ } },
    allCombatants: [/* user, target, specifiedTarget */],
  })
  const result = dealTickDamage(ctx, { ticks: 1, target: 'specified' })
  // Tick should be based on specified target's max HP (190), not ctx.target's (90)
  const dmg = Math.abs(result.combatantDeltas.get('specified')!.hpDelta!)
  expect(dmg).toBe(19)  // floor(190/10), not 9
})
```

## Summary

| Severity | Count | Findings |
|---|---|---|
| Type Safety (narrowing gap) | 1 | 127 |
| Type Safety (123-series) | 1 | 128 |
| Type Safety (cast escape) | 2 | 129, 130 |
| Test Adequacy | 1 | 131 |

**Overall assessment:** All 7 findings from the eleventh review are genuinely resolved. The two correctness bugs (120, 121) are fixed. The type system is substantially tighter — `StatusType`, `VolatileType`, `CombatEventType`, `WeatherType`, and `CombatStatKey` now prevent misspelled string literals across the core type surface.

The findings in this review are lower severity than the previous round. There are no correctness bugs. Findings 128–130 are type-safety hygiene — the same "narrower type exists, use it" principle that has driven findings since 109, applied to locations that the 123 sweep missed or that the 123 fix itself introduced. Finding 127 is a defensive coding suggestion. Finding 131 is the most actionable — the test suite should prove the fix works, not just assume it.

**Ring 1 readiness:** Unblocked. The correctness foundation is solid. The type widenings (128–130) are cosmetic safety — they cannot produce runtime bugs that don't already exist as logic errors. Finding 131 should be addressed to prevent regression of the most consequential fix in this cycle.

**Status:** Twelfth adversarial review complete (findings 127–131). Zero correctness bugs. The type-tightening campaign continues with diminishing returns — the remaining widenings are in utility internals, not in the handler-facing API.
