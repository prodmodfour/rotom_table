---
review_id: code-review-168
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-031
domain: player-view
commits_reviewed:
  - 201af93
  - 930d150
files_reviewed:
  - app/composables/usePlayerGridView.ts
  - app/tests/e2e/artifacts/tickets/bug/bug-031.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T06:15:00Z
follows_up: null
---

## Review Scope

Two commits for bug-031 (P3, MEDIUM severity): explored fog cells were showing tokens in the player view, contradicting the design spec's information asymmetry table (design-player-view-integration-001, section 3.5).

**Commit 201af93** (`fix: hide tokens in explored fog cells per design spec`): Changed the `visibleTokens` computed filter in `usePlayerGridView.ts` from `state === 'revealed' || state === 'explored'` to `state === 'revealed'` only. Updated JSDoc to match. Removed the TODO comment that originally documented the gap.

**Commit 930d150** (`docs: update bug-031 ticket`): Added resolution log entry and changed status to `in-progress`.

## Verification Performed

1. **Design spec alignment.** The design spec (section 3.5) explicitly states: "Fog: explored cells = Dimmed, terrain visible, no tokens." The fix matches this exactly.

2. **No duplicate code paths.** Searched all `.ts` and `.vue` files for other references to `explored` + token visibility. The `visibleTokens` filter in `usePlayerGridView.ts` (line 90) is the only place where fog state determines token visibility for the player view. No other code path leaks tokens through explored cells.

3. **Architecture is correct.** The data flow is clean:
   - `usePlayerGridView.visibleTokens` filters combatants by fog state (the fix location)
   - `PlayerGridView.vue` passes filtered `visibleTokens` as `:tokens` prop to `GridCanvas`
   - `GridCanvas.vue` has its own `visibleTokens` computed, but it only bounds-checks position -- it does NOT re-apply fog logic. This is correct; fog filtering happens upstream.

4. **GM and Group views unaffected.** `VTTContainer.vue` (GM) and `GroupGridCanvas.vue` (Group) both compute tokens from raw combatants without fog filtering. The fix is scoped exclusively to the player view path.

5. **Rendering consistency.** `useGridRendering.ts` draws explored cells with `rgba(10, 10, 15, 0.5)` semi-transparent overlay -- dimmed terrain is visible, but now no tokens render on top. This is fully consistent with the design spec: "Dimmed, terrain visible, no tokens."

6. **`fogOfWar.isVisible` getter not affected.** The store's `isVisible(x, y)` getter returns `true` for both `revealed` and `explored` cells. This is used for rendering purposes (determining whether to draw fog overlays), NOT for token visibility. No code in `.ts` or `.vue` source files calls `fogStore.isVisible` or `fogOfWarStore.isVisible` -- the getter exists but is unused in production code. The fix correctly uses `getCellState()` to get the exact fog state rather than the boolean `isVisible()`.

7. **No unit tests exist for this composable.** Searched `app/tests/` for any test files referencing `usePlayerGridView` -- none found. This is pre-existing technical debt (the player view is documented as scaffolding not yet complete). Not a blocker for this fix.

8. **Commit granularity.** Two commits, each with a single file changed. Fix commit is 1 file / 8 lines changed. Docs commit is 1 file / 8 lines changed. Granularity is correct.

## Issues

No issues found. The fix is a clean, minimal, correct change that aligns the implementation with the design spec.

## What Looks Good

1. **Minimal, targeted fix.** One line changed in the filter condition, plus JSDoc updated to match. No unnecessary refactoring or scope creep.

2. **TODO comment cleaned up.** The previous TODO (added in commit 279f4d7 as a deferral from feature-003) is properly removed now that the fix is applied. No stale TODOs left behind.

3. **JSDoc updated.** The comment above `visibleTokens` now accurately describes the behavior: "Only 'revealed' cells show tokens. Hidden and explored cells hide tokens." Clear and correct.

4. **Ticket traceability.** Resolution log in bug-031 ticket properly records the commit hash, file changed, and what was done.

5. **Design spec not modified.** The ticket offered two options: fix the code or update the spec. The developer correctly chose to fix the code to match the spec, which is the right call -- the spec's information asymmetry model is intentional (explored cells show terrain layout but hide dynamic information like token positions).

## Verdict

**APPROVED.** The fix is correct, minimal, and properly aligned with the design spec. No regressions identified. No other code paths reference the explored+token combination. The rendering pipeline is consistent (explored cells render as dimmed terrain without tokens). Commit granularity and documentation are appropriate.
