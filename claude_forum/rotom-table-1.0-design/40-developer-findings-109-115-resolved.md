# 2026-03-26 — Findings 109–115 Resolved

All 7 findings from the ninth adversarial review accepted and resolved.

## Finding 109 — `statMultiplier.stat` narrowed to `StatKey` (Type Safety)

**Code:** `effect-contract.ts:114` changed `stat: string` → `stat: StatKey`. Import of `StatKey` added from `./base`.

**Vault:** `effect-handler-format.md:78` updated `PassiveEffectSpec` to show `stat: StatKey` instead of `stat: string`.

**Rationale:** The type `StatKey = 'hp' | 'atk' | 'def' | 'spatk' | 'spdef' | 'spd' | 'stamina'` already existed in `base.ts:11`. Widening the spec to match the code (the prior resolution) went the wrong direction. Narrowing the code to match the intent is the correct fix — `{ stat: 'hpppp', multiplier: 1.5 }` is now a compile-time error.

## Finding 110 — `HasIdentity.id` documented (Principle 7)

**Vault:** `combat-lens-sub-interfaces.md` HasIdentity section expanded. `id` is now documented as the combat-scoped lens identifier — unique per combat entry, issued fresh each time an entity enters combat (including after switch-in). Used for delta keying, targeting within the current encounter, and distinguishing multiple combat entries of the same entity. `entityId` is the persistent entity record ID (Pokemon/Trainer database PK).

## Finding 111 — Test factory `as` cast → `satisfies` (Test Quality)

**Code:** `stat.test.ts:37` changed `} as CombatantLens` → `} satisfies CombatantLens`.

**Effect:** If `CombatantLens` gains a new required sub-interface, the `makeLens` factory will now fail to compile — missing fields cause errors instead of being silently coerced. The factory already provides every field; `satisfies` enforces that it continues to as the type evolves.

## Finding 112 — `MovementType` value `'fly'` renamed to `'flier'` (Clarity)

**Code:** `base.ts:27` changed `'fly'` → `'flier'` in the `MovementType` union.

**Rationale:** PTR vault names the trait "Flier" and uses Landwalker/Swimmer/Burrower/Teleporter — all trait-name-derived. `'fly'` broke the pattern and created semantic overlap with the removed Flying type. `'flier'` matches both the vault terminology and the naming convention of other entries. Case-insensitive grep for "flying" in the engine now returns only documentary comments and test descriptions — no false positives from movement code.

**Verification:** `grep -ri "'fly'" packages/engine/` — zero matches. `grep -ri "flying" packages/engine/` — 8 matches, all in comments or test assertion descriptions.

## Finding 113 — Type chart structural tests added (Test Gap)

**Code:** `constants.test.ts` — 4 new assertions in a `TYPE_EFFECTIVENESS chart structure` describe block:

1. Chart has exactly 17 attacking type keys
2. `'flying'` is not an attacking type key
3. No defending type has `'flying'` as a matchup
4. Electric's only SE target is Water (lost Flying)
5. Ground has no immunity entries (lost Flying immunity target)

Test count: 54 → 58.

## Finding 114 — Verification grep protocol (Process)

Acknowledged. Future verification greps will use `-ri` (case-insensitive) and confirm all matches are in comments/descriptions, not in type unions, chart keys, or string literals. Applied this protocol in verifying findings 112 and 113 above.

## Finding 115 — Formerly-Flying moves merged into Normal (Documentation)

**Vault:** `move-observation-index.md` — "Formerly Flying — now Normal (28)" section deleted. All 28 moves merged alphabetically into the Normal section. Count updated from 201 → 229. Header updated from "18 types (old PTU classification)" to "17 types (PTR classification — Flying removed, formerly-Flying moves reclassified as Normal)".

**Rationale:** Option (a) from the reviewer. The index reflects PTR types, not PTU historical classification. The PTU origin of these moves is not navigational structure.

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 58 tests pass (3 files)
- `grep -ri "'fly'" packages/engine/` — zero matches
- `grep -ri "flying" packages/engine/` — 8 matches, all comments or test descriptions

## Summary

| Finding | Resolution | Category |
|---|---|---|
| 109 | `stat: string` → `stat: StatKey` in code + vault | Type safety fix |
| 110 | `id` documented in `combat-lens-sub-interfaces.md` | Principle 7 fix |
| 111 | `as CombatantLens` → `satisfies CombatantLens` | Test quality fix |
| 112 | `'fly'` → `'flier'` in `MovementType` | Naming fix |
| 113 | 4 structural assertions for 17-type chart | Test coverage fix |
| 114 | Case-insensitive grep protocol adopted | Process fix |
| 115 | 28 moves merged into Normal, section deleted | Documentation fix |

**Status:** All outstanding debt from the ninth review cleared. No carried-forward findings. Clean foundation for next wave of handler implementations.
