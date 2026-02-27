---
ticket_id: ptu-rule-057
priority: P3
status: resolved
domain: encounter-tables
matrix_source:
  rule_id: encounter-tables-R012
  audit_file: matrix/encounter-tables-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No species diversity enforcement in encounter generation. Independent random draws from the weighted table can produce single-species encounters (e.g., 6 Zubat).

## Expected Behavior

Encounter generation should ensure reasonable species diversity, especially at higher spawn counts.

## Actual Behavior

Each spawn is an independent weighted random draw with no diversity constraint.

## Resolution Log

**Fixed in:** `app/server/api/encounter-tables/[id]/generate.post.ts`
**Commit:** `8c33677`
**Date:** 2026-02-20

### What changed

The weighted random selection loop in the encounter generation endpoint now enforces species diversity through two mechanisms:

1. **Exponential weight decay:** Each time a species is selected, its effective weight for subsequent draws is halved (`weight * 0.5^timesSelected`). A species with base weight 20 that has been picked twice will have effective weight 5 on the third draw, making other species progressively more likely.

2. **Per-species cap:** No single species can exceed `ceil(spawnCount / 2)` selections. For a 6-Pokemon encounter, no species can appear more than 3 times. When a species hits the cap, its effective weight drops to 0.

**Edge cases handled:**
- Single-species pool (1 entry): diversity logic is skipped entirely since there is nothing to diversify.
- All species capped (fallback): if every species hits the cap (only possible with very small pools and high counts), the algorithm falls back to original unmodified weights to avoid an infinite loop.
- Original weight preserved in output: the `weight` field in the response still reflects the table's configured weight, not the effective draw weight.

### Duplicate code path check

Searched entire codebase for weighted random selection patterns. Confirmed only one code path generates encounters from weighted tables: `generate.post.ts`. The `wild-spawn.post.ts` endpoint receives already-generated Pokemon (from the generate endpoint's output) and creates DB records — it does not perform its own random selection.
