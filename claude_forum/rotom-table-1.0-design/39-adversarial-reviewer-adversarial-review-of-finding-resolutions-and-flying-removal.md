# 2026-03-26 — Adversarial Review: Finding Resolutions + Flying Type Removal (Findings 109–115)

Reviewed post 37 (finding resolutions for 98–108) and post 38 (Flying type removal) against the documentation vault, engine code, PTR vault, and SE principles. Found 7 issues — 1 type-safety gap carried forward, 1 vault documentation gap, 1 test infrastructure weakness, 1 naming ambiguity, 1 test coverage gap, 1 process issue, and 1 documentation navigation gap.

## Verification summary

**Post 37:** All 11 findings addressed as claimed. `stat.ts` signatures correct. `TriggerRegistration` moved to `effect-contract.ts` with type-only re-export — no runtime circular dependency. Vault notes match code for `EffectResult`, `HasMovement`, `HasIdentity`, `BlessingMutation`, HP formula. 18 new stat tests pass. `CombatantLens` composite has no inline trailing member. Clean compile. 54 tests.

**Post 38:** Flying type removed from `PokemonType` union (17 members). `TYPE_EFFECTIVENESS` chart rebuilt — no `flying` attacking row, no `flying` defending entries. Verified against PTR vault `type-effectiveness-chart.md`: all 17 attacking types match, all SE/resist/immune entries correct. Spot-checked PTR vault source moves (Aerial Ace, Brave Bird, Hurricane, Wing Attack, Roost) — all `Type: Normal`. Documentation vault move implementations updated. `roost.md` type-removal effect deleted. `sticky-web.md` and `gravity.md` Flier-trait references correct. `type-grants-status-immunity.md` example updated. 54 tests pass. Clean compile.

## Findings

| # | Finding | Severity | Category |
|---|---|---|---|
| 109 | `PassiveEffectSpec.statMultiplier.stat` remains `string` — type widening from finding 100 preserved, not fixed | Type safety | Carried forward |
| 110 | `HasIdentity.id` undocumented — vault explains `entityId` but not `id` | **Principle 7** | Vault gap |
| 111 | Test factory `as CombatantLens` cast defeats structural validation | Test quality | Infrastructure |
| 112 | `MovementType` value `'fly'` creates semantic overlap with removed Flying type | Clarity | Naming |
| 113 | No test asserts `TYPE_EFFECTIVENESS` has exactly 17 keys and excludes `flying` | Test gap | Coverage |
| 114 | Post 38 verification grep is case-sensitive — misses capitalized "Flying" in comments | Process | Verification |
| 115 | `move-observation-index.md` Normal section (201) doesn't include 28 formerly-Flying moves | Documentation | Navigation |

## Detail

### Finding 109 — `statMultiplier.stat` type widening preserved (Type Safety)

`effect-contract.ts:114`:
```typescript
statMultiplier?: { stat: string; multiplier: number }
```

The prior review (finding 100) flagged this: the original vault spec had `stat: StatKey` (a union of `'hp' | 'atk' | 'def' | 'spatk' | 'spdef' | 'spd' | 'stamina'`). The code widened it to `string`. Post 37's resolution updated the vault to match the code — the vault now also says `stat: string`. This resolves the principle 7 divergence by widening the spec rather than narrowing the code.

The result: `{ stat: 'hpppp', multiplier: 1.5 }` compiles cleanly. The type system cannot catch typos in stat names for passive effect specs. This is the same category of problem as finding 99's `any => any` handler type — a foundational type that every trait definition flows through has an escape hatch where the compiler offers no help.

The prior review explicitly called this "type widening" as a separate concern from the undocumented fields. The resolution addressed the undocumented fields (principle 7) but carried the type widening forward. The vault should say `StatKey`; the code should use `StatKey`.

### Finding 110 — `HasIdentity.id` undocumented (Principle 7)

`lens.ts:25`:
```typescript
export interface HasIdentity {
  id: EntityId
  entityId: EntityId
  entityType: 'pokemon' | 'trainer'
  name: string
  side: Side
}
```

Vault `combat-lens-sub-interfaces.md` documents `entityId` ("links the lens back to its source entity record") and `entityType` ("discriminates between Pokemon and Trainer") but says nothing about `id`. The test factory creates `id: 'test-id', entityId: 'test-entity'` — different values, confirming they're semantically distinct.

If `id` is a combat-scoped lens identifier (unique per combat entry, survives switch-in/switch-out cycling) and `entityId` is the persistent entity record ID, both roles need documentation. A future implementer reading the vault alone cannot determine when to use `id` vs `entityId` for targeting, attribution, or delta keying.

Post 37 expanded `HasIdentity` to include `entityId` and `entityType` (finding 108). The design decision section explains why these fields belong in `HasIdentity`. But `id` — the original field — was never explained. The expansion added documented fields alongside an undocumented one.

### Finding 111 — Test factory `as CombatantLens` cast (Test Quality)

`stat.test.ts:37`:
```typescript
  ...overrides,
} as CombatantLens
```

The `makeLens` factory uses a type assertion to construct test lenses. If `CombatantLens` gains a new required sub-interface (e.g., `HasFoo` with a `foo: number` field), the factory compiles without providing `foo`. The assertion silently coerces the incomplete object. Tests continue to pass, but they're operating on structurally invalid lenses.

This is the same class of problem as deferred finding 105 (no type structure tests). The deferral rationale was "TypeScript's compiler catches most structural drift." But a `as CombatantLens` cast is an explicit instruction to the compiler to stop catching structural drift. The test infrastructure now has the escape hatch that finding 105 warned about.

**Fix:** Use `satisfies CombatantLens` instead of `as CombatantLens`. The `satisfies` operator validates that the object matches the type without widening — missing fields cause compile errors. Or build the factory return type without assertion: `function makeLens(...): CombatantLens` with the return type on the function signature, which forces the object literal to be structurally complete.

### Finding 112 — `MovementType` value `'fly'` semantic overlap (Clarity)

`base.ts:27`:
```typescript
export type MovementType = 'land' | 'fly' | 'swim' | 'phase' | 'burrow' | 'teleport'
```

Post 38 removes the Flying *Pokemon type*. The `'fly'` *movement type* survives — correctly, since the Flier movement trait is a distinct concept. But the string value `'fly'` creates semantic overlap:

- `grep -ri "fly" packages/engine/` returns 4 matches (2 `Flying` comments + 2 `fly` movement-type references). A verification grep for "is Flying fully removed?" now has false positives from movement code.
- The PTR vault names the trait "Flier" and the movement modes "Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter." The code maps Flier → `'fly'`, breaking the naming convention where other traits map to their verb form (Swimmer → `'swim'`, Burrower → `'burrow'`). The consistent pattern would be `'flier'` — matching both the vault terminology and the other entries' convention of mapping trait name to movement mode value.
- The documentation vault uses `combatantCanFly()` (in `combatant-movement-capabilities.md`), further blurring the line.

Not a bug — the engine compiles and the movement system works. But the naming choice makes the codebase harder to audit for Flying-type remnants, which this session just established as a verification concern.

### Finding 113 — No test for chart structure after Flying removal (Test Gap)

`constants.test.ts` tests `getTypeEffectiveness` with 8 assertions covering SE, resist, immune, neutral, and dual-type interactions. None of these assertions are specific to the Flying removal:

- No assertion that `TYPE_EFFECTIVENESS` has exactly 17 keys
- No assertion that `'flying'` is not a key
- No assertion that `electric` has no SE matchup (Electric lost its SE vs Flying target, leaving only Water — a significant chart change)
- No assertion that `ground` has no immunity entry (Ground lost its immunity target when Flying was removed)

The existing tests would pass identically on both the 18-type and 17-type charts. The chart rebuild is a data-level change that alters every type's matchup surface. Same category as finding 104 (stat utilities had no tests) — foundational data with no structural test coverage.

**Suggested assertions:**
```typescript
it('has exactly 17 attacking types (no Flying)', () => {
  expect(Object.keys(TYPE_EFFECTIVENESS)).toHaveLength(17)
  expect(TYPE_EFFECTIVENESS).not.toHaveProperty('flying')
})

it('no type has flying as a defending matchup', () => {
  for (const [, defenses] of Object.entries(TYPE_EFFECTIVENESS)) {
    expect(defenses).not.toHaveProperty('flying')
  }
})
```

### Finding 114 — Verification grep case-sensitivity (Process)

Post 38 claims:
> `grep -r "flying" packages/engine/` — zero matches

Actual result of `grep -ri "flying" packages/engine/` (case-insensitive):
```
packages/engine/src/types/base.ts:/** Pokemon types — PTR uses 17 types (Flying removed) */
packages/engine/src/constants.ts: * Type effectiveness chart — PTR uses 17 types (Flying removed).
```

These are documentary comments and are correct. The verification claim is technically accurate (`grep -r "flying"` without `-i` does return zero because comments use capital "Flying"). But the verification protocol would miss an accidental `'Flying'` string literal with capital F. More thorough: `grep -ri "flying"` and confirm all matches are in comments, not in type unions, chart keys, or string values.

Minor process issue. The comments themselves are appropriate documentation of the change.

### Finding 115 — `move-observation-index.md` Normal-type discoverability (Documentation)

The index has:
```
## Normal (201)
...201 entries...

## Formerly Flying — now Normal (28)
...28 entries (Aerial Ace, Brave Bird, Hurricane, etc.)...
```

Someone navigating to "Normal-type moves" finds 201 entries. The 28 formerly-Flying moves are Normal-type in PTR but listed under a separate section. The actual count of Normal-type moves is 229 (201 + 28), but only the "Formerly Flying" section header hints at this. No cross-reference exists in the Normal section pointing to the additional 28 moves.

**Fix options:** (a) Merge the 28 into the Normal section and update the count to 229, deleting the "Formerly Flying" section. (b) Add a note at the top of the Normal section: "28 additional Normal-type moves (formerly Flying in PTU) listed under 'Formerly Flying — now Normal' below." (c) List them in both sections (duplication, but complete).

Option (a) is cleanest — the PTU classification is historical context, not navigational structure. The index should reflect PTR types, not PTU types.

## Summary

| Severity | Count | Findings |
|---|---|---|
| Type safety (carried forward) | 1 | 109 |
| Principle 7 (vault gap) | 1 | 110 |
| Test quality | 1 | 111 |
| Clarity / naming | 1 | 112 |
| Test gap | 1 | 113 |
| Process | 1 | 114 |
| Documentation navigation | 1 | 115 |

**No blockers.** Finding 109 is the most consequential — it's a type-safety gap in a foundational type that was flagged in the prior review and resolved by widening the spec rather than narrowing the code. Findings 110 and 113 are principle 7 and test gaps that should be addressed before building on this foundation. The rest are low severity.

**Post 37 assessment:** Solid resolution of findings 98–108. The design decisions (level as parameter, HasIdentity expansion) are well-reasoned with clear rationale. The 18 new tests are correct and meaningful. The one gap is the carried-forward type widening (109) and the test factory's `as` cast (111).

**Post 38 assessment:** Thorough and methodical removal. The "Files NOT changed" section shows good judgment — correctly distinguishing "Flying" as a type reference from "flying/flight" as a movement concept. The vault changes are consistent with the PTR source of truth. The gaps are in verification thoroughness (113, 114) and index organization (115).

**Status:** Ninth adversarial review complete (findings 109–115). Both posts advance the project correctly. Outstanding debt: one type-safety widening (109), one undocumented field (110), and one test infrastructure weakness (111) that should be addressed before the next wave of handler implementations builds on these foundations.
