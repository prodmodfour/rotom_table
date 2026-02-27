---
review_id: rules-review-007
target: refactoring-002
ticket_id: refactoring-002
trigger: dev-fix-review
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-16
commits_reviewed:
  - c5ecc91
  - 8589bf6
  - c82b8c3
  - 9576503
files_reviewed:
  - app/server/services/grid-placement.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/from-scene.post.ts
mechanics_verified: 2
correct: 2
incorrect: 0
needs_review: 0
scenarios_to_rerun: []
---

## Summary

Refactoring-002 extracts duplicated grid placement logic into a shared `grid-placement.service.ts`. The refactoring contains one PTU mechanic (size-to-token-size mapping) and one PTU-adjacent mechanic (multi-cell token occupancy tracking). Both are CORRECT. The rest of the refactoring is application-level UX logic (auto-placement positioning) with no PTU rules implications.

## Lessons Checked

- **Lesson 1 (taxonomy audit):** Applied the enumeration principle to the size class list. The `sizeToTokenSize` function enumerates exactly the 5 PTU size classes (Small, Medium, Large, Huge, Gigantic) — no phantom sizes, no missing sizes. The lesson's specific concern (condition taxonomies) does not apply to this refactoring.

## Mechanics Verified

### 1. Size-to-Token-Size Mapping

- **Rule:** PTU 1.05 p.232 (`core/07-combat.md`): "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4"
- **Implementation:** `sizeToTokenSize()` in `grid-placement.service.ts:28-42` — `Small|Medium → 1`, `Large → 2`, `Huge → 3`, `Gigantic → 4`, `default → 1`
- **Status:** CORRECT
- **Notes:** All 5 PTU size classes are present. Default fallback to 1 is reasonable for unset/unknown values. No errata on size classes. This function was previously inline in `combatants.post.ts` — the extraction preserved the logic exactly.

### 2. Multi-cell Token Occupancy Tracking

- **Rule:** PTU 1.05 p.232 (`core/07-combat.md`): Large Pokemon occupy 2x2 cells, Huge 3x3, Gigantic 4x4. Implied: all cells within the token's footprint are occupied and cannot overlap with other tokens.
- **Implementation:** `buildOccupiedCellsSet()` (lines 48-60) iterates `dx=0..size-1, dy=0..size-1` marking all cells from `(x, y)` to `(x+size-1, y+size-1)`. `canFit()` (lines 66-81) checks the same cell range for boundary violations and overlap.
- **Status:** CORRECT
- **Notes:** The cell marking pattern correctly represents a square token footprint. Boundary check (`x + size > gridWidth`) prevents tokens from extending past the grid edge. The `markOccupied()` call after placement (line 142) ensures successive placements in a loop avoid already-placed tokens — matches the old manual `occupiedCells.add()` calls in `wild-spawn.post.ts` and `from-scene.post.ts`.

## Non-PTU Logic (Not Scored)

### Side-based Auto-placement

The side positioning constants (`players: x=1-4`, `allies: x=5-8`, `enemies: x=gridWidth-5 to gridWidth-1`) and the two-pass fallback algorithm are **application UX logic**, not PTU mechanics. PTU specifies no rules for automated combatant placement — the GM places tokens manually. This logic is a convenience feature. The negative-offset resolution for enemies (`gridWidth + (-5)`) produces identical values to the old inline `gridWidth - 5` for any grid width, as verified by the code review.

## Pre-existing Issues (Not Introduced by This Refactoring)

1. **tokenSize always 1 in practice:** `capabilities.size` is never populated in the database. The `sizeToTokenSize` function exists but always hits the `default` case. Already tracked as **refactoring-010** (P1, FEATURE_GAP + PTU-INCORRECT).
2. **Wild spawn hardcodes tokenSize=1:** `wild-spawn.post.ts` and `from-scene.post.ts` both use `const tokenSize = 1` instead of deriving from species size. Also tracked in **refactoring-010**.

These are data pipeline gaps, not refactoring errors. The refactoring preserved the existing behavior exactly.

## Errata Check

`books/markdown/errata-2.md` — no corrections for size classes, token sizes, or grid placement.

## Verdict

**APPROVED** — 2 PTU mechanics verified, both CORRECT. The refactoring is a pure behavior-preserving extraction with no PTU rules impact. Pre-existing size data gaps are tracked separately in refactoring-010. No scenarios need re-running.
