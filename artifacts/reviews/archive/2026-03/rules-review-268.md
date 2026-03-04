---
review_id: rules-review-268
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - ddbb1879
  - b4e7df79
  - 77e4d5b7
  - 5515e0d6
  - 026663f5
  - 944bd999
  - 28bfcf12
mechanics_verified:
  - heal-ball-post-capture-effect
  - friend-ball-post-capture-effect
  - luxury-ball-post-capture-effect
  - ball-modifier-in-capture-roll
  - ball-modifier-sign-convention
  - ball-catalog-completeness
  - ball-selector-modifier-display
  - conditional-ball-preview-in-ui
  - gm-context-toggles
  - capture-rate-display-ball-breakdown
  - capture-panel-workflow-accuracy
  - websocket-broadcast-ball-info
  - post-capture-effect-response-format
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Page 271 (Throwing Poke Balls, Capture Roll)
  - core/09-gear-and-items.md#Page 272 (Poke Ball Chart, Apricorn balls)
  - core/09-gear-and-items.md#Page 273 (Heal Ball, Quick Ball, Dusk Ball, Cherish Ball, Park Ball)
  - core/05-pokemon.md#Page 214 (Capture Rate formula, 1d100 roll)
reviewed_at: 2026-03-03T06:30:00Z
follows_up: rules-review-262
---

## Review Scope

First review of feature-017 P2 (Poke Ball Type System). P2 covers three sections:

- **Section I: Ball Type Selection UI** -- BallSelector.vue, BallConditionPreview.vue, CaptureContextToggles.vue, CaptureRateDisplay.vue ball breakdown, CapturePanel.vue capture workflow.
- **Section J: Post-Capture Effects** -- Heal Ball heal-to-max, Friend Ball +1 Loyalty, Luxury Ball raised happiness in attempt.post.ts.
- **Section K: Capture Result Display** -- CapturePanel integrated into CombatantCard.vue with trainer selector, capture_attempt WebSocket broadcast with ball info.

P0 and P1 were APPROVED (code-review-286 + rules-review-262). All 13 conditional ball evaluators in `pokeBallConditions.ts` were verified correct in rules-review-253 and confirmed unchanged in rules-review-262. This review focuses on the P2-specific additions: UI correctness, post-capture effects, and integration.

Decrees checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy on throws). No violations found.

## Mechanics Verified

### Heal Ball Post-Capture Effect

- **Rule:** "A caught Pokemon will heal to Max HP immediately upon capture." (`core/09-gear-and-items.md#Page 273`)
- **Implementation:** `attempt.post.ts` lines 179-189: When `ballDef?.postCaptureEffect === 'heal_full'` and capture succeeds, updates the Pokemon's `currentHp` to `pokemon.maxHp`. The `pokemon.maxHp` value comes from the Prisma record's real max HP field, not an injury-reduced effective HP. Per decree-015, all HP percentage calculations use real max HP, and "heal to Max HP" correctly restores to the real maximum.
- **Design decision alignment:** The spec (Section J) explicitly states: "Heal Ball heals to real max HP, not injury-reduced effective max HP" and cites decree-015. The implementation matches.
- **Edge case: injuries persist.** The implementation does NOT clear injuries on Heal Ball capture. PTU says "heal to Max HP" -- it does not mention clearing injuries. This is correct: the Pokemon has full HP but retains its injuries. The effective max HP cap from injuries still applies going forward in combat, but the initial capture heal brings the Pokemon to real max.
- **Status:** CORRECT

### Friend Ball Post-Capture Effect

- **Rule:** "A caught Pokemon will start with +1 Loyalty." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `attempt.post.ts` lines 190-195: Sets `postCaptureEffect` to `{ type: 'loyalty_plus_one', description: '...' }`. No mechanical DB change because loyalty is not tracked. The effect is stored in the response and displayed in the UI.
- **Design decision alignment:** The spec (Section J) states: "No mechanical effect until loyalty tracking is implemented." This is an acceptable limitation -- the effect is recorded for display, and the mechanical implementation is deferred to when the loyalty system exists.
- **Status:** CORRECT (informational only, mechanical implementation deferred)

### Luxury Ball Post-Capture Effect

- **Rule:** "A caught Pokemon is easily pleased and starts with a raised happiness." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `attempt.post.ts` lines 196-202: Sets `postCaptureEffect` to `{ type: 'raised_happiness', description: '...' }`. No mechanical DB change because happiness is not tracked.
- **Status:** CORRECT (informational only, mechanical implementation deferred)

### Ball Modifier in Capture Roll

- **Rule:** "rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll." (`core/09-gear-and-items.md#Page 271`) and "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (`core/05-pokemon.md#Page 214`)
- **Implementation:** `captureRate.ts` `attemptCapture()` line 209: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. The ball modifier is additive on the roll. Since negative modifiers (e.g., Great Ball -10) lower the roll, making it more likely to be <= capture rate, this correctly implements easier capture.
- **Verification against PTU example (p.2116-2119):** "Sylvana rolls a 68 on her capture roll and subtracts her Trainer Level, 4, for a total of 64. ... You're using a basic Poke Ball so you don't add or subtract anything." A basic ball with +0 modifier: `modifiedRoll = 68 - 4 + 0 + 0 = 64`. Matches the example exactly.
- **Status:** CORRECT (unchanged from P0, verified again for P2 integration context)

### Ball Modifier Sign Convention

- **Rule:** The Poke Ball Chart (`core/09-gear-and-items.md#Page 272-273`) lists modifiers as: Great Ball: -10, Ultra Ball: -15, Master Ball: -100, Timer Ball: +5, Quick Ball: -20, Heal Ball: -5, Friend Ball: -5, Luxury Ball: -5, Cherish Ball: -5, Park Ball: -15. All other balls: +0.
- **Implementation:** `pokeBalls.ts` POKE_BALL_CATALOG matches every value from the book:
  - Basic Ball: 0 (book: +0)
  - Great Ball: -10 (book: -10)
  - Ultra Ball: -15 (book: -15)
  - Master Ball: -100 (book: -100)
  - Timer Ball: +5 (book: +5)
  - Quick Ball: -20 (book: -20)
  - Heal Ball: -5 (book: -5)
  - Friend Ball: -5 (book: -5)
  - Luxury Ball: -5 (book: -5)
  - Cherish Ball: -5 (book: -5)
  - Park Ball: -15 (book: -15)
  - All conditional balls (Level, Lure, Moon, Love, Heavy, Fast, Net, Nest, Repeat, Dive, Dusk): 0 (book: +0)
  - Safari Ball, Sport Ball, Premier Ball: 0 (book: +0)
- **Status:** CORRECT. All 25 ball modifiers match PTU 1.05 exactly.

### Ball Catalog Completeness

- **Rule:** PTU Chapter 9, p.272-273 lists 25 ball types (IDs 01-25).
- **Implementation:** `pokeBalls.ts` contains exactly 25 entries with IDs 1-25. All ball names match the PTU book spelling. Costs match: Basic $250, Great $400, Ultra $800, Master $300,000 (book: "Worth at least $300,000"), all special balls $800, safari/promo balls $0.
- **Status:** CORRECT

### Post-Capture Effect Type Definitions

- **Rule:** Three balls have post-capture effects per PTU:
  - Heal Ball: heal to max HP (p.273)
  - Friend Ball: +1 Loyalty (p.272)
  - Luxury Ball: raised happiness (p.272)
- **Implementation:** `pokeBalls.ts` `PokeBallDef.postCaptureEffect` is typed as `'heal_full' | 'loyalty_plus_one' | 'raised_happiness'`. Exactly these three ball entries have the property set:
  - Friend Ball (id 9): `postCaptureEffect: 'loyalty_plus_one'`
  - Luxury Ball (id 20): `postCaptureEffect: 'raised_happiness'`
  - Heal Ball (id 21): `postCaptureEffect: 'heal_full'`
- **Exhaustiveness check:** No other ball in the PTU chart has a post-capture mechanical effect. Safari Ball, Sport Ball, Park Ball have no special effects beyond their modifier. Premier Ball and Cherish Ball are decorative. All conditional balls only modify the capture roll.
- **Status:** CORRECT

### Ball Selector Modifier Display

- **Rule:** Each ball's modifier from the Poke Ball Chart should be visible to the GM for informed selection.
- **Implementation:** `BallSelector.vue` displays `ball.modifier` (the base modifier from the catalog) for each ball in the dropdown. The selected ball's total modifier (base + conditional) is shown in the toggle button via `calculateBallModifier()`. The sign convention in `modifierClass()` correctly treats negative modifiers as "positive" (green -- easier capture) and positive as "negative" (red -- harder capture).
- **Status:** CORRECT

### Conditional Ball Preview in UI

- **Rule:** Conditional balls have bonuses that depend on game state. The GM needs to see whether conditions are met.
- **Implementation:** `BallConditionPreview.vue` evaluates the ball's condition via `evaluateBallCondition(ball.name, conditionContext)` and shows a green checkmark with the modifier value when met, or a gray "if..." when unmet. The tooltip (`ball.conditionDescription`) shows the full condition text.
- **Verification:** The condition descriptions in the catalog match PTU exactly:
  - Level Ball: "-20 if target is under half the level of your active Pokemon" (PTU: "-20 Modifier if the target is under half the level your active Pokemon is")
  - Moon Ball: "-20 if the target evolves with an Evolution Stone" (PTU: "-20 Modifier if the target evolves with an Evolution Stone")
  - All 13 conditional descriptions accurately paraphrase the PTU text.
- **Status:** CORRECT

### GM Context Toggles

- **Rule:** Three balls depend on GM-provided environmental context: Lure Ball (target baited), Dusk Ball (dark/low-light), Dive Ball (underwater/underground). These cannot be auto-detected from game state.
- **Implementation:** `CaptureContextToggles.vue` provides three checkboxes mapping to `targetWasBaited`, `isDarkOrLowLight`, and `isUnderwaterOrUnderground` in the `BallConditionContext`. Each toggle label correctly identifies the associated ball. The component uses `v-model` pattern to update the parent's condition context reactively.
- **Exhaustiveness check:** Are there other GM-knowledge conditions? The Moon Ball's "evolves with Evolution Stone" is auto-detected from species data. The Repeat Ball's "already own same species" is auto-detected from DB. The Level Ball, Heavy Ball, Fast Ball, Net Ball, Nest Ball, Timer Ball, Quick Ball, and Love Ball all auto-resolve from game data. Only Lure/Dusk/Dive require GM input. The three toggles are correct and complete.
- **Status:** CORRECT

### Capture Rate Display Ball Breakdown

- **Rule:** The ball modifier is separate from the capture rate and modifies the roll, not the rate. The display should show the ball modifier breakdown alongside the capture rate.
- **Implementation:** `CaptureRateDisplay.vue` shows a ball modifier section when `ballType !== 'Basic Ball'`, with base modifier, conditional modifier (with met/unmet status), and total ball modifier. The `ballModClass()` function correctly colors negative modifiers green (easier) and positive red (harder).
- **Distinction between capture rate and ball modifier:** The capture rate (100 - level*2 + HP mod + evolution mod + status + injuries + etc.) is separate from the ball modifier (applied to the roll). The display correctly shows these as separate sections with a separator, matching PTU's two-step process: (1) calculate capture rate, (2) modify the roll with ball + trainer level.
- **Status:** CORRECT

### Capture Panel Workflow Accuracy

- **Rule:** Per PTU p.271: "Throwing Poke Balls is an AC6 Status Attack... If it hits, and the Pokemon is able to be Captured, you then make a Capture Roll by rolling 1d100 and subtracting the Trainer's Level."
- **Implementation:** `CapturePanel.vue` `rollAndThrow()` follows the correct two-step process:
  1. Roll accuracy via `rollAccuracyCheck()` (d20 vs AC 6, nat 1 auto-miss, nat 20 auto-hit per decree-042)
  2. If hit, call `attemptCapture()` which rolls 1d100 server-side with ball modifier
- **Natural 20 handling:** Per decree-042 and the code, nat 20 is passed as `accuracyRoll: 20` to the server, where `criticalHit = body.accuracyRoll === 20` adds +10 to the effective capture rate. PTU p.214: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll" -- this is equivalent to adding +10 to the capture rate. The implementation is correct.
- **Status:** CORRECT

### WebSocket Broadcast Ball Info

- **Rule:** N/A (no PTU rule governs WebSocket broadcast content; this is implementation detail).
- **Implementation:** `attempt.post.ts` lines 243-258 broadcast includes `ballType`, `ballModifier`, and `postCaptureEffect`. This enables the Group View and Player View to display ball-specific capture results. The broadcast fires for both successful and failed captures.
- **Status:** CORRECT (no rules implications)

### Post-Capture Effect Response Format

- **Rule:** PTU defines the effects textually. The response must convey sufficient information for the GM to apply any non-mechanical effects manually.
- **Implementation:** `attempt.post.ts` lines 260-306 return `postCaptureEffect: { type: string, description: string }` when a post-capture effect occurs. The description is human-readable and includes the Pokemon's species name and the specific effect. `CapturePanel.vue` renders this with a sparkle icon and the description text.
- **Status:** CORRECT

## Decree Compliance

- **decree-013 (1d100 system):** The P2 commits do not modify the capture roll formula. The 1d100 roll in `captureRate.ts` `attemptCapture()` remains unchanged. Ball modifiers are correctly applied additively to the roll. **Fully compliant.**

- **decree-014 (Stuck/Slow separate):** The P2 commits do not modify `calculateCaptureRate()` or status condition handling. Ball modifiers are a separate system that does not interact with Stuck/Slow bonuses. **Fully compliant.**

- **decree-015 (real max HP):** The Heal Ball effect at `attempt.post.ts` line 184 uses `pokemon.maxHp` from the Prisma record, which stores the real max HP. The Heal Ball heals to real max HP, not injury-reduced effective HP. This is explicitly correct per decree-015 and the PTU text "heal to Max HP." **Fully compliant.**

- **decree-042 (full accuracy on throws):** The accuracy check in `useCapture.ts` `rollAccuracyCheck()` remains unchanged -- it rolls a flat d20 vs AC 6 with nat 1/nat 20 handling. The TODO comment at line 263 correctly notes that ptu-rule-131 (tracked ticket) will implement full accuracy modifiers. The P2 commits do not modify accuracy handling. **Fully compliant** (deferred ptu-rule-131 acknowledged in code comments).

## Observations (Non-Blocking)

### Observation 1: CapturePanel local preview missing evolutionStage and isLegendary

CombatantCard.vue's `capturePokemonData` (line 440-450) does not pass `evolutionStage`, `maxEvolutionStage`, or `isLegendary` to CapturePanel. The `calculateCaptureRateLocal` function defaults to `evolutionStage: 1, maxEvolutionStage: 3` (always +10 evolution modifier) and `isLegendary: false`. This means the local capture rate preview could be inaccurate for fully evolved Pokemon (should be -10, shows +10) or legendary Pokemon (should be -30, shows 0).

This is a pre-existing issue from prior tiers -- the server-side capture attempt correctly looks up species data and applies accurate evolution/legendary modifiers. The preview is cosmetic and does not affect the actual capture calculation. Not a P2 regression.

### Observation 2: CapturePanel trainerCombatantId mismatch

CombatantCard.vue's `availableTrainers` uses `c.entityId!` (the HumanCharacter entity ID), but CapturePanel passes this as `trainerCombatantId` to the action consumption endpoint, which expects a combatant ID. This is a code quality issue (for the code reviewer), not a PTU rules issue -- the capture roll itself is unaffected.

## What Looks Good

1. **Heal Ball implementation is decree-compliant.** Uses real max HP per decree-015. Does not clear injuries, correctly interpreting "heal to Max HP" as restoring HP only, not removing injuries. This is a subtle distinction the implementation gets right.

2. **All 25 ball modifiers match PTU exactly.** Cross-verified every modifier value against the Poke Ball Chart at p.272-273. No discrepancies.

3. **Three post-capture effects correctly identified and scoped.** Only Heal Ball, Friend Ball, and Luxury Ball have post-capture effects in PTU. No other balls are incorrectly given effects. The Heal Ball is the only one with a mechanical DB effect; Friend Ball and Luxury Ball correctly defer to future systems.

4. **GM context toggles are complete and correctly scoped.** Exactly the three GM-knowledge-dependent conditions (baited, dark, underwater) have toggles. All other conditions auto-resolve from game data.

5. **Conditional ball previews are reactive.** Changing the ball selection or toggling context flags updates the modifier display in real-time via computed properties, giving the GM immediate feedback.

6. **Sign convention is consistent throughout.** Negative modifier = easier capture (green). Positive modifier = harder capture (red). This convention is maintained in BallSelector, BallConditionPreview, CaptureRateDisplay, and CapturePanel.

7. **WebSocket broadcast includes all necessary ball data.** The Group View receives ball type, modifier, and post-capture effect, enabling display without additional API calls.

## Verdict

**APPROVED.** All P2 mechanics are correctly implemented per PTU 1.05:

- The Heal Ball heals to real max HP per decree-015 and PTU p.273.
- The Friend Ball and Luxury Ball correctly store informational effects with deferred mechanical implementation.
- All 25 ball modifiers match the Poke Ball Chart exactly.
- The three GM context toggles cover all non-auto-detectable conditions completely.
- The capture workflow follows the correct two-step process (accuracy check then capture roll) with ball modifiers applied additively to the roll.
- All four relevant decrees are fully respected.

No CRITICAL, HIGH, or MEDIUM issues found. Two non-blocking observations noted for the code reviewer.

## Required Changes

None.
