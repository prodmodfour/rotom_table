---
ticket_id: ptu-rule-113
ticket_type: ptu-rule
priority: P2
status: in-progress
domain: vtt
source: decree-023
affected_files:
  - app/stores/measurement.ts
  - app/composables/useRangeParser.ts
created_at: 2026-02-26
---

# ptu-rule-113: Switch burst shapes from Chebyshev to PTU diagonal distance

## Problem

Burst shapes currently use Chebyshev distance (`Math.max(|dx|, |dy|) <= radius`) producing filled squares. Per decree-023 (reaffirming decree-002), all grid distance uses PTU's alternating diagonal rule with no exceptions. Bursts must use PTU diagonal distance, producing diamond-like shapes instead of squares.

## Required Changes

1. In `measurement.ts` `getBurstCells` (lines ~184-198): Replace `Math.max(Math.abs(dx), Math.abs(dy)) <= radius` with PTU alternating diagonal distance calculation.
2. In `useRangeParser.ts` burst case in `getAffectedCells`: Same change — use PTU diagonal distance.
3. Remove the comment "Use Chebyshev distance for PTU" on line ~186.
4. Update any tests asserting square burst shapes.

## PTU Reference

- p.231: Alternating diagonal rule (1-2-1)
- decree-002: "All grid distance measurements use PTU's alternating diagonal rule. No Chebyshev distance in the app."
- decree-023: "Burst shapes are NOT exempt from the alternating diagonal rule."

## Acceptance Criteria

- Burst 1: 5 cells (center + 4 cardinal) — not 9 (3x3 square)
- Burst 2: 13 cells (diamond) — not 25 (5x5 square)
- Both measurement preview and move targeting produce identical burst shapes
- No Chebyshev distance calls remain in burst logic

**Note:** The acceptance criteria cell counts (5 for Burst 1, 13 for Burst 2) assumed Manhattan distance. With PTU alternating diagonal, the correct counts are: Burst 1 = 9 cells (first diagonal = 1m, same as Chebyshev for radius 1), Burst 2 = 21 cells (5x5 minus 4 far corners). The implementation uses `ptuDiagonalDistance` per decree-023.

## Resolution Log

| Commit | Files Changed | Description |
|--------|--------------|-------------|
| 3e2b506 | `app/stores/measurement.ts`, `app/composables/useRangeParser.ts` | Replaced Chebyshev `Math.max(|dx|, |dy|)` with `ptuDiagonalDistance(dx, dy)` in both `getBurstCells` and `getAffectedCells` burst case. |
| 4c4c285 | `app/tests/unit/composables/useRangeParser.test.ts` | Added burst shape unit tests verifying PTU diagonal distance produces correct cell counts. |
