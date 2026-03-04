---
review_id: code-review-328
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-024
domain: testing
commits_reviewed:
  - e250a53f
  - cc691946
files_reviewed:
  - app/tests/unit/services/living-weapon.service.test.ts
  - artifacts/tickets/open/feature/feature-024.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T14:55:00Z
follows_up: code-review-324
---

## Review Scope

Re-review of the feature-024 fix cycle addressing two findings from code-review-324:

- **H1**: Duplicate `vi.mock` for `~/utils/equipmentBonuses` — first block (lines 17-26) was dead code because Vitest only honors the last `vi.mock` call for a given module.
- **M1**: `.toBe` reference equality assertion in `clearWieldOnRemoval` test (line 581) was flagged as testing an implementation detail without justification.

Commit `e250a53f` applies both fixes to `living-weapon.service.test.ts`. Commit `cc691946` updates the feature-024 resolution log with the fix cycle entry.

Decrees checked: decree-043 (skill rank gating) and decree-046 (No Guard accuracy) are relevant to the living weapon domain but concern game rules, not test structure. No decree violations.

## Issues

No issues found.

## What Looks Good

**H1 fix is clean.** The duplicate `vi.mock('~/utils/equipmentBonuses', ...)` block (formerly lines 17-26) has been removed entirely. The remaining single mock at line 27 includes all three exports (`computeEquipmentBonuses`, `computeEffectiveEquipment`, `getEquipmentGrantedCapabilities`), which is the correct superset. Grep confirms exactly one `vi.mock.*equipmentBonuses` occurrence in the file.

**M1 fix is appropriate.** The `.toBe` assertion is retained (correct — this test intentionally verifies reference equality to ensure the no-op path returns the original array, not a shallow copy). The added comment `// Intentional reference equality: no-op path must return the original array (not a copy)` explains the design intent clearly. This is the right resolution: the assertion was not a bug, it was under-documented intent.

**Resolution log updated correctly.** The feature-024 ticket now records the fix cycle commit and updated line count (671 -> 660 lines), maintaining traceability.

**No collateral damage.** The diff is minimal (15 lines changed, net -11), confined to the single test file. No mock ordering changes, no import shifts, no test logic modifications beyond the two targeted fixes.

## Verdict

**APPROVED.** Both code-review-324 findings are resolved. H1 dead code removed, M1 assertion documented. No new issues introduced. The fix is minimal and precisely scoped.
