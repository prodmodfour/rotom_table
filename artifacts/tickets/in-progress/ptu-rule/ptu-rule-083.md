---
ticket_id: ptu-rule-083
priority: P4
severity: MEDIUM
status: in-progress
domain: vtt-grid
source: rules-review-144 RULING-1
created_by: slave-collector (plan-20260224-171113)
created_at: 2026-02-24
---

## Summary

Measurement store distance getter uses Chebyshev distance (`Math.max(dx, dy)`) instead of PTU's alternating diagonal rule. This causes the distance measurement tool to display incorrect distances for diagonal measurements.

## PTU Rule Reference

"Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (`core/07-combat.md` p.425-428)

## Affected Files

- `app/stores/measurement.ts` (distance getter, lines 35-43)

## Current Behavior

The measurement store's `distance` getter uses `Math.max(dx, dy)` (Chebyshev distance). Example: moving 3 squares diagonally returns 3m.

## Expected Behavior

Should use PTU alternating diagonal rule: 3 diagonal squares should cost 1+2+1 = 4m. The correct formula is already implemented in `useGridMovement.calculateMoveDistance` (via `usePathfinding.ts:100-109`).

## Suggested Fix

Align the measurement store's distance getter with `calculateMoveDistance` from `useGridMovement.ts`. Compute diagonal count as `min(dx, dy)`, straight count as `abs(dx - dy)`, and apply the alternating rule: `diagonalCost = diagonals + Math.floor(diagonals / 2)`, then `total = straightCount + diagonalCost`.

## Resolution Log

### Fix: `1151a18` — Replace Chebyshev with PTU alternating diagonal rule

**Files changed:**
- `app/stores/measurement.ts` — distance getter: replaced `Math.max(dx, dy)` with PTU alternating diagonal formula
- `app/components/player/PlayerGridView.vue` — player grid distance display: same fix (duplicate code path found via grep)
- `app/components/vtt/VTTContainer.vue` — isometric 3D flat distance component: same fix (duplicate code path found via grep)

**Formula applied:** `diagonals = min(dx, dy)`, `straights = abs(dx - dy)`, `diagonalCost = diagonals + floor(diagonals / 2)`, `total = straights + diagonalCost`

**Duplicate code path check:** Grepped entire `app/` for `Math.max(dx, dy)` and `Chebyshev`. Found 3 distance-measurement code paths (all fixed). Remaining Chebyshev uses are AoE shape containment checks (burst cells, fog of war radius, terrain brush, range checking) which correctly use Chebyshev for "is cell within N squares" — these are NOT point-to-point distance measurements and should not use the alternating diagonal rule.

## Impact

- Distance measurement tool displays incorrect distances for diagonal paths
- Does NOT affect actual movement validation (which correctly uses alternating diagonals via A* pathfinding)
- Pre-existing issue from original measurement store implementation (commit `433fdb0`), not introduced by feature-002 P2
