---
id: feature-023
title: Player Capture & Healing Interfaces
priority: P2
severity: MEDIUM
status: in-progress
domain: player-view+capture+healing
source: matrix-gap (GAP-CAP-1 + GAP-HEAL-1)
matrix_source: capture R004, R027, R032, healing R018, R019, R024
created_by: master-planner
created_at: 2026-02-28
---

# feature-023: Player Capture & Healing Interfaces

## Summary

Capture and healing features are implemented for GM view but unreachable from player view. Players cannot throw Poke Balls, use healing items, or trigger Take a Breather from their interface. 6 matrix rules classified as Implemented-Unreachable.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R004 | Throwing Accuracy Check | capture | Impl-Unreachable — GM-only |
| R027 | Capture Workflow | capture | Impl-Unreachable — GM-only |
| R032 | Capture Is Standard Action | capture | Impl-Unreachable — GM-only |
| R018 | Take a Breather — Core Effects | healing | Impl-Unreachable — GM-only |
| R019 | Take a Breather — Action Cost | healing | Impl-Unreachable — GM-only |
| R024 | Trainer AP Drain for Injury | healing | Impl-Unreachable — GM-only |

## Implementation Scope

FULL-scope feature requiring design spec. Extends the player view system (feature-003). Needs player action submission → GM approval workflow via WebSocket.

## Design Spec

- **Design ID:** design-player-capture-healing-001
- **Location:** `artifacts/designs/design-player-capture-healing-001/`
- **Tiers:** P0 (action request extensions + GM panel), P1 (capture UI), P2 (healing UI)
- **New files:** 5 (PlayerCapturePanel, PlayerHealingPanel, PlayerRequestPanel, usePlayerCapture, usePlayerHealing)
- **Modified files:** 7
- **Estimated commits:** 12-16

## Related Tickets

- feature-003 (all tracks complete): Player View core infrastructure
- feature-016 (P2): AoO system — player actions need interrupt awareness
- feature-020 (design-complete): Healing item system — P2 integrates if implemented

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-01 | Design spec created | design-player-capture-healing-001 with P0/P1/P2 tiers, shared-specs, testing-strategy |
| 2026-03-02 | P0 implemented | 5 commits (a5a0a822..15527ddc): extended PlayerActionType, added player request functions, created PlayerRequestPanel, extracted usePlayerRequestHandlers composable, wired into GM encounter view |
| 2026-03-02 | P0 fix cycle | 9 commits (63770d47..212f51a0): fixed CRIT-001 ball type string mismatch, HIGH-001 ballType passthrough, CR-1 gm/index.vue 800-line cap via useSwitchModalState extraction, HI-1 unused prop removal, HI-2 undo snapshots, HI-3 alert→inline error + MED-001 entityId→combatantId + MED-002 null check + ME-3 deny reason, ME-1 app-surface.md, ME-2 capture rate display, ME-4 import path |
| 2026-03-02 | P1 implemented | 4 commits (20c5ed16..1ba0bdba): Section E-H. captureTargets computed (usePlayerCombat.ts), usePlayerCapture.ts composable, PlayerCapturePanel.vue (two-step flow), wired into PlayerCombatActions.vue + SCSS capture button style |
| 2026-03-02 | P1 fix cycle | 4 commits (64ef8cb6..fb3ce4a4): CRIT-1 captureTargets 'Enemies'->'enemies' case fix (usePlayerCombat.ts), M1 hardcoded gap->$spacing-xs (PlayerCapturePanel.vue), M2 inline comment for omitted evolution/legendary params (usePlayerCapture.ts), H1 app-surface.md P1 components added |
