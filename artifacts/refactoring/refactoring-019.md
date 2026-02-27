---
ticket_id: refactoring-019
priority: P1
categories:
  - PTU-INCORRECT
affected_files:
  - app/composables/useTypeChart.ts
  - app/tests/unit/composables/useTypeChart.test.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-17T07:00:00
origin: rules-review-017
---

## Summary

`useTypeChart.ts` computes dual-type effectiveness by multiplying per-type values (e.g., `1.5 × 1.5 = 2.25` for doubly SE). PTU 1.05 defines flat values for multi-type interactions that diverge from the multiplicative result. Three cases are incorrect.

## Findings

### Finding 1: PTU-INCORRECT — Doubly Super Effective returns 2.25, should be 2.0

- **Code:** `useTypeChart.ts:35-46` — `effectiveness *= chart[defType]` in a loop
- **Test:** `useTypeChart.test.ts:39-46` — expects 2.25 for Fire vs Grass/Steel
- **PTU rule:** "If both Types are weak, the attack is doubly super-effective and does x2 damage." (07-combat.md:1016-1017)
- **Actual:** `1.5 × 1.5 = 2.25`
- **Expected:** `2.0`
- **Impact:** 12.5% damage overcalculation on all doubly-SE attacks against dual-type Pokemon

### Finding 2: PTU-INCORRECT — SE + Resist returns 0.75, should be 1.0

- **Code:** Same multiplicative loop
- **Test:** Not directly tested (no SE+Resist dual-type test case exists)
- **PTU rule:** "If one Type is weak and one is resistant, the attack is neutral." (07-combat.md:1019-1020)
- **Actual:** `1.5 × 0.5 = 0.75`
- **Expected:** `1.0` (neutral)
- **Impact:** 25% damage undercalculation. Example: Ground vs Water/Grass — Ground is SE against Water and resisted by Grass. Should be neutral, code gives 0.75.

  Wait — Ground vs Water is not SE. Let me correct this with a real example: Fighting vs Ice/Poison — Fighting is SE against Ice (1.5) and resisted by Poison (0.5). Code returns 0.75, PTU says neutral (1.0).

### Finding 3: PTU-INCORRECT — Triply Super Effective returns 3.375, should be 3.0

- **Code:** Same multiplicative loop
- **Test:** Not tested (three-type Pokemon are rare in PTU but possible via moves/abilities)
- **PTU rule:** "triply super-effective attacks do x3 damage" (07-combat.md:1032-1033)
- **Actual:** `1.5 × 1.5 × 1.5 = 3.375`
- **Expected:** `3.0`
- **Impact:** Low frequency (requires 3+ types) but 12.5% damage overcalculation

## Root Cause

The composable stores per-type numeric multipliers (1.5 for SE, 0.5 for resist, 0 for immune) and multiplies them across defender types. This multiplicative approach is correct for:
- Resistances: `0.5 × 0.5 = 0.25 = 1/4` (matches PTU)
- Immunity: `any × 0 = 0` (matches PTU)

But PTU defines flat lookup values for super-effective multi-type interactions that diverge from multiplication:

| Interaction | Multiplicative | PTU Defined |
|-------------|---------------|-------------|
| SE × SE | 2.25 | 2.0 |
| SE × Resist | 0.75 | 1.0 (neutral) |
| SE × SE × SE | 3.375 | 3.0 |
| Resist × Resist | 0.25 | 0.25 (matches) |
| Any × Immune | 0 | 0 (matches) |

## Suggested Fix

Replace the multiplicative loop with a qualitative classification system:

1. For each defender type, classify the matchup as SE, resist, immune, or neutral
2. Count SE types, resist types, immune types
3. If any immune → return 0
4. Net interaction = SE count - resist count
5. Look up the final multiplier from a defined table:

| Net | Result | Multiplier |
|-----|--------|------------|
| -3 | Triply Resisted | 0.125 |
| -2 | Doubly Resisted | 0.25 |
| -1 | Resisted | 0.5 |
| 0 | Neutral | 1.0 |
| +1 | Super Effective | 1.5 |
| +2 | Doubly Super Effective | 2.0 |
| +3 | Triply Super Effective | 3.0 |

This matches all PTU-defined outcomes including the SE+Resist=neutral case.

Update the test file to expect 2.0 for doubly SE and add test cases for SE+Resist and triply SE.

Estimated commits: 2 (composable fix + test update)

## Resolution Log

- **Commit:** `5565b6e` — fix: replace multiplicative type effectiveness with PTU qualitative classification
- **Files changed:**
  - `app/composables/useTypeChart.ts` — replaced multiplicative loop with net-classification lookup (count SE/resist/immune, look up flat multiplier). Added `NET_EFFECTIVENESS` table. Updated `getEffectivenessDescription` for triply SE/resisted.
  - `app/utils/damageCalculation.ts` — same fix applied to the standalone `getTypeEffectiveness()` and `getEffectivenessLabel()` functions (duplicate code path).
  - `app/tests/unit/composables/useTypeChart.test.ts` — updated doubly SE tests from 2.25→2.0, added SE+resist (neutral), triply SE (3.0), triply resisted (0.125), doubly SE description (2.0) test cases.
- **Tests:** 499/500 unit tests pass (1 pre-existing failure in settings.test.ts unrelated to this change)
- **Resolved:** 2026-02-17
