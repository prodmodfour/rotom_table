---
review_id: rules-review-262
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-017
domain: capture
commits_reviewed:
  - 87c6b6df
  - a41b4d5a
  - 5e5f6de7
  - 183965e9
mechanics_verified:
  - conditional-ball-modifier-local-preview
  - conditional-ball-modifier-rate-preview
  - condition-context-shared-service
  - condition-context-auto-population-full
  - test-coverage-buildConditionContext
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Page 272 (Poke Ball Chart)
  - core/09-gear-and-items.md#Page 273 (Quick Ball, Dusk Ball)
  - core/05-pokemon.md#Page 214 (Capture Roll formula)
reviewed_at: 2026-03-02T19:30:00Z
follows_up: rules-review-253
---

## Review Scope

Re-review of feature-017 P1 fix cycle. The prior code review (code-review-277) found 5 issues (2 HIGH, 3 MEDIUM). Four fix commits were applied. This rules review verifies that all 5 issues are resolved and that the fixes do not introduce any PTU rules violations.

Prior rules review (rules-review-253) APPROVED all 13 conditional ball evaluators as matching PTU 1.05 Chapter 9 exactly. This re-review focuses exclusively on the integration paths (how context reaches those evaluators) rather than re-verifying the evaluator logic itself.

Decrees checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy on throws). No violations found. The fix commits do not modify capture rate calculation, status bonus handling, HP percentage logic, or accuracy checking.

## Fix Issue Resolution

### H1: `calculateCaptureRateLocal` missing `conditionContext` (commit `5e5f6de7`)

- **Rule:** Ball conditional modifiers must be evaluated with full context when available. "The Type of Ball will also modify the Capture Roll." (`core/09-gear-and-items.md#Page 271`)
- **Implementation:** `useCapture.ts` line 114-126: `calculateCaptureRateLocal` now accepts `conditionContext?: Partial<BallConditionContext>` in its params interface. Line 140: `calculateBallModifier(ballType, params.conditionContext)` passes the context through.
- **Verification:** Before this fix, `calculateBallModifier(ballType)` was called without context, meaning every conditional ball returned `modifier: 0` in local previews (CombatantCard). Now, if a caller provides `conditionContext`, all 13 conditional evaluators receive their required data. Timer Ball on round 5 with `{ encounterRound: 5 }` now correctly shows conditional -20 (total -15) instead of +5.
- **Status:** RESOLVED. The local preview path now produces correct conditional modifiers.

### H2: `rate.post.ts` incomplete context auto-population (commit `a41b4d5a`)

- **Rule:** The rate preview must show the same conditional modifiers that the actual capture attempt would apply. All 13 conditional balls depend on context fields that exist in the database.
- **Implementation:** `rate.post.ts` lines 131-163: When `trainerId` is provided, calls `buildConditionContext()` from the shared service, which auto-populates all 14 context fields (encounterRound, targetLevel, targetTypes, targetGender, targetSpecies, targetWeightClass, targetMovementSpeed, targetEvolvesWithStone, targetEvoLine, activePokemonLevel, activePokemonGender, activePokemonEvoLine, trainerOwnsSpecies, plus GM override merging). When `trainerId` is absent, falls back to the previous 5-field partial context for backward compatibility.
- **Verification:** The request interface at lines 22-27 now accepts `encounterId` and `trainerId`. With both provided, the rate preview endpoint produces identical context to `attempt.post.ts`. The GM's ball selection preview now correctly evaluates:
  - **Level Ball**: resolves `activePokemonLevel` from encounter combatants
  - **Love Ball**: resolves gender and evo line for both target and active Pokemon
  - **Moon Ball**: resolves `targetEvolvesWithStone` from species data
  - **Repeat Ball**: resolves `trainerOwnsSpecies` from DB count
  - **Timer/Quick Ball**: resolves `encounterRound` from encounter record
  - **Dusk/Lure/Dive Ball**: correctly require GM override via `conditionContext`
- **Status:** RESOLVED. Rate preview now has full context parity with attempt endpoint.

### M1: Dead `condition` property on `PokeBallDef` (commit `87c6b6df`)

- **Rule:** N/A (code cleanliness, not rules issue).
- **Implementation:** `pokeBalls.ts` `PokeBallDef` interface no longer contains `condition?: (context: BallConditionContext) => number`. The `conditionDescription` field is retained for UI display (present on 13 ball entries). All 25 ball entries in `POKE_BALL_CATALOG` remain unchanged.
- **Verification:** Searched for `condition?.*BallConditionContext` in `pokeBalls.ts` -- no matches. The evaluator registry pattern in `pokeBallConditions.ts` remains the canonical location for condition logic, which is architecturally correct.
- **Status:** RESOLVED. Dead code removed without affecting any ball definitions.

### M2: `buildConditionContext` private to `attempt.post.ts` (commit `a41b4d5a`)

- **Rule:** N/A (code organization, resolved as part of H2).
- **Implementation:** `buildConditionContext`, `checkEvolvesWithStone`, and `deriveEvoLine` extracted to `server/services/ball-condition.service.ts` (185 lines). Both `attempt.post.ts` and `rate.post.ts` import from the shared service. All three functions are exported for direct testing.
- **Verification:** `attempt.post.ts` line 9 imports `buildConditionContext` from the shared service. The file dropped from ~382 lines to ~258 lines. No local definitions of these helpers remain. `rate.post.ts` line 6 imports the same function.
- **Status:** RESOLVED. Clean extraction with proper reuse.

### M3: Zero test coverage for `buildConditionContext` (commit `183965e9`)

- **Rule:** N/A (test coverage, not rules issue). However, tests verify that context fields fed to evaluators are correct, which indirectly validates rules correctness.
- **Implementation:** `tests/unit/services/ball-condition.service.test.ts` (681 lines, 55 tests) covering:
  - `checkEvolvesWithStone`: 19 tests covering all 11 stone types, case insensitivity, non-stone items (Metal Coat), level-up evolutions, trade evolutions, empty/invalid/malformed JSON, mixed triggers
  - `deriveEvoLine`: 9 tests covering single species, single evolution, multiple evolutions (Eevee), duplicate species name, invalid JSON, non-array JSON, missing toSpecies field
  - `buildConditionContext`: 27 tests covering target field population from species data, highest movement speed derivation, evo line derivation, stone evolution detection, null speciesData fallback, single-type species, genderless Pokemon default, encounter round lookup (from encounter, null currentRound, missing encounter, no encounterId), active Pokemon resolution (level/gender from combatants, fainted Pokemon filtering, enemy Pokemon filtering, no trainer Pokemon, genderless active Pokemon, trainer combatant skipping), species ownership check, GM override merging (priority, merge not replace, empty overrides)
- **Verification:** Tests mock Prisma and verify all 14 context fields are correctly populated. The fainted-Pokemon-filtering test (lines 423-464) ensures the Level Ball and Love Ball get the correct active Pokemon data even when the first combatant is fainted. The GM override test (lines 592-639) confirms overrides take priority without destroying auto-populated fields.
- **Status:** RESOLVED. Comprehensive coverage of all `buildConditionContext` code paths.

## Mechanics Verified

### Conditional Ball Modifier in Local Preview Path

- **Rule:** "The Type of Ball will also modify the Capture Roll." (`core/09-gear-and-items.md#Page 271`)
- **Implementation:** `useCapture.ts` `calculateCaptureRateLocal()` passes `conditionContext` to `calculateBallModifier()`, which calls `evaluateBallCondition()` from the evaluator registry. The full chain: `calculateCaptureRateLocal(params)` -> `calculateBallModifier(ballType, params.conditionContext)` -> `evaluateBallCondition(ballType, context)` -> `evaluateTimerBall(context)` (or whichever evaluator matches).
- **Status:** CORRECT

### Conditional Ball Modifier in Rate Preview Path

- **Rule:** Same as above. The rate preview must show the modifier the actual capture would apply.
- **Implementation:** `rate.post.ts` builds full context via `buildConditionContext()` when `trainerId` is provided, passes it to `calculateBallModifier()`. The `conditionContext` includes all 14 fields needed by all 13 evaluators plus the 3 GM-override-only fields (isDarkOrLowLight, targetWasBaited, isUnderwaterOrUnderground).
- **Status:** CORRECT

### Shared Context Service Correctness

- **Rule:** Context fields must match the data requirements of each evaluator:
  - Timer/Quick Ball: `encounterRound` (from encounter.currentRound)
  - Level Ball: `targetLevel` + `activePokemonLevel` (from Pokemon + encounter combatant)
  - Heavy Ball: `targetWeightClass` (from speciesData.weightClass)
  - Fast Ball: `targetMovementSpeed` = max(overland, swim, sky) per "a Movement Capability above 7" (`core/09-gear-and-items.md#Page 272`)
  - Love Ball: `targetGender` + `activePokemonGender` + `targetEvoLine` + `activePokemonEvoLine`
  - Net Ball: `targetTypes` (from speciesData.type1/type2)
  - Moon Ball: `targetEvolvesWithStone` (from evolutionTriggers JSON)
  - Repeat Ball: `trainerOwnsSpecies` (from pokemon.count query)
  - Nest Ball: `targetLevel` (from Pokemon.level)
  - Dusk/Lure/Dive Ball: GM-provided boolean flags
- **Implementation:** `ball-condition.service.ts` `buildConditionContext()` populates all fields from correct data sources. Movement speed uses `Math.max(overland ?? 0, swim ?? 0, sky ?? 0)` which correctly picks the highest capability. Stone evolution uses keyword matching against the `evolutionTriggers` JSON. Evo line derivation includes the species itself plus all `toSpecies` from triggers. Active Pokemon is the trainer's first non-fainted Pokemon in the encounter (correct per PTU -- the "active" Pokemon is the one currently in battle).
- **Status:** CORRECT

### Condition Context Auto-Population Completeness

- **Rule:** Both capture endpoints should produce identical conditional modifiers for the same Pokemon/encounter/trainer combination.
- **Implementation:** Both `attempt.post.ts` (line 146) and `rate.post.ts` (line 138) call the same `buildConditionContext()` function with the same signature: `(pokemon, speciesData, trainer, encounterId?, gmOverrides?)`. The attempt endpoint always has trainer/encounter data. The rate endpoint has it when `trainerId` is provided (new in this fix).
- **Status:** CORRECT

## Decree Compliance

- **decree-013 (1d100 system):** No changes to the capture roll formula. Conditional ball modifiers continue to be applied additively to the 1d100 roll via `attemptCapture()`. **Fully compliant.**

- **decree-014 (Stuck/Slow separate):** No changes to `calculateCaptureRate()` or status condition handling. Ball condition context does not interact with Stuck/Slow bonuses. **Fully compliant.**

- **decree-015 (real max HP):** No changes to HP percentage calculations. The `buildConditionContext()` function does not reference HP data. **Fully compliant.**

- **decree-042 (full accuracy on throws):** No changes to accuracy checking. The AC 6 gate in `attempt.post.ts` remains unchanged. **Fully compliant.**

## Test Coverage Assessment

The fix cycle added 55 tests in `ball-condition.service.test.ts`, bringing the total Poke Ball system test count to:

| Test File | Test Count | Coverage |
|-----------|-----------|----------|
| `pokeBallConditions.test.ts` | 85 | All 13 evaluators, boundary values, edge cases, integration |
| `captureAttempt.test.ts` | 14 | API handler: ownership, input validation, AC 6 gate, ball modifier integration |
| `ball-condition.service.test.ts` | 55 | buildConditionContext, checkEvolvesWithStone, deriveEvoLine |
| **Total** | **154** | |

Key test scenarios verified for rules correctness:
1. Fainted Pokemon skipping ensures Level Ball uses the correct active Pokemon level
2. Owner filtering ensures only the capturing trainer's Pokemon are considered for Love Ball
3. Stone keyword matching covers all 11 PTU Evolution Stones
4. Evo line derivation includes branched evolutions (Eevee -> multiple)
5. GM override merging preserves auto-populated fields while allowing override
6. Null/missing data fallbacks return safe defaults (no false positives for any ball condition)

## What Looks Good

1. **Clean extraction pattern.** The shared `ball-condition.service.ts` follows the existing service pattern (pure function with DB access, clearly documented). Both endpoints now use identical logic for context building.

2. **Backward compatibility preserved.** The rate endpoint falls back to partial context (5 fields from speciesData) when `trainerId` is not provided. The composable's `conditionContext` parameter is optional. No existing callers break.

3. **No evaluator logic changed.** All 13 evaluators in `pokeBallConditions.ts` are unchanged. The fix only affected how context reaches them. This means the rules-review-253 approval of all evaluators remains valid.

4. **Thorough edge case testing.** The 55 new tests cover scenarios that directly affect PTU rules correctness: genderless Pokemon for Love Ball, fainted Pokemon filtering for Level Ball, species ownership count for Repeat Ball.

## Verdict

**APPROVED.** All 5 issues from code-review-277 are correctly resolved. The four fix commits (M1, H2+M2, H1, M3) address each issue cleanly:

1. **H1 RESOLVED:** `calculateCaptureRateLocal` now passes `conditionContext` to `calculateBallModifier`.
2. **H2 RESOLVED:** `rate.post.ts` uses the shared `buildConditionContext` for full 14-field context when `trainerId` is provided.
3. **M1 RESOLVED:** Dead `condition` property removed from `PokeBallDef` interface.
4. **M2 RESOLVED:** Helpers extracted to `ball-condition.service.ts` for shared use.
5. **M3 RESOLVED:** 55 unit tests covering all code paths in `buildConditionContext`, `checkEvolvesWithStone`, and `deriveEvoLine`.

No new PTU rules issues introduced. All 13 conditional ball evaluators continue to match PTU 1.05 Chapter 9 (p.271-273) exactly per rules-review-253. Decree compliance verified for decree-013, decree-014, decree-015, and decree-042. Feature-017 P1 is APPROVED.

## Required Changes

None.
