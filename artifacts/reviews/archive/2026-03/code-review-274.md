---
review_id: code-review-274
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-042
domain: combat
commits_reviewed:
  - ac75a49b
  - 02a483cb
  - 6250f5c7
files_reviewed:
  - app/server/api/encounters/[id]/release-hold.post.ts
  - app/tests/unit/api/release-hold-turnorder.test.ts
  - artifacts/tickets/in-progress/bug/bug-042.md
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/hold-action.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-02T11:58:00Z
follows_up: code-review-268
---

## Review Scope

Re-review of bug-042 Attempt 2: rewrite hold-release turnOrder dedup from post-insert indexOf to remove-before-insert with currentTurnIndex adjustment. This addresses CRIT-001 from code-review-268 which BLOCKED Attempt 1.

**Decree check:**
- decree-006 (dynamic initiative reorder on speed changes): Not triggered by this fix. The fix operates on turnOrder splice, not initiative recalculation.
- decree-021 (League Battle two-phase trainer system): The bug only affects Full Contact battles where turnOrder persists across rounds. League Battles rebuild turnOrder at phase transitions, so duplicates would be cleaned. The fix still correctly deduplicates in League mode (defensive, covered by test).
- decree-033 (fainted switch on trainer's next turn): Orthogonal to hold-release. No interaction.

No decree violations found.

## CRIT-001 Resolution Verification

The original CRIT-001 identified that `indexOf(combatantId, currentTurnIndex + 1)` only searches AFTER the insertion point, missing the common case where the held combatant's original entry is BEFORE `currentTurnIndex`.

**Attempt 2 approach (lines 83-98 of release-hold.post.ts):**

```typescript
const originalIndex = turnOrder.indexOf(combatantId)
if (originalIndex !== -1) {
  turnOrder.splice(originalIndex, 1)
  if (originalIndex < currentTurnIndex) {
    currentTurnIndex--
  }
}
turnOrder.splice(currentTurnIndex, 0, combatantId)
```

**Manual trace of the CRIT-001 failing scenario:**
- `turnOrder = ['A', 'B', 'C', 'D']`, `currentTurnIndex = 2`, releasing 'B'
- `indexOf('B')` = 1 (found BEFORE currentTurnIndex)
- Remove index 1: `['A', 'C', 'D']`. Since 1 < 2: `currentTurnIndex` adjusts to 1.
- `splice(1, 0, 'B')`: `['A', 'B', 'C', 'D']`. B appears once. Length 4.

CRIT-001 is resolved. The remove-before-insert pattern correctly handles all three positional cases:
1. **Original BEFORE currentTurnIndex** (common hold-release case): removes, adjusts index down, inserts at correct position.
2. **Original AFTER currentTurnIndex** (wrap-around case: held last, released at start): removes, no index adjustment needed, inserts correctly.
3. **Original AT currentTurnIndex** (edge case): removes, `originalIndex < currentTurnIndex` is false so no adjustment, inserts at same position.

## HIGH-001 Resolution Verification

All 12 tests pass. Verified by running `npx vitest run app/tests/unit/api/release-hold-turnorder.test.ts` from the main repository (worktree lacks `.nuxt/tsconfig.json` for Vite, which is an infrastructure issue, not a code issue). Results: 12 passed, 0 failed.

The test helper function (`releaseHeldIntoTurnOrder`) now mirrors the production code exactly (remove-before-insert with index adjustment). Test assertions were updated to check `result.currentTurnIndex` instead of the original `currentTurnIndex` constant, which is correct since the index may shift after removal.

## MED-001 / MED-002 Resolution Verification

**MED-002 (ticket file location):** The ticket file was moved from `artifacts/tickets/open/bug/bug-042.md` to `artifacts/tickets/in-progress/bug/bug-042.md`. Confirmed via the git diff showing `rename from` / `rename to`. Resolved.

**MED-001 (ticket commit hashes):** Partially resolved. Attempt 1 hashes were corrected to `66ec847e` and `aa8b50e4`. However, Attempt 2 hashes are recorded as `d72808c9` and `fd4a9a53` but the actual commits are `ac75a49b` and `02a483cb`. Neither `d72808c9` nor `fd4a9a53` exist in the repository. This is the same class of error as the original MED-001 -- stale or placeholder hashes.

## Issues

### MEDIUM

#### MED-001: Attempt 2 commit hashes in ticket are incorrect

The bug-042 ticket Attempt 2 fix log records commits `d72808c9` and `fd4a9a53`, but the actual commits are `ac75a49b` (fix) and `02a483cb` (test update). These hashes do not exist in the repository.

**File:** `artifacts/tickets/in-progress/bug/bug-042.md` lines 66-67

**Fix:** Update the two hashes in the Attempt 2 table to `ac75a49b` and `02a483cb`.

## What Looks Good

1. **CRIT-001 correctly resolved.** The remove-before-insert approach is the right solution. It handles all three positional cases (before, at, after currentTurnIndex) without the directional bias of the indexOf-after-insert pattern. The currentTurnIndex adjustment logic (`if originalIndex < currentTurnIndex`) is correct -- it accounts for the array shift caused by the removal.

2. **Clear, well-commented code.** The inline comments in release-hold.post.ts (lines 83-86) explain WHY the approach differs from priority.post.ts. This prevents future developers from "fixing" it back to the broken pattern.

3. **Test updates are thorough and accurate.** Six test assertions were updated to use `result.currentTurnIndex` instead of the input constant, and expected array orderings were adjusted. The test helper function mirrors the production code exactly. The buggy version helper (`releaseHeldIntoTurnOrderBuggy`) was left unchanged as a regression reference.

4. **No regression to priority.post.ts.** The priority dedup pattern (insert-then-indexOf-after) was not modified and remains correct because `canUsePriority` enforces `hasActed === false`, guaranteeing the original is always after `currentTurnIndex`. Per decree-021, League Battles rebuild turnOrder at phase transitions, so the defensive dedup in League mode is bonus safety.

5. **Correct currentTurnIndex persistence.** The adjusted `currentTurnIndex` is written to the DB (line 107) and passed to `buildEncounterResponse` (line 123). The WebSocket broadcast and API response both reflect the corrected state.

6. **Commit granularity is correct.** Three focused commits: fix (1 file), tests (1 file), housekeeping (1 file move + content update).

7. **hold-action.post.ts confirms the precondition.** Verified that hold-action does NOT remove the combatant from turnOrder (only advances currentTurnIndex), which is why the original entry persists and must be handled on release.

## Verdict

**APPROVED** -- The CRIT-001 correctness bug from code-review-268 is fully resolved. The remove-before-insert approach handles all positional scenarios correctly. All 12 tests pass. The only remaining issue is MED-001 (incorrect commit hashes in the ticket), which does not affect correctness or functionality.

## Required Changes

1. **MED-001 (fix now):** Update the Attempt 2 commit hashes in `artifacts/tickets/in-progress/bug/bug-042.md` from `d72808c9`/`fd4a9a53` to `ac75a49b`/`02a483cb`.
