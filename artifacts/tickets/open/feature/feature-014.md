---
id: feature-014
title: VTT Flanking Detection
priority: P1
severity: HIGH
status: in-progress
domain: vtt-grid+combat
source: matrix-gap (combat Gap 4 + VTT SG-2)
matrix_source: combat R063, R064, R065, vtt-grid R018, R019, R020
created_by: master-planner
created_at: 2026-02-28
---

# feature-014: VTT Flanking Detection

## Summary

No flanking detection exists. PTU flanking grants -2 evasion penalty when a target is between two enemies on opposite sides. This is a core positional combat mechanic that makes grid positioning meaningful. 6 matrix rules across combat and vtt-grid domains.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R063 | Flanking — Evasion Penalty | combat | Missing — no flanking detection or -2 evasion |
| R064 | Flanking — Requirements by Size | combat | Missing — depends on R063 |
| R065 | Flanking — Large Combatant | combat | Missing — depends on R063 + multi-tile |
| R018 | Flanking Detection | vtt-grid | Missing — no adjacency-based flanking logic |
| R019 | Flanking — Large Multi-Square | vtt-grid | Missing — depends on R018 + multi-tile tokens |
| R020 | Flanking Self-Flank Prevention | vtt-grid | Missing — depends on R018 |

## PTU Rules

- Chapter 7: Flanking rules
- Flanked when enemies on opposite sides (horizontal, vertical, or diagonal)
- -2 to all evasion while flanked
- Large+ combatants: flanking considers occupied squares, not center
- Cannot flank yourself (multiple Pokemon on same side don't count)

## Implementation Scope

FULL-scope feature requiring design spec. Depends on multi-tile token system (feature-013) for Large+ combatant flanking.

## Design Spec

- **Design ID**: design-flanking-001
- **Location**: `artifacts/designs/design-flanking-001/`
- **Status**: designed (P0/P1/P2 specs complete)

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-01 | Design spec created | Full multi-tier design spec with P0 (core 1x1 flanking), P1 (multi-tile, advanced), P2 (automation, UI, WebSocket) |
| 2026-03-01 | P0 implemented | 8 commits: a695cfa5..0c4bd69d. Section A (flankingGeometry.ts), B (useFlankingDetection.ts), C (canvas+VTTToken visual), D (evasion penalty in accuracy). Files: types/combat.ts, utils/flankingGeometry.ts, composables/useFlankingDetection.ts, composables/useCanvasDrawing.ts, composables/useGridRendering.ts, composables/useMoveCalculation.ts, components/vtt/VTTToken.vue, components/vtt/GridCanvas.vue, components/encounter/MoveTargetModal.vue |
