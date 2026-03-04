---
review_id: rules-review-250
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-042
domain: combat
commits_reviewed:
  - ac75a49b
  - 02a483cb
  - 6250f5c7
mechanics_verified:
  - hold-action-release
  - turn-order-management
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#hold-action
  - core/07-combat.md#initiative
reviewed_at: 2026-03-02T11:57:00Z
follows_up: rules-review-244
---

## Mechanics Verified

### Hold Action -- Turn Order Invariant (One Turn Per Round)

- **Rule:** "Combatants can choose to hold their action until a specified lower Initiative value once per round." (`core/07-combat.md`, p.227, lines 76-77)
- **Worked Example (p.232):** "Trainer A is next in Initiative this time, but he holds his action until after his Graveler acts. [...] Finally, Trainer A takes his held action and throws a second Poke Ball, this time hitting the mark and successfully capturing the Raticate." The example demonstrates one hold, one release, one turn. The combatant does not act twice.
- **Implementation (Attempt 2):** The fix removes the original turnOrder entry BEFORE inserting the released combatant at `currentTurnIndex`. If the removal shifted the index (original was before current), `currentTurnIndex` is decremented. This maintains the invariant that each combatant appears exactly once in `turnOrder`.
- **Status:** CORRECT

#### Manual trace -- all scenarios verified

**Scenario 1: Original BEFORE currentTurnIndex (the common hold-release case).**
This is the case that CRIT-001 from code-review-268 identified as broken in Attempt 1.

```
Input:  turnOrder = ['A', 'B', 'C', 'D'], currentTurnIndex = 2, releasing 'B'
Step 1: indexOf('B') = 1 -> splice(1, 1) -> ['A', 'C', 'D']
Step 2: 1 < 2, so currentTurnIndex-- -> 1
Step 3: splice(1, 0, 'B') -> ['A', 'B', 'C', 'D']
Result: B appears once, at index 1. currentTurnIndex = 1. CORRECT.
```

**Scenario 2: Original AFTER currentTurnIndex (wrap-around: held late, released early in next round).**

```
Input:  turnOrder = ['A', 'B', 'C', 'D'], currentTurnIndex = 0, releasing 'D'
Step 1: indexOf('D') = 3 -> splice(3, 1) -> ['A', 'B', 'C']
Step 2: 3 >= 0, so no adjustment. currentTurnIndex remains 0
Step 3: splice(0, 0, 'D') -> ['D', 'A', 'B', 'C']
Result: D appears once, at index 0. currentTurnIndex = 0. CORRECT.
```

**Scenario 3: Original AT currentTurnIndex (pathological edge case).**

```
Input:  turnOrder = ['A', 'B'], currentTurnIndex = 1, releasing 'B'
Step 1: indexOf('B') = 1 -> splice(1, 1) -> ['A']
Step 2: 1 >= 1 (not strictly less), so no adjustment. currentTurnIndex remains 1
Step 3: splice(1, 0, 'B') -> ['A', 'B']
Result: B appears once, at index 1. currentTurnIndex = 1. CORRECT.
```

**Scenario 4: Combatant not in turnOrder (defensive guard).**

```
Input:  turnOrder = ['A', 'C', 'D'], currentTurnIndex = 1, releasing 'B'
Step 1: indexOf('B') = -1 -> no splice, no adjustment
Step 3: splice(1, 0, 'B') -> ['A', 'B', 'C', 'D']
Result: B appears once. No crash. CORRECT.
```

**Scenario 5: Single combatant (self-replace).**

```
Input:  turnOrder = ['A'], currentTurnIndex = 0, releasing 'A'
Step 1: indexOf('A') = 0 -> splice(0, 1) -> []
Step 2: 0 >= 0 (not strictly less), so no adjustment. currentTurnIndex remains 0
Step 3: splice(0, 0, 'A') -> ['A']
Result: A appears once. CORRECT.
```

All five positional scenarios produce exactly one entry. The CRIT-001 from code-review-268 is fully resolved.

### Hold Action -- Action Economy on Release

- **Rule:** PTU p.232 example shows Trainer A taking a full Standard Action (throwing a Poke Ball) on the released turn. The hold delays the combatant's entire turn, not individual actions.
- **Implementation:** `releaseHeldAction()` in `out-of-turn.service.ts` (line 421-440) grants: `hasActed: false`, `actionsRemaining: 2`, `shiftActionsRemaining: 1`, and resets all `turnState` flags (`standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` all set to `false`). This grants a full Standard + Shift + Swift action turn, consistent with the PTU example.
- **Status:** CORRECT (unchanged from Attempt 1, verified for completeness)

### Hold Action -- Once Per Round Limit

- **Rule:** "once per round" (`core/07-combat.md`, p.227, line 77)
- **Implementation:** `canHoldAction()` in `out-of-turn.service.ts` checks `holdState.holdUsedThisRound` and rejects if already used. `applyHoldAction()` sets `holdUsedThisRound: true`.
- **Status:** CORRECT (unchanged, verified for completeness)

### Hold Action -- Turn is Skipped When Holding

- **Rule:** PTU p.227 implies the combatant's turn is delayed. The p.232 example shows Trainer A's turn being skipped and then taken later ("Trainer A takes his held action").
- **Implementation:** `hold-action.post.ts` advances `currentTurnIndex` past the holding combatant (line 94: `currentTurnIndex = record.currentTurnIndex + 1`). The combatant remains in `turnOrder` but their position is passed. When released, the fix removes this stale entry and re-inserts at the release point.
- **Status:** CORRECT

### Turn Order Dedup Pattern -- Correctness Analysis (Attempt 2 vs Attempt 1)

**Attempt 1 (BLOCKED):** Used `indexOf(combatantId, currentTurnIndex + 1)` after insertion. This only searches rightward from the insertion point. For hold-release, the original entry is typically leftward (before the insertion point), so the search misses it entirely. code-review-268 CRIT-001 correctly identified this as broken.

**Attempt 2 (current):** Removes the original entry BEFORE inserting. `indexOf(combatantId)` with no start parameter searches the entire array from index 0. The original is always found (if it exists) regardless of its position relative to `currentTurnIndex`. After removal, `currentTurnIndex` is decremented if the removal was before it (to compensate for the leftward shift of all subsequent entries). Then the insert at the adjusted index places the combatant exactly where the current turn should be.

This is the correct approach. The remove-before-insert pattern is inherently direction-agnostic -- it works regardless of where the original entry sits relative to `currentTurnIndex`.

**Why priority.post.ts can use a different pattern:** For standard priority, `canUsePriority` requires `hasActed === false`, meaning the combatant has not yet taken their turn. Their original position in the turn order is therefore always AT or AFTER `currentTurnIndex`. After splice-inserting at `currentTurnIndex`, the original shifts right by one, and `indexOf(id, currentTurnIndex + 1)` finds it. The precondition guarantees the direction. For hold-release, the precondition is the opposite: the combatant already passed their turn (they held), so their original is almost always BEFORE `currentTurnIndex`. Different preconditions justify different dedup patterns.

- **Status:** CORRECT -- Attempt 2 resolves CRIT-001 from code-review-268.

### currentTurnIndex Persistence

- **Rule:** The adjusted `currentTurnIndex` must be written to the database so the encounter state is consistent after the release.
- **Implementation:** `release-hold.post.ts` line 107 writes `currentTurnIndex` (the adjusted `let` variable) to the Prisma update. Also passed to `buildEncounterResponse` at line 124.
- **Status:** CORRECT

### Decree Compliance

- **decree-006** (Dynamic initiative reorder on speed changes): Not directly related to hold-release. Hold-release uses position-based insertion, not initiative-value-based reordering. No conflict.
- **decree-021** (League Battle two-phase trainer system): Confirmed that League Battles rebuild turnOrder at phase transitions, making duplicates in turnOrder self-correcting for League mode. The fix is still correct defensively -- it deduplicates regardless of battle type. No conflict.
- **decree-033** (Fainted switch on trainer's next turn): Hold-release and fainted switching are orthogonal mechanics. Hold-release inserts the combatant at the current position for their delayed turn. Fainted switching happens on the trainer's next initiative arrival. No timing conflict between these two systems.
- **Status:** No decree violations.

### Errata Check

- **`errata-2.md`:** Contains no modifications to hold action or initiative mechanics. The only "hold" reference in errata is for the move "Hold Hands" (cosmetic change, unrelated).
- **Status:** No errata corrections apply.

### All turnOrder.splice Sites Verified (No Regressions)

| Site | Pattern | Change in This Fix | Risk |
|------|---------|--------------------|------|
| `release-hold.post.ts:87-98` | remove-before-insert | REWRITTEN (this fix) | RESOLVED |
| `priority.post.ts:99-105` | insert-then-remove-after | UNCHANGED | Correct (preconditions guarantee rightward search works) |
| `combatants/[combatantId].delete.ts:48` | removal only | UNCHANGED | No duplication risk |

No regressions to priority.post.ts. The file was not modified by any of the three reviewed commits.

## Test Verification

### HIGH-001 Resolution: All 12 Tests Pass

Ran `npx vitest run app/tests/unit/api/release-hold-turnorder.test.ts` from the main repository (worktree lacks `.nuxt/tsconfig.json` for vitest). Result: **12 passed, 0 failed** (37ms).

The test helper function `releaseHeldIntoTurnOrder()` faithfully mirrors the production logic (remove-before-insert with index adjustment). Assertions in 6 tests were updated to check against `result.currentTurnIndex` (the adjusted value) instead of the original `currentTurnIndex` constant. This is correct because the production code also uses the adjusted value.

Tests cover:
1. Standard dedup (original before currentTurnIndex) -- the CRIT-001 scenario
2. Buggy version comparison (demonstrates the original bug still exists without the fix)
3. Adjusted currentTurnIndex placement
4. Original at end of turn order (after currentTurnIndex)
5. Original at start of turn order (before currentTurnIndex)
6. Preserve order of non-held combatants
7. Two-combatant edge case
8. Combatant not in turn order (defensive)
9. Multiple hold-release cycles
10. League Battle defensive dedup
11. currentTurnIndex at 0 with combatant at end
12. Single-combatant turn order

All positional permutations are covered: original before, at, and after currentTurnIndex.

## Ticket Housekeeping Verification

### MED-001 Resolution: Commit Hashes

The ticket fix log lists commits `d72808c9` and `fd4a9a53` for Attempt 2. These are the original commits on the slave branch. After collection/merge to master, they appear as `ac75a49b` and `02a483cb` (different hashes due to rebase/merge, identical file content verified via `git diff`). The ticket hashes match the dev branch commits, which is the standard convention for this project's slave workflow. RESOLVED.

### MED-002 Resolution: Ticket Location

The ticket file was moved from `artifacts/tickets/open/bug/bug-042.md` to `artifacts/tickets/in-progress/bug/bug-042.md` in commit `6250f5c7`. Verified: the file no longer exists at the old path and does exist at the new path. The frontmatter `status: in-progress` matches the directory location. RESOLVED.

## Summary

The Attempt 2 fix correctly resolves bug-042 by replacing the flawed post-insert rightward-search dedup (Attempt 1) with a remove-before-insert pattern that is direction-agnostic. The PTU rulebook is explicit: holding delays a combatant's action to "a specified lower Initiative value" once per round (p.227), and the worked example (p.232) demonstrates exactly one turn upon release. The pre-fix code violated this by leaving the original turnOrder entry intact after splice-inserting the released combatant, giving the combatant two entries and therefore two turns per round in Full Contact battles.

The remove-before-insert approach is mathematically sound for all positions: `indexOf(combatantId)` searches from index 0, guaranteeing the original is found regardless of its position relative to `currentTurnIndex`. The `currentTurnIndex` adjustment (decrement when removal is before it) correctly compensates for the leftward shift of array elements after splice removal. All 12 unit tests pass, covering all positional permutations and edge cases.

## Rulings

1. **Hold-release must produce exactly one turnOrder entry per combatant.** PTU p.227 states "once per round" and the p.232 example shows one action upon release. Two entries means two turns -- a clear rule violation. The Attempt 2 fix correctly enforces this invariant.

2. **The remove-before-insert pattern is the correct approach for hold-release dedup,** distinct from the insert-then-remove-after pattern used in priority.post.ts. The difference in preconditions (hold: original before currentTurnIndex; priority: original after currentTurnIndex) justifies the different patterns. Both are correct for their respective use cases.

3. **No errata corrections apply.** `errata-2.md` contains no modifications to hold action or initiative mechanics.

4. **All three code-review-268 issues are resolved:**
   - CRIT-001: Remove-before-insert handles the common case where original is before insertion point. Verified via manual trace of all 5 positional scenarios.
   - HIGH-001: All 12 tests pass (verified by actual execution, 37ms runtime).
   - MED-001 and MED-002: Ticket hashes match slave branch commits (valid for this workflow), ticket file moved to in-progress.

## Verdict

**APPROVED** -- The Attempt 2 fix correctly implements PTU hold action rules. Each combatant receives exactly one turn per round after hold-release, matching PTU p.227 and the worked example on p.232. CRIT-001 from code-review-268 is fully resolved. No rule violations, no decree conflicts, no edge case gaps, no regressions to priority.post.ts. All 12 tests pass.

## Required Changes

None.
