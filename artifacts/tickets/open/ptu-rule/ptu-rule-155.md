---
id: ptu-rule-155
title: "Reclassify R156-R160, R164 capture rules in player-view matrix (Implemented-Unreachable → Partial/Implemented)"
priority: P2
severity: LOW
status: open
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
