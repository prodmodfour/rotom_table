---
review_id: code-review-038
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-002, bug-001, ptu-rule-030
domain: csv-import
commits_reviewed:
  - 3896a22
  - c79f8d8
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
follows_up: code-review-037
reviewed_at: 2026-02-18T23:50:00
---

## Review Scope

Re-review of CSV capability row index fix. Previous review (code-review-037) approved commit 3d7413b which used rows 32/33/34. rules-review-034 found those indices were off by +1. Commit 3896a22 corrects all rows to 31/32/33. Commit c79f8d8 backfills commit hashes into ticket fix logs.

This review supersedes code-review-037, which is now stale.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- **Correct fix applied.** All 7 capability `getCell` calls shifted uniformly by -1 row. The resulting cell map has no duplicates and matches the inline comment grid:
  - Row 31: overland (13), levitate (15), power (17)
  - Row 32: sky (13), burrow (15)
  - Row 33: swim (13), jump (15)
- **Comment updated.** The inline layout comment was updated from rows 32-34 to rows 31-33, matching the actual code. Comment-to-code consistency is confirmed.
- **Ticket fix logs are thorough.** All three tickets document both the wrong commit (3d7413b) and the corrected commit (3896a22) with explicit cell coordinates. Good audit trail showing the two-attempt fix history.
- **Clean commit separation.** Code fix (3896a22) separate from ticket bookkeeping (c79f8d8).
- **Developer verified against actual CSV data.** sabre.csv (Alolan Vulpix) values confirmed: overland=4, swim=2, sky=0, burrow=0, levitate=0, power=2, jump={1,2}.

## Verdict

APPROVED — Row indices corrected from 32/33/34 to 31/32/33. All 7 capabilities now read from distinct, documented cells. Verified against actual PTU CSV export. No remaining issues.

## Scenarios to Re-run

- csv-pokemon-import-capabilities: Import a Pokemon with non-zero swim, sky, burrow, levitate, power, and jump values via CSV and verify each capability displays the correct (distinct) value. Use a Flying/Water type like Gyarados or Pelipper to confirm sky and swim are no longer aliased.
