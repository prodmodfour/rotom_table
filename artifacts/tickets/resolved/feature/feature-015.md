---
id: feature-015
title: Speed CS Movement Integration
priority: P1
severity: HIGH
status: resolved
resolution: already-implemented
domain: vtt-grid
source: matrix-gap (VTT SG-3)
matrix_source: vtt-grid R026, R027
created_by: master-planner
created_at: 2026-02-28
resolved_at: 2026-02-28
---

# feature-015: Speed CS Movement Integration

## Summary

Speed Combat Stages are tracked and applied to initiative and evasion but do not affect movement range on the VTT grid. Per PTU rules, each Speed CS level adds/subtracts 1 meter of movement. 2 matrix rules classified as Missing.

## Resolution

**Already Implemented.** Both R026 and R027 were implemented prior to ticket creation. The matrix incorrectly classified them as Missing. The audit report (`artifacts/matrix/vtt-grid/audit/audit-report.md`) had already identified this discrepancy.

### Implementation Details

The `applyMovementModifiers` function in `app/composables/useGridMovement.ts` (lines 95-134) correctly implements:

- **R026 (Speed CS Affect Movement):** Reads `combatant.entity.stageModifiers.speed`, clamps to [-6, +6], applies `Math.trunc(stage / 2)` as additive bonus/penalty. CS+6 = +3m, CS-6 = -3m. Per PTU 1.05 p.696: "bonus or penalty equal to half your current Speed Combat Stage value rounded down."
- **R027 (Speed CS Movement Floor):** Enforces `Math.max(modifiedSpeed, 2)` when the stage bonus is negative. Per PTU 1.05 p.700: "may never reduce it below 2."

All movement code paths apply this function:
- `getSpeed()` — base speed for validation
- `getMaxPossibleSpeed()` — exploration budget for flood-fill
- `getAveragedSpeedForPath()` — terrain-mixed speed
- `buildSpeedAveragingFn()` — flood-fill averaging callback

### Existing Tests

Comprehensive unit tests exist at `app/tests/unit/composables/useGridMovement.test.ts` (335 lines) covering:
- Speed CS +1 through +6 (additive half-value bonuses)
- Speed CS -1 through -6 (additive half-value penalties with 2m floor)
- Symmetry verification (positive/negative produce equal magnitude)
- Clamping beyond +/-6
- Interactions with Stuck, Slowed, Sprint conditions
- Minimum speed floor enforcement

### PTU Rules Correction

The ticket description incorrectly states "Each +1 Speed CS = +1 meter movement." The actual PTU rule (p.696) is "bonus or penalty equal to **half** your current Speed Combat Stage value rounded down." The code correctly implements the rulebook formula (half, not one-for-one).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R026 | Speed CS Affect Movement | ~~Missing~~ Implemented — applyMovementModifiers applies Math.trunc(stage/2) |
| R027 | Speed CS Movement Floor | ~~Missing~~ Implemented — Math.max(modifiedSpeed, 2) for negative CS |

## PTU Rules

- Chapter 7: Speed Combat Stages (p.696-700)
- Bonus/penalty = half Speed CS value, rounded down
- CS +6 = +3m, CS +4 = +2m, CS +2 = +1m, CS +1 = +0m
- CS -6 = -3m, CS -4 = -2m, CS -2 = -1m, CS -1 = -0m
- Minimum movement: 2 meters when negative CS applied
- Applies to all movement types (Overland, Swim, Burrow, etc.)

## Resolution Log

| Commit | Files Changed | Description |
|--------|--------------|-------------|
| e46d143 | artifacts/matrix/vtt-grid/matrix.md | Corrected R026/R027 from Missing to Implemented, updated coverage score |
