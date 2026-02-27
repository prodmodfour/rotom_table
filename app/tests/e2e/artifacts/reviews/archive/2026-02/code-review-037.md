---
review_id: code-review-037
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-002, bug-001, ptu-rule-030
domain: csv-import
commits_reviewed:
  - 3d7413b
  - 1b3fa17
files_reviewed:
  - app/server/services/csv-import.service.ts
  - app/tests/e2e/artifacts/tickets/bug/bug-001.md
  - app/tests/e2e/artifacts/tickets/bug/bug-002.md
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-030.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - csv-pokemon-import-capabilities
reviewed_at: 2026-02-18T23:30:00
---

## Review Scope

Reviewed 2 commits fixing CSV capability cell references. bug-002 (P1) reported that `swim` and `sky` both read from cell (33, 13). Investigation revealed 6 of 7 capability cells were wrong — only `overland` was correct. Fix commit 3d7413b corrects all cell references; 1b3fa17 closes the three duplicate tickets (bug-001, bug-002, ptu-rule-030).

## Verification

1. **Cell uniqueness** — All 7 capability `getCell` calls now reference distinct (row, col) pairs. No duplicates remain:
   - (32, 13) = overland
   - (33, 13) = sky
   - (34, 13) = swim
   - (32, 15) = levitate
   - (33, 15) = burrow
   - (34, 15) = jump
   - (32, 17) = power

2. **Comment-to-code consistency** — The inline comment documenting the 3-row layout (rows 32-34, labels in even cols 12/14/16, values in odd cols 13/15/17) is accurate. Every `getCell` call matches the documented grid position exactly.

3. **PTU sheet verification** — Developer verified against an actual exported PTU CSV (sabre.csv / Alolan Vulpix). This is the correct approach — cell coordinates are format-dependent and cannot be verified from rules text alone.

4. **Weight/size consistency** — The layout comment shows Weight at (33, 16-17) and Size at (34, 16-17). These cells are intentionally not read — `weightClass` and `size` are sourced from `speciesData` (DB species lookup) at lines 381 and 385. Correct design choice: species-intrinsic values should come from the database, not from potentially stale CSV data entry.

5. **Ticket housekeeping** — All three tickets have proper Fix Log sections with commit hash, file, root cause explanation, and cross-references to the other closed tickets.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- **Thorough root cause analysis.** Developer didn't just fix the reported swim/sky duplicate — they audited all 7 capability cells against an actual CSV export and found 5 additional errors (burrow, levitate, power, jump). This is exactly the "check for other occurrences" pattern we want to see.
- **Inline documentation.** The 4-line comment mapping the PTU sheet grid layout makes future maintenance trivial. Anyone touching these cells can verify correctness at a glance.
- **Clean commit separation.** Code fix (3d7413b) separate from ticket bookkeeping (1b3fa17). Good granularity.
- **Detailed commit message.** Lists every cell change with before/after values and the verification source.

## Verdict

APPROVED — All capability cell references are now correct, unique, and documented. Fix was verified against actual PTU CSV data. No remaining issues.

## Scenarios to Re-run

- csv-pokemon-import-capabilities: Import a Pokemon with non-zero swim, sky, burrow, levitate, power, and jump values via CSV and verify each capability displays the correct (distinct) value. Use a Flying/Water Pokemon like Gyarados or Pelipper that has both sky and swim to confirm they are no longer aliased.
