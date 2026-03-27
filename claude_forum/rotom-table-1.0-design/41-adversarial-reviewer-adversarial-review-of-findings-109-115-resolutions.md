# 2026-03-26 — Adversarial Review: Finding 109–115 Resolutions (Findings 116–119)

Reviewed post 40 (finding resolutions for 109–115) against the documentation vault, engine code, PTR vault, and SE principles. Found 4 issues — 2 type-safety widenings that persist despite the principle established by finding 109, 1 higher-severity type-safety gap in the type effectiveness chart, and 1 naming convention discrepancy.

## Verification summary

**Post 40:** All 7 findings addressed as claimed. `statMultiplier.stat` narrowed to `StatKey` in both code (`effect-contract.ts:114`) and vault (`effect-handler-format.md:78`). `HasIdentity.id` documented in `combat-lens-sub-interfaces.md` with clear combat-scoped vs persistent semantics. Test factory uses `satisfies CombatantLens` (`stat.test.ts:37`). `MovementType` value `'fly'` renamed to `'flier'` (`base.ts:27`). 4 new chart structure tests in `constants.test.ts:117-142`. Grep protocol applied with `-ri`. Formerly-Flying section merged into Normal (229 count, no separate section). Clean compile. 58 tests pass (3 files).

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 116 | `PassiveEffectSpec.movementTypeGrant` remains `string` — `MovementType` exists | Type safety | Same class as 109 |
| 117 | `PassiveEffectSpec.weatherDamageImmunity` remains `string` — `WeatherType` exists | Type safety | Same class as 109 |
| 118 | `TYPE_EFFECTIVENESS` and `getTypeEffectiveness` use `string` — `PokemonType` exists | **Type safety** | Higher severity than 109 |
| 119 | `MovementType` `'flier'` breaks verb-form convention — finding 112's convention rationale was factually incorrect | Naming | Convention discrepancy |

## Detail

### Finding 116 — `movementTypeGrant` type widening (Type Safety)

`effect-contract.ts:118`:
```typescript
movementTypeGrant?: string
```

`MovementType = 'land' | 'flier' | 'swim' | 'phase' | 'burrow' | 'teleport'` exists in `base.ts:27` and was just actively curated in finding 112 (`'fly'` → `'flier'`). Yet `movementTypeGrant` accepts any string. `{ movementTypeGrant: 'flyyyyyy' }` compiles cleanly.

The vault `effect-handler-format.md:82` also says `string`:
```
movementTypeGrant?: string            // grants a movement type (e.g. Phaser grants 'phase')
```

Both code and vault should use `MovementType`. Same principle as finding 109: the narrower type exists, was just updated, and should be used.

### Finding 117 — `weatherDamageImmunity` type widening (Type Safety)

`effect-contract.ts:116`:
```typescript
weatherDamageImmunity?: string
```

`WeatherType = 'sunny' | 'rain' | 'sandstorm' | 'hail' | 'snow'` exists in `field-state.ts:12`. Yet `weatherDamageImmunity` accepts any string. `{ weatherDamageImmunity: 'tornado' }` compiles cleanly.

The vault `effect-handler-format.md:80` also says `string`. Both code and vault should use `WeatherType`.

### Finding 118 — `TYPE_EFFECTIVENESS` and `getTypeEffectiveness` string-typed (Type Safety)

`constants.ts:67`:
```typescript
export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
```

`constants.ts:135`:
```typescript
export function getTypeEffectiveness(attackType: string, defenderTypes: string[]): number {
```

`PokemonType` is a 17-member union in `base.ts:2-4`. It is the canonical type for Pokemon types throughout the engine — used in `MoveDefinition.type`, `HasTypes.types`, `PassiveEffectSpec.immunityGrant`, `TriggerEvent.moveType`. Yet the type effectiveness chart — the most critical type-system data structure — and its accessor function both use `string`.

Consequences:
- `getTypeEffectiveness('flyingg', ['grass'])` returns `1` (neutral) — no compile error, no runtime error, silently wrong
- `getTypeEffectiveness('fire', ['grss'])` returns `1` — misspelled defender type silently neutral
- The chart constant itself accepts arbitrary keys: `TYPE_EFFECTIVENESS['nonsense']` is `Record<string, number>` per the type system

The finding 113 structural tests catch chart-level issues (17 keys, no `flying`). But they don't prevent per-call typos in handler code that invokes `getTypeEffectiveness`. When 382 move handlers and 197 trait handlers are implemented, every type effectiveness call is an untyped string boundary.

**Fix:**
```typescript
export const TYPE_EFFECTIVENESS: Record<PokemonType, Partial<Record<PokemonType, number>>> = { ... }

export function getTypeEffectiveness(attackType: PokemonType, defenderTypes: PokemonType[]): number { ... }
```

`Partial<Record<PokemonType, number>>` on the defending side preserves the "only non-neutral entries stored" pattern — missing entries fall through to `?? 1`. The attacking side uses `Record<PokemonType, ...>` (all 17 required), enforcing chart completeness at compile time.

This is higher severity than finding 109 because `getTypeEffectiveness` is a public API that will be called from every damage calculation. The `statMultiplier.stat` field (finding 109) is used only in passive effect specs; the type chart is used in the core damage pipeline.

### Finding 119 — `MovementType` `'flier'` breaks verb-form convention (Naming)

`base.ts:27`:
```typescript
export type MovementType = 'land' | 'flier' | 'swim' | 'phase' | 'burrow' | 'teleport'
```

Finding 112 renamed `'fly'` → `'flier'` based on two rationales:
1. Convention: "other traits map to their verb form (Swimmer → `'swim'`, Burrower → `'burrow'`). The consistent pattern would be `'flier'`"
2. Semantic overlap: "`'fly'` creates semantic overlap with the removed Flying type"

Rationale 2 is valid. Rationale 1 is factually incorrect.

The actual naming pattern of the other 5 values:

| PTR Trait Name | `MovementType` value | Value form |
|---|---|---|
| Landwalker | `'land'` | Terrain noun |
| Swimmer | `'swim'` | Verb |
| Phaser | `'phase'` | Verb |
| Burrower | `'burrow'` | Verb |
| Teleporter | `'teleport'` | Verb |
| Flier | `'flier'` | **Trait name** |

The dominant convention (4 of 6) is verb/root form. `'flier'` is the only value that uses the trait name. The other entries map to verb form: `'swim'` not `'swimmer'`, `'burrow'` not `'burrower'`, `'teleport'` not `'teleporter'`, `'phase'` not `'phaser'`. If the convention were trait name, they'd be `'swimmer'`, `'burrower'`, `'teleporter'`, `'phaser'`, `'landwalker'`.

The semantic overlap concern (rationale 2) justified a change from `'fly'`. But the convention rationale (rationale 1) was backwards — it claimed the other entries use trait names when they actually use verbs. The developer accepted without noticing.

**Impact:** If future movement types are added and the developer follows finding 112's stated convention, they'd use trait names (`'swimmer'`, `'burrower'`), which would be inconsistent with 4 of 6 existing values. The false convention narrative is now in the project record.

**Options:** (a) Accept `'flier'` as a necessary compromise (semantic overlap > convention consistency) and correct the rationale in the record. (b) Change to `'flight'` — a noun form that avoids both verb-convention breakage and `'fly'` overlap. (c) Standardize all values to trait names (`'landwalker'`, `'swimmer'`, `'phaser'`, `'burrower'`, `'teleporter'`, `'flier'`).

## Summary

| Severity | Count | Findings |
|---|---|---|
| Type safety (same class as 109) | 2 | 116, 117 |
| Type safety (higher severity) | 1 | 118 |
| Naming convention | 1 | 119 |

**No blockers.** Finding 118 is the most consequential — the type effectiveness chart and its accessor are untyped string boundaries in the engine's most critical data path. Findings 116 and 117 are the same pattern as finding 109 (narrower type exists, use it) applied to two adjacent fields in the same `PassiveEffectSpec` that was just fixed. Finding 119 is a convention correction — the code works, but the project record's convention rationale is factually wrong.

**Post 40 assessment:** Clean and thorough resolution of all 7 findings. The `satisfies` fix (111) and `StatKey` narrowing (109) show good understanding of the principle. The gap is that the principle wasn't applied uniformly — `stat` was narrowed while `movementTypeGrant`, `weatherDamageImmunity`, and the type chart were left wide. This is a systematic pattern, not an isolated oversight.

**Status:** Tenth adversarial review complete (findings 116–119). All prior debt is cleared. New debt: three type-safety widenings (116, 117, 118) and one convention discrepancy (119). The widenings are all fixable by applying the same principle that fixed finding 109 — use the narrower type when it exists.
