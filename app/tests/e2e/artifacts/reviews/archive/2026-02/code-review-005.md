---
review_id: code-review-005
target: refactoring-006
ticket_id: refactoring-006
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16
commits_reviewed:
  - 767e6f3
  - a95b67e
files_reviewed:
  - app/constants/statusConditions.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/services/combatant.service.ts
  - app/tests/e2e/scenarios/combat/combat-take-a-breather-001.spec.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
scenarios_to_rerun:
  - combat-take-a-breather-001
---

## Summary

Refactoring-006 deduplicates constants in `breather.post.ts` and `move.post.ts` and includes a PTU bug fix — breather previously only cleared 5 conditions (Confused, Cursed, Enraged, Suppressed, Flinched) instead of all 12 (10 volatile + Slowed + Stuck). The code changes are correct and well-structured. However, the bug fix introduces new behavior with zero test coverage.

## Issues

### HIGH #1: Bug fix has no test coverage for new behavior

**File:** `app/tests/e2e/scenarios/combat/combat-take-a-breather-001.spec.ts`

The existing e2e test only applies Confused and verifies it gets cleared. The bug fix expanded condition clearing from 5 to 12, but no test verifies any of the 7 newly-cured conditions (Disabled, Encored, Taunted, Tormented, Infatuated, Slowed, Stuck).

**Slowed and Stuck are the critical gap.** These are "Other Afflictions" (not Volatile) that PTU p.245 explicitly names as cured by Take a Breather. They were never cleared before this fix. Without test coverage, this behavior can regress silently.

**Required fix:** Add a test case to `combat-take-a-breather-001.spec.ts` that:
1. Applies Slowed and Stuck to a combatant
2. Calls Take a Breather
3. Verifies both conditions appear in `breatherResult.conditionsCured`
4. Verifies neither condition remains in `entity.statusConditions` after breather

### MEDIUM #1: Remaining duplication in capture files

The ticket's rationale was "If the list of volatile conditions changes, the local copy could be missed." The developer fixed `breather.post.ts` but left two other local copies:

- `app/utils/captureRate.ts:16-23` — local `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS` arrays (10 entries each, currently in sync with canonical source)
- `app/composables/useCapture.ts:146-147` — inline `persistentConditions` and `volatileConditions` arrays (same values)

These are the exact same duplication pattern the ticket was about. Values are currently correct but at risk of future divergence. Recommend expanding refactoring-006 scope or creating a follow-up ticket.

### MEDIUM #2: Stale e2e test comment

**File:** `app/tests/e2e/scenarios/combat/combat-take-a-breather-001.spec.ts:10`

```
// Current (reflects old buggy behavior):
*   - Cure volatile conditions: Confused, Cursed, Enraged, Suppressed, Flinched
// Should be:
*   - Cure all Volatile conditions + Slowed and Stuck (PTU p.245)
```

### MEDIUM #3: Pipeline state tracking inconsistency

`pipeline-state.md:635` still shows refactoring-006 as `open`. The ticket itself has `status: resolved`. Should be updated when the review passes.

## Observation for Game Logic Reviewer

PTU p.247 lists Sleep under "Volatile Afflictions", but the code classifies `Asleep` as Persistent (`constants/statusConditions.ts:8`). This predates this commit. If Sleep is correctly volatile per PTU 1.05, then:
- `VOLATILE_CONDITIONS` should include `Asleep`
- `PERSISTENT_CONDITIONS` should not include `Asleep`
- Breather should cure Sleep
- Capture rate classification may change (volatile = +5 vs persistent = +10)

This is a pre-existing classification question. Defer to Game Logic Reviewer for PTU ruling.

## What Looks Good

- `BREATHER_CURED_CONDITIONS = [...VOLATILE_CONDITIONS, 'Slowed', 'Stuck']` — clean pattern that correctly separates the two rule sources (volatile conditions from p.247, Slowed+Stuck explicitly named in p.245)
- `createDefaultStageModifiers()` export — minimal change, no behavior alteration, just visibility
- `crypto.randomUUID()` standardization — correct; `uuid` package still imported in 4 other files (combatants.post.ts, from-scene.post.ts, load.post.ts, pokemon-generator.service.ts) so dependency retained appropriately
- Commit message is well-structured with PTU page references
- Ticket resolution log is thorough

## Verdict

**APPROVED** (re-review of a95b67e)

### Re-review: a95b67e

Both CHANGES_REQUIRED items resolved:

1. **HIGH #1 — RESOLVED.** New test `breather cures Slowed and Stuck (non-volatile, PTU p.245)` (lines 197-231) applies both conditions, verifies pre-state, calls breather, asserts both in `conditionsCured`, and confirms neither remains post-breather. Comment correctly notes these are "Other Afflictions, not Volatile." Exactly what was requested.

2. **MEDIUM #2 — RESOLVED.** Header comment (line 10) updated from the old partial list to `Cure all Volatile conditions + Slowed and Stuck (PTU p.245)`.

Remaining tracked items:
- MEDIUM #1 — Capture file duplication (recommend new Auditor ticket)
- MEDIUM #3 — Pipeline state updated with this re-review

### Note for Game Logic Reviewer

The Sleep/Asleep classification observation from the original review still stands. PTU p.247 lists Sleep under Volatile Afflictions, but the code classifies `Asleep` as Persistent. This predates refactoring-006 and affects breather curing + capture rate modifiers. Defer to Game Logic Reviewer for ruling.

### Scenarios to re-run

- `combat-take-a-breather-001`
