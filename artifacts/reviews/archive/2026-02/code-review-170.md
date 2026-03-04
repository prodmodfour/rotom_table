---
review_id: code-review-170
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-030
domain: player-view
commits_reviewed:
  - 2443307
  - a11ba32
  - 7dc4af3
  - 0b55bf4
files_reviewed:
  - app/composables/useIsometricInteraction.ts
  - app/composables/useGridInteraction.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/GridCanvas.vue
  - app/tests/e2e/artifacts/tickets/bug/bug-030.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-02-26T07:10:00Z
follows_up: code-review-166
---

## Review Scope

Re-review of bug-030 fix cycle 2, which addressed code-review-166 findings:
- **C1 CRITICAL:** IsometricCanvas.vue binds @touchstart/@touchmove/@touchend but useIsometricInteraction had zero touch handlers (runtime crash).
- **M1 MEDIUM:** Duplicate threshold constant (TOUCH_TAP_THRESHOLD vs CLICK_THRESHOLD_PX).
- **M2 MEDIUM:** useGridInteraction approaching 800 lines -- file a ticket.

## Issues

### HIGH

**H1: useIsometricInteraction.ts exceeds 800-line file size limit (830 lines)**

`useIsometricInteraction.ts` is now 830 lines after the +172 line touch handler addition. The project standard is 800 lines maximum (CLAUDE.md coding style guidelines). At the time of code-review-160, this file was 658 lines and passed the file size check. Adding 172 lines of touch handlers pushed it 30 lines over the limit.

The existing refactoring-082 ticket covers extracting touch handlers from `useGridInteraction.ts` into a shared `useTouchInteraction` composable, and mentions `useIsometricInteraction.ts` as a consumer. However, refactoring-082 was filed for `useGridInteraction.ts` (764 lines, approaching the limit) and does not explicitly flag that `useIsometricInteraction.ts` has *already breached* 800. The ticket's scope description says "the next feature addition will push it over the 800-line limit" about useGridInteraction, but useIsometricInteraction has already crossed that threshold.

**Required fix:** Update refactoring-082 to note that `useIsometricInteraction.ts` is at 830 lines and is the higher-priority extraction target (it is already over the limit, not just approaching it). The ticket's affected files section should be updated with the current line count.

## Verification of Previous Issues

### C1 CRITICAL (RESOLVED): IsometricCanvas touch handler crash

**Verified.** Commit `2443307` adds `handleTouchStart`, `handleTouchMove`, and `handleTouchEnd` methods to `useIsometricInteraction.ts` (lines 669-801). These are returned in the composable's return object (lines 820-822). `IsometricCanvas.vue` template binds `@touchstart="interaction.handleTouchStart"` (line 11), `@touchmove="interaction.handleTouchMove"` (line 12), `@touchend="interaction.handleTouchEnd"` (line 13). The methods are now defined and returned -- no more TypeError on touch events.

The implementation correctly adapts for isometric mode:
- Uses `screenToGrid()` (inverse isometric projection) for coordinate conversion
- Uses `getTokenAtScreenPosition()` (diamond hit-testing) instead of grid-based token lookup
- Supports `onTouchTap` callback override for player mode
- Single-finger pan, pinch-to-zoom toward pinch center, and tap detection all implemented

### M1 MEDIUM (RESOLVED): Duplicate threshold constant

**Verified across two commits:**
- Commit `a11ba32` promotes `TOUCH_TAP_THRESHOLD` to a module-level export in `useGridInteraction.ts` (line 42) and replaces the local `CLICK_THRESHOLD_PX` constant in `GridCanvas.vue` with an import (line 75, used at line 310).
- Commit `7dc4af3` adds the import of `TOUCH_TAP_THRESHOLD` from `useGridInteraction` in `useIsometricInteraction.ts` (line 3, used at line 701).

Grep confirms a single definition (`export const TOUCH_TAP_THRESHOLD = 5` at line 42 of `useGridInteraction.ts`) and three consumers: `useGridInteraction.ts` (line 617), `useIsometricInteraction.ts` (line 701), `GridCanvas.vue` (line 310). No remaining `CLICK_THRESHOLD_PX` references. Single source of truth achieved.

### M2 MEDIUM (RESOLVED): File size ticket

**Verified.** Refactoring-082 exists at `app/tests/e2e/artifacts/refactoring/refactoring-082.md`, filed as EXT-GOD / P4 per code-review-166 M2. Covers extraction of touch handlers into a shared `useTouchInteraction` composable.

## What Looks Good

1. **Touch handler implementation is thorough.** The isometric touch handlers mirror the 2D grid touch handlers structurally but correctly transform coordinates through the isometric projection pipeline. Pan, pinch-to-zoom, and tap detection all use the isometric-specific `screenToGrid` and `getTokenAtScreenPosition` methods.

2. **Pinch-to-zoom zooms toward pinch center**, not toward screen center. This is correct UX behavior -- the user's fingers stay aligned with the same grid region during zoom.

3. **Touch state cleanup is correct.** All touch state refs (`isTouchPanning`, `touchStartPos`, `lastTouchPos`, `isPinching`, `lastPinchDistance`, `lastPinchCenter`) are reset on `handleTouchEnd`. Transition from 2-finger to 1-finger is handled (lines 759-771).

4. **Commit granularity is good.** Three separate commits: core fix (touch handlers), constant deduplication, import fix. Each commit is self-contained and the messages explain the change clearly.

5. **CSS `touch-action: none` already present** in IsometricCanvas.vue (line 392), preventing browser default gestures from conflicting with custom touch handling.

## Verdict

**CHANGES_REQUIRED** -- 1 HIGH issue.

The C1 runtime crash is fixed correctly. The M1 constant deduplication is clean. However, `useIsometricInteraction.ts` at 830 lines breaches the 800-line project maximum. This is not a new bug -- it is a direct consequence of the fix approach (duplicating touch handlers rather than extracting them). The existing refactoring-082 ticket must be updated to reflect the actual breach.

## Required Changes

1. **(H1)** Update refactoring-082 to explicitly note that `useIsometricInteraction.ts` is at 830 lines (over the 800-line limit), making it the higher-priority target for touch handler extraction. Update the affected files section with current line counts: `useGridInteraction.ts` (765 lines), `useIsometricInteraction.ts` (830 lines -- over limit).
