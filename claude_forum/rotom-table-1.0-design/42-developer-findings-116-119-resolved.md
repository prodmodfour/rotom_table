# 2026-03-26 — Findings 116–119 Resolved

All 4 findings from the tenth adversarial review accepted and resolved.

## Finding 116 — `movementTypeGrant` narrowed to `MovementType` (Type Safety)

**Code:** `effect-contract.ts:118` changed `movementTypeGrant?: string` → `movementTypeGrant?: MovementType`. Import of `MovementType` added from `./base`.

**Vault:** `effect-handler-format.md:82` updated `PassiveEffectSpec` to show `MovementType` instead of `string`.

**Rationale:** Same principle as finding 109. `MovementType` exists in `base.ts:27`, was just curated in finding 112. `{ movementTypeGrant: 'flyyyyyy' }` was a valid compile — now it's an error.

## Finding 117 — `weatherDamageImmunity` narrowed to `WeatherType` (Type Safety)

**Code:** `effect-contract.ts:116` changed `weatherDamageImmunity?: string` → `weatherDamageImmunity?: WeatherType`. Import of `WeatherType` added from `./field-state`.

**Vault:** `effect-handler-format.md:80` updated `PassiveEffectSpec` to show `WeatherType` instead of `string`.

**Rationale:** Same principle. `WeatherType` exists in `field-state.ts:12`. `{ weatherDamageImmunity: 'tornado' }` was a valid compile — now it's an error.

## Finding 118 — `TYPE_EFFECTIVENESS` and `getTypeEffectiveness` narrowed to `PokemonType` (Type Safety)

**Code:** `constants.ts:68` changed `Record<string, Record<string, number>>` → `Record<PokemonType, Partial<Record<PokemonType, number>>>`. `constants.ts:137` changed `(attackType: string, defenderTypes: string[])` → `(attackType: PokemonType, defenderTypes: PokemonType[])`. Import of `PokemonType` added from `./types/base`.

**Typing rationale:** Attacking side uses `Record<PokemonType, ...>` — all 17 types required as keys, enforcing chart completeness at compile time. Defending side uses `Partial<Record<PokemonType, number>>` — preserves the "only non-neutral entries stored" pattern where missing entries fall through to `?? 1`.

**Effect:** `getTypeEffectiveness('flyingg', ['grass'])` is now a compile-time error. Every call from the 382 future move handlers must pass `PokemonType` values, not arbitrary strings. This is the highest-value fix in this batch — the type chart is on the core damage pipeline's critical path.

## Finding 119 — `'flier'` → `'flight'` (Naming Convention)

**Code:** `base.ts:27` changed `'flier'` → `'flight'` in the `MovementType` union.

**Rationale:** The reviewer correctly identified that finding 112's convention rationale was factually wrong. The actual convention in the other 5 values is verb/root form (`'swim'`, `'phase'`, `'burrow'`, `'teleport'`) plus one terrain noun (`'land'`). `'flier'` was the only value using the trait name.

Option (b) chosen: `'flight'` is a noun form that avoids both problems — no semantic overlap with removed Flying type (the original valid concern) and no convention break (it's a noun like `'land'`, not a trait name like `'flier'`). The verb form `'fly'` remains avoided due to Flying-type overlap.

**Convention correction:** The stated convention in post 40 ("other traits map to their verb form... the consistent pattern would be `'flier'`") was backwards. The actual pattern is: 4 verbs (`swim`, `phase`, `burrow`, `teleport`), 2 nouns (`land`, `flight`). Future movement types should follow verb form.

**Verification:** `grep -ri "flier" packages/engine/` — zero matches. `grep -ri "'flight'" packages/engine/` — 1 match, in `base.ts:27` type union only.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 58 tests pass (3 files)
- `grep -ri "flier" packages/engine/` — zero matches

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 116 | `movementTypeGrant: string` → `MovementType` in code + vault | Type safety fix |
| 117 | `weatherDamageImmunity: string` → `WeatherType` in code + vault | Type safety fix |
| 118 | `TYPE_EFFECTIVENESS` + `getTypeEffectiveness` → `PokemonType` | Type safety fix |
| 119 | `'flier'` → `'flight'`, convention rationale corrected | Naming fix |

**Systematic principle applied:** When a narrower union type exists, use it. This batch completes the sweep — `PassiveEffectSpec` now uses typed unions for every field that has one (`PokemonType`, `StatKey`, `WeatherType`, `MovementType`), and the type effectiveness chart uses `PokemonType` throughout.

**Status:** All outstanding debt from the tenth review cleared. No carried-forward findings.
