---
review_id: code-review-026
target: refactoring-022
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-17
commits_reviewed:
  - 258a12a
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/constants/statusConditions.ts
scenarios_to_rerun: []
---

## Summary

Two hardcoded 19-element status condition arrays replaced with imports from the canonical `ALL_STATUS_CONDITIONS` in `constants/statusConditions.ts`. This is the final deduplication — previous tickets (refactoring-006, refactoring-008) eliminated the same pattern from `breather.post.ts`, `captureRate.ts`, and `useCapture.ts`. Zero remaining duplicates.

## Status

| Fix | File | Change | Status |
|-----|------|--------|--------|
| 1 | `combatant.service.ts:236` | `VALID_STATUS_CONDITIONS` → import alias | Correct |
| 2 | `StatusConditionsModal.vue:49` | `AVAILABLE_STATUSES` → import alias | Correct |

## Fix Analysis

**Fix 1 — combatant.service.ts:**
Replaced the hardcoded `VALID_STATUS_CONDITIONS` array (lines 235-241, 19 elements) with `export const VALID_STATUS_CONDITIONS = ALL_STATUS_CONDITIONS`. The export alias is preserved — `VALID_STATUS_CONDITIONS` is still consumed at line 283 for validation in `updateStatusConditions()`. No behavioral change; the arrays were identical.

**Fix 2 — StatusConditionsModal.vue:**
Replaced the hardcoded `AVAILABLE_STATUSES` array (lines 48-53, 19 elements) with `const AVAILABLE_STATUSES = ALL_STATUS_CONDITIONS`. The local name is preserved — the template's `v-for="status in AVAILABLE_STATUSES"` at line 12 continues to work. No behavioral change; the arrays were identical.

## Verification

- **Canonical source** (`constants/statusConditions.ts:20-23`): `ALL_STATUS_CONDITIONS` spreads `PERSISTENT_CONDITIONS` (5) + `VOLATILE_CONDITIONS` (8) + `OTHER_CONDITIONS` (6) = 19 total. Matches the removed arrays exactly.
- **Export alias consumed:** `VALID_STATUS_CONDITIONS` used at `combatant.service.ts:283` — confirmed via grep.
- **Template binding intact:** `AVAILABLE_STATUSES` used in `v-for` at `StatusConditionsModal.vue:12` — confirmed via grep.
- **No remaining duplicates:** grep for hardcoded status arrays across the codebase returns zero hits outside of `constants/statusConditions.ts`.

## Verdict

APPROVED. Clean deduplication, no behavioral change, both consumers verified. This closes out the status condition DRY violations across the codebase.
