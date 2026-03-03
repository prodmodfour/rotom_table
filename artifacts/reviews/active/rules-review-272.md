---
review_id: rules-review-272
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-017
domain: capture
commits_reviewed:
  - 3a3cdf93
  - 06e7cd95
  - e2db3c03
  - 7728f183
  - 1b71b439
  - ae9cc9d0
  - 0200b213
  - f411fa76
mechanics_verified:
  - capture-rate-evolution-stage-passthrough
  - encounter-round-timer-quick-ball
  - capture-rate-formula-integrity
  - ball-modifier-pipeline-integrity
  - accuracy-check-ac6
  - heal-ball-post-capture-max-hp
  - websocket-capture-attempt-data
  - capture-warning-action-economy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Page 214 (Capture Rate formula, HP thresholds, evolution modifier, status modifiers)
  - core/09-gear-and-items.md#Page 271-273 (Poke Ball Chart, ball modifiers, Timer Ball, Quick Ball, Heal Ball)
reviewed_at: 2026-03-03T14:00:00Z
follows_up: rules-review-268
---

## Review Scope

Re-review of feature-017 P2 after code-review-295 fix cycle (8 commits by slave-5). The fix cycle addressed 1 CRITICAL + 3 HIGH + 4 MEDIUM code quality issues. This rules review verifies that none of the 8 fixes introduced PTU rule regressions and that newly wired data (evolution stages, encounter round) is correct.

rules-review-268 APPROVED the P2 implementation with 0 issues and two non-blocking observations. Observation 1 (missing evolutionStage/maxEvolutionStage in local preview) is directly addressed by fix M2 (commit 06e7cd95). Observation 2 (trainerCombatantId mismatch) is a code quality concern, not a rules issue.

Decrees checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy on throws). No violations found.

## Mechanics Verified

### Capture Rate Evolution Stage Passthrough (Fix M2)

- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Capture Rate. If the Pokemon has one evolution remaining, don't change the Capture Rate. If the Pokemon has no evolutions remaining, subtract 10 from the Capture Rate." (`core/05-pokemon.md#Page 214`)
- **Implementation:** `CombatantCaptureSection.vue` (commit 06e7cd95) fetches species data via `$fetch('/api/species/${species}')` and passes `evolutionStage` and `maxEvolutionStage` to `CapturePanel` via the `pokemonData` computed property. The `CapturePanel` passes these through to `calculateCaptureRateLocal()`, which calls `calculateCaptureRate()` in `captureRate.ts`. The formula at line 95-103 computes `evolutionsRemaining = maxEvolutionStage - evolutionStage` and applies +10 (two remaining), 0 (one remaining), or -10 (none remaining).
- **Default fallback:** When the species API call fails (catch block at line 80-82), `speciesEvolution` stays `null`, and `calculateCaptureRateLocal` uses defaults `evolutionStage: 1, maxEvolutionStage: 3` (line 135-136), which yields +10 (two remaining). This is a safe fallback -- the server-side capture attempt always looks up species data independently and gets the correct values. The local preview is informational only.
- **Status:** CORRECT. The fix resolves the observation from rules-review-268. The local capture rate preview now correctly reflects evolution stage modifiers when species data is available.

### Encounter Round for Timer Ball and Quick Ball (Fix M3)

- **Rule:** Timer Ball: "+5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20." (`core/09-gear-and-items.md#Page 272`). Quick Ball: "-20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3." (`core/09-gear-and-items.md#Page 273`)
- **Implementation:** `CapturePanel.vue` (commit 1b71b439) now includes `encounterRound: encounterStore.currentRound || 1` in the `fullConditionContext` computed property (line 169). The encounter store getter `currentRound` returns `state.encounter?.currentRound ?? 0`. The `|| 1` fallback ensures the round is never 0 (Timer Ball and Quick Ball evaluators expect 1-based rounds).
- **Timer Ball verification:** Round 1: conditional = 0, total = +5. Round 2: conditional = -5, total = 0. Round 6+: conditional = -25, total = -20 (capped). Matches PTU exactly.
- **Quick Ball verification:** Round 1: conditional = 0, total = -20. Round 2: conditional = +5, total = -15. Round 3: conditional = +10, total = -10. Round 4+: conditional = +20, total = 0. Matches PTU exactly.
- **Status:** CORRECT. The encounter round is now properly wired to the condition context, enabling accurate Timer Ball and Quick Ball previews.

### Capture Rate Formula Integrity

- **Rule:** "First, begin with 100. Then subtract the Pokemon's Level x2. Next, look at the Pokemon's current Hit Points..." (`core/05-pokemon.md#Page 214`)
- **Implementation:** `captureRate.ts` `calculateCaptureRate()` is unchanged by the fix cycle. The formula: `base(100) + levelModifier(-(level*2)) + hpModifier + evolutionModifier + shinyModifier + legendaryModifier + statusModifier + injuryModifier + stuckModifier + slowModifier`. HP thresholds: >75% = -30, <=75% = -15, <=50% = 0, <=25% = +15, exactly 1 HP = +30. All match PTU p.214.
- **Decree compliance:** HP percentage uses `currentHp / maxHp` where `maxHp` is the real max HP from the DB record, per decree-015. Stuck (+10) and Slow (+5) are tracked separately from volatile conditions, per decree-014.
- **Status:** CORRECT. No changes to core capture rate logic.

### Ball Modifier Pipeline Integrity

- **Rule:** "The Type of Ball will also modify the Capture Roll." (`core/09-gear-and-items.md#Page 271`)
- **Implementation:** The ball modifier pipeline is unchanged: `calculateBallModifier(ballType, conditionContext)` returns `{ total, base, conditional, conditionMet }`. The `total` is added to the capture roll in `attemptCapture()`: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. The `formatModifier()` extraction (commit f411fa76) is purely a display utility refactoring -- it does not touch any modifier calculation logic.
- **All 25 ball base modifiers remain unchanged** in `POKE_BALL_CATALOG`. All 13 conditional evaluators in `pokeBallConditions.ts` remain unchanged. The `evaluateBallCondition()` registry is unchanged.
- **Status:** CORRECT. The refactoring commits (C1, M1) are purely structural with no impact on game logic.

### Accuracy Check AC 6

- **Rule:** "Throwing Poke Balls is an AC6 Status Attack." (`core/09-gear-and-items.md#Page 271`)
- **Implementation:** `useCapture.ts` `rollAccuracyCheck()` is unchanged: d20 roll, natural 1 auto-miss, natural 20 auto-hit, otherwise `roll >= 6`. Server-side validation in `attempt.post.ts` lines 36-60 enforces the same gate. The TODO comment at line 263-264 correctly references ptu-rule-131 for full accuracy modifiers per decree-042.
- **Status:** CORRECT. No changes to accuracy logic.

### Heal Ball Post-Capture Max HP

- **Rule:** "A caught Pokemon will heal to Max HP immediately upon capture." (`core/09-gear-and-items.md#Page 273`)
- **Implementation:** `attempt.post.ts` lines 179-189: `currentHp: pokemon.maxHp` uses the real max HP from the Prisma record. Per decree-015, this is the correct HP value. No fix cycle commits modified this code path.
- **Status:** CORRECT. Unchanged from rules-review-268.

### WebSocket Capture Attempt Data (Fix H1)

- **Rule:** N/A (no PTU rule governs WebSocket broadcast -- this is integration infrastructure).
- **Implementation:** `useWebSocket.ts` (commit e2db3c03) adds a `capture_attempt` handler that stores the event data and reloads the encounter on successful capture. The handler correctly extracts `trainerName`, `pokemonSpecies`, `ballType`, `captured`, `roll`, `modifiedRoll`, and `captureRate`. The encounter reload on capture ensures the Group View reflects ownership changes. The `lastCaptureAttempt` ref is exposed as `readonly()`.
- **Rules impact:** The capture data displayed to Group View (roll, modified roll, capture rate) matches what the server computed. No rules-relevant transformations occur in the WebSocket handler -- it is a pass-through.
- **Status:** CORRECT (no rules implications).

### Capture Warning for Action Economy (Fix H2)

- **Rule:** "Throwing a Poke Ball is a Standard Action." (PTU Core p.227, referenced in `useCapture.ts` line 172)
- **Implementation:** `CapturePanel.vue` (commit ae9cc9d0) displays `captureWarning` from `useCapture()`. The warning is set at `useCapture.ts` line 217: "Capture succeeded but standard action was not consumed -- please adjust action economy manually". This fires when the action consumption API call fails but the capture itself succeeds. The warning correctly alerts the GM to manually handle the action economy rather than silently ignoring the failure.
- **Rules impact:** The warning text accurately describes the PTU rule. The capture result is not rolled back on action consumption failure, which is correct -- the capture roll itself is valid per PTU rules; the action economy tracking is an app-level convenience, not a game mechanic that would invalidate the capture.
- **Status:** CORRECT.

## Decree Compliance

- **decree-013 (1d100 system):** No fix cycle commits modify the capture roll formula. The `attemptCapture()` function in `captureRate.ts` continues to roll 1d100 exclusively. **Fully compliant.**

- **decree-014 (Stuck/Slow separate):** No fix cycle commits modify `calculateCaptureRate()` or status condition handling. The breakdown in `CaptureRateDisplay.vue` correctly shows `stuckModifier` and `slowModifier` as separate line items (lines 55-62). **Fully compliant.**

- **decree-015 (real max HP):** The `CombatantCaptureSection.vue` extraction passes `maxHp: pokemon.maxHp` from the Pokemon entity (line 94), which is the real max HP from the Prisma record. The Heal Ball effect in `attempt.post.ts` continues to use `pokemon.maxHp`. **Fully compliant.**

- **decree-042 (full accuracy on throws):** The accuracy check in `rollAccuracyCheck()` is unchanged. The TODO comment referencing ptu-rule-131 for full modifier integration is preserved. **Fully compliant** (deferred ptu-rule-131 acknowledged).

## Fix Cycle Impact Assessment

| Fix | Commits | Rules Impact |
|-----|---------|-------------|
| C1: CombatantCaptureSection extraction | 3a3cdf93 | None. Structural refactoring only. All capture data props preserved. |
| H1: capture_attempt WebSocket consumer | e2db3c03 | None. Pass-through display of server-computed values. |
| H2: CapturePanel warning display | ae9cc9d0 | None. Informational UI. Correctly describes action economy rule. |
| H3: z-index SCSS variable | 0200b213 | None. Styling only. |
| M1: formatModifier shared utility | f411fa76 | None. Display formatting extracted. No calculation logic moved. |
| M2: evolutionStage/maxEvolutionStage | 06e7cd95 | **Positive.** Resolves rules-review-268 Observation 1. Local preview now reflects correct evolution modifier. |
| M3: encounterRound in context | 1b71b439 | **Positive.** Timer Ball and Quick Ball previews now use actual encounter round instead of implicit default. |
| M4: BallSelector click-outside | 7728f183 | None. UI interaction only. |

## Summary

The 8-commit fix cycle addresses code quality issues from code-review-295 without introducing any PTU rule regressions. Two fixes (M2 and M3) actively improve rules accuracy by wiring evolution stage data and encounter round to the local capture rate preview. All core capture mechanics -- the 1d100 system, capture rate formula, ball modifier pipeline, accuracy check, post-capture effects, and status/condition handling -- remain unchanged and correct per PTU 1.05.

## Verdict

**APPROVED.** All 8 fix cycle commits are rules-clean. No CRITICAL, HIGH, or MEDIUM issues found. The fix cycle resolves the non-blocking observation from rules-review-268 (evolution stage in local preview). All four capture-domain decrees (013, 014, 015, 042) remain fully respected.

## Required Changes

None.
