---
ticket_id: refactoring-119
category: refactoring
priority: P4
status: open
source: code-review-264 MED-001
created_by: slave-collector (plan-20260301-223500)
created_at: 2026-03-02
---

# refactoring-119: Update stale interrupt.post.ts file header comment

## Summary

The file header comment in `interrupt.post.ts` (lines 16-17) still says: "Per spec F3: In League Battles, Pokemon using Interrupt forfeit their next round turn (skipNextRound = true)." This was narrowed by commit cd1c7cd4 to only apply to uncommandable switched-in Pokemon (`canBeCommanded === false`). The `applyInterruptUsage` JSDoc in `out-of-turn.service.ts` was correctly updated, but the endpoint file header was not.

## Affected Files

- `app/server/api/encounters/[id]/interrupt.post.ts` (lines 16-17)

## Suggested Fix

Update the comment to: "Per PTU p.229 + spec F3: In League Battles, only switched-in Pokemon that cannot be commanded this round forfeit their next round turn when using an Interrupt."

## Impact

- Stale comments mislead future developers. No behavioral impact.
