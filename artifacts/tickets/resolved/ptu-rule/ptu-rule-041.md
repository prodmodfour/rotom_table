---
ticket_id: ptu-rule-041
type: ptu-rule
priority: P2
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: senior-reviewer
created_at: 2026-02-19T18:50:00
domain: healing
severity: LOW
affected_files:
  - app/tests/e2e/artifacts/loops/healing.md
  - app/tests/e2e/artifacts/scenarios/healing-workflow-pokemon-center-full-heal-001.md
---

## Summary

The healing loop doc and Pokemon Center full-heal scenario still describe `drainedAp` being reset to 0 by Pokemon Center visits. This was made incorrect by the ptu-rule-038 fix — Pokemon Centers do NOT restore drained AP (that is exclusively an Extended Rest benefit). Additionally, both docs still reference `restMinutesToday` being set to 480, which was made incorrect by the ptu-rule-040 fix.

## Details

### Stale drainedAp assertion (from ptu-rule-038)

`app/tests/e2e/artifacts/loops/healing.md:194`:
```
8. **[Mechanic: drained-ap-restoration]** For characters: sets `drainedAp` to 0
```
This step should be removed entirely. The character Pokemon Center endpoint docblock already correctly states: "Pokemon Centers do NOT restore drained AP — that is exclusively an Extended Rest benefit."

`app/tests/e2e/artifacts/loops/healing.md:213`:
```
- `drainedAp` set to 0 (characters only)
```
Should be removed from the Expected End State.

### Stale restMinutesToday assertions (from ptu-rule-040)

`app/tests/e2e/artifacts/loops/healing.md:191` — remove `, sets restMinutesToday to 480 (maxed out)` clause.

`app/tests/e2e/artifacts/loops/healing.md:212` — remove `restMinutesToday set to 480` line from Expected End State.

`app/tests/e2e/artifacts/scenarios/healing-workflow-pokemon-center-full-heal-001.md:148` — remove `, restMinutesToday = 480` from verification line.

## Fix

Update 5 lines across 2 markdown files to remove stale assertions. No code changes needed.

## PTU Reference

- ptu-rule-038: Pokemon Centers do not restore drained AP
- ptu-rule-040: Pokemon Centers do not consume daily rest budget

## Fix Log

- Removed `, sets restMinutesToday to 480 (maxed out)` from Pokemon Center full-heal mechanic description (healing.md line 191)
- Removed entire `[Mechanic: drained-ap-restoration]` step from Pokemon Center workflow (healing.md line 194)
- Removed `restMinutesToday set to 480` from Pokemon Center Expected End State (healing.md line 212)
- Removed `drainedAp set to 0 (characters only)` from Pokemon Center Expected End State (healing.md line 213)
- Updated Pokemon Center scenario verification to assert `restMinutesToday = 120 (unchanged)` instead of `480` (healing-workflow-pokemon-center-full-heal-001.md line 148)
- Removed `drained-ap-restoration` from W3 mechanics_exercised frontmatter
- Fixed step numbering in W3 workflow (9-11 instead of 10-12)

## Discovered By

Senior Reviewer during code-review-051 (reviewing ptu-rule-040 fix).
