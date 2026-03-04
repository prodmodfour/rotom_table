---
review_id: rules-review-236
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - cc97db2c
  - e778f3e4
  - 4bcb1504
  - 6128782a
  - b373f438
  - 50e56c4b
  - e392dc5d
  - fc2ca87b
  - 14c18cdf
mechanics_verified:
  - flanking-evasion-penalty
  - flanking-fainted-exclusion
  - flanking-visual-indicator
  - flanking-detection-algorithm
  - flanking-adjacency
  - flanking-size-requirements
  - flanking-side-hostility
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 232 (Flanking)
  - errata-2.md (no flanking errata)
reviewed_at: 2026-03-01T19:45:00Z
follows_up: rules-review-230
---

## Re-Review Context

This is a re-review following the P0 fix cycle for feature-014 (VTT Flanking Detection). The prior code-review-254 found 2 HIGH and 4 MEDIUM issues. The prior rules-review-230 found 0 HIGH and 2 MEDIUM recommendations. This review verifies all issues from both reviews are resolved.

## Mechanics Verified

### 1. Flanking Detection Algorithm (PTU p.232) -- Re-verified

- **Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other." (`core/07-combat.md#Page 232`)
- **Implementation:** `checkFlanking()` in `app/utils/flankingGeometry.ts` (lines 146-194) is unchanged from the original implementation. Collects adjacent foes, checks all pairs for non-adjacency.
- **Status:** CORRECT

No changes were made to the core algorithm. The logic remains sound for P0 (1x1 tokens).

### 2. Flanking Evasion Penalty (PTU p.232) -- Re-verified

- **Rule:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_EVASION_PENALTY = 2` constant in `flankingGeometry.ts` (line 38). `getFlankingPenalty()` in `useFlankingDetection.ts` (line 113-114) now uses the constant: `return isTargetFlanked(combatantId) ? FLANKING_EVASION_PENALTY : 0`. In `useMoveCalculation.ts` (line 404): `const flankingPenalty = options?.getFlankingPenalty?.(targetId) ?? 0`.
- **Status:** CORRECT

The fix cycle replaced the hardcoded `2` with `FLANKING_EVASION_PENALTY` (commit e778f3e4). The constant value is 2, matching PTU p.232. The penalty is correctly subtracted from the accuracy threshold, making flanked targets easier to hit. The formula at line 405:
```typescript
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```
correctly applies the flanking penalty as an evasion reduction (subtracted from threshold). This matches the PTU text "take a -2 penalty to their Evasion."

### 3. Flanking Penalty vs Evasion Cap Ordering -- Documented

- **Rule:** PTU p.232 says "-2 penalty to their Evasion." The evasion cap is 9. Ordering ambiguity documented.
- **Implementation:** `useMoveCalculation.ts` lines 400-403 now contain explicit documentation:
  ```typescript
  // NOTE: Flanking penalty is currently applied AFTER the evasion cap (Math.min(9, evasion)).
  // The ordering of flanking penalty vs evasion cap is pending decree-need-039.
  // Do NOT change this ordering until the decree is ruled.
  ```
- **Status:** CORRECT (per decree-need-039 pending ruling)

The code correctly documents the design decision and defers to decree-need-039 for a binding ruling. The decree-need ticket at `artifacts/tickets/open/decree/decree-need-039.md` is properly filed with both interpretive options. This resolves rules-review-230 MED-2.

### 4. Fainted Combatant Exclusion -- Defense-in-Depth Added

- **Rule:** Fainted combatants (HP = 0) cannot meaningfully participate in combat. PTU does not explicitly state fainted combatants cannot flank, but a combatant at 0 HP is Fainted and cannot take actions.
- **Implementation:** `positionedCombatants` in `useFlankingDetection.ts` (lines 44-51) now checks three conditions:
  ```typescript
  const hp = c.entity.currentHp ?? 0
  const conditions = c.entity.statusConditions ?? []
  const isDead = conditions.includes('Dead')
  const isFainted = conditions.includes('Fainted')
  return hp > 0 && !isDead && !isFainted
  ```
- **Status:** CORRECT

The fix cycle (commit 50e56c4b) added `conditions.includes('Fainted')` as defense-in-depth alongside the HP > 0 check. This addresses rules-review-230 MED-1. The HP check is the canonical fainted indicator, and the status condition check provides safety against data inconsistency edge cases. Both layers are correct.

### 5. Flanking Visual Indicator -- Canvas Removed, CSS-Only Retained

- **Rule:** PTU p.232 flanking is a mechanical effect (-2 evasion). Visual feedback is an app design choice, not a PTU rule. However, the visual must accurately reflect the flanking state computed by the algorithm.
- **Implementation:** The fix cycle (commit cc97db2c) removed the `drawFlankingIndicator()` function from `useCanvasDrawing.ts`, removed the canvas-level flanking rendering from `useGridRendering.ts`, and removed the `flankingMap` prop from `GridCanvas.vue`. The CSS-based indicator on `VTTToken.vue` is retained:
  ```scss
  &--flanked {
    &::after {
      border: 2px dashed rgba(255, 100, 50, 0.7);
      animation: flanking-pulse 1.5s ease-in-out infinite;
    }
  }
  ```
  The `:is-flanked="isTargetFlanked(token.combatantId)"` prop binding in `GridCanvas.vue` (line 38) drives the CSS class.
- **Status:** CORRECT

The CSS animation (`flanking-pulse`) pulses reliably via CSS keyframes, which animates continuously regardless of canvas re-render timing. This was the correct resolution -- the canvas version required `requestAnimationFrame` to pulse during idle states, while the CSS version animates natively.

### 6. Flanking Size Requirements (PTU p.232) -- Re-verified

- **Rule:** "For Large Trainers and Pokemon, the requirement is three foes [...] four for Huge and five for Gigantic." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_FOES_REQUIRED` in `flankingGeometry.ts` (lines 27-32): `{ 1: 2, 2: 3, 3: 4, 4: 5 }`. Unchanged.
- **Status:** CORRECT

### 7. Side-Based Hostility -- Re-verified

- **Rule:** Flanking requires FOES on opposing sides.
- **Implementation:** `isEnemySide()` in `utils/combatSides.ts` correctly identifies players+allies as friendly, enemies as hostile to both. Used at `useFlankingDetection.ts` line 75.
- **Status:** CORRECT

## Fix Cycle Resolution Verification

### code-review-254 Issues

| Issue | Severity | Description | Resolution | Verified |
|-------|----------|-------------|------------|----------|
| HIGH-1 | HIGH | Duplicate canvas+CSS flanking indicator | Canvas version removed (commit cc97db2c). `drawFlankingIndicator()` deleted from `useCanvasDrawing.ts`. Canvas flanking rendering deleted from `useGridRendering.ts`. `flankingMap` prop removed from `GridCanvas.vue`. CSS-only retained on `VTTToken.vue`. | YES -- confirmed no `drawFlankingIndicat` references remain in codebase |
| HIGH-2 | HIGH | Canvas pulse never animates during idle | Resolved by removing canvas version entirely (commit cc97db2c). CSS animation is self-sustaining. | YES -- resolved by HIGH-1 fix |
| MED-1 | MEDIUM | FLANKING_EVASION_PENALTY constant unused, hardcoded 2 in composable | Constant now imported and used in `useFlankingDetection.ts` line 15 (import) and line 114 (usage). Commit e778f3e4. | YES -- confirmed `FLANKING_EVASION_PENALTY` imported from `flankingGeometry` and used in `getFlankingPenalty()` |
| MED-2 | MEDIUM | Dead `FlankingSize` type in combat.ts | Removed in commit 4bcb1504. Confirmed no `FlankingSize` references remain in codebase. | YES -- grep returns 0 matches |
| MED-3 | MEDIUM | app-surface.md missing flanking entries | Updated in commit b373f438. Lines 169, 171, 173 now document `useFlankingDetection.ts`, `GridCanvas.vue` flanking features, and `flankingGeometry.ts`. | YES -- all three surface entries present |
| MED-4 | MEDIUM | Redundant composable instantiation undocumented | Comment added in `MoveTargetModal.vue` (commit 6128782a, lines 259-263) explaining the intentional dual instantiation: MoveTargetModal is rendered by GMActionModal, not as a child of GridCanvas. | YES -- comment clearly explains the architectural reason |

### rules-review-230 Recommendations

| Issue | Severity | Description | Resolution | Verified |
|-------|----------|-------------|------------|----------|
| MED-1 | MEDIUM | Add `Fainted` status condition check for defense-in-depth | Added in commit 50e56c4b. `useFlankingDetection.ts` line 50: `const isFainted = conditions.includes('Fainted')`, line 51: `return hp > 0 && !isDead && !isFainted`. | YES -- both HP and status condition checked |
| MED-2 | MEDIUM | Document flanking penalty vs evasion cap ordering, file decree-need if contested | decree-need-039 filed (commit e392dc5d). Code comments added in `useMoveCalculation.ts` lines 400-403 explicitly documenting the decision and referencing the pending decree. | YES -- decree-need-039 ticket properly filed with both options documented |

## Decree Compliance

- **decree-002** (PTU alternating diagonal for range): Flanking uses 8-directional adjacency (Chebyshev distance = 1), not range measurement. No conflict.
- **decree-003** (All tokens passable; enemy = rough terrain): Flanking detection is independent of movement/passability. The flanking system checks adjacency for the evasion penalty, while the rough terrain penalty is applied separately via `getRoughTerrainPenalty()`. Both are additive terms in the accuracy threshold formula. No conflict.
- **decree-need-039** (flanking penalty vs evasion cap ordering): Properly documented as pending. Current implementation applies penalty after cap. Code comment references decree-need-039 and explicitly forbids changing the ordering until the decree is ruled. Compliant.
- No active decrees specifically govern flanking mechanics. No decree violations found.

## Errata Check

Searched `books/markdown/errata-2.md` for "flank" -- no matches. No flanking errata exist. The PTU 1.05 core text on p.232 is authoritative.

## Summary

All 6 issues from code-review-254 (2 HIGH, 4 MEDIUM) and both recommendations from rules-review-230 (2 MEDIUM) are fully resolved. The core flanking algorithm remains unchanged and correct. The fix cycle cleanly removed the problematic duplicate canvas indicator, promoted the `FLANKING_EVASION_PENALTY` constant to its intended usage site, cleaned up dead code, documented architectural decisions, added defense-in-depth for fainted combatants, and properly filed decree-need-039 for the evasion cap ordering ambiguity.

The implementation faithfully captures PTU p.232 flanking mechanics for P0 (1x1 tokens):
- 2+ non-adjacent foes required for Small/Medium targets
- 8-directional adjacency correctly implemented
- -2 evasion penalty applied to accuracy threshold
- Fainted/Dead combatants excluded from flanking computation
- Side hostility correctly determines foes vs allies

## Rulings

1. **All code-review-254 issues are resolved.** The canvas flanking indicator has been fully removed, the constant is in use, dead code is gone, documentation is updated, and the dual composable instantiation is documented.

2. **All rules-review-230 recommendations are addressed.** Fainted defense-in-depth is implemented. Evasion cap ordering is documented and deferred to decree-need-039.

3. **No new PTU rule violations introduced.** The fix cycle only removed, documented, or refactored existing code. No changes to flanking detection logic, evasion penalty values, or accuracy calculation formulas.

4. **decree-need-039 is properly filed.** The flanking penalty vs evasion cap ordering is a genuine ambiguity in PTU 1.05. The current implementation (penalty after cap) is defensible and produces the more tactically meaningful result. The decree-need ticket correctly presents both options for the human to rule on.

## Verdict

**APPROVED**

No critical, high, or medium PTU rule violations. All prior review issues fully resolved. The flanking detection implementation is correct per PTU p.232 for P0 scope (1x1 tokens). One pending decree-need (039) is properly filed and documented -- it does not block approval because the current implementation is a valid interpretation.

## Required Changes

None.
