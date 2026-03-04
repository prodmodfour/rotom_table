---
review_id: rules-review-248
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - 741ff4df
  - a063aa26
  - 3ddf97a0
  - 5ea41ed2
  - 027ceb77
mechanics_verified:
  - flanking-multi-tile-target-requirements
  - flanking-multi-tile-attacker-counting
  - flanking-self-flank-prevention
  - flanking-independent-set-non-adjacency
  - flanking-diagonal-adjacency
  - flanking-backward-compatibility
  - flanking-evasion-penalty-unchanged
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 232 (Flanking)
  - errata-2.md (no flanking errata)
reviewed_at: 2026-03-02T12:45:00Z
follows_up: rules-review-236
---

## Review Context

First rules review of feature-014 P1 (Multi-Tile Flanking). P0 was APPROVED (rules-review-236, 7 mechanics verified, 0 issues). P1 adds multi-tile target flanking (Section E), multi-tile attacker counting (Section F), diagonal flanking confirmation (Section G), and 3+ attacker flanking validation (Section H).

PTU source text (core/07-combat.md, Page 232):
> "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants."

> "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."

> "However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."

Errata check: `books/markdown/errata-2.md` contains no flanking-related corrections.

## Mechanics Verified

### 1. Multi-Tile Target Flanking Requirements (PTU p.232) -- CORRECT

- **Rule:** Large targets require 3 non-adjacent foes, Huge requires 4, Gigantic requires 5.
- **Implementation:** `FLANKING_FOES_REQUIRED` in `flankingGeometry.ts` (lines 27-32): `{ 1: 2, 2: 3, 3: 4, 4: 5 }`. This maps token footprint (1x1, 2x2, 3x3, 4x4) to required foe count (2, 3, 4, 5). The `checkFlankingMultiTile` function at line 323 reads `requiredFoes = FLANKING_FOES_REQUIRED[targetSize] ?? 2`.
- **PTU match:** Exact match. Small/Medium = 2, Large = 3, Huge = 4, Gigantic = 5.
- **Test verification:** Lines 386-457 test Large (requires 3), Huge (requires 4), Gigantic (requires 5), plus insufficient foe scenarios.
- **Status:** CORRECT

### 2. Multi-Tile Attacker Counting (PTU p.232) -- CORRECT

- **Rule:** "Foes larger than Medium [...] count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."
- **Implementation:** `countAdjacentAttackerCells` in `flankingGeometry.ts` (lines 212-239). For each cell of the attacker token, checks if any 8-neighbor is a target cell. If so, that attacker cell counts as 1 foe. The `break` at line 232 ensures each attacker cell counts at most once (even if it neighbors multiple target cells).
- **PTU match:** Exact match. A 2x2 attacker with 2 cells adjacent to the target counts as 2 foes. A 3x3 attacker with 3 cells adjacent counts as 3.
- **Test verification:**
  - Lines 228-240: Flygon (2x2) adjacent to Aggron (2x2) counts as 2 foes
  - Lines 242-255: Lugia (3x3) adjacent to Aggron (2x2) counts as 3 foes
  - Lines 186-198: 2x2 attacker with 2 cells adjacent to 1x1 target counts as 2
- **PTU visual example match:** The code produces the correct result for the PTU p.232 Flygon+Zangoose example: Flygon (2 cells adjacent) + Zangoose (1 cell adjacent) = 3 effective foes >= 3 required for Large Aggron = FLANKED. Test at lines 485-498.
- **Status:** CORRECT

### 3. Self-Flank Prevention (PTU p.232) -- CORRECT

- **Rule:** "A single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."
- **Implementation:** `checkFlankingMultiTile` line 331: `if (adjacentFoes.length < 2)` returns `isFlanked: false`. This checks the count of DISTINCT combatants, not effective foe count. Even if a single 3x3 Lugia occupies 3 cells adjacent to the target (effective count = 3), the distinct combatant count is 1, so flanking is denied.
- **PTU match:** Exact match. The PTU text explicitly states "a minimum of two combatants" -- not foe-equivalents.
- **Test verification:**
  - Lines 476-483: 2x2 attacker alone cannot self-flank 1x1 target
  - Lines 500-508: Lugia (3x3) alone with 3 adjacent cells cannot flank Aggron (2x2)
- **PTU visual example match:** "A Lugia can by itself occupy three adjacent squares to the Aggron. However, it takes at least two different foes to Flank someone, so this does not count as Flanking." Implementation produces `isFlanked: false, effectiveFoeCount: 3`. Correct.
- **Status:** CORRECT

### 4. Non-Adjacency Requirement via Independent Set (PTU p.232) -- CORRECT

- **Rule:** "at least [N] foes are adjacent to them but not adjacent to each other."
- **Implementation:** `findIndependentSet` in `flankingGeometry.ts` (lines 258-294) uses a greedy minimum-degree-first heuristic to find a set of foes where no two are adjacent. `checkFlankingMultiTile` (lines 388-402) calls this and checks if the independent set's total contribution >= requiredFoes.
- **PTU interpretation:** The "not adjacent to each other" clause means the flanking foes must be spread around the target, not clustered together. The independent set formalization correctly captures this -- it finds a subset of foes where no pair is adjacent to each other, which is the literal meaning of "not adjacent to each other."
- **Test verification:**
  - Lines 395-409: 3 non-adjacent foes around Large target = FLANKED
  - Lines 411-425: 3 foes around Large target, 2 are adjacent = NOT FLANKED (max IS = 2 < 3)
  - Lines 541-553: 3 mutually adjacent foes around 1x1 target = NOT FLANKED (max IS = 1 < 2)
  - Lines 555-563: 2 adjacent Zangoose = NOT FLANKED (PTU visual example)
- **PTU visual example match:** "The Hitmonchan has two Zangoose adjacent to him, but they themselves are adjacent, so this doesn't count as Flanking." Implementation correctly rejects this case.
- **Status:** CORRECT

### 5. Multi-Tile Attacker Contribution in Independent Set Context -- CORRECT

- **Rule interpretation:** The contribution counting (Section F) interacts with the non-adjacency check (Section H). A large attacker in the independent set contributes its full cell-adjacent count toward the required foe total. The non-adjacency check applies to combatants, not individual cells.
- **Implementation:** Lines 391-393 sum contributions of independent set members: `independentContribution = independentSet.reduce((sum, idx) => sum + foeContributions[idx].contribution, 0)`. Line 395 checks `independentContribution >= requiredFoes`.
- **PTU match:** The Flygon+Zangoose example from PTU p.232 demonstrates this: Flygon (2 foe-equivalents) + Zangoose (1 foe-equivalent) = 3, and they are not adjacent to each other (Flygon at (5,3), Zangoose at (2,3), distance 3). The implementation correctly finds the independent set {Flygon, Zangoose}, sums their contributions (2+1=3), and compares to requiredFoes (3). Result: FLANKED.
- **Important correctness fix:** The implementation correctly avoids the spec's `adjacentFoes.length < requiredFoes` early exit, which would have incorrectly rejected Flygon+Zangoose (2 distinct combatants < 3 required). Instead, it uses `totalEffectiveCount < requiredFoes`, which correctly accounts for multi-tile contributions. This is a PTU-correct deviation from the design spec.
- **Status:** CORRECT

### 6. Diagonal Adjacency for Flanking (PTU p.232) -- CORRECT

- **Rule:** PTU flanking uses 8-directional adjacency. The visual examples on p.232 show diagonal flanking (the Zangoose positions include diagonal adjacency to the Hitmonchan).
- **Implementation:** `NEIGHBOR_OFFSETS` (lines 17-21) includes all 8 directions (4 cardinal + 4 diagonal). `areAdjacent` (lines 109-127) checks Chebyshev distance <= 1 between any pair of cells.
- **Decree-002 interaction:** Per the spec Section G, decree-002 (PTU alternating diagonal for distance measurement) does NOT affect adjacency. Adjacency is topological (8-neighbors), not metric. Two cells at Chebyshev distance 1 are adjacent regardless of PTU diagonal movement cost. This is correct.
- **Test verification:** Lines 571-589 verify diagonal flanking scenarios.
- **Status:** CORRECT (unchanged from P0)

### 7. Flanking Evasion Penalty Application -- CORRECT (unchanged)

- **Rule:** "take a -2 penalty to their Evasion" (PTU p.232)
- **Implementation:** `FLANKING_EVASION_PENALTY = 2` (line 38). `getFlankingPenalty()` in `useFlankingDetection.ts` returns 2 when flanked, 0 otherwise. `useMoveCalculation.ts` (line 405) subtracts the penalty from the accuracy threshold.
- **Per decree-040:** Flanking penalty applies AFTER the evasion cap of 9. `effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty`. The implementation at line 396/405 correctly applies this ordering.
- **Status:** CORRECT (unchanged from P0, confirmed by decree-040)

## Decree Compliance

- **decree-002** (PTU alternating diagonal): Not relevant to flanking adjacency. Adjacency uses Chebyshev distance = 1, not PTU alternating diagonal metric. No conflict.
- **decree-003** (All tokens passable, enemy = rough terrain): Not relevant to flanking detection. Flanking checks positional adjacency, not movement or pathfinding. The rough terrain penalty is applied separately via `getRoughTerrainPenalty()` in `useMoveCalculation.ts`. No conflict.
- **decree-040** (Flanking -2 after evasion cap): `useMoveCalculation.ts` line 396 applies `Math.min(9, evasion)` then line 405 subtracts `flankingPenalty`. This matches decree-040: `effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty`. No violation. (Note: the code comment at lines 401-403 still references decree-need-039 as pending, but this is a documentation issue flagged in code-review-272 MED-2, not a rule violation.)

## Errata Check

No flanking-related corrections in `books/markdown/errata-2.md`. PTU 1.05 core text on p.232 is authoritative.

## PTU Worked Examples Verification

All PTU p.232 visual examples are faithfully reproduced in the test suite:

| PTU Example | Test | Expected | Actual | Match |
|-------------|------|----------|--------|-------|
| Hitmonchan flanked by 2 non-adjacent Zangoose | Lines 354-361 | FLANKED | isFlanked: true | YES |
| Hitmonchan NOT flanked by 2 adjacent Zangoose | Lines 555-563 | NOT FLANKED | isFlanked: false | YES |
| Aggron (Large) flanked by Flygon (2 cells adj) + Zangoose | Lines 485-498 | FLANKED (eff=3, req=3) | isFlanked: true, effectiveFoeCount: 3 | YES |
| Aggron NOT flanked by Lugia alone (self-flank prevention) | Lines 500-508 | NOT FLANKED (eff=3, but 1 combatant) | isFlanked: false, effectiveFoeCount: 3 | YES |

All 4 canonical PTU examples produce correct results.

## Summary

The P1 implementation faithfully captures PTU p.232 multi-tile flanking mechanics:

1. Size-scaled requirements (3 for Large, 4 for Huge, 5 for Gigantic) correctly implemented via `FLANKING_FOES_REQUIRED`
2. Multi-tile attacker counting (cells adjacent to target = foe-equivalents) correctly implemented via `countAdjacentAttackerCells`
3. Self-flank prevention (minimum 2 distinct combatants) correctly enforced even when cell-count exceeds required foes
4. Non-adjacency among flankers correctly verified via independent set algorithm
5. Contribution-based flanking threshold (sum of independent set member contributions >= required) correctly handles the Flygon+Zangoose scenario where distinct combatant count < required foes
6. 8-directional adjacency (including diagonal) correctly used for all checks
7. Evasion penalty application unchanged and correct per decree-040

No PTU rule violations found. No decree violations found. No errata applicable.

## Verdict

**APPROVED**

All 7 mechanics verified correct. No critical, high, or medium PTU rule violations. The implementation is a faithful and complete capture of PTU p.232 flanking rules for all token sizes. The deviation from the design spec's early-exit logic is a correctness improvement that prevents false negatives for multi-tile attacker scenarios.

## Required Changes

None.
