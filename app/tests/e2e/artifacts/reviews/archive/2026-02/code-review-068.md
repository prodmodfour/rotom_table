---
review_id: code-review-068
commit: ef1fe54
ticket: bug-028
domain: combat
status: APPROVED
date: 2026-02-20
reviewer: senior-reviewer
---

# Code Review 068: E2E Regression Test for Cursed Surviving Take a Breather (bug-028)

## Commit

`ef1fe54` -- `test: add E2E regression test for Cursed surviving Take a Breather`

## Files Reviewed

1. `app/tests/e2e/scenarios/combat/combat-take-a-breather-001.spec.ts` (new test case added)
2. `app/tests/e2e/artifacts/tickets/bug/bug-028.md` (new ticket)

---

## Issues

None.

---

## What Looks Good

1. **Test correctly applies both Cursed and Confused.** Line 275-277:

   ```typescript
   await applyStatus(request, encounterId, bulbasaurCombatantId, {
     add: ['Cursed', 'Confused']
   })
   ```

   This satisfies the ticket requirement: "Apply Cursed + another volatile condition (e.g., Confused) to a combatant." Confused is a standard volatile condition that Take a Breather should cure, providing the positive control that the filter logic works correctly.

2. **Pre-breather state verification is thorough.** Lines 280-283 verify both conditions are actually present before the breather:

   ```typescript
   expect(bulbasaurBefore.entity.statusConditions).toContain('Cursed')
   expect(bulbasaurBefore.entity.statusConditions).toContain('Confused')
   ```

   This guards against a false-positive where the API silently drops the status application. Without this check, the test could pass even if Cursed was never applied.

3. **All five ticket assertions are covered:**
   - (1) Cursed + Confused applied: lines 282-283
   - (2) Take a Breather executed: line 286
   - (3) Cursed NOT in `conditionsCured`: line 289
   - (4) Confused IS in `conditionsCured`: line 292
   - (5) Post-breather GET confirms Cursed still present and Confused gone: lines 298-302

   This is exactly the 5-step verification specified in the ticket.

4. **Test file location is correct.** Added to `combat-take-a-breather-001.spec.ts` alongside existing breather tests. This is one of the two locations suggested by the ticket and the better choice -- it keeps all Take a Breather edge cases together in one describe block. The test name (`'breather does NOT cure Cursed (volatile exception, PTU p.245)'`) includes the PTU page reference for traceability.

5. **Test follows established patterns.** The test uses the same helpers (`createPokemon`, `createEncounter`, `addCombatant`, `startEncounter`, `applyStatus`, `takeBreather`, `getEncounter`, `findCombatantByEntityId`) and the same `bulbasaurSetup`/`charmanderSetup` fixtures as the other tests in the file. Cleanup is handled by the shared `test.afterEach` hook. No new helper functions or fixtures were needed.

6. **Test placement within the describe block is logical.** The new test is inserted after the "no active buffs" test and before the "breather is logged" test, grouping it with the other condition-specific tests. The ordering flows: core behavior, persistent conditions, temp HP, slowed/stuck, clean state, cursed exception, move log.

7. **Ticket artifact is well-structured.** The bug-028 ticket includes clear traceability: source (`code-review-063`), related tickets (`bug-014`), fix log with commit reference, and suggested locations. The priority (P3) and severity (LOW) are appropriate for a test-gap-only ticket.

---

## Verdict

**APPROVED.** The test correctly implements all five assertions from the ticket specification. It covers the Cursed exception (PTU p.245) with a proper positive control (Confused is cured normally). The test follows existing patterns and is placed in the right file. No issues found.
