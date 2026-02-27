---
review_id: code-review-163
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-003-track-c-p1
domain: player-view
commits_reviewed:
  - 1151a18
  - 6e48b8a
  - 849c211
  - aed853a
  - adb6ecb
  - 9b89809
  - ce8e6a4
  - 279f4d7
  - c3ba9c9
files_reviewed:
  - app/components/player/PlayerGridView.vue
  - app/components/player/PlayerGroupControl.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/VTTContainer.vue
  - app/composables/usePlayerGridView.ts
  - app/composables/useStateSync.ts
  - app/pages/player/index.vue
  - app/server/routes/ws.ts
  - app/server/api/group/tab.put.ts
  - app/stores/measurement.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T03:00:00Z
follows_up: code-review-159
---

## Review Scope

Re-review of 9 commits (1151a18..c3ba9c9) addressing all 7 issues from code-review-159 plus the pre-fix for C1/R1 (ptu-rule-083). Verified each fix against the original issue description by reading the actual source files, not just diffs.

## Issue Resolution Verification

### C1 (CRITICAL): Chebyshev distance replaced with PTU alternating diagonal -- RESOLVED

**Pre-fixed by ptu-rule-083 (commit 1151a18).** Three code paths corrected:

1. `PlayerGridView.vue` lines 127-130: Now uses `diagonals + Math.floor(diagonals / 2) + straights`. Formula matches `useGridMovement.calculateMoveDistance()` exactly (lines 143-148 of the composable).
2. `measurement.ts` distance getter (lines 41-46): Same correct formula applied.
3. `VTTContainer.vue` isometric 3D distance (lines 312-315): Flat distance component now uses the correct PTU formula before 3D Euclidean calculation.

Verified: No remaining `Math.max(dx, dy)` patterns used for movement distance anywhere in the codebase. The remaining Chebyshev patterns in `getBurstCells` (measurement.ts), `fogOfWar.ts`, and `terrain.ts` are correct -- those determine area shapes (which cells are "within N cells"), not movement costs. PTU burst/cone shapes are squares, not alternating-diagonal shapes.

### H1 (HIGH): Player tab state blindness -- RESOLVED

**Commit 6e48b8a.** Three paths fixed:

1. `ws.ts` identify handler (line 238): `sendTabState(peer)` now called for player-role clients on identify, matching the existing group-role behavior.
2. `ws.ts` tab_sync_request handler (line 277): Condition changed from `role === 'group'` to `role === 'group' || role === 'player'`.
3. `tab.put.ts` (line 2, 32): Import changed from `broadcastToGroup` to `broadcastToGroupAndPlayers`. Verified `broadcastToGroupAndPlayers` in `websocket.ts` (line 114-121) correctly iterates peers and sends to both `'group'` and `'player'` roles.

The player page's `onMessage` listener (index.vue lines 201-206) already handles both `tab_state` and `tab_change` event types, extracting the tab value. This was already wired correctly -- the issue was purely server-side omission.

### H2 (HIGH): Frozen isOnCooldown computed -- RESOLVED

**Commit 849c211.** One-line fix in `PlayerGroupControl.vue` line 85:

Before: `computed(() => Date.now() < cooldownUntil.value)` -- `Date.now()` is not reactive.
After: `computed(() => cooldownRemaining.value > 0)` -- depends on `cooldownRemaining`, which is updated every second by the interval timer in `startCooldown()` (lines 163-174).

Verified the full cooldown lifecycle: `startCooldown()` sets `cooldownRemaining` to 30, the interval decrements it, and when it reaches 0 the interval clears itself. The computed now correctly transitions from `true` to `false` when `cooldownRemaining` hits 0.

### H3 (HIGH): Multi-cell token click detection -- RESOLVED

**Commit aed853a.** Token bounding box check in `GridCanvas.vue` lines 283-286:

Before: `t.position.x === gridX && t.position.y === gridY` -- only matched origin cell.
After: `gridX >= t.position.x && gridX < t.position.x + t.size && gridY >= t.position.y && gridY < t.position.y + t.size` -- matches full `size x size` bounding box.

This correctly handles all token sizes. A 2x2 token at (5,5) now matches clicks on (5,5), (6,5), (5,6), and (6,6). The half-open interval (`<` not `<=`) is correct because `position + size` is the first cell OUTSIDE the token.

Note: This check only applies to the player mode cell-click path (preventing cell click events from firing when a token occupies the clicked cell). The token-select path goes through `VTTToken` component click handlers which work at the DOM level (the token element spans the full bounding box), so token selection was never affected by this bug.

### M1 (MEDIUM): Dead fetch in useStateSync -- RESOLVED

**Commit adb6ecb.** The `refreshCharacterDataSafe` function (which fetched character data and discarded it) has been deleted entirely. The composable now accepts `refreshCharacterData` as an option parameter (line 18), and calls it on reconnect (lines 66-69). The player page passes the real `refreshCharacterData` from `usePlayerIdentity` (index.vue line 168).

The `try/catch` with empty catch around the call (line 68) is appropriate -- network may still be recovering during reconnect, and character data will be refreshed via subsequent WebSocket events anyway.

### M2 (MEDIUM): encounter_unserved not broadcast to players -- RESOLVED

**Commit 9b89809.** Both `serve_encounter` and `encounter_unserved` handlers in `ws.ts` now include player-role clients:

- `serve_encounter` (line 427): Filter changed from `otherInfo.role === 'group'` to `otherInfo.role === 'group' || otherInfo.role === 'player'`.
- `encounter_unserved` (line 446): Same filter change applied.

The developer proactively fixed `serve_encounter` too (not flagged in the review) -- good pattern recognition. The commit message explicitly notes "Lesson 2: check all similar broadcast patterns for the same issue."

Also noted: both handlers now pre-stringify the message (`servedMsg`, `unservedMsg`) before the loop, avoiding redundant `JSON.stringify()` calls per peer. Minor performance improvement.

### M3 (MEDIUM): Player grid panning blocked -- RESOLVED

**Commit ce8e6a4.** Complete rewrite of the mouse event handling in `GridCanvas.vue` (lines 254-307). Key changes:

1. `handleMouseDown`: Always delegates to `interaction.handleMouseDown(event)` regardless of player mode. In player mode, additionally records `playerMouseDownPos` for click-vs-drag detection.
2. `handleMouseUp`: In player mode, compares mouseup position to mousedown position. If movement < 5px (`CLICK_THRESHOLD_PX`), treats it as a click and emits `playerCellClick`. If >= 5px, it was a drag (pan gesture) and no cell click is emitted.
3. Panning now works in player mode because `interaction.handleMouseDown` is always called.

The 5px threshold is reasonable -- prevents accidental clicks during micro-drags while being tight enough to register intentional taps.

Touch events remain unimplemented, tracked as bug-030. The commit includes a TODO comment (line 256): "Touch events (pinch-to-zoom, touch panning) -- see bug-030." I verified `bug-030.md` exists in the tickets directory.

### R3: Explored fog showing tokens -- TRACKED

**Commit 279f4d7.** TODO comment added to `usePlayerGridView.ts` (lines 80-83) referencing bug-031. The TODO clearly states the discrepancy: explored cells currently show tokens, design spec says they should not. Bug-031 ticket exists and is properly filed. Acceptable deferral -- this is a design spec question, not a correctness bug.

### Documentation commit (c3ba9c9)

Feature-003 ticket updated with resolution log. 42 lines added documenting all 7 fixes with commit hashes, file lists, and deferral notes.

## What Looks Good

1. **Formula consistency.** The PTU diagonal formula `diagonals + Math.floor(diagonals / 2) + straights` is now used in all four movement distance code paths: `useGridMovement.calculateMoveDistance`, `PlayerGridView.handleCellClick`, `measurement.ts` distance getter, and `VTTContainer.vue` isometric flat distance. No divergence remains.

2. **Proactive fix scope.** The M2 fix went beyond the review requirement by also fixing `serve_encounter` (same player-exclusion pattern). The commit message documents the reasoning.

3. **Click-vs-drag detection.** The implementation is clean -- records position on mousedown, compares on mouseup, with a clear threshold constant. The `playerMouseDownPos` ref is properly nulled after use. No leaked state between interactions.

4. **Dependency injection in useStateSync.** Rather than importing `usePlayerIdentity` directly (which would create coupling), the composable accepts `refreshCharacterData` as a parameter. This follows DIP and makes the composable testable in isolation.

5. **Commit granularity.** Each fix is a separate commit with a clear message referencing the original issue ID. The pre-fix (ptu-rule-083) is correctly attributed as a separate concern.

6. **Cleanup patterns preserved.** The `PlayerGroupControl` interval/timeout cleanup in `onUnmounted` (lines 188-201) is complete. The `useStateSync` composable has no listeners to clean up (it uses `watch` which is auto-cleaned by Vue).

7. **Broadcast message pre-stringification.** The M2 fix pre-creates JSON strings (`servedMsg`, `unservedMsg`) before the peer loop, avoiding redundant serialization. Small but good practice.

## Verdict

**APPROVED**

All 7 issues from code-review-159 have been resolved correctly. The pre-fix for C1/R1 (ptu-rule-083) is verified. Each fix addresses the root cause identified in the original review. No new issues introduced. Deferred items (R2 -> ux-004, R3 -> bug-031, touch events -> bug-030) are properly tracked with tickets.
