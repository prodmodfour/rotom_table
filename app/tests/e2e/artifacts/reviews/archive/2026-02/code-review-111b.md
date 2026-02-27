---
review_id: code-review-111b
ticket: ptu-rule-051
follows_up: code-review-111
commits_reviewed: [0c840f1]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

# Follow-up Review: ptu-rule-051 — Breather Shift Banner Fixes

## Scope

Re-review of `app/pages/gm/index.vue` after two required fixes from code-review-111.

## Fix Verification

### HIGH — Banner persists across turn changes

**Status: FIXED**

`pendingBreatherShift.value = null` is now the first statement in `nextTurn()` (line 402), clearing stale banner data before advancing the turn. The same cleanup was added inside `endEncounter()` (line 433), inside the confirmation guard. Both placements match the review's prescribed fix exactly.

Verified at:
- `app/pages/gm/index.vue` line 402 (`nextTurn`)
- `app/pages/gm/index.vue` line 433 (`endEncounter`)

### MEDIUM — "Move on Grid" immediately dismisses banner

**Status: FIXED**

`focusBreatherToken()` (lines 352-357) no longer sets `pendingBreatherShift.value = null`. The function now only switches `activeView` to `'grid'`, leaving the banner visible. The auto-dismiss path via `handleTokenMoveWithBreatherClear` (lines 359-366) remains the sole mechanism for clearing the banner on token movement. The explicit "Dismiss" emit on the banner component (line 40) provides the manual escape hatch.

This means the three dismissal paths are now correctly differentiated:
1. **Token moved on grid** -- auto-dismiss via `handleTokenMoveWithBreatherClear` (line 363-364)
2. **GM clicks "Dismiss"** -- explicit dismiss via `@dismiss="pendingBreatherShift = null"` (line 40)
3. **Turn advances or encounter ends** -- cleanup via `nextTurn` / `endEncounter` (lines 402, 433)

"Move on Grid" no longer duplicates "Dismiss" behavior.

## Regression Check

All 11 references to `pendingBreatherShift` in `gm/index.vue` were audited:
- Line 37: Template `v-if` guard -- unchanged, correct
- Line 38: Props binding -- unchanged, correct
- Line 40: Dismiss emit handler -- unchanged, correct
- Line 335: Ref declaration -- unchanged, correct
- Line 346: Assignment in breather action handler -- unchanged, correct
- Line 354: Early return guard in `focusBreatherToken` -- unchanged, correct
- Line 363-364: Auto-clear in `handleTokenMoveWithBreatherClear` -- unchanged, correct
- Line 402: **NEW** -- clear in `nextTurn`
- Line 433: **NEW** -- clear in `endEncounter`

No new issues introduced. The diff is minimal (3 insertions, 3 deletions) and surgically addresses both review findings.

## Summary

Both required fixes from code-review-111 are correctly applied. The banner lifecycle is now clean: it appears on breather action, persists through grid focus, and is cleared on token move, explicit dismiss, turn advance, or encounter end. No regressions detected.
