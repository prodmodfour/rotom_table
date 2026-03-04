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
| 2026-03-01 | P0 fix cycle | 7 commits: 5fb3a65c..1c9667b9. Addresses code-review-254 (2 HIGH, 4 MED) + rules-review-230 (2 MED). HIGH-1/2: removed duplicate canvas flanking indicator (keep CSS-only). MED-1: use FLANKING_EVASION_PENALTY constant. MED-2: remove dead FlankingSize type. MED-3: update app-surface.md. MED-4: document intentional composable duplication. R230-MED-1: add Fainted defense-in-depth. R230-MED-2: document decree-need-039 pending. Files: useCanvasDrawing.ts, useGridRendering.ts, GridCanvas.vue, useFlankingDetection.ts, combat.ts, MoveTargetModal.vue, useMoveCalculation.ts, app-surface.md |
| 2026-03-02 | P1 implemented | 4 commits: 08b0b415..98ef7972. Section E (multi-tile target flanking via checkFlankingMultiTile + findIndependentSet), F (multi-tile attacker counting via countAdjacentAttackerCells), G (diagonal — confirmed correct from P0, no changes), H (3+ attackers — validated with independent set algorithm). Files: utils/flankingGeometry.ts, composables/useFlankingDetection.ts, tests/unit/utils/flankingGeometry.test.ts |
| 2026-03-02 | P1 fix cycle | 2 commits: e121fc82, 7b2f6d61. MED-1: update app-surface.md with P1 functions. MED-2: replace stale decree-need-039 comment with decree-040 citation in useMoveCalculation.ts. |
| 2026-03-02 | P2 implemented | 5 commits: 9dca0cfd..0f1ad78e. Section I (auto-detect watcher in useFlankingDetection with FlankingDetectionOptions), J (server-side flanking in calculate-damage.post.ts via checkFlankingMultiTile + decree-040 post-cap), K (CombatantCard isFlanked prop + badge, wired through CombatantSides to GM page), L (WebSocket flanking_update relay in ws.ts, GM broadcast via watcher, useWebSocket receivedFlankingMap). Files: composables/useFlankingDetection.ts, components/vtt/GridCanvas.vue, components/vtt/VTTContainer.vue, server/api/encounters/[id]/calculate-damage.post.ts, components/encounter/CombatantCard.vue, components/gm/CombatantSides.vue, pages/gm/index.vue, server/routes/ws.ts, composables/useWebSocket.ts |
