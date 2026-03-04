---
review_id: code-review-331
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-134
domain: combat
commits_reviewed:
  - 8bdb1834
  - 194e78ae
files_reviewed:
  - app/constants/statusConditions.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-04T19:10:00Z
follows_up: null
---

## Review Scope

Two commits implementing ptu-rule-134: revert Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) from `clearsOnFaint: true` to `clearsOnFaint: false`, per decree-047.

Commit `8bdb1834` changes the code in `app/constants/statusConditions.ts`. Commit `194e78ae` moves the ticket to in-progress and updates the refactoring-106 resolution log.

## Decree Compliance

**decree-047** (Other conditions do not clear on faint by default):
- Binding point 1 (RAW baseline `clearsOnFaint: false`): All 5 conditions verified to have `clearsOnFaint: false`. Correct.
- Binding point 2 (source-dependent clearing deferred): Comment at line 161 references refactoring-129 as future work. Correct.
- Binding point 3 (`clearsOnEncounterEnd: true` is intentional): All 5 conditions retain `clearsOnEncounterEnd: true`. Comment block at lines 155-161 documents this as a pragmatic improvement. Correct.

**decree-038** (Decouple behaviors from categories): The fix continues to use per-condition flags rather than category-based logic. The `FAINT_CLEARED_CONDITIONS` array is derived from `clearsOnFaint` flags, not from category membership. Correct.

**decree-044** (Remove phantom Bound condition): Not directly applicable, but Trapped retains `clearsOnRecall: false` (Trapped prevents recall entirely), which is consistent with decree-044's ruling that only Trapped blocks recall. No issue.

## Verification

### Conditions changed (all confirmed `clearsOnFaint: false`)
| Condition | clearsOnRecall | clearsOnEncounterEnd | clearsOnFaint |
|-----------|---------------|---------------------|---------------|
| Stuck | true | true | false |
| Slowed | true | true | false |
| Trapped | false | true | false |
| Tripped | true | true | false |
| Vulnerable | true | true | false |

### Downstream consumer check
The only consumer of `FAINT_CLEARED_CONDITIONS` is `combatant.service.ts:applyFaintStatus()` (line 174). This function builds a Set from the derived array and uses it to filter which conditions to clear. Since the array is dynamically derived from `clearsOnFaint` flags, the 5 Other conditions are automatically excluded. No code changes needed in the consumer. Verified safe.

### FAINT_CLEARED_CONDITIONS contents after fix
The derived array now contains exactly 14 conditions (5 persistent + 9 volatile, including Asleep and Bad Sleep), matching the pre-refactoring-106 count. Fainted and Dead were already `clearsOnFaint: false` and remain excluded.

## Issues

No issues found.

## What Looks Good

1. **Minimal, surgical fix.** Only the 5 values that needed changing were changed. No unnecessary refactoring or scope creep.
2. **Thorough documentation.** The block comment at lines 155-161 explains the decree-047 rationale, the RAW reference, the intentional `clearsOnEncounterEnd: true` decision, and the future work pointer to refactoring-129. Each individual condition also has an inline comment citing decree-047.
3. **Derived array correctness.** The `FAINT_CLEARED_CONDITIONS` comment at lines 259-260 was updated to explain why Other conditions are excluded, with both decree-047 and refactoring-129 references.
4. **Commit granularity.** Code fix and ticket housekeeping are properly separated into two commits.
5. **Ticket resolution log.** ptu-rule-134 has a resolution log with the fix commit hash. refactoring-106 has a fix cycle section documenting both the HIGH (clearsOnFaint revert) and MEDIUM (clearsOnEncounterEnd documented as intentional) from code-review-327.

## Verdict

**APPROVED.** The fix correctly implements all three binding points of decree-047. The 5 Other conditions now have `clearsOnFaint: false`, the `FAINT_CLEARED_CONDITIONS` derived array automatically excludes them, and the sole downstream consumer (`applyFaintStatus`) requires no changes. Documentation is thorough and accurate.

## Required Changes

None.
