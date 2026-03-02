# Implementation Log: design-poke-ball-types-001

## P0: Poke Ball Catalog and Base Modifier Integration

**Status:** Implemented
**Date:** 2026-03-02
**Branch:** slave/2-dev-feature-017-p0-20260302

### Commits

| Commit | Section | Files Changed | Description |
|--------|---------|---------------|-------------|
| `3ae59073` | A | app/constants/pokeBalls.ts (new) | Poke Ball catalog with all 25 PTU ball types, types, helper functions |
| `9de31f89` | B | app/utils/captureRate.ts | Added ballModifier parameter to attemptCapture() |
| `bb0acb53` | C | app/server/api/capture/rate.post.ts, attempt.post.ts | ballType param, validation, ball breakdown in response |
| `2efb67d8` | D | app/composables/useCapture.ts | ballType support on all functions, getAvailableBalls(), updated interfaces |

### Section Details

**A. Poke Ball Catalog Constants** — `app/constants/pokeBalls.ts`
- Defined `PokeBallCategory`, `BallConditionContext`, `PokeBallDef` types
- Created `POKE_BALL_CATALOG` with all 25 ball entries (base modifiers, categories, costs, descriptions)
- Helper functions: `getBallsByCategory()`, `getBallDef()`, `calculateBallModifier()`, `getAvailableBallNames()`
- `DEFAULT_BALL_TYPE = 'Basic Ball'`
- P0 returns base modifier only; condition functions are undefined (P1)

**B. Base Modifier Integration** — `app/utils/captureRate.ts`
- Added optional `ballModifier` parameter (default 0) to `attemptCapture()`
- Roll calculation: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`
- Return type now includes `ballModifier` for breakdown visibility
- Fully backward compatible

**C. Ball Type Parameter in Capture API**
- `rate.post.ts`: Added optional `ballType` field, validates against catalog, returns `ballType`, `ballModifier`, `ballBreakdown`
- `attempt.post.ts`: Added optional `ballType` field, computes ball modifier, passes to `attemptCapture()`, returns ball breakdown
- Unknown ball types return HTTP 400

**D. Updated useCapture Composable**
- `getCaptureRate()` gains `ballType` parameter
- `calculateCaptureRateLocal()` gains `ballType` in params, returns ball breakdown
- `attemptCapture()` gains `ballType` in params, sends to API
- New `getAvailableBalls()` returns `PokeBallDef[]` for UI (P2)
- New `BallBreakdown` interface, updated `CaptureRateData` and `CaptureAttemptResult`

### Backward Compatibility

All changes are backward compatible. New parameters default to 'Basic Ball' (+0 modifier). Existing callers (CombatantCard.vue, tests) continue to work without modification.

### Deferred to P1

- Conditional ball logic (condition functions on ball definitions)
- Round-dependent balls (Timer Ball, Quick Ball)
- Stat-comparison balls (Level Ball, Heavy Ball, Fast Ball)
- Context-dependent balls (Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive)

### Deferred to P2

- Ball type selection UI
- Post-capture effects (Heal Ball, Friend Ball, Luxury Ball)
- Capture result display with ball-specific messaging

---

## P0 Review Fixes

**Status:** Completed
**Date:** 2026-03-02
**Branch:** slave/3-dev-feature-017-p1-20260302

| Commit | Issue | Files Changed | Description |
|--------|-------|---------------|-------------|
| `0d3e04e3` | M1 | app/constants/pokeBalls.ts | `as const satisfies Record<string, PokeBallDef>` for proper type safety |
| `3c6a2145` | H1 | app/tests/unit/api/captureAttempt.test.ts | 4 ball modifier integration tests with vi.hoisted mock pattern |
| `be690131` | M2 | .claude/skills/references/app-surface.md | Poke Ball system documentation in Capture API section |

---

## P1: Conditional Ball Logic

**Status:** Implemented
**Date:** 2026-03-02
**Branch:** slave/3-dev-feature-017-p1-20260302

### Commits

| Commit | Section | Files Changed | Description |
|--------|---------|---------------|-------------|
| `a666acf4` | E | app/utils/pokeBallConditions.ts (new) | 13 conditional evaluators with registry pattern |
| `7e2683d5` | E | app/constants/pokeBalls.ts | calculateBallModifier wired to evaluateBallCondition |
| `fe01dda7` | F-H | app/server/api/capture/attempt.post.ts | Auto-populate context from DB (encounter round, species data, active Pokemon) |
| `1986921d` | F-H | app/server/api/capture/rate.post.ts | Condition context support in rate preview |
| `57d396e0` | F-H | app/composables/useCapture.ts | Pass conditionContext and encounterId to API |
| `7c2a4f90` | — | app/tests/unit/api/captureAttempt.test.ts | Updated tests for context parameter |
| `2302c95f` | — | app/utils/pokeBallConditions.ts | Fix -0 edge case in Timer/Heavy Ball |
| `91c77ae9` | — | app/tests/unit/utils/pokeBallConditions.test.ts (new) | 85 unit tests for all evaluators |

### Section Details

**E. Conditional Ball Logic Engine** — `app/utils/pokeBallConditions.ts`
- Pure function evaluators for all 13 conditional ball types
- Registry pattern: `BALL_CONDITION_EVALUATORS` maps ball name to evaluator function
- Public API: `evaluateBallCondition(ballName, context)` returns `{ modifier, conditionMet, description }`
- `calculateBallModifier()` in pokeBalls.ts now calls the evaluator and sums base + conditional

**F. Round-Dependent Balls**
- Timer Ball: -5 per round elapsed, conditional capped at -25 (total = base +5 + (-25) = -20)
- Quick Ball: degrades from base -20 (round 1) to 0 (round 4+) via cumulative +5/+10/+20

**G. Stat-Comparison Balls**
- Level Ball: -20 if target level < half of active Pokemon level
- Heavy Ball: -5 per Weight Class above 1 (WC 1=0, WC 6=-25)
- Fast Ball: -20 if highest movement capability > 7

**H. Context-Dependent Balls**
- Love Ball: -30 if same evo line + opposite gender (genderless rejected)
- Net Ball: -20 if target is Water or Bug type
- Dusk Ball: -20 in dark/low-light (GM flag)
- Moon Ball: -20 if target evolves with Evolution Stone
- Lure Ball: -20 if target was baited (GM flag)
- Repeat Ball: -20 if trainer already owns target species
- Nest Ball: -20 if target is under level 10
- Dive Ball: -20 if underwater/underground (GM flag)

### API Layer Context Auto-Population

`buildConditionContext()` in attempt.post.ts auto-populates from DB:
- `encounterRound` from encounter.currentRound
- `targetLevel`, `targetGender`, `targetSpecies` from Pokemon record
- `targetTypes` from speciesData.type1/type2
- `targetWeightClass` from speciesData.weightClass
- `targetMovementSpeed` from max(overland, swim, sky)
- `targetEvolvesWithStone` from evolutionTriggers (stone keyword detection)
- `targetEvoLine` from species name + evolutionTriggers toSpecies
- `activePokemonLevel/Gender/EvoLine` from trainer's non-fainted combatant
- `trainerOwnsSpecies` from pokemon.count query
- GM overrides via `conditionContext` in request body

### SpeciesData Schema

No schema changes needed. All required fields (types, weightClass, overland/swim/sky, evolutionTriggers) already exist. `evolvesWithStone` and `evolutionLine` are derived at runtime from existing fields rather than adding new columns.

### Test Coverage

85 unit tests covering all 13 evaluators + integration with calculateBallModifier:
- Condition met/not met for each ball type
- Missing data graceful fallbacks
- Boundary values (level thresholds, round caps, WC scaling)
- Case-insensitive type and species matching
- Empty arrays, undefined fields

### Deferred to P2

- Ball type selection UI
- Post-capture effects (Heal Ball full heal, Friend Ball +1 loyalty, Luxury Ball raised happiness)
- Full evolution line traversal (currently uses species + direct evolutions only)
- Scene-linked isDarkOrLowLight auto-detection

---

## P1 Review Fixes (code-review-277)

**Status:** Completed
**Date:** 2026-03-03
**Branch:** slave/4-dev-feature-017-p1-fix-20260303

| Commit | Issue | Files Changed | Description |
|--------|-------|---------------|-------------|
| `1b781984` | M1 | app/constants/pokeBalls.ts | Remove dead `condition` property from PokeBallDef (evaluator registry replaced it) |
| `1a7b5de2` | H2+M2 | app/server/services/ball-condition.service.ts (new), attempt.post.ts, rate.post.ts, useCapture.ts | Extract buildConditionContext to shared service; rate.post.ts gains full 13-field context |
| `851f2f7e` | H1 | app/composables/useCapture.ts | Pass conditionContext to calculateBallModifier in calculateCaptureRateLocal |
| `ec2a94e6` | M3 | app/tests/unit/services/ball-condition.service.test.ts (new) | 55 unit tests for buildConditionContext, checkEvolvesWithStone, deriveEvoLine |

### Issue Details

- **H1**: `calculateCaptureRateLocal` called `calculateBallModifier(ballType)` without context, so CombatantCard previews never showed conditional modifiers. Now accepts and passes `conditionContext`.
- **H2+M2**: `rate.post.ts` only had 5 of 13 context fields (missing encounterRound, activePokemon*, trainerOwnsSpecies, targetEvolvesWithStone, targetEvoLine, targetGender, targetWasBaited, isDarkOrLowLight, isUnderwaterOrUnderground). Extracted `buildConditionContext` from `attempt.post.ts` to `ball-condition.service.ts`. `rate.post.ts` now accepts `encounterId`/`trainerId` and uses the shared service for full context.
- **M1**: Removed `condition?: (context: BallConditionContext) => number` from `PokeBallDef` — dead code since P1 evaluator registry replaced it.
- **M3**: Added 55 tests covering stone detection (all 12 stone types, case-insensitive, mixed triggers, edge cases), evo line derivation, and full context assembly (encounter round lookup, active Pokemon resolution with faint/owner filtering, species ownership, GM override merging, null speciesData fallbacks).
