---
ticket_id: ptu-rule-054
priority: P3
status: resolved
domain: pokemon-lifecycle
matrix_source:
  rule_id: pokemon-lifecycle-R010
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Base Relations Rule is not enforced during stat point distribution. The weighted random algorithm can produce stat allocations that violate the required ordering where higher base stats should receive more points.

## Expected Behavior (PTU Rules)

Per PTU Core: stat points should be distributed respecting Base Relations — a Pokemon's highest base stat should receive the most points, and the relative ordering of stats should be maintained after distribution.

## Actual Behavior

The weighted random distribution makes higher base stats more likely to receive points but does not guarantee the required ordering is maintained.

## Resolution Log

**Fix commit:** c466c99 — `fix: enforce Base Relations rule during stat point distribution`

**Root cause:** `distributeStatPoints()` in `pokemon-generator.service.ts` used a purely weighted random loop to allocate stat points. While higher base stats were more *likely* to receive points, the random distribution could produce results where a lower base stat ended up with a higher final value than a higher base stat.

**Fix approach:** Added `enforceBaseRelations()` as a post-distribution correction step. After the weighted random allocation completes:

1. Stats are grouped into **tiers** by base value (equal base = same tier, per PTU rules).
2. All added-point values are sorted descending.
3. The sorted values are assigned to tiers top-down: the highest base-stat tier receives the largest added-point values, the next tier gets the next slice, etc.
4. Within each tier, values are shuffled (Fisher-Yates) to preserve randomness for equal-base-stat stats.

**Correctness guarantee:** Because the pool is sliced sequentially from a descending sort, the minimum added-point value assigned to a higher tier is always >= the maximum value assigned to a lower tier. Combined with the strictly higher base stat, every stat in a higher tier will always have a higher final value than every stat in a lower tier.

**PTU rule reference:** PTU Core Chapter 5, p.198-199 — "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." Equal base stats do not need to maintain equality.

**Duplicate code path check:** Searched entire `app/` for `distributeStatPoints`, `stat.*point`, `distributeStat`. Only one code path performs automated stat distribution — the generator service. The `levelUpCheck.ts` and `PokemonLevelUpPanel.vue` handle level-up stat points as a manual player allocation (displays a reminder about Base Relations but does not auto-allocate), so no fix needed there.

**Files changed:**
- `app/server/services/pokemon-generator.service.ts` — added `enforceBaseRelations()` function, integrated into `distributeStatPoints()`
