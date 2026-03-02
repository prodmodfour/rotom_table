---
review_id: code-review-272
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - 741ff4df
  - a063aa26
  - 3ddf97a0
  - 5ea41ed2
  - 027ceb77
files_reviewed:
  - app/utils/flankingGeometry.ts
  - app/composables/useFlankingDetection.ts
  - app/tests/unit/utils/flankingGeometry.test.ts
  - app/composables/useMoveCalculation.ts
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-flanking-001/spec-p1.md
  - artifacts/designs/design-flanking-001/_index.md
  - artifacts/tickets/open/feature/feature-014.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-02T12:30:00Z
follows_up: code-review-260
---

## Review Scope

First review of feature-014 P1 (VTT Flanking Detection -- Multi-Tile Flanking). 4 implementation commits (741ff4df, a063aa26, 3ddf97a0, 5ea41ed2) plus 1 chore commit (027ceb77). Implements Sections E (multi-tile target flanking), F (multi-tile attacker counting), G (diagonal flanking -- confirmed no changes needed from P0), and H (3+ attacker flanking) from design-flanking-001 spec-p1.md.

Decree check: decree-002 (PTU alternating diagonal) -- not relevant to flanking adjacency, which uses Chebyshev distance = 1 (topological, not metric). decree-003 (token passability) -- not relevant to flanking computation, which checks adjacency only. decree-040 (flanking -2 after evasion cap) -- confirmed current implementation in `useMoveCalculation.ts` matches the decree (effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty). No decree violations found.

Previous tier: P0 APPROVED (code-review-260 + rules-review-236). P0 fix cycle resolved all code-review-254 + rules-review-230 issues.

## Issues

### MEDIUM

**MED-1: app-surface.md not updated with P1 functions**

`app-surface.md` line 183 documents `flankingGeometry.ts` with only P0 functions: "getOccupiedCells, getAdjacentCells, areAdjacent, checkFlanking". The P1 additions (`checkFlankingMultiTile`, `countAdjacentAttackerCells`, `findIndependentSet`) are not listed. Line 179 describes `useFlankingDetection.ts` without mentioning multi-tile support.

The design spec summary table says P1 was implemented but app-surface.md was not updated to reflect the new public API surface. This creates a discoverability gap for future developers and skills that rely on app-surface.md for understanding available utilities.

**Fix:** Update `app-surface.md` line 183 to include all P1 exported functions. Update line 179 to mention multi-tile target/attacker support.

File: `.claude/skills/references/app-surface.md` lines 179, 183

---

**MED-2: Stale decree-need-039 comment in useMoveCalculation.ts (pre-existing)**

`useMoveCalculation.ts` lines 401-403 still say:
```typescript
// The ordering of flanking penalty vs evasion cap is pending decree-need-039.
// Do NOT change this ordering until the decree is ruled.
```

But decree-040 was issued (2026-03-01T22:30:00Z) which resolves decree-need-039. The decree-need ticket is in `artifacts/tickets/resolved/decree/` with `decree_id: decree-040`. The comment is now stale and misleading -- it implies an unresolved ambiguity when the ruling has been made.

This is pre-existing (from the P0 fix cycle) and was not introduced by P1 commits. The P1 commits did not touch `useMoveCalculation.ts`. However, per review philosophy ("fix now, not later"), this should be corrected since the developer is already working in the flanking domain and the fix is a 2-line comment update.

**Fix:** Update the comment to cite decree-040 instead of referencing the pending status:
```typescript
// Per decree-040: Flanking penalty applies AFTER the evasion cap.
// effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty
```

File: `app/composables/useMoveCalculation.ts` lines 401-403

## What Looks Good

1. **Correct deviation from spec to fix a bug.** The spec's `checkFlankingMultiTile` in Section E used `adjacentFoes.length < requiredFoes` as an early exit, which would incorrectly reject the Flygon+Zangoose scenario (2 distinct combatants providing 3 effective foes for a Large target). The implementation correctly replaces this with two separate checks: (a) `adjacentFoes.length < 2` for self-flank prevention, and (b) `totalEffectiveCount < requiredFoes` for the effective count check. The test at lines 485-498 verifies this exact case. Good engineering judgment to fix the spec bug rather than implement it blindly.

2. **Clean algorithm design.** The `findIndependentSet` greedy heuristic (minimum-degree-first) is well-chosen for the problem domain. The comment at line 248-256 correctly notes the NP-hard general case and the practical sufficiency for PTU combat scales (max ~20 foes). The separation between the independent set finder (pure graph algorithm) and the flanking-specific contribution logic (sum of foeContributions) keeps the code modular and testable.

3. **Comprehensive test coverage.** The 636-line test file covers all spec sections:
   - P0 regression tests (lines 14-163): constants, geometry primitives, `checkFlanking` P0 behavior
   - `countAdjacentAttackerCells` (lines 169-256): 1x1 to 1x1, non-adjacent, 2x2 to 1x1, 2x2 to 2x2, PTU Flygon example, PTU Lugia example
   - `findIndependentSet` (lines 258-332): disconnected graph, path graph, complete graph, early termination, empty graph, spec Section H examples
   - `checkFlankingMultiTile` (lines 334-636): backward compatibility (5 tests), multi-tile target (6 tests), multi-tile attacker (5 tests), 3+ attackers (3 tests), diagonal flanking (2 tests), edge cases (4 tests)
   - PTU rulebook worked examples (Flygon+Zangoose flanking Aggron, Lugia self-flank prevention) are explicitly tested. This is excellent coverage.

4. **Minimal composable change.** The `useFlankingDetection.ts` change is a 14-line diff that swaps `checkFlanking` for `checkFlankingMultiTile`, adds the Fainted filter enhancement, and updates comments. The multi-tile version is backward compatible with 1x1 tokens (verified by backward compatibility test suite), so the composable change is safe. No consumers needed modification.

5. **Immutability maintained.** All functions in `flankingGeometry.ts` are pure -- they take readonly inputs and return new objects. No mutation of input arrays, no side effects. The `foeContributions` map uses spread operator (`{ ...foe, contribution }`) to avoid mutating the original foe objects. The composable uses Vue `computed()` for reactive state, avoiding direct mutation.

6. **Good commit granularity.** 4 commits for 4 logical units: (1) `countAdjacentAttackerCells` function, (2) `findIndependentSet` + `checkFlankingMultiTile` functions, (3) composable wiring, (4) tests. Each commit message accurately describes the change and references the relevant PTU rule or spec section.

7. **Self-flank prevention is robust.** The `adjacentFoes.length < 2` check at line 331 ensures that even if a Huge combatant has 4 adjacent cells counting as 4 foe-equivalents (enough for a 1x1 target), it still requires at least 2 distinct combatants. The Lugia test (line 500-508) verifies a 3x3 with 3 adjacent cells (effective count = 3) still fails because only 1 distinct combatant exists.

8. **File sizes within limits.** `flankingGeometry.ts`: 410 lines (well under 800). `useFlankingDetection.ts`: 131 lines. Test file: 636 lines (tests are allowed to be longer).

## Verdict

**APPROVED**

The P1 implementation is correct, well-tested, and cleanly designed. The `checkFlankingMultiTile` function correctly handles all token sizes with proper self-flank prevention and multi-tile attacker contribution counting. The greedy independent set algorithm is appropriate for the problem domain. The deviation from the spec's early-exit logic is an improvement that fixes a correctness bug in the spec. The 636-line test suite provides thorough coverage of PTU rulebook examples, spec worked examples, and edge cases.

The two MEDIUM issues (app-surface.md not updated, stale decree comment) are documentation gaps that do not affect correctness or user experience.

## Required Changes

**MED-1:** Update `app-surface.md` line 183 to include `checkFlankingMultiTile`, `countAdjacentAttackerCells`, `findIndependentSet` in the flankingGeometry.ts description. Update line 179 to mention multi-tile support in useFlankingDetection.ts.

**MED-2:** Update `useMoveCalculation.ts` lines 401-403 to cite decree-040 instead of referencing decree-need-039 as pending.
