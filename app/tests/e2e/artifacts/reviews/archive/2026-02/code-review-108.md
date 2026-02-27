---
review_id: code-review-108
ticket: ptu-rule-057
commits_reviewed: ["8c33677", "01f2f2f"]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

# Code Review: Species Diversity in Encounter Generation

## Status Table

| Area | Status |
|---|---|
| Correctness | PASS |
| Immutability | PASS |
| Error handling | PASS |
| Edge cases | PASS |
| File size (229 lines) | PASS |
| Naming / readability | PASS |
| No duplicate code paths | PASS (confirmed single weighted-selection site) |

## Analysis

### Algorithm Soundness

The diversity enforcement uses two complementary mechanisms:

1. **Exponential decay** (`weight * 0.5^timesSelected`): Each repeat selection of a species halves its draw probability. After 3 picks of the same species, its effective weight is 12.5% of original. This is a well-established softmax-style suppression that avoids hard cutoffs while progressively favoring variety.

2. **Hard cap** (`ceil(count / 2)`): No species can exceed half the encounter. For `count = 6`, max per species is 3. For `count = 1`, max is 1 (effectively no cap since only one draw occurs). For `count = 2`, max is 1, meaning diversity is guaranteed with 2+ species in the pool.

**Traced edge cases:**

- **1 species in pool:** `applyDiversity = false`, so original weighted selection runs unmodified. Correct -- no diversity to enforce.
- **2 species, count = 6:** Cap is 3 per species. With exponential decay, after 3 picks of species A (effective weight: `w * 0.125`), species B dominates remaining draws. Cap ensures at most 3 of each. Correct.
- **All species capped (fallback):** With 2 species and count = 6, after 3 of each, both hit cap, `effectiveTotalWeight = 0`, so `useOriginal = true` and draws fall back to original weights. This can only happen when `pool_size * maxPerSpecies < count`, which is rare (requires very small pools relative to count). The fallback prevents an infinite loop / zero-division. Correct.
- **count = 1:** `maxPerSpecies = 1`. One draw occurs, diversity decay has no effect (timesSelected = 0 for all species on first draw). Behaves identically to the original algorithm. Correct.
- **Floating-point precision:** `Math.random() * drawWeight` and successive subtraction could theoretically overshoot all entries due to floating-point drift. However, `selected` defaults to `entries[0]` before the loop, so this is safe -- the worst case is the first entry gets selected as a fallback, same as the pre-existing behavior.

### Code Quality

- **No mutation of input data.** `entries` and `entryPool` are not modified by the diversity logic. `effectiveEntries` is a new array created each iteration via `.map()`. `selectionCounts` is a new local `Map` introduced by this change, not modifying any existing state. Clean.
- **`selected` references `entries[0]` but pushes `entry` from `effectiveEntries`.** Wait -- let me verify. Line 174 sets `selected = entries[0]` (the raw entry). Line 180 sets `selected = entry` where `entry` comes from the destructured `{ entry, effectiveWeight }` in `effectiveEntries`. The `entry` field in `effectiveEntries` is a direct reference to the same object in `entries` (line 149: `entries.map(entry => ...)`). So `selected` always points to an object from the `entries` array. Consistent and correct.
- **Comment quality is excellent.** The block comment at lines 135-141 explains the "why" of the algorithm, not just the "what." The inline comments are concise and useful.
- **Variable naming is clear.** `effectiveEntries`, `effectiveWeight`, `selectionCounts`, `maxPerSpecies`, `applyDiversity`, `useOriginal` -- all self-documenting.
- **`totalWeight` in response** (line 218) still reports the original pool weight, not the decayed weights. This is correct per the ticket requirements ("Original weight preserved in output").

### Ticket Documentation (commit 01f2f2f)

The resolution log in the ticket is thorough: explains both mechanisms, lists edge cases, and documents the duplicate code path check. Status correctly moved from `open` to `in-progress` (not `closed`, which is appropriate since it still needs review approval).

## What Looks Good

- Surgical change: only the weighted selection loop was modified. No unrelated changes.
- All edge cases identified in the ticket are actually handled in code.
- The `applyDiversity` flag cleanly short-circuits all diversity logic for single-species pools, avoiding unnecessary computation.
- The fallback to original weights when all species are capped is a defensive measure that prevents the algorithm from breaking under unusual pool configurations.
- File stays well under the 800-line limit at 229 lines.
- The approach is algorithmically sound -- exponential decay is a standard technique for diversity sampling and the cap provides a hard guarantee.

## Recommended Next Steps

1. **Mark ticket as `done`.** The implementation matches the ticket requirements and handles all documented edge cases.
2. **No unit tests exist for this endpoint.** The existing test file `app/tests/unit/stores/encounterTables.test.ts` covers the Pinia store, not the API endpoint. This is a pre-existing gap, not introduced by this change. Consider filing a test ticket if encounter generation becomes more complex.
