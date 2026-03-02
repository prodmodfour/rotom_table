---
review_id: rules-review-253
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - bbed0484
  - 8462d95b
  - fb66ea9e
  - c591a9a0
  - 9c14d469
  - 6abb95c4
  - 69effd65
  - 4c98f105
  - 87c39ee1
  - 63124ad4
  - 58f54a8b
  - 1aa1443e
files_reviewed:
  - app/constants/pokeBalls.ts
  - app/utils/pokeBallConditions.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/tests/unit/utils/pokeBallConditions.test.ts
  - app/tests/unit/api/captureAttempt.test.ts
  - .claude/skills/references/app-surface.md
mechanics_verified:
  - timer-ball-round-progression
  - quick-ball-degradation
  - level-ball-threshold
  - heavy-ball-weight-class-scaling
  - fast-ball-movement-threshold
  - love-ball-evo-line-gender
  - net-ball-type-check
  - dusk-ball-lighting
  - moon-ball-stone-evolution
  - lure-ball-bait-check
  - repeat-ball-species-ownership
  - nest-ball-level-threshold
  - dive-ball-environment
  - ball-modifier-capture-roll-integration
  - condition-context-auto-population
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/09-gear-and-items.md#Page 272 (Poke Ball Chart)
  - core/09-gear-and-items.md#Page 273 (Quick Ball, Dusk Ball, Cherish Ball, Park Ball)
  - core/05-pokemon.md#Page 214 (Capture Roll formula)
  - core/05-pokemon.md#Page 271 (Throwing Poke Balls)
reviewed_at: 2026-03-02T16:45:00Z
follows_up: rules-review-245
---

## Review Scope

PTU 1.05 rules verification for P1 of feature-017 (Poke Ball Type System). This review verifies all 13 conditional ball evaluators against PTU Chapter 9 (p.271-273), the integration of conditional modifiers into the capture roll formula (Chapter 5, p.214), condition context auto-population from DB data, and decree compliance for decrees 013, 014, and 015.

Follows up rules-review-245 (P0 APPROVED), which verified all 25 ball base modifiers, costs, descriptions, and post-capture effects.

## PTU Source Material

Primary source: PTU 1.05, Chapter 9: Gear and Items, p.271-273 (Poke Ball Chart).
Secondary source: PTU 1.05, Chapter 5: Pokemon, p.214 (Capture mechanics and Capture Roll).
Errata: `errata-2.md` (capture mechanic changes are labeled "playtest" -- per decree-013, the core 1d100 system is authoritative).

## Mechanics Verified

### Timer Ball (Round-Dependent)

- **Rule:** "Timer Ball: +5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** Base modifier +5 in catalog. `evaluateTimerBall()` computes `roundsElapsed = round - 1`, then `conditional = -(5 * roundsElapsed)` capped at -25 (so total = base(+5) + conditional caps at -20). Round 1: total +5. Round 2: total 0. Round 6+: total -20.
- **Verification:** Round-by-round: R1=+5, R2=0, R3=-5, R4=-10, R5=-15, R6=-20. PTU says modifier starts at +5 and decreases -5 per round until -20. Six values (+5, 0, -5, -10, -15, -20) matches exactly.
- **Status:** CORRECT

### Quick Ball (Round-Dependent)

- **Rule:** "Quick Ball: -20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3." (`core/09-gear-and-items.md#Page 273`)
- **Implementation:** Base modifier -20 in catalog. `evaluateQuickBall()` adds conditional: round 1 = 0, round 2 = +5, round 3 = +10, round 4+ = +20. Total: R1=-20, R2=-15, R3=-10, R4+=0.
- **Verification:** PTU "+5 after 1 round" = round 2 total -15. "+10 after round 2" = round 3 total -10. "+20 after round 3" = round 4+ total 0. All match.
- **Status:** CORRECT

### Level Ball (Stat-Comparison)

- **Rule:** "-20 Modifier if the target is under half the level your active Pokemon is." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateLevelBall()` computes `threshold = activeLevel / 2`, returns -20 if `targetLevel < threshold`. Returns 0 when either level is undefined.
- **Verification:** PTU says "under half" = strict less-than. Code uses `<` not `<=`. Example: active level 10, threshold 5 -- target at level 4 gets -20, target at level 5 does not. Correct interpretation of "under."
- **Status:** CORRECT

### Heavy Ball (Stat-Comparison)

- **Rule:** "-5 Modifier for each Weight Class the target is above 1." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateHeavyBall()` computes `classesAboveOne = Math.max(0, wc - 1)`, returns `-(5 * classesAboveOne)`. WC1=0, WC2=-5, WC3=-10, WC4=-15, WC5=-20, WC6=-25.
- **Verification:** PTU Weight Classes range 1-6. "-5 per WC above 1" = (wc-1)*(-5). WC6 = -25. No cap specified in PTU, and WC6 is the maximum per PTU species data. Scaling is correct.
- **Status:** CORRECT

### Fast Ball (Stat-Comparison)

- **Rule:** "-20 Modifier if the target has a Movement Capability above 7." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateFastBall()` checks `speed > 7`, returns -20 if true. Uses `targetMovementSpeed` which is populated as `Math.max(overland, swim, sky)` from SpeciesData.
- **Verification:** PTU says "Movement Capability above 7" = strictly above (not "at or above"). Code uses `>` not `>=`. Speed 7 does not trigger, speed 8+ triggers. The use of highest movement capability (max of overland/swim/sky) is reasonable since PTU says "a Movement Capability" (any one of them). Correct.
- **Status:** CORRECT

### Love Ball (Context-Dependent)

- **Rule:** "-30 Modifier if the user has an active Pokemon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokemon." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateLoveBall()` checks: (1) neither Pokemon is genderless ('N'), (2) opposite gender (`targetGender !== activeGender`), (3) same evo line (set intersection of evo line arrays, case-insensitive). Returns -30 if all three conditions met.
- **Verification:** All three conditions match PTU text exactly. Genderless exclusion is explicitly handled. The evo line comparison uses set overlap which correctly handles cases where an evolution chain member appears in both arrays (e.g., Pikachu -> Raichu; if target is Pikachu and active is Raichu, both contain "Pikachu" or "Raichu" in their lines).
- **Status:** CORRECT

### Net Ball (Context-Dependent)

- **Rule:** "-20 Modifier, if the target is Water or Bug type." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateNetBall()` normalizes types to lowercase, checks for 'water' or 'bug' in `targetTypes` array. Dual-typed Pokemon with either Water or Bug trigger the bonus.
- **Verification:** PTU says "Water or Bug type" -- inclusive OR. A Water/Flying Pokemon triggers it. A Bug/Poison Pokemon triggers it. A Fire/Steel Pokemon does not. Correct.
- **Status:** CORRECT

### Dusk Ball (Context-Dependent)

- **Rule:** "-20 Modifier if it is dark, or if there is very little light out, when used." (`core/09-gear-and-items.md#Page 273`)
- **Implementation:** `evaluateDuskBall()` checks `isDarkOrLowLight === true`, returns -20. GM-provided context flag.
- **Verification:** This is inherently a GM judgment call (what constitutes "dark" or "very little light"). The boolean flag approach is appropriate. Defaults to false (no bonus) when not provided. Correct.
- **Status:** CORRECT

### Moon Ball (Context-Dependent)

- **Rule:** "-20 Modifier if the target evolves with an Evolution Stone." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateMoonBall()` checks `targetEvolvesWithStone === true`, returns -20. Auto-populated in `attempt.post.ts` via `checkEvolvesWithStone()` which parses `evolutionTriggers` JSON for stone-related `requiredItem` fields.
- **Verification:** The `checkEvolvesWithStone()` function checks for keywords: 'stone', 'fire stone', 'water stone', 'thunder stone', 'leaf stone', 'moon stone', 'sun stone', 'shiny stone', 'dusk stone', 'dawn stone', 'ice stone', 'oval stone'. This covers all PTU Evolution Stones (PTU p.227-228). The Oval Stone is correctly included as it is an evolution-triggering stone. Correct.
- **Status:** CORRECT

### Lure Ball (Context-Dependent)

- **Rule:** "-20 Modifier if the target was baited into the encounter with food." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateLureBall()` checks `targetWasBaited === true`, returns -20. GM-provided context flag.
- **Verification:** Baiting is a narrative/GM decision (PTU p.274 describes Bait mechanics). Boolean flag is appropriate. Defaults to false when not provided. Correct.
- **Status:** CORRECT

### Repeat Ball (Context-Dependent)

- **Rule:** "-20 Modifier if you already own a Pokemon of the target's species." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateRepeatBall()` checks `trainerOwnsSpecies === true`, returns -20. Auto-populated in `attempt.post.ts` by counting trainer's Pokemon of the target species via Prisma query.
- **Verification:** PTU says "you already own" -- the DB count query (`prisma.pokemon.count({ where: { ownerId: trainer.id, species: pokemon.species } })`) checks current ownership. If count > 0, condition is met. Correct.
- **Status:** CORRECT

### Nest Ball (Context-Dependent)

- **Rule:** "-20 Modifier if the target is under level 10." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateNestBall()` checks `level < 10`, returns -20. Strict less-than.
- **Verification:** PTU says "under level 10" = strictly below 10. Level 9 triggers, level 10 does not. Code uses `<` not `<=`. Correct.
- **Status:** CORRECT

### Dive Ball (Context-Dependent)

- **Rule:** "-20 Modifier, if the target was found underwater or underground." (`core/09-gear-and-items.md#Page 272`)
- **Implementation:** `evaluateDiveBall()` checks `isUnderwaterOrUnderground === true`, returns -20. GM-provided context flag.
- **Verification:** Environment classification is a GM decision. Boolean flag is appropriate. Defaults to false when not provided. Correct.
- **Status:** CORRECT

### Ball Modifier Integration into Capture Roll

- **Rule:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features." (`core/05-pokemon.md#Page 214`) + "The Type of Ball will also modify the Capture Roll." (`core/09-gear-and-items.md#Page 271`)
- **Implementation:** `attemptCapture()` in `captureRate.ts` line 209: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. `calculateBallModifier()` returns `total = base + conditional`. This total is passed as `ballModifier` parameter.
- **Verification:** Ball modifiers are negative for better balls (e.g., Great Ball -10, conditional -20 for Net Ball on Bug type). Adding a negative ballModifier to the roll reduces the modified roll, making it more likely to be <= captureRate. This correctly implements the PTU "modify the Capture Roll" language. The ball modifier is applied additively to the roll, separate from the capture rate calculation. Correct per rules-review-245 ruling.
- **Status:** CORRECT

### Condition Context Auto-Population

- **Rule:** Ball conditions reference Pokemon stats, encounter state, and trainer state that are available in the database.
- **Implementation:** `attempt.post.ts` `buildConditionContext()` auto-populates 14 context fields from DB data: `encounterRound` (from encounter record), `targetLevel`, `targetTypes` (from speciesData.type1/type2), `targetGender`, `targetSpecies`, `targetWeightClass`, `targetMovementSpeed` (max of overland/swim/sky), `targetEvolvesWithStone` (parsed from evolutionTriggers), `targetEvoLine` (derived from species + evolution triggers), `activePokemonLevel` (from trainer's first non-fainted Pokemon in encounter), `activePokemonGender`, `activePokemonEvoLine`, `trainerOwnsSpecies` (from DB count). GM overrides merge on top.
- **Verification:** All auto-populated fields use correct data sources from the Prisma schema. The `targetMovementSpeed = Math.max(overland, swim, sky)` correctly uses the highest movement capability per the Fast Ball's "a Movement Capability" wording. The `targetEvolvesWithStone` check parses `evolutionTriggers` JSON for stone keywords. The `trainerOwnsSpecies` DB query correctly counts owned Pokemon of the target species.
- **Status:** CORRECT

## Issues

### MEDIUM

**M1. Rate preview endpoint (`rate.post.ts`) has incomplete condition context auto-population compared to attempt endpoint.**

The `rate.post.ts` endpoint auto-populates only 5 context fields (`targetLevel`, `targetTypes`, `targetWeightClass`, `targetMovementSpeed`, `targetSpecies`), while `attempt.post.ts` auto-populates 14 fields. Fields like `targetGender` and `targetEvolvesWithStone` could be auto-populated from the same `speciesDataRecord` that `rate.post.ts` already fetches. This means the rate preview will return `conditionMet: false` for Moon Ball, Love Ball, and other balls whose conditions depend on data that IS available in the DB but not included in the auto-context.

**Impact:** Functional, not rules-correctness. The rate preview underreports conditional modifiers for some balls. The actual capture attempt (`attempt.post.ts`) correctly evaluates all conditions. The GM can always pass explicit `conditionContext` in the rate request. This does not produce incorrect capture results -- it only affects the preview display.

**Recommendation:** In a future pass, align `rate.post.ts` auto-population with `attempt.post.ts` for fields derivable without encounter context: `targetGender` (from Pokemon record), `targetEvolvesWithStone` (from speciesData), `targetEvoLine` (from speciesData). Fields requiring encounter state (`encounterRound`, `activePokemonLevel`, etc.) cannot be auto-populated in the rate endpoint since it has no encounter context, and that is correct.

## Ball-by-Ball Conditional Verification Summary

| # | Ball Name | PTU Condition | Code Condition | Modifier | Match |
|---|-----------|---------------|----------------|----------|-------|
| 06 | Level Ball | Target under half active Pokemon's level | `targetLevel < activeLevel / 2` | -20 | YES |
| 07 | Lure Ball | Target was baited with food | `targetWasBaited === true` | -20 | YES |
| 08 | Moon Ball | Target evolves with Evolution Stone | `targetEvolvesWithStone === true` | -20 | YES |
| 10 | Love Ball | Same evo line + opposite gender, no genderless | Gender + evo line overlap check | -30 | YES |
| 11 | Heavy Ball | -5 per Weight Class above 1 | `-(5 * Math.max(0, wc - 1))` | -5 to -25 | YES |
| 12 | Fast Ball | Movement Capability above 7 | `speed > 7` | -20 | YES |
| 15 | Repeat Ball | Trainer already owns target species | `trainerOwnsSpecies === true` | -20 | YES |
| 16 | Timer Ball | +5 base, -5 per round until -20 | `base(5) + -(5 * elapsed)` capped at -20 | +5 to -20 | YES |
| 17 | Nest Ball | Target under level 10 | `level < 10` | -20 | YES |
| 18 | Net Ball | Target is Water or Bug type | Type array includes 'water'/'bug' | -20 | YES |
| 19 | Dive Ball | Found underwater or underground | `isUnderwaterOrUnderground === true` | -20 | YES |
| 22 | Quick Ball | -20 base, degrades +5/+10/+20 over rounds | Stepwise conditional per round | -20 to 0 | YES |
| 23 | Dusk Ball | Dark or very little light | `isDarkOrLowLight === true` | -20 | YES |

**Result: 13/13 conditional ball evaluators match PTU 1.05 exactly.**

## Decree Compliance

- **decree-013 (1d100 system):** All conditional ball modifiers integrate with the core 1d100 capture system. The `evaluateBallCondition()` returns a modifier that feeds into `calculateBallModifier()`, which is applied to the 1d100 roll via `attemptCapture()`. No d20 playtest elements introduced. **Fully compliant.**

- **decree-014 (Stuck/Slow separate):** Conditional ball modifiers are applied to the roll side of the equation, not the capture rate side. The `calculateCaptureRate()` function was not modified -- Stuck (+10) and Slow (+5) remain independently tracked in the capture rate calculation. Ball modifiers and Stuck/Slow bonuses operate on different sides of the comparison (roll vs rate) and do not interact. **Fully compliant.**

- **decree-015 (real max HP):** Conditional ball modifiers do not interact with HP percentage calculations. The `calculateCaptureRate()` function continues to use real max HP per its existing implementation. No conditional ball evaluator references HP data. **Fully compliant.**

## Test Coverage Assessment

The test suite (`pokeBallConditions.test.ts`, 673 lines) covers:

1. **All 13 conditional evaluators** with condition-met, condition-not-met, and missing-data cases.
2. **Boundary values**: Level Ball at exact half threshold, Nest Ball at level 9/10 boundary, Fast Ball at speed 7/8 boundary, Heavy Ball at all WC values (1-6), Timer Ball across rounds 1-20, Quick Ball across rounds 1-100.
3. **Edge cases**: Love Ball with genderless Pokemon, empty evo lines, case-insensitive matching; Timer Ball cap at high rounds.
4. **Integration tests**: `calculateBallModifier` end-to-end for Timer Ball, Quick Ball, Net Ball, Heavy Ball, Basic Ball, Great Ball, Love Ball, Nest Ball, Dusk Ball. Verifies base + conditional = total.
5. **captureAttempt.test.ts**: Verifies ball modifier integration in the API layer -- `calculateBallModifier` called with correct arguments, ball modifier total passed to `attemptCapture()`, unknown ball type rejection, default to Basic Ball.

Test coverage is comprehensive for the PTU mechanics. No untested evaluators or boundary conditions identified.

## What Looks Good

1. **All 13 conditional evaluators exactly match PTU 1.05 Chapter 9 text.** No transcription errors or misinterpretations. Each evaluator's condition, modifier value, and boundary behavior were verified against the rulebook quotes.

2. **Pure function architecture is well-suited for game logic.** Each evaluator is a standalone pure function with no side effects. The registry pattern (`BALL_CONDITION_EVALUATORS`) allows adding new balls without modifying `calculateBallModifier()`. This follows the Open/Closed Principle.

3. **Graceful degradation for missing context.** Every evaluator handles undefined/missing data by returning `modifier: 0, conditionMet: false`. This ensures that balls without sufficient context never produce incorrect modifiers -- they simply report no bonus. This is the safe default per PTU rules (if you can't verify the condition, don't apply the bonus).

4. **Server-side auto-population is thorough.** The `buildConditionContext()` function in `attempt.post.ts` auto-populates 14 context fields from DB data, minimizing the need for manual GM input. The `trainerOwnsSpecies` check via DB count is especially well-implemented -- it answers the Repeat Ball question definitively from the data.

5. **GM override mechanism is correct.** The `...gmOverrides` spread operator after auto-context allows the GM to override any auto-populated value, which is necessary for edge cases the auto-population cannot handle (e.g., lighting conditions, bait status).

6. **Timer Ball and Quick Ball round tracking is correctly wired.** The encounter's `currentRound` field feeds into `encounterRound`, and the evaluators interpret "round 1" as the first round (no rounds elapsed) vs "after round 1" (one round elapsed). This matches the PTU round-counting semantics.

7. **The `-0` fix (commit fb66ea9e) is appropriate.** Prevents Timer Ball round 1 and Heavy Ball WC 1 from returning `-0` instead of `0`, which is a JavaScript quirk that could cause display issues.

## Verdict

**APPROVED.** All 13 conditional ball evaluators correctly implement PTU 1.05 Chapter 9 (p.271-273) ball conditions. The Timer Ball round progression, Quick Ball degradation curve, Level Ball threshold comparison, Heavy Ball weight class scaling, Fast Ball movement threshold, Love Ball evo line + gender check, Net Ball type check, Dusk Ball lighting check, Moon Ball stone evolution check, Lure Ball bait check, Repeat Ball species ownership check, Nest Ball level threshold, and Dive Ball environment check all match the rulebook exactly.

The ball modifier integration into the 1d100 capture roll formula is correct per decree-013. No interactions with Stuck/Slow bonuses (decree-014) or HP percentage calculations (decree-015).

The M1 issue (rate preview endpoint incomplete auto-population) is functional, not rules-correctness, and does not affect actual capture outcomes.

## Required Changes

None required. M1 is a recommendation for future improvement.
