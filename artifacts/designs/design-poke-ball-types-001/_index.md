---
design_id: design-poke-ball-types-001
ticket_id: feature-017
category: FEATURE
scope: FULL
domain: capture
status: implemented
decrees:
  - decree-013
  - decree-014
  - decree-015
matrix_source:
  - capture-R020
  - capture-R021
  - capture-R022
  - capture-R023
  - capture-R024
  - capture-R025
  - capture-R026
affected_files:
  - app/utils/captureRate.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/composables/useCapture.ts
  - app/types/capture.ts
  - app/components/encounter/CaptureRateDisplay.vue
  - app/components/encounter/CombatantCard.vue
new_files:
  - app/constants/pokeBalls.ts
  - app/utils/pokeBallConditions.ts
  - app/server/services/ball-condition.service.ts
  - app/components/capture/BallSelector.vue
  - app/components/capture/BallConditionPreview.vue
  - app/components/capture/CaptureContextToggles.vue
  - app/components/capture/CapturePanel.vue
---

# Design: Poke Ball Type System

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Poke Ball Catalog Constants, B. Base Modifier Integration into Capture Rate, C. Ball Type Parameter in Capture API, D. Updated useCapture Composable | [spec-p0.md](spec-p0.md) |
| P1 | E. Conditional Ball Logic Engine, F. Round-Dependent Balls (Timer, Quick), G. Stat-Comparison Balls (Level, Heavy, Fast), H. Context-Dependent Balls (Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive) | [spec-p1.md](spec-p1.md) |
| P2 | I. Ball Type Selection UI, J. Post-Capture Effects (Heal Ball, Friend Ball, Luxury Ball), K. Capture Result Display with Ball Info | [spec-p2.md](spec-p2.md) |

## Summary

Implement the full PTU Poke Ball type system from Chapter 9 (p.271-273). Currently, the capture system uses a flat base rate with the `modifiers` parameter on `attemptCapture()` as a pre-calculated number the GM enters manually. PTU defines 25 ball types, each with a base modifier to the capture roll and optional conditional bonuses or post-capture effects. This design covers 7 matrix rules:

| Rule | Title | Current Status | Target |
|------|-------|---------------|--------|
| R020 | Poke Ball Type Modifiers | Missing -- no ball catalog, no auto-modifiers | Full ball catalog with per-ball base modifiers integrated into capture formula |
| R021 | Level Ball Condition | Missing -- no level comparison logic | -20 modifier when target is under half the user's active Pokemon level |
| R022 | Love Ball Condition | Missing -- no gender/species comparison | -30 modifier for same evolutionary line + opposite gender |
| R023 | Timer Ball Scaling | Missing -- no round-dependent scaling | Starts at +5, decreases -5 per round until -20 |
| R024 | Quick Ball Decay | Missing -- no round-dependent decay | Starts at -20, increases +5/+10/+20 after rounds 1/2/3 |
| R025 | Heavy Ball Scaling | Missing -- no weight class logic | -5 per weight class above 1 |
| R026 | Heal Ball Post-Capture Effect | Missing -- no post-capture heal | Full HP heal on successful capture |

## Related Decrees

- **decree-013**: Use the core 1d100 capture system, not the errata d20 playtest. Ball modifiers apply to the 1d100 roll, not a d20 system.
- **decree-014**: Stuck/Slow capture bonuses are separate, not stacked with volatile. Ball modifiers are independent of status bonuses and stack additively.
- **decree-015**: Use real max HP for capture rate HP percentage calculations. Heal Ball post-capture effect heals to real max HP (not injury-reduced).

## PTU Rules Reference

PTU Core Chapter 9, p.271-273 (Poke Ball Chart):

**Capture mechanics (p.271):** "Throwing Poke Balls is an AC6 Status Attack... you then make a Capture Roll by rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll."

The ball modifier is applied to the capture roll (not the capture rate). Per the existing `attemptCapture()` function, modifiers reduce the roll: `modifiedRoll = roll - trainerLevel + modifiers`. Since ball modifiers in PTU are expressed as modifiers to the roll (negative = easier capture), the sign convention is: a -10 modifier from Great Ball means subtract 10 from the roll, making capture easier.

**All 25 Ball Types:**

| # | Ball | Base Mod | Conditional Modifier | Post-Capture |
|---|------|----------|---------------------|--------------|
| 01 | Basic Ball | +0 | -- | -- |
| 02 | Great Ball | -10 | -- | -- |
| 03 | Ultra Ball | -15 | -- | -- |
| 04 | Master Ball | -100 | -- | -- |
| 05 | Safari Ball | +0 | -- | Safari hunts only |
| 06 | Level Ball | +0 | -20 if target < half user's active Pokemon level | -- |
| 07 | Lure Ball | +0 | -20 if target was baited | -- |
| 08 | Moon Ball | +0 | -20 if target evolves with Evolution Stone | -- |
| 09 | Friend Ball | -5 | -- | Caught Pokemon starts +1 Loyalty |
| 10 | Love Ball | +0 | -30 if same evo line + opposite gender (not genderless) | -- |
| 11 | Heavy Ball | +0 | -5 per Weight Class above 1 | -- |
| 12 | Fast Ball | +0 | -20 if target has Movement Capability above 7 | -- |
| 13 | Sport Ball | +0 | -- | Safari hunts only |
| 14 | Premier Ball | +0 | -- | Promotional |
| 15 | Repeat Ball | +0 | -20 if trainer already owns same species | -- |
| 16 | Timer Ball | +5 | -5 per round since encounter start (until total -20) | -- |
| 17 | Nest Ball | +0 | -20 if target is under level 10 | -- |
| 18 | Net Ball | +0 | -20 if target is Water or Bug type | -- |
| 19 | Dive Ball | +0 | -20 if target found underwater or underground | -- |
| 20 | Luxury Ball | -5 | -- | Raised happiness |
| 21 | Heal Ball | -5 | -- | Heal to Max HP on capture |
| 22 | Quick Ball | -20 | +5 after round 1, +10 after round 2, +20 after round 3 | -- |
| 23 | Dusk Ball | +0 | -20 if dark or low-light conditions | -- |
| 24 | Cherish Ball | -5 | -- | Decorative |
| 25 | Park Ball | -15 | -- | Safari hunts only |

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Ball type catalog constants | NOT_IMPLEMENTED | No ball definitions | **P0** |
| B | Base modifier integration | NOT_IMPLEMENTED | modifiers param exists but no auto-calculation | **P0** |
| C | Ball type parameter in capture API | NOT_IMPLEMENTED | No ballType field in request/response | **P0** |
| D | Updated useCapture composable | NOT_IMPLEMENTED | No ball-aware capture flow | **P0** |
| E | Conditional ball logic engine | NOT_IMPLEMENTED | No per-ball condition checker | **P1** |
| F | Round-dependent balls (Timer, Quick) | NOT_IMPLEMENTED | No round tracking for ball modifiers | **P1** |
| G | Stat-comparison balls (Level, Heavy, Fast) | NOT_IMPLEMENTED | No level/weight/speed comparison | **P1** |
| H | Context-dependent balls (Love, Net, Dusk, etc.) | NOT_IMPLEMENTED | No type/gender/environment checks | **P1** |
| I | Ball type selection UI | NOT_IMPLEMENTED | No ball picker in capture workflow | **P2** |
| J | Post-capture effects (Heal, Friend, Luxury) | NOT_IMPLEMENTED | No post-capture processing | **P2** |
| K | Capture result display with ball info | NOT_IMPLEMENTED | No ball info in capture result | **P2** |

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
