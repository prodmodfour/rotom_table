---
review_id: code-review-326
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-012
domain: websocket
commits_reviewed:
  - 06313ff4
  - b343d400
  - 8d5abf80
files_reviewed:
  - app/composables/useWebSocket.ts
  - app/types/api.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/routes/ws.ts
  - artifacts/tickets/open/ux/ux-012.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-04T13:30:00Z
follows_up: code-review-322
---

## Review Scope

Re-review of the fix cycle for code-review-322 (1 CRITICAL + 2 MEDIUM). The fix was delivered in commit `06313ff4` which replaced the single `lastStatusTick` ref with an array-based `statusTickQueue`, added all missing server broadcast fields, and exposed `clearStatusTickQueue()` for UI consumption. Commit `7dabfef6` addressed the resolution log hashes (M2).

**Decrees checked:** decree-005 (status CS auto-apply) and decree-032 (Cursed tick on Standard Action only). Neither is violated. This change is purely a client-side display handler -- tick-firing logic remains entirely server-side in `next-turn.post.ts`. Per decree-032, the Cursed tick timing distinction is a server concern; the client handler correctly treats all incoming `status_tick` events uniformly.

## Issues

### MEDIUM

**M1: Resolution log still contains a non-existent commit hash**

The M2 fix (commit `7dabfef6`) corrected the original wrong hashes (`faff273e`, `e672db94`) to the correct ones (`8d5abf80`, `b343d400`). However, the fix cycle entry references `c54820c6` as the hash for the queue refactor commit. This hash does not exist in the repository -- the actual commit is `06313ff4`. The commit message for `7dabfef6` also references `c54820c6`.

This is the same class of error that M2 originally flagged: wrong commit hash in the resolution log. It appears the developer wrote the docs commit referencing a hash that was subsequently rebased or amended.

**Location:** `artifacts/tickets/open/ux/ux-012.md` line 35, hash `c54820c6` should be `06313ff4`.

This is not blocking because the resolution log is documentation, not executable code, and the correct commit can be found via `git log`. But it should be fixed while the developer is still in context.

## What Looks Good

**C1 (CRITICAL) is fully resolved.** The `statusTickQueue` array ref correctly accumulates all tick events using immutable spread (`[...statusTickQueue.value, { ...d, timestamp: Date.now() }]`). This handles the burst pattern where multiple ticks fire in a single turn (Burn + Poison on the same combatant, or ticks across multiple combatants). No events are lost.

**M1 (MEDIUM) is fully resolved.** The handler cast and ref type now include all 8 server broadcast fields: `encounterId`, `combatantId`, `combatantName`, `condition`, `damage`, `newHp`, `fainted`, `formula`. Verified against the server broadcast in `next-turn.post.ts` lines 749-757 -- exact field match. The `combatantId` field enables Player View to filter ticks to the player's own Pokemon, and `formula` enables GM tooltip display of tick calculations.

**Immutable update pattern is correct.** Line 287 uses `statusTickQueue.value = [...statusTickQueue.value, { ...d, timestamp: Date.now() }]` -- a new array allocation rather than `push()`. This triggers Vue reactivity properly and avoids mutating the previous array reference that `readonly()` protects.

**`clearStatusTickQueue()` is properly exposed.** Defined at line 356-358, returned at line 398. The function resets to an empty array, matching the immutable pattern. The `statusTickQueue` ref itself is exposed as `readonly()` at line 397, preventing consumers from directly mutating it -- they must use the clear function. This is the correct consumer API: watch the queue, display toasts, call clear.

**Type union is correct.** The `status_tick` entry in `api.ts` line 52 includes all 8 fields matching the server broadcast shape. It sits in the combat events section, consistent with the grouping convention.

**No decree violations.** Client handler is display-only; tick-firing logic (including decree-032 Cursed timing) is entirely server-side.

## Verdict

**APPROVED** -- All three issues from code-review-322 are substantively resolved. The queue pattern correctly handles burst tick events, all server broadcast fields are preserved, and the original wrong commit hashes were fixed. The remaining M1 (wrong hash for the fix cycle commit itself) is documentation-only and does not affect functionality.

## Required Changes

1. **M1 (MEDIUM):** Update `artifacts/tickets/open/ux/ux-012.md` line 35 to replace `c54820c6` with `06313ff4` (the actual fix cycle commit hash).
