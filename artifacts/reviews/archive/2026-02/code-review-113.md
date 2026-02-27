---
review_id: code-review-113
target: ptu-rule-076
trigger: dev-fix
verdict: APPROVED
reviewed_commits: [c2a28bc, 49cc263]
reviewed_files: [app/server/api/encounters/[id]/breather.post.ts, app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-076.md]
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

The developer fixed ptu-rule-076 by adding `combatant.turnState.shiftActionUsed = true` at line 99 of the breather endpoint, alongside the existing `standardActionUsed` and `hasActed` assignments. The comment was updated to clarify that Take a Breather is a Full Action consuming both Standard and Shift actions per PTU p.245. The ticket was marked resolved with a thorough resolution log including a duplicate code path check. Both commits are clean and correctly scoped.

## Issues

### CRITICAL

(none)

### HIGH

(none)

### MEDIUM

**M1: Direct property mutation inconsistency with `pass.post.ts`** -- The breather endpoint uses direct property assignment (`combatant.turnState.standardActionUsed = true`) while the newer `pass.post.ts` uses the spread pattern (`combatant.turnState = { ...combatant.turnState, ... }`). This was already noted in code-review-105 as a style inconsistency. Both approaches are functionally correct on server-side plain JSON objects (no reactive proxies), so this is not a correctness bug. However, the project's coding style rules prefer immutable patterns. This is a pre-existing inconsistency, not introduced by this fix -- the developer correctly added one line matching the existing three-line pattern at that location. Filing a consistency cleanup as a separate concern would be appropriate but is not blocking.

## New Tickets Filed

(none -- M1 is a pre-existing style inconsistency already documented in code-review-105)

## What Looks Good

1. **Minimal, targeted fix.** Exactly one line added to the correct location. No unnecessary refactoring, no scope creep.
2. **Accurate comment update.** Changed "Mark as having used their standard action" to "Mark as having used their full action (standard + shift) -- PTU p.245" which precisely describes the semantics.
3. **Thorough duplicate code path check.** The developer searched all server endpoints for `standardActionUsed` and `hasActed` patterns, confirmed the breather endpoint is the only server endpoint that sets action flags on `turnState`, and verified that the intercept maneuver (also a Full Action) is handled entirely client-side via `useEncounterActions.ts` lines 143-145 which already correctly marks both standard and shift. I independently verified all three claims via grep.
4. **Clean commit hygiene.** Two properly scoped commits: one for the code fix, one for the ticket resolution. Conventional commit format. Descriptive messages with PTU page references.
5. **Client-side redundancy is harmless.** The composable at `useEncounterActions.ts` line 143-145 still calls `useAction(combatantId, 'standard')` and `useAction(combatantId, 'shift')` before calling the breather endpoint. With the server now also setting both flags, the client-side call is redundant but harmless -- the server is now authoritative regardless of which client calls it, which was the ticket's requirement.

## Verdict

APPROVED. The fix is correct, minimal, and the developer's duplicate code path analysis is verified.
