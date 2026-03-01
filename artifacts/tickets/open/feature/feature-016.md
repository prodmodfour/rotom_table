---
id: feature-016
title: Priority / Interrupt / Attack of Opportunity System
priority: P2
severity: MEDIUM
status: in-progress
domain: combat+vtt-grid
source: matrix-gap (combat Gap 2 + VTT SG-5)
matrix_source: combat R040, R046, R047, R048, R110, R116, R117, vtt-grid R031
created_by: master-planner
created_at: 2026-02-28
design_spec: artifacts/designs/design-priority-interrupt-001/
---

# feature-016: Priority / Interrupt / Attack of Opportunity System

## Summary

No mechanism for out-of-turn actions. PTU has three categories: Priority (act before initiative), Interrupt (act during another's turn), and Attack of Opportunity (triggered by specific actions). The app has AoO and Intercept entries in `COMBAT_MANEUVERS` but no trigger detection, interrupt flow, or out-of-turn action resolution. 8 matrix rules across combat and vtt-grid.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R040 | Initiative — Holding Action | combat | Missing — no hold-action mechanism |
| R046 | Priority Action Rules | combat | Missing — no Priority action system |
| R047 | Priority Limited/Advanced Variants | combat | Missing — depends on R046 |
| R048 | Interrupt Actions | combat | Missing — no Interrupt mechanism |
| R110 | Attack of Opportunity | combat | Partial — constant exists, no trigger detection |
| R116 | Intercept Melee | combat | Impl-Unreachable — in constant, no interrupt flow |
| R117 | Intercept Ranged | combat | Impl-Unreachable — in constant, no interrupt flow |
| R031 | AoO Movement Trigger | vtt-grid | Missing — no alert when moving from adjacent enemy |

## PTU Rules

- Chapter 7: Priority, Interrupt, and AoO rules
- Priority: declare before initiative, resolve first (1/round)
- Interrupt: act during another's turn in response to trigger (1/round)
- AoO triggers: adjacent foe shifts away, uses ranged attack, stands up, uses maneuver not targeting you, retrieves item
- Disengage maneuver: shift 1m without provoking AoO
- Intercept: melee (free redirect of attack) or ranged (block attack aimed at ally)

## Implementation Scope

FULL-scope feature requiring design spec. This is a fundamental combat system change affecting turn flow.

## Design Spec

**Status:** design-complete (2026-03-01)
**Location:** `artifacts/designs/design-priority-interrupt-001/`

### Tier Breakdown

| Tier | Scope | Rules | Est. Commits |
|------|-------|-------|-------------|
| P0 | AoO trigger detection, out-of-turn engine, VTT grid integration | R110, R031 | 6-8 |
| P1 | Priority (Standard/Limited/Advanced), Interrupt framework, Hold Action | R040, R046, R047, R048 | 8-10 |
| P2 | Intercept Melee/Ranged, Disengage maneuver | R116, R117, ptu-rule-095 | 8-10 |

### Key Architecture Decisions

1. **GM-driven resolution model** — system detects opportunities, GM accepts/declines
2. **Pending action queue** — `OutOfTurnAction[]` on Encounter, persisted in DB
3. **Client-side between-turns state** — Priority declaration window without server phase
4. **Backward-compatible** — all new fields optional with defaults

## Related Tickets

- ptu-rule-095 (P4, open): Disengage maneuver — absorbed into P2 of this design

## Resolution Log

| Date | Action | Commits | Files |
|------|--------|---------|-------|
| 2026-03-01 | Design spec written | ea1ef69b, 425a2a3f, e09525eb, fb161da1, 2bdc3ab5 | 6 design spec files |
| 2026-03-01 | P0 implemented | 77f08598, 215e8769, b12d7b93, c56f485a, a6895c1a, 3edcfc2d, 8b577107, 416039c2 | 6 new: out-of-turn.service.ts, adjacency.ts, aooTriggers.ts, aoo-detect.post.ts, aoo-resolve.post.ts, AoOPrompt.vue. 5 modified: combat.ts, encounter.ts, encounter store, useGridMovement.ts, next-turn.post.ts, ws.ts, schema.prisma, encounter.service.ts |
| 2026-03-01 | P0 fix cycle (code-review-247) | 40a1bfda, e6765d1f, 4fb2a888, 4d4c5bc0, 0c8a264e, 89641e87, 70ebcc3e, e43fe165 | CRIT-001: reactor eligibility re-validation in aoo-resolve. H1: triggerType input validation. H2: DB4 damage base corrected to 11. H3: app-surface.md updated. M1: client AoO preview eligibility. M2: auto-decline on target faint. M3: stale record in detect. M4: pending action cleanup. Files: aoo-resolve.post.ts, aoo-detect.post.ts, aooTriggers.ts, useGridMovement.ts, out-of-turn.service.ts, next-turn.post.ts, app-surface.md |
| 2026-03-01 | P1 fix cycle (code-review-259 + rules-review-235) | 828ec965, 3c0813eb, d2590ee6, fdca3850, 332c6854, 9fa2d636, 13c1b3dc, 757b297d, 18c06bb5, e6c161a1 | CRIT-001: betweenTurns wired into nextTurn. CRIT-002: Standard Priority duplicate turnOrder. HIGH-001: holdReleaseTriggered returned. HIGH-002: hold-action advances turn. HIGH-003: applyAdvancedPriority standardActionUsed. HIGH-004: unused import. rules-HIGH-002: skipNextRound narrowed to uncommandable Pokemon. MED-003: decline before eligibility. MED-004: checkHoldQueue returns all. MED-005: Priority filter to store getter. MED-001: app-surface.md updated. Files: encounter.ts store, gm/index.vue, priority.post.ts, hold-action.post.ts, out-of-turn.service.ts, next-turn.post.ts, interrupt.post.ts, PriorityActionPanel.vue, app-surface.md |
