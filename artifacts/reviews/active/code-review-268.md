---
review_id: code-review-268
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-042
domain: combat
commits_reviewed:
  - 7e11ecf8
  - b4894ae7
  - a547e791
files_reviewed:
  - app/server/api/encounters/[id]/release-hold.post.ts
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/hold-action.post.ts
  - app/tests/unit/api/release-hold-turnorder.test.ts
  - artifacts/tickets/open/bug/bug-042.md
verdict: BLOCKED
issues_found:
  critical: 1
  high: 1
  medium: 2
reviewed_at: 2026-03-02T09:15:00Z
follows_up: null
---

## Review Scope

Bug-042 fix: turnOrder deduplication after hold-release in Full Contact battles. The fix adds a dedup pattern (splice + indexOf removal) copied from priority.post.ts (CRIT-002 fix). 12 unit tests added. Ticket updated.

Decree check: decree-021 (League Battles rebuild turnOrder on phase transitions, so bug only affects Full Contact) -- the fix correctly targets Full Contact. No conflict with decree-033 (fainted switch timing is unrelated to hold-release).

## Issues

### CRITICAL

#### CRIT-001: Dedup logic fails when original entry is before insertion point

The dedup pattern `indexOf(combatantId, currentTurnIndex + 1)` only searches AFTER the insertion point. For hold-release, the held combatant's original position is almost always BEFORE `currentTurnIndex` (they held at their earlier turn, play continued past them, and they release later). In this common case, the original entry is not shifted right by the splice -- it stays at its original index, which is less than `currentTurnIndex + 1`, and `indexOf` never finds it.

**Proof (verified via Node.js execution):**

```
Scenario: turnOrder = ['A', 'B', 'C', 'D'], currentTurnIndex = 2, releasing 'B'
  B held at position 1 (their turn), game advanced to C (position 2).

  After splice(2, 0, 'B'): ['A', 'B', 'B', 'C', 'D']
  indexOf('B', 3): searches index 3 ('C'), 4 ('D') -> returns -1
  Original B at index 1 is NOT removed.
  Result: ['A', 'B', 'B', 'C', 'D'] -- B appears TWICE. Bug NOT fixed.
```

This fails for Tests 1, 3, 5, 6, 7, and 9 in the test file. These tests would fail if actually executed because the assertions check for single occurrences and unchanged array length, but the dedup does not work.

**Why the same pattern works in priority.post.ts but not here:** For standard priority, `canUsePriority` requires `hasActed === false`, meaning the combatant's original position is always AT or AFTER `currentTurnIndex`. The splice shifts the original right, so `indexOf(id, currentTurnIndex + 1)` finds it. For hold-release, the original is typically BEFORE `currentTurnIndex`, so the pattern breaks.

**Correct approach:** Remove the original entry BEFORE inserting, or search the entire array:

```typescript
// Option A: Remove first, then insert
const originalIndex = turnOrder.indexOf(combatantId)
if (originalIndex !== -1) {
  turnOrder.splice(originalIndex, 1)
  // Adjust currentTurnIndex if the removal shifted it
  if (originalIndex < currentTurnIndex) {
    currentTurnIndex--
  }
}
turnOrder.splice(currentTurnIndex, 0, combatantId)
```

**Severity:** CRITICAL -- the bug-042 fix does not actually fix bug-042. The most common hold-release scenario (hold early, release later) still produces duplicate turn order entries.

**File:** `app/server/api/encounters/[id]/release-hold.post.ts` lines 86-91

### HIGH

#### HIGH-001: Tests not executed -- would fail against their own assertions

The 12 unit tests replicate the dedup logic as a pure extracted function, which faithfully mirrors the production code. However, because the production logic is wrong (CRIT-001), at least 6 of the 12 tests would FAIL if actually run:

- "should not create duplicate entries when releasing a held combatant" (line 60) -- FAILS
- "should place the released combatant at the current turn index" (line 94) -- FAILS
- "should handle release when held combatant is first in turn order" (line 118) -- FAILS
- "should preserve order of other combatants" (line 131) -- FAILS
- "should work correctly when only 2 combatants exist" (line 144) -- FAILS
- "should maintain no duplicates after multiple hold-release cycles" (line 171) -- FAILS

The tests that DO pass are the edge cases where the original happens to be after the insertion point (e.g., "held combatant is last in turn order" at line 104, "currentTurnIndex at 0 with combatant at end" at line 203).

This strongly suggests the tests were written but never actually run with `vitest`. A test suite that fails on its primary happy-path test should have been caught immediately.

**Action:** All tests must actually pass before the fix is submitted. After fixing CRIT-001, re-run the full test suite and verify all 12 pass.

**File:** `app/tests/unit/api/release-hold-turnorder.test.ts`

### MEDIUM

#### MED-001: Ticket commit hashes do not match actual commits

The bug-042 ticket fix log references commits `66ec847e` and `aa8b50e4`, but the actual commits are `7e11ecf8` and `b4894ae7`. This suggests the developer recorded placeholder or stale hashes.

**File:** `artifacts/tickets/open/bug/bug-042.md` lines 47-48

#### MED-002: Ticket file not moved to in-progress directory

The ticket frontmatter was updated to `status: in-progress` but the file remains at `artifacts/tickets/open/bug/bug-042.md` instead of being moved to `artifacts/tickets/in-progress/bug/bug-042.md`. The artifact lifecycle system expects file location to match status.

**File:** `artifacts/tickets/open/bug/bug-042.md`

## What Looks Good

1. **Correct diagnosis.** The ticket correctly identifies the root cause: splice without dedup creates duplicate entries. The analysis of Full Contact vs League Battle impact is accurate, consistent with decree-021.
2. **Good test coverage intent.** The test file covers a good range of scenarios: happy path, edge cases, multi-cycle, League mode, defensive cases. The test structure (pure function extraction for testability) is the right pattern.
3. **Commit granularity is correct.** Three small, focused commits: fix, tests, ticket update. Follows project guidelines.
4. **Codebase splice audit.** The ticket's "Duplicate Code Path Check" correctly identifies all three `turnOrder.splice` sites and their risk levels.
5. **Immutability in tests.** The test functions use `[...turnOrder]` spread to avoid mutating input arrays.

## Verdict

**BLOCKED** -- The fix contains a CRITICAL correctness bug that means it does not actually resolve bug-042 for the most common scenario. The dedup pattern from priority.post.ts was copied without accounting for the directional difference: in priority, the original is always after the insertion point; in hold-release, the original is typically before it.

## Required Changes

1. **CRIT-001 (must fix):** Rewrite the dedup logic to handle the case where the original entry is BEFORE `currentTurnIndex`. The recommended approach is remove-then-insert with index adjustment (see code suggestion above). Ensure the fix also adjusts `currentTurnIndex` if the removal shifts it.

2. **HIGH-001 (must fix):** After fixing CRIT-001, actually run the test suite (`npx vitest run app/tests/unit/api/release-hold-turnorder.test.ts`) and verify all 12 tests pass. Include evidence of passing tests in the ticket fix log.

3. **MED-001 (fix now):** Update the ticket fix log with the correct commit hashes (`7e11ecf8` and `b4894ae7`).

4. **MED-002 (fix now):** Move the ticket file from `artifacts/tickets/open/bug/` to `artifacts/tickets/in-progress/bug/`.

**Note:** The priority.post.ts dedup (CRIT-002 fix) is NOT affected by this issue because the preconditions for priority guarantee the original is always after the insertion point. No fix needed there.
