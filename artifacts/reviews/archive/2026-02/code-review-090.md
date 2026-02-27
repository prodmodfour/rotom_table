---
review_id: code-review-090
ticket: refactoring-033
result: CHANGES REQUESTED
date: 2026-02-20
reviewer: senior-reviewer
commits_reviewed:
  - b7feca3
  - 74568fc
---

# Code Review: refactoring-033 (Density dropdown hardcoded labels)

## Verdict: CHANGES REQUESTED

The fix in `TableEditor.vue` is correct and well-implemented. However, the same bug exists in a second file that was not addressed. One CRITICAL issue found.

---

## Fix Verification

### TableEditor.vue changes (b7feca3) -- PASS

**Before:** Four hardcoded `<option>` elements with wrong spawn count labels (e.g., "Sparse (1-2 Pokemon)" when `DENSITY_RANGES.sparse` is `{ min: 2, max: 4 }`).

**After:** A `densityOptions` array is computed from `Object.entries(DENSITY_RANGES)` and rendered via `v-for`. Labels are built as `` `${tier.charAt(0).toUpperCase() + tier.slice(1)} (${range.min}-${range.max} Pokemon)` ``.

**Verified:**
- Import is correct: `import { DENSITY_RANGES, type DensityTier } from '~/types'`
- `DENSITY_RANGES` in `app/types/habitat.ts` (lines 17-22) is typed as `Record<DensityTier, { min: number; max: number }>`, so `Object.entries()` yields `[string, { min: number; max: number }][]` pairs. The `as DensityTier` cast on `tier` is appropriate since the Record guarantees only those four keys exist.
- `Object.entries()` preserves insertion order for string keys in modern JS engines, so the dropdown order will be `sparse, moderate, dense, abundant` -- matching the original hardcoded order.
- `densityOptions` is a plain (non-reactive) array computed once at setup time. This is correct because `DENSITY_RANGES` is a static constant that never changes at runtime.
- The generated labels will be: "Sparse (2-4 Pokemon)", "Moderate (4-8 Pokemon)", "Dense (8-12 Pokemon)", "Abundant (12-16 Pokemon)" -- all matching `DENSITY_RANGES` values.
- The `select` element still correctly uses `v-model="editor.editSettings.density"` and each option's `:value` is the tier string (`"sparse"`, `"moderate"`, etc.), so form binding is unchanged.

### Ticket resolution (74568fc) -- PASS

Status correctly changed from `open` to `resolved`. Resolution log documents the commit, file changed, and approach taken.

---

## Issues Found

### CRITICAL: Same hardcoded labels remain in EncounterTableModal.vue

**File:** `app/components/habitat/EncounterTableModal.vue`, lines 73-76

```html
<option value="sparse">Sparse (1-2 Pokemon)</option>
<option value="moderate">Moderate (2-4 Pokemon)</option>
<option value="dense">Dense (4-6 Pokemon)</option>
<option value="abundant">Abundant (6-8 Pokemon)</option>
```

This is the create/edit modal for encounter tables (in the habitat section), and it contains the exact same hardcoded labels with the exact same wrong values that refactoring-033 identified. The ticket says "density tier dropdown in the table settings modal" -- `TableEditor.vue` has a settings modal with a density dropdown, AND `EncounterTableModal.vue` has its own density dropdown for table creation/editing.

**Impact:** The original ticket's root cause (hardcoded labels that drift from `DENSITY_RANGES`) is only half-fixed. Users creating or editing encounter tables via `EncounterTableModal.vue` will still see the wrong spawn counts.

**Required action:** Apply the same `densityOptions` pattern to `EncounterTableModal.vue`. This could be done by either:
1. Duplicating the `densityOptions` derivation (simple, 4 lines), or
2. Extracting a shared utility/composable that both components import (better DRY, but may be over-engineered for 4 lines of setup code).

Option 1 is acceptable given the small scope.

---

## Cross-cutting Checks

| Check | Result |
|---|---|
| File sizes under 800 lines | PASS (TableEditor.vue is well within limits) |
| No secrets or hardcoded values | FAIL (EncounterTableModal.vue still has hardcoded density labels) |
| Import correctness | PASS |
| Type safety | PASS (DensityTier cast is valid) |
| Ticket resolution log updated | PASS |
| No mutations introduced | PASS |
| All occurrences addressed | FAIL (EncounterTableModal.vue missed) |
