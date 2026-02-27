---
ticket_id: refactoring-020
priority: P1
categories:
  - EXT-DUPLICATE
affected_files:
  - app/composables/useTypeChart.ts
  - app/utils/damageCalculation.ts
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/tests/unit/composables/useTypeChart.test.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-17T07:00:00
origin: refactoring-019
---

## Summary

The type effectiveness chart, net-classification lookup table, effectiveness calculation function, and effectiveness label function are fully duplicated between `useTypeChart.ts` (composable) and `damageCalculation.ts` (utility). Both were independently fixed in refactoring-019, which made the duplication worse by adding identical `NET_EFFECTIVENESS` tables to both files.

## Findings

### Finding 1: EXT-DUPLICATE — Identical type chart in two files

- **File A:** `app/composables/useTypeChart.ts:13-32` — `typeEffectiveness` (18-type Record)
- **File B:** `app/utils/damageCalculation.ts:83-102` — `TYPE_CHART` (identical 18-type Record)
- **Impact:** Any future type chart correction must be applied in both places. Divergence risk is high — refactoring-019 already required fixing the same bug in both.

### Finding 2: EXT-DUPLICATE — Identical NET_EFFECTIVENESS lookup table

- **File A:** `app/composables/useTypeChart.ts:36-44` — `NET_EFFECTIVENESS`
- **File B:** `app/utils/damageCalculation.ts:250-258` — `NET_EFFECTIVENESS`
- **Impact:** Added during refactoring-019 fix. Same 7-entry table duplicated verbatim.

### Finding 3: EXT-DUPLICATE — Identical getTypeEffectiveness function

- **File A:** `app/composables/useTypeChart.ts:47-64` — `getTypeEffectiveness()` (composable method)
- **File B:** `app/utils/damageCalculation.ts:267-282` — `getTypeEffectiveness()` (exported function)
- **Consumers:**
  - File A → `app/composables/useMoveCalculation.ts:293` (client-side combat UI)
  - File B → `app/utils/damageCalculation.ts:310` (internal, called by `calculateDamage()`) → consumed by `app/server/api/encounters/[id]/calculate-damage.post.ts`

### Finding 4: EXT-DUPLICATE — Near-identical effectiveness label function

- **File A:** `app/composables/useTypeChart.ts:67-76` — `getEffectivenessDescription()`
- **File B:** `app/utils/damageCalculation.ts:287-295` — `getEffectivenessLabel()`
- **Difference:** Only the function name differs. Logic and return values are identical after refactoring-019.

## Root Cause

The type chart was originally embedded in `useCombat.ts` (composable). When `damageCalculation.ts` was created as a pure utility (design-testability-001), it needed the type chart for server-side damage calculation, so the chart was copied rather than extracted to a shared location. The composable was later extracted to `useTypeChart.ts` (refactoring-007) but the utility copy was never consolidated.

## Suggested Fix

1. **Extract canonical type data to a new pure utility:** `app/utils/typeChart.ts`
   - Move `TYPE_CHART`, `NET_EFFECTIVENESS`, `getTypeEffectiveness()`, `getEffectivenessLabel()` here
   - These are pure functions with zero dependencies — safe to import from anywhere

2. **Update `damageCalculation.ts`** to import from `typeChart.ts` instead of defining its own copy
   - Remove `TYPE_CHART`, `NET_EFFECTIVENESS`, `getTypeEffectiveness`, `getEffectivenessLabel`
   - Import `{ getTypeEffectiveness, getEffectivenessLabel }` from `~/utils/typeChart`

3. **Update `useTypeChart.ts` composable** to delegate to the utility
   - Remove the inline `typeEffectiveness` chart, `NET_EFFECTIVENESS`, and `getTypeEffectiveness` implementation
   - Import from `~/utils/typeChart` and re-export through the composable return object
   - Keep `typeImmunities`, `isImmuneToStatus`, `hasSTAB` in the composable (they have no utility duplicate)
   - Rename the composable's `getEffectivenessDescription` to use `getEffectivenessLabel` for consistency, or re-export under both names for backward compatibility

4. **Update consumers:**
   - `useMoveCalculation.ts` — continues using `useTypeChart()` composable (no change needed)
   - `calculate-damage.post.ts` — continues importing from `damageCalculation.ts` (no change needed, it uses `calculateDamage` which internally calls the now-imported function)

5. **Move/update tests:**
   - Type chart data tests and `getTypeEffectiveness` tests should move to `tests/unit/utils/typeChart.test.ts`
   - `useTypeChart.test.ts` retains tests for `isImmuneToStatus`, `hasSTAB`, and the composable's re-export behavior

6. **Clamp net to ±3** (from code-review-020 MEDIUM #1):
   - `const net = Math.max(-3, Math.min(3, seCount - resistCount))`
   - PTU defines triply as the maximum tier. Current `?? 1` fallback returns neutral for net beyond ±3 (e.g., 4+-type Pokemon via abilities). Should cap at triply SE (3.0) or triply resisted (0.125).

Estimated commits: 3-4 (extract utility, update damageCalculation imports, update composable delegation, move tests)

## Resolution Log

**Resolved:** 2026-02-17

**Commits:**
- `3f9afc0` — refactor: extract canonical type chart utility from duplicated code
- `a51e49c` — refactor: replace inline type chart in damageCalculation with import
- `07fa45e` — refactor: delegate useTypeChart composable to canonical typeChart utility
- `d7bff18` — test: split type chart tests between utility and composable

**Files created:**
- `app/utils/typeChart.ts` — canonical source for TYPE_CHART, NET_EFFECTIVENESS, getTypeEffectiveness(), getEffectivenessLabel()
- `app/tests/unit/utils/typeChart.test.ts` — 23 tests covering chart completeness, all effectiveness tiers, and ±3 net clamp

**Files changed:**
- `app/utils/damageCalculation.ts` — removed 77 lines of duplicated type chart code, re-exports from typeChart.ts
- `app/composables/useTypeChart.ts` — removed 77 lines of duplicated code, delegates to typeChart.ts, keeps typeImmunities/isImmuneToStatus/hasSTAB
- `app/tests/unit/composables/useTypeChart.test.ts` — retained 13 tests for composable-specific behavior (isImmuneToStatus, hasSTAB, re-export verification)

**Bug fix applied:**
- Net effectiveness clamped to ±3 (code-review-020 MEDIUM #1): `Math.max(-3, Math.min(3, seCount - resistCount))` instead of `?? 1` fallback for net beyond triply

**Test status:** 507/508 unit tests pass (1 pre-existing failure in settings store unrelated to this change)
