---
id: ptu-rule-155
title: "Reclassify R156-R160, R164 capture rules in player-view matrix (Implemented-Unreachable → Partial/Implemented)"
priority: P2
severity: LOW
status: in-progress
domain: player-view
source: artifacts/matrix/player-view-audit.md (Escalation Notes)
created_by: slave-collector (plan-matrix-1772733434)
created_at: 2026-03-05
affected_files:
  - artifacts/matrix/player-view/matrix.md
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerCapturePanel.vue
---

## Summary

The player-view implementation audit found that R156-R160 and R164 (capture system rules) are classified as **Implemented-Unreachable** in the player-view matrix, but `usePlayerCombat.ts` includes `requestCapture()` (lines 352-369) and `PlayerCapturePanel.vue` exists. The player CAN initiate capture requests via WebSocket to the GM.

## Problem

The matrix classifications do not reflect the current state of the capture panel feature. These rules may now be **Partial** or **Implemented** from the player-view perspective, which would increase the domain's coverage score above the current 64.7%.

## Required Action

1. Review the capture panel implementation against R156-R160, R164 rules
2. Update matrix classifications if the player-side capture flow qualifies as Partial or Implemented
3. Recalculate player-view coverage score

## Impact

Coverage score accuracy. No correctness issue -- this is a classification update only.

## Resolution Log

### Analysis (2026-03-06)

Reviewed player capture implementation across:
- `app/components/player/PlayerCapturePanel.vue` — UI for target selection, capture rate preview, request submission
- `app/composables/usePlayerCombat.ts` — `requestCapture()` sends WebSocket request to GM (lines 352-369), `captureTargets` filters wild non-fainted Pokemon
- `app/composables/usePlayerCapture.ts` — `fetchCaptureRate()` (server) and `estimateCaptureRate()` (local fallback) provide capture rate preview
- `app/composables/useCapture.ts` — Full capture rate calculation with breakdown (HP, status, evolution, ball modifiers)

### Classification Decisions

| Rule | Old | New | Rationale |
|------|-----|-----|-----------|
| R156 | Implemented-Unreachable | **Partial** | Player initiates capture via PlayerCapturePanel (target selection + request to GM); execution/resolution is GM-side |
| R157 | Implemented-Unreachable | **Implemented-Unreachable** | No change — accuracy roll (nat 20 bonus) is server-side only; player does not roll |
| R158 | Implemented-Unreachable | **Implemented-Unreachable** | No change — 1d100 capture roll is server-side only; player requests but does not roll |
| R159 | Implemented-Unreachable | **Partial** | Capture rate preview visible to player via CaptureRateDisplay; usePlayerCapture fetches from server or estimates locally |
| R160 | Implemented-Unreachable | **Partial** | HP modifiers visible in capture rate breakdown shown to player |
| R164 | Implemented-Unreachable | **Implemented-Unreachable** | No change — errata d20 system is inactive per decree-013; player panel connects to core 1d100 system |

### Coverage Score Impact

Moving 3 rules from Implemented-Unreachable (0.5 weight) to Partial (0.5 weight) does not change the weighted sum.
- Old: (96 + 0.5*35 + 0.5*11) / 184 = 119/184 = 64.7%
- New: (96 + 0.5*38 + 0.5*8) / 184 = 119/184 = 64.7%

Score unchanged at **64.7%** — the reclassification corrects accuracy of per-rule classifications without affecting the aggregate.

### Files Changed

- `artifacts/matrix/player-view/matrix.md` — Updated R156, R159, R160 classifications; updated counts (Partial: 35→38, Implemented-Unreachable: 11→8); updated formula; updated Gap 2 description; updated audit plan tiers; updated appendix table
