---
id: feature-017
title: Poke Ball Type System
priority: P2
severity: MEDIUM
status: in-progress
domain: capture
source: matrix-gap (GAP-CAP-2)
matrix_source: capture R020, R021, R022, R023, R024, R025, R026
created_by: master-planner
created_at: 2026-02-28
design_spec: design-poke-ball-types-001
---

# feature-017: Poke Ball Type System

## Summary

No Poke Ball type system exists. The capture rate endpoint uses a flat base rate with no ball-specific modifiers. PTU defines 25+ ball types each with unique capture rate modifiers, conditional bonuses, and post-capture effects. 7 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R020 | Poke Ball Type Modifiers | Missing — no ball catalog, no auto-modifiers |
| R021 | Level Ball Condition | Missing — bonus when user level > target level |
| R022 | Love Ball Condition | Missing — bonus for same species different gender |
| R023 | Timer Ball Scaling | Missing — bonus increases with round count |
| R024 | Quick Ball Decay | Missing — large bonus round 1, decreasing |
| R025 | Heavy Ball Scaling | Missing — bonus/penalty based on weight |
| R026 | Heal Ball Post-Capture Effect | Missing — full heal on capture |

## PTU Rules

- Chapter 9: Poke Ball catalog with modifiers
- Each ball type has: base modifier, conditional bonus, post-capture effect
- Modifier applied to capture rate formula
- Some balls have round-dependent scaling (Timer, Quick)
- Some have conditional checks (Level, Love, Heavy)

## Implementation Scope

FULL-scope feature requiring design spec. Needs ball type catalog, capture rate formula integration, and selection UI.

## Design Spec

[design-poke-ball-types-001](../../../designs/design-poke-ball-types-001/_index.md)

Three-tier design:
- **P0**: Ball type catalog (25 balls), base modifier integration into capture roll, ballType API parameter
- **P1**: Conditional ball logic (Timer, Quick, Level, Heavy, Fast, Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive)
- **P2**: Ball selection UI, post-capture effects (Heal Ball, Friend Ball, Luxury Ball), enhanced capture display

Related decrees: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP).

## Note

ptu-rule-050 (resolved) only removed dead `pokeBallType` code. The actual ball type system was never implemented.

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-03-01 | Design spec created | design-poke-ball-types-001 with 6 files: _index.md, spec-p0.md, spec-p1.md, spec-p2.md, shared-specs.md, testing-strategy.md |
| 2026-03-01 | Status changed | open -> design-complete |
| 2026-03-02 | P0 implemented | Section A: `3ae59073` app/constants/pokeBalls.ts (25 ball catalog, types, helpers) |
| 2026-03-02 | P0 implemented | Section B: `9de31f89` app/utils/captureRate.ts (ballModifier param on attemptCapture) |
| 2026-03-02 | P0 implemented | Section C: `bb0acb53` app/server/api/capture/rate.post.ts, attempt.post.ts (ballType param, ball breakdown in response) |
| 2026-03-02 | P0 implemented | Section D: `2efb67d8` app/composables/useCapture.ts (ballType support, getAvailableBalls, updated interfaces) |
| 2026-03-02 | Status changed | design-complete -> in-progress (P0 complete, P1/P2 pending) |
| 2026-03-02 | P0 review fixes | `0d3e04e3` M1: as const satisfies on POKE_BALL_CATALOG |
| 2026-03-02 | P0 review fixes | `3c6a2145` H1: ball modifier integration tests in captureAttempt.test.ts |
| 2026-03-02 | P0 review fixes | `be690131` M2: document pokeBalls.ts in app-surface.md |
| 2026-03-02 | P1 implemented | Section E: `a666acf4` app/utils/pokeBallConditions.ts (13 conditional evaluators, registry pattern) |
| 2026-03-02 | P1 implemented | Section E: `7e2683d5` app/constants/pokeBalls.ts (calculateBallModifier wired to condition engine) |
| 2026-03-02 | P1 implemented | Section F-H: `fe01dda7` app/server/api/capture/attempt.post.ts (auto-populate context from DB) |
| 2026-03-02 | P1 implemented | Section F-H: `1986921d` app/server/api/capture/rate.post.ts (condition context in rate preview) |
| 2026-03-02 | P1 implemented | Section F-H: `57d396e0` app/composables/useCapture.ts (pass conditionContext to API) |
| 2026-03-02 | P1 tests | `91c77ae9` 85 unit tests for all 13 conditional evaluators + integration |
| 2026-03-02 | Status unchanged | in-progress (P0+P1 complete, P2 pending) |
| 2026-03-03 | P1 fix cycle | code-review-277 (2 HIGH, 3 MEDIUM) — fixes below |
| 2026-03-03 | M1 fix | `1b781984` Remove dead condition property from PokeBallDef interface |
| 2026-03-03 | H2+M2 fix | `1a7b5de2` Extract buildConditionContext to shared ball-condition.service.ts; rate.post.ts gains encounterId/trainerId for full context |
| 2026-03-03 | H1 fix | `851f2f7e` Pass conditionContext to calculateBallModifier in calculateCaptureRateLocal |
| 2026-03-03 | M3 fix | `ec2a94e6` 55 unit tests for buildConditionContext, checkEvolvesWithStone, deriveEvoLine |
| 2026-03-02 | P2 implemented | Section I: `ddbb1879` BallSelector.vue + BallConditionPreview.vue (ball type selection UI) |
| 2026-03-02 | P2 implemented | Section I: `b4e7df79` CaptureContextToggles.vue (GM context flags for baited/dark/underwater) |
| 2026-03-02 | P2 implemented | Section I: `77e4d5b7` CaptureRateDisplay.vue (ball modifier breakdown in hover) |
| 2026-03-02 | P2 implemented | Section J: `5515e0d6` attempt.post.ts (Heal Ball heal-to-max, Friend/Luxury Ball info effects) |
| 2026-03-02 | P2 implemented | Section I+K: `026663f5` CapturePanel.vue (full capture workflow), useCapture.ts (postCaptureEffect type) |
| 2026-03-02 | P2 implemented | Section I: `944bd999` CombatantCard.vue (CapturePanel integration with trainer selector) |
| 2026-03-02 | P2 implemented | Section K: `28bfcf12` attempt.post.ts (capture_attempt WebSocket broadcast with ball info) |
| 2026-03-03 | P2 fix cycle | code-review-295 (1 CRITICAL, 3 HIGH, 4 MEDIUM) -- fixes below |
| 2026-03-03 | M1 fix | `31fa1a44` Extract formatModifier to shared utils/pokeBallFormatters.ts (BallSelector, BallConditionPreview, CaptureRateDisplay) |
| 2026-03-03 | H3 fix | `a4d92020` Replace hardcoded z-index: 100 with $z-index-dropdown in CaptureRateDisplay.vue |
| 2026-03-03 | H2 fix | `be7c987d` Display useCapture warning ref in CapturePanel for action economy failures |
| 2026-03-03 | M3 fix | `26446360` Include encounterRound from encounter store in CapturePanel fullConditionContext |
| 2026-03-03 | M4 fix | `a2b1eed6` Add click-outside handler to BallSelector dropdown |
| 2026-03-03 | H1 fix | `08085f0a` Add capture_attempt WebSocket consumer in useWebSocket.ts + type in api.ts |
| 2026-03-03 | M2 fix | `a37ba0d5` Fetch species data for evolutionStage/maxEvolutionStage in capture rate preview |
| 2026-03-03 | C1 fix | `00338955` Extract CombatantCaptureSection.vue from CombatantCard.vue (1027 -> 918 lines) |
