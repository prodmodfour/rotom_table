---
review_id: rules-review-046
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-040
domain: healing
commits_reviewed:
  - 63bec43
mechanics_verified:
  - pokemon-center-rest-budget-independence
  - pokemon-center-healing-scope
  - daily-injury-counter-sharing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Resting
  - core/07-combat.md#Pokemon-Centers
reviewed_at: 2026-02-19T19:00:00
---

## Review Scope

Reviewing commit 63bec43 which fixes ptu-rule-040: Pokemon Center endpoints incorrectly set `restMinutesToday: 480`, consuming the entire daily rest budget. The fix removes this field from both `characters/[id]/pokemon-center.post.ts` and `pokemon/[id]/pokemon-center.post.ts`.

## Mechanics Verified

### Pokemon Center / Rest Budget Independence
- **Rule:** "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md` lines 1995-1998) and "Pokemon Centers use expensive and advanced machinery to heal Pokemon. In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health..." (`core/07-combat.md` lines 2015-2020)
- **Implementation:** Previously both endpoints set `restMinutesToday: 480` after healing. The fix removes this line from both files. `restMinutesToday` now remains unchanged by Pokemon Center visits.
- **Status:** CORRECT
- **Detail:** PTU defines rest as a deliberate passive activity ("sleep, or at least sitting down for a while" — line 1990-1991) with an 8-hour daily budget. Pokemon Centers are a separate medical procedure. No rulebook text links Pokemon Center visits to rest time consumption. The removal is the correct fix.

### Pokemon Center Healing Scope (Post-Fix Verification)
- **Rule:** Pokemon Centers heal to full HP, clear all status conditions, restore daily-frequency moves, and heal up to 3 injuries/day. They do NOT restore drained AP (Extended Rest only per line 2011). (`core/07-combat.md` lines 2015-2028)
- **Implementation:** Character endpoint restores HP to max, clears status conditions, heals injuries (capped at 3/day), returns `apRestored: 0`. Pokemon endpoint additionally resets move usage (`usedToday`, `usedThisScene`). Neither endpoint touches `drainedAp`.
- **Status:** CORRECT
- **Detail:** All Pokemon Center healing effects remain intact after the fix. Only the erroneous `restMinutesToday` assignment was removed.

### Daily Injury Counter Sharing
- **Rule:** "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (`core/07-combat.md` lines 2026-2028)
- **Implementation:** Both endpoints retain `lastRestReset: new Date()` and `injuriesHealedToday` tracking. The `shouldResetDailyCounters()` check resets the counter on a new day. The shared 3/day injury cap is preserved across all healing sources.
- **Status:** CORRECT
- **Detail:** `lastRestReset` drives the daily counter reset for `injuriesHealedToday` — this is correctly retained. It does NOT affect `restMinutesToday` (which tracks actual rest time separately).

## Summary
- Mechanics checked: 3
- Correct: 3
- Incorrect: 0
- Needs review: 0

## Rulings
None required — the rule distinction between rest and Pokemon Center healing is unambiguous.

## Verdict
APPROVED — The fix correctly removes the erroneous `restMinutesToday: 480` from both Pokemon Center endpoints. PTU treats rest and Pokemon Center healing as independent mechanics, and the fix preserves all other Pokemon Center healing behavior (HP, status, moves, injuries, AP exclusion) unchanged.

## Required Changes
None.
