---
id: feature-019
title: VTT Status-Movement Integration
priority: P2
severity: MEDIUM
status: in-progress
domain: vtt-grid
source: matrix-gap (VTT SG-4)
matrix_source: vtt-grid R022, R024, R025
created_by: master-planner
created_at: 2026-02-28
---

# feature-019: VTT Status-Movement Integration

## Summary

Status conditions that affect movement (Stuck, Slowed, Tripped) are tracked in combat but not integrated into VTT movement validation. GM can move Stuck tokens, Slowed tokens have full movement range, and Tripped tokens can move without standing up. 3 matrix rules classified as Partial.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R022 | Stuck Condition — No Movement | Implemented — `applyMovementModifiers` returns 0 for Stuck |
| R024 | Slowed Condition — Half Movement | Implemented — `applyMovementModifiers` halves speed for Slowed |
| R025 | Tripped Condition — Stand Up Cost | Implemented — `applyMovementModifiers` returns 0 for Tripped |

## PTU Rules

- Chapter 7: Movement-affecting conditions
- Stuck: cannot move (0 movement)
- Slowed: movement halved (round down)
- Tripped: must use Shift Action to stand up before moving

## Implementation Scope

PARTIAL-scope — can be implemented directly. Modify movement range calculation and pathfinding to check active status conditions.

## Affected Areas

- `app/composables/useGridMovement.ts` — movement range + validation
- `app/stores/encounterGrid.ts` — movement preview

## Resolution Log

### R022 & R024: Already Implemented

Stuck and Slowed were already fully integrated into VTT movement via `applyMovementModifiers()` in `useGridMovement.ts`:
- Stuck: early-return of 0 (commit `8ecdb47c`, `072f167c`)
- Slowed: `Math.floor(speed / 2)` with minimum floor
- Both flow through `getSpeed()`, `getMaxPossibleSpeed()`, `getAveragedSpeedForPath()`, `buildSpeedAveragingFn()`, and `isValidMove()`
- 38 existing test cases cover all modifier interactions

The matrix audit classified these as "Partial" based on a stale snapshot before these implementations existed.

### R025: Tripped Movement Block

**Commit:** `99dad473` feat: block VTT movement for Tripped combatants (R025)
- Added Tripped check to `applyMovementModifiers()` — returns 0, same pattern as Stuck
- PTU p.251: "needs to spend a Shift Action getting up before they can take further actions"
- Since the Shift Action IS movement in PTU, Tripped blocks grid movement
- GM removes Tripped via status system when combatant uses Shift to stand up
- 6 test cases: Tripped alone, Speed CS override, Sprint override, Stuck+Tripped, Tripped+Slowed

**Commit:** `3a7287b9` fix: also check tempConditions for Tripped movement block
- Tripped can come from statusConditions (Trip maneuver) or tempConditions (Take a Breather)
- Updated check: `conditions.includes('Tripped') || tempConditions.includes('Tripped')`
- 2 additional test cases for tempCondition variant

### Files Changed

- `app/composables/useGridMovement.ts` — Tripped check in `applyMovementModifiers()`, JSDoc updates
- `app/tests/unit/composables/useGridMovement.test.ts` — 8 new test cases for Tripped
