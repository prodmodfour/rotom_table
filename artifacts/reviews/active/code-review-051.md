---
review_id: code-review-051
ticket_id: ptu-rule-040
type: code-review
reviewer: senior-reviewer
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-19T18:45:00
commits_reviewed:
  - 63bec43
files_reviewed:
  - app/server/api/characters/[id]/pokemon-center.post.ts
  - app/server/api/pokemon/[id]/pokemon-center.post.ts
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-040.md
scenarios_to_rerun:
  - healing-workflow-pokemon-center-full-heal-001
follows_up: null
---

## Summary

Reviewed fix for ptu-rule-040: removal of `restMinutesToday: 480` from both Pokemon Center endpoints. Code change is correct and minimal. However, the developer did not update test artifacts that now contain stale assertions describing the old (incorrect) behavior.

## Status

| Item | Status |
|------|--------|
| Character endpoint fix | Done — line removed |
| Pokemon endpoint fix | Done — line removed |
| Ticket created with fix log | Done |
| Loop/scenario doc updates | **Missing** |

## Issues

### MEDIUM-1: Stale assertions in healing loop doc

`app/tests/e2e/artifacts/loops/healing.md:191`:
```
5. **[Mechanic: pokemon-center-full-heal]** Server sets `currentHp` to `maxHp`, clears ALL status conditions (persistent + volatile + other), sets `restMinutesToday` to 480 (maxed out)
```
Should remove the `sets restMinutesToday to 480 (maxed out)` clause.

`app/tests/e2e/artifacts/loops/healing.md:212`:
```
- `restMinutesToday` set to 480
```
Should remove this line entirely from the "Expected End State" list.

### MEDIUM-2: Stale assertion in Pokemon Center full-heal scenario

`app/tests/e2e/artifacts/scenarios/healing-workflow-pokemon-center-full-heal-001.md:148`:
```
- Verify: currentHp = 44 (full), injuries = 1, statusConditions = [], drainedAp = 2 (unchanged — Pokemon Centers do not restore AP per ptu-rule-038), restMinutesToday = 480
```
Should remove `, restMinutesToday = 480` from this verification line.

These three stale assertions will produce incorrect Playwright tests if anyone implements from these specs, and will mislead anyone reading the loop to understand system behavior.

### OUT-OF-SCOPE: Stale drainedAp assertion in healing loop (from ptu-rule-038)

`app/tests/e2e/artifacts/loops/healing.md:194`:
```
8. **[Mechanic: drained-ap-restoration]** For characters: sets `drainedAp` to 0
```
This was made stale by the ptu-rule-038 fix (Pokemon Centers do NOT restore AP). Filed as **ptu-rule-041** which also consolidates the restMinutesToday doc staleness from this ticket.

## What Looks Good

- Surgical fix: exactly the right 2 lines removed, nothing else touched
- Commit message is well-written — explains the "why" (medical procedure vs rest), references the ticket
- No behavioral regressions: `lastRestReset`, `injuriesHealedToday`, status clearing, injury healing all untouched
- Grepped the entire server directory — no other endpoints set `restMinutesToday: 480`
- Ticket has complete Fix Log

## Required Changes

1. Update `healing.md` lines 191 and 212 to remove `restMinutesToday` references from Pokemon Center behavior
2. Update `healing-workflow-pokemon-center-full-heal-001.md` line 148 to remove `restMinutesToday = 480` assertion

**Filed:** ptu-rule-041 covers all stale doc assertions (both the restMinutesToday lines from this fix and the drainedAp line from ptu-rule-038). Developer can fix all 5 lines in one commit.
