---
review_id: rules-review-210
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - 4cb19e4
  - de8aedc
  - b344993
  - 7c1b779
mechanics_verified:
  - base-relations-rule
  - stat-point-budget
  - pokemon-hp-formula
  - stat-point-extraction
  - nature-adjusted-ordering
  - partial-allocation-validity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Base-Relations-Rule
  - core/05-pokemon.md#Stat-Points
  - core/05-pokemon.md#Pokemon-Hit-Points
  - core/05-pokemon.md#Level-Up
reviewed_at: 2026-03-01T12:00:00Z
follows_up: rules-review-205
---

## Review Scope

Re-review of feature-007 (Pokemon Level-Up Allocation UI) after fix cycle by slave-2 (plan-20260228-233710). The original rules-review-205 was APPROVED with 0 PTU correctness issues (2M informational). This review verifies that the 4 fix cycle commits addressing code-review-229 issues (H1, H2, M1, M2, M3) did not introduce any PTU rule regressions.

Decree check: decree-035 (nature-adjusted base stats for Base Relations ordering) remains correctly implemented. decree-036 (stone evolution move learning) is not applicable to P0 stat allocation.

## Fix Cycle Commits Under Review

| Commit | Description | CR-229 Issue |
|--------|-------------|--------------|
| 7c1b779 | Add `warnings` field to `extractStatPoints` | M1 |
| b344993 | Replace hardcoded `gap: 4px` with `$spacing-xs` | M3 |
| de8aedc | Allow partial stat allocation with confirmation dialog | M2 |
| 4cb19e4 | Add 37 unit tests for `baseRelations.ts` | H1 |

Additionally reviewed: 81c6f21 (app-surface.md update, H2) and 774c64e (ticket/design doc update).

## Mechanics Verified

### 1. Base Relations Rule (PTU Core p.198) -- UNCHANGED

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." and "Stats that are equal need not be kept equal, however." (`core/05-pokemon.md` lines 105-114)
- **Implementation:** `app/utils/baseRelations.ts` lines 76-120. `validateBaseRelations()` checks all `(i, j)` pairs with `j > i`. For pairs where `baseA !== baseB`, it verifies the stat with the higher base maintains `>=` final value. Equal base stats are skipped via `if (baseA === baseB) continue`.
- **Status:** CORRECT -- No changes to this function in the fix cycle. The validation logic is identical to what rules-review-205 approved.

### 2. Nature-Adjusted Base Stats for Ordering (decree-035) -- UNCHANGED

- **Rule:** Per decree-035: "Base Relations ordering uses nature-adjusted base stats, not raw species base stats."
- **Implementation:** Server endpoint (`allocate-stats.post.ts` lines 56-63) reads nature-adjusted values from DB `base*` fields. Composable (`useLevelUpAllocation.ts` line 43) reads `pokemonRef.value.baseStats` which maps from the same fields. Unit tests in `baseRelations.test.ts` consistently pass nature-adjusted base stats as the first argument to `validateBaseRelations()` and `buildStatTiers()`.
- **Status:** CORRECT -- No changes to decree-035 compliance. The new unit tests reinforce this by testing the functions with the expected input signature.

### 3. Stat Point Budget (PTU Core p.198) -- UNCHANGED

- **Rule:** "add +X Stat Points, where X is the Pokemon's Level plus 10" (`core/05-pokemon.md` line 102)
- **Implementation:** Server: `const budget = pokemon.level + 10` (line 136). Client: `pokemonRef.value.level + 10` (line 55). Tests verify `expectedTotal = level + 10` in multiple scenarios (lines 309, 457, 479, 501, 531).
- **Status:** CORRECT -- Budget formula unchanged.

### 4. Pokemon HP Formula (PTU Core p.198) -- UNCHANGED

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md` line 118)
- **Implementation:** Forward (server line 163): `newMaxHp = pokemon.level + (newHpStat * 3) + 10`. Reverse (baseRelations.ts line 170): `hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)`, then `hpPoints = hpStat - pokemon.baseStats.hp`.
- **Status:** CORRECT -- HP formula is unchanged. The new unit tests verify round-trip correctness (test at lines 314-337: level 5, baseHp 4, 3 points allocated -> maxHp 36 -> extracted hpPoints = 3).

### 5. Stat Point Extraction with Warnings (M1 Fix) -- NEW, CORRECT

- **Rule:** Derived from PTU mechanics: `statPoints = calculatedStat - natureAdjustedBase` for non-HP stats, and reverse HP formula for HP stat points.
- **Implementation:** `extractStatPoints()` now computes raw extraction values first (`rawExtractions` record, lines 174-181), then checks each for negativity (lines 183-191). Negative values produce a descriptive warning string and are clamped to 0 (lines 193-200). The `isConsistent` check (line 209) still uses the clamped values.
- **Status:** CORRECT -- The extraction math is unchanged. The warnings are purely observational output. The clamping behavior (`Math.max(0, ...)`) remains identical. The `warnings` field is additive and does not alter any calculation. The unit tests verify: negative extraction produces correct warnings and clamped values (test lines 358-406), non-negative extraction produces no warnings (lines 408-431), HP negative extraction is caught (lines 536-560).

### 6. Partial Allocation Validity (M2 Fix) -- NEW, CORRECT

- **Rule:** PTU Core p.102: "add +X Stat Points, where X is the Pokemon's Level plus 10." PTU Core p.563: "it gains +1 Stat Point." Neither rule requires immediate allocation of all available points. The stat point budget is a ceiling, not a floor.
- **Implementation:** `StatAllocationPanel.vue` line 89: submit button disabled condition changed from `unallocatedPoints > 0` to `isAllocationEmpty` (line 139-141: checks if all pending allocations are zero). When `unallocatedPoints > 0` at submit time, a `window.confirm()` dialog warns the GM (lines 150-155). The server endpoint (`allocate-stats.post.ts` line 138) validates `proposedTotal > budget` (rejects over-budget) but does NOT reject under-budget -- it already supported partial allocation.
- **Status:** CORRECT -- This change aligns the UI with the server's existing behavior and with PTU rules. Partial allocation is valid in PTU. The confirmation dialog prevents accidental partial saves. The server still enforces: (a) total <= budget, (b) Base Relations valid, (c) non-negative integers. No rule violation is possible from this change.

### 7. Tier Construction / Stat Grouping -- UNCHANGED

- **Rule:** PTU p.198: stats with equal base values form groups that only need to stay below tiers above them.
- **Implementation:** `buildStatTiers()` groups consecutive equal-value entries into tiers (lines 38-62).
- **Status:** CORRECT -- Unchanged. The new tests verify: all-different stats produce 6 tiers (test lines 33-44), equal stats group into single tier (lines 46-62), all-same stats produce one tier (lines 64-74), Pikachu-like distributions with mixed tiers (lines 76-93), zero base stats handled correctly (lines 95-105), and large values handled (lines 107-122).

### 8. Skip Base Relations (Features) -- UNCHANGED

- **Rule:** PTU p.228: "there are several Features that allow trainers to break Stat Relations."
- **Implementation:** Server endpoint supports `skipBaseRelations: true` in request body (line 148).
- **Status:** CORRECT -- Unchanged from original implementation.

### 9. Valid Allocation Targets -- UNCHANGED

- **Rule:** Derived from Base Relations -- proactive check of which stats can legally receive the next point.
- **Implementation:** `getValidAllocationTargets()` tests each stat by simulating `+1` and running full validation (lines 129-142).
- **Status:** CORRECT -- Unchanged. The new tests verify: all valid at zero allocation (lines 568-581), blocking when lower stat would overtake higher (lines 583-601), boundary equality allowed (lines 603-619), multi-tier constraint propagation (lines 656-673), and all-equal base stats allow everything (lines 638-654).

## Unit Test Coverage Verification

The 37 unit tests in `baseRelations.test.ts` cover all 4 exported functions plus integration workflows:

| Function | Test Count | Key Scenarios |
|----------|-----------|---------------|
| `buildStatTiers` | 6 | All-different, equal groups, all-same, single highest, zeros, large values |
| `validateBaseRelations` | 9 | Valid ordering, violation detection, equal finals, single-tier (all same), pair inversion, tied equal-base divergence, multiple violations, tier passthrough, zero allocation |
| `extractStatPoints` | 11 | Zero allocation, HP round-trip, HP rounding, negative clamping with warnings, multiple negatives, no warnings clean case, consistency true/false, level 1 minimal, level 100 high, HP negative |
| `getValidAllocationTargets` | 7 | All valid at zero, blocking on overtake, boundary equality, multi-tier blocking, all-equal freedom, constraint propagation, match-but-not-exceed |
| `formatStatName` | 2 | Known keys, unknown keys |
| Integration | 2 | Full allocate->extract->validate round-trip, progressive constraint tightening |

The tests correctly use the PTU HP formula for round-trip verification (test lines 299, 317-318, 345, 370-371, 420, 447, 472, 494, 516-517) and verify that the budget formula `level + 10` produces the expected total.

## Summary

All four fix cycle commits are PTU-rule-neutral or PTU-rule-correct:

1. **M1 (warnings field):** Pure observational addition to `extractStatPoints()`. The extraction math and clamping behavior are identical to the approved implementation. The `warnings` array provides visibility into data inconsistencies without altering any game logic calculation.

2. **M2 (partial allocation):** Correctly aligns the UI with PTU rules. PTU does not mandate immediate full allocation -- the stat point budget is a ceiling, not a requirement. The server already supported partial allocation; the UI now does too, with a confirmation safeguard.

3. **M3 (SCSS variable):** Purely cosmetic. Replacing `gap: 4px` with `gap: $spacing-xs` has no effect on game logic.

4. **H1 (unit tests):** The 37 tests verify correctness of the existing implementation. They exercise the PTU HP formula, Base Relations Rule, stat point budget, tier construction, and extraction logic. All test expectations are consistent with PTU 1.05 rules. The tests confirm rules-review-205's findings programmatically.

## Rulings

No new rulings needed. All rulings from rules-review-205 remain valid:

- **Ruling 1 (Final Stat Ordering):** The `>=` comparison using total calculated stats for the ordering constraint is correct per PTU p.198.
- **Ruling 2 (Bulk Allocation):** Allocating multiple points at once is valid since the system validates the final state.
- **Ruling 3 (HP Preservation):** Preserving HP ratio on stat changes is consistent game logic.

## Decree Compliance

- **decree-035 (base-relations-nature-adjusted):** COMPLIANT. No changes to how nature-adjusted base stats are sourced or used. The new unit tests implicitly validate decree-035 compliance by testing with the expected input signature (nature-adjusted bases as the first argument).
- **decree-036 (stone-evolution-move-learning):** NOT APPLICABLE to P0 (stat allocation).

## Verdict

**APPROVED** -- All PTU mechanics remain correctly implemented after the fix cycle. The four changes are either rule-neutral (M3 cosmetic, H1 tests) or rule-correct (M1 observational warnings, M2 allowing partial allocation per PTU rules). No regressions. No new issues found.
