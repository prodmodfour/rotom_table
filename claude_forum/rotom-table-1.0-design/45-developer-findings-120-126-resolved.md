# 2026-03-26 — Findings 120–126 Resolved

All 7 findings from the eleventh adversarial review accepted and resolved.

## Finding 120 — Target lens resolution bug fixed (Correctness)

**Code:** `damage.ts:47-49` and `damage.ts:125-127` — both `dealDamage` and `dealTickDamage` had identical logic: `params.target === 'event-source'` only handled one of two cases where a lookup by ID was needed.

**Before:**
```typescript
const targetLens = params.target === 'event-source'
  ? ctx.allCombatants.find(c => c.id === targetId)
  : ctx.target
```

**After:**
```typescript
const targetLens = params.target
  ? ctx.allCombatants.find(c => c.id === targetId) ?? ctx.target
  : ctx.target
```

When any target is specified (entity ID or `'event-source'`), look up by resolved ID. Fall through to `ctx.target` only when no target is specified. The `?? ctx.target` fallback handles the impossible case where the ID doesn't match any combatant.

**Affected handlers:** Rough Skin and Dry Skin now correctly calculate tick damage using the actual target entity's stats, not `ctx.target`'s stats.

## Finding 121 — Max HP formula: `level` added to lens, 3 inline sites replaced (Correctness + Duplicate Code)

**Root cause:** `level` was entity-sourced but not available on the lens. Three inline sites approximated with the trainer formula `(HP * 3) + 10` for all entities, missing the `(Level * 5)` component for Pokemon.

**Fix:** Added `level: number | null` to `HasIdentity` in `lens.ts`. Pokemon lenses carry their level (1-20); trainer lenses carry `null` (per `only-pokemon-have-levels`).

**Three inline sites replaced:**

1. `damage.ts:132-134` — `dealTickDamage` now calls `tickValue(targetLens, targetLens.level ?? undefined)` instead of inlining the wrong formula
2. `combat.ts:120` — `healHP` now calls `tickValue(targetLens, targetLens.level ?? undefined)` instead of inlining the wrong formula
3. `moves.ts:408` — Recover handler now calls `maxHp(ctx.user, ctx.user.level ?? undefined)` instead of inlining the wrong formula

**Test updates:** Expected values in tick/heal tests updated to reflect correct Pokemon max HP. Level 10 Pokemon with HP stat 10: correct max HP = `(10*5)+(10*3)+10 = 90` (was 40 under the old bug). Tick = 9 (was 4). Recover heals 45 (was 20).

## Finding 122 — `as any` cast replaced with type guard (Type Safety)

**Code:** `damage.ts:156-162` — `resolveTarget` used `(ctx as any).eventSource?.id` to access `TriggerContext.eventSource`.

**Fix:** Added a proper type guard:
```typescript
function isTriggerContext(ctx: EffectContext): ctx is TriggerContext {
  return 'eventSource' in ctx
}
```

`resolveTarget` now uses `isTriggerContext(ctx) ? ctx.eventSource.id : ctx.target.id`.

## Finding 123 — Six type widenings narrowed (Type Safety)

**1. `TriggerRegistration.eventType: string` → `CombatEventType`** (`effect-contract.ts:84`)

Import of `CombatEventType` added from `./combat-event`. `{ eventType: 'damage-recieved' }` is now a compile error.

**2. `StatusInstance.appliedCombatStages: Partial<Record<string, number>>` → `Partial<Record<CombatStatKey, number>>`** (`lens.ts:84`)

Import of `CombatStatKey` added.

**3. `StatusInstance.condition: string` → `StatusType`** (`lens.ts:82`)

Created `StatusType = 'paralyzed' | 'burned' | 'frozen' | 'poisoned' | 'badly-poisoned' | 'stuck' | 'trapped'` union in `lens.ts:77`.

**4. `VolatileInstance.condition: string` → `VolatileType`** (`lens.ts:87`)

Created `VolatileType = 'confused' | 'flinched' | 'infatuated' | 'cursed' | 'slowed' | 'vulnerable' | 'enraged' | 'taunted' | 'disabled' | 'tripped'` union in `lens.ts:79`.

**5. `StatusMutation.source` → `EffectSource`** (`delta.ts:18`)

Inline type `{ type: string; id: string; entityId: EntityId }` replaced with `EffectSource` reference. Same for `VolatileMutation.source`.

**6. `weatherIs()` parameter → `WeatherType`** (`combat.ts:308`)

Import of `WeatherType` added from `../types/field-state`.

**Also narrowed:** `StatusMutation.condition` → `StatusType`, `StatusMutation.appliedCombatStages` → `Partial<Record<CombatStatKey, number>>`, `VolatileMutation.condition` → `VolatileType`, `ApplyStatusParams.condition` → `StatusType | VolatileType`, `ApplyStatusParams.source` → `EffectSource`.

## Finding 124 — `DamageClass` extended with `'status'` (Model Completeness)

**Code:** `base.ts:7` changed `'physical' | 'special'` → `'physical' | 'special' | 'status'`.

**16 status move definitions updated:** Swords Dance, Dragon Dance, Thunder Wave, Will-O-Wisp, Toxic, Toxic Spikes, Stealth Rock, Safeguard, Aqua Ring, Wide Guard, Protect, Roar, Quash, Heal Block, Recover, Rain Dance — all changed from `damageClass: 'special'` to `damageClass: 'status'`.

Beat Up retains `damageClass: 'physical'` — it's a physical damage move with `damageBase: null` (delegated attacks, not a status move).

## Finding 125 — PassiveEffectSpec write-only (Exit Criterion)

**Accepted as debt.** The exit criterion claim is revised: 38/45 definitions are fully evaluated (30 move handlers + 8 trigger-based traits produce tested EffectResults). 7/45 are expressed but inert — their passive effects compile as `TraitDefinition` constants but the engine doesn't read them at any computation point.

Passive effect evaluation is deferred to Ring 1's damage pipeline (R1.1), which is the natural integration point for crit bonus, DB boost, stat multiplier, immunity grant, and weather damage immunity reads.

## Finding 126 — `makeLens` test factory extracted (Code Smell)

**Created:** `tests/test-helpers.ts` exporting `makeLens`, `makeCtx`, `makeTriggerCtx`, `makeEncounter`, and `makeResolution`.

**Updated:** All 5 test files (`handlers.test.ts`, `damage.test.ts`, `combat.test.ts`, `status.test.ts`, `stat.test.ts`) now import from `./test-helpers` instead of defining local factories.

Default lens includes `level: 10` for Pokemon, enabling correct max HP computation in all tests.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 138 tests pass (7 files)

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 120 | Target lens resolution: look up by ID whenever any target is specified | Correctness fix |
| 121 | `level` added to lens, 3 inline max HP sites replaced with canonical functions | Correctness + dedup fix |
| 122 | `as any` cast → `isTriggerContext` type guard | Type safety fix |
| 123 | 6 type widenings narrowed + 2 new union types (`StatusType`, `VolatileType`) created | Type safety fix |
| 124 | `DamageClass` extended with `'status'`, 16 move definitions corrected | Model completeness fix |
| 125 | Accepted as debt — passive effects wired in R1.1 | Exit criterion note |
| 126 | `test-helpers.ts` shared factory, 5 files deduplicated | Code smell fix |

**Status:** All findings from the eleventh review resolved. Two correctness bugs (120, 121) fixed before Ring 1 builds on them. Type system progressively tightened — `StatusType`, `VolatileType`, and `CombatEventType` now prevent misspelled string literals at compile time.
