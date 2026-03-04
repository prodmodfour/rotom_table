---
review_id: code-review-277
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - 1aa1443e
  - 58f54a8b
  - 63124ad4
  - 87c39ee1
  - 4c98f105
  - 69effd65
  - 6abb95c4
  - 9c14d469
  - c591a9a0
  - fb66ea9e
  - 8462d95b
  - bbed0484
files_reviewed:
  - app/utils/pokeBallConditions.ts
  - app/constants/pokeBalls.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/capture/rate.post.ts
  - app/tests/unit/utils/pokeBallConditions.test.ts
  - app/tests/unit/api/captureAttempt.test.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-03-02T18:30:00Z
follows_up: code-review-269
---

## Review Scope

P1 implementation of Poke Ball Type System (feature-017, design-poke-ball-types-001). 12 commits by slave-3, covering:

1. **P0 review fixes** (3 commits): `as const satisfies` on catalog, ball modifier integration tests, app-surface.md documentation. These address code-review-269 issues H1, M1, M2.
2. **P1 conditional ball logic** (9 commits): 13 conditional evaluators in `pokeBallConditions.ts`, wired to `calculateBallModifier`, server-side context auto-population in both capture APIs, composable context passing, -0 edge case fix, and 85 unit tests.

P0 review fixes verified against code-review-269:
- **H1 (missing ball modifier tests)**: Fixed. 5 tests added in `captureAttempt.test.ts` covering ball type passed to `calculateBallModifier`, modifier total forwarded to `attemptCapture`, unknown ball rejection, default to Basic Ball.
- **M1 (as const ineffective)**: Fixed. `as const satisfies Record<string, PokeBallDef>` now provides both literal types and structural validation.
- **M2 (app-surface.md)**: Fixed. Poke Ball system documented in Capture API section and Player capture section.

Decrees checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP). No violations found. The ball modifier system is additive on the roll per decree-013, status bonuses remain independent per decree-014, and HP calculations are unchanged per decree-015.

## Issues

### HIGH

**H1: `calculateCaptureRateLocal` does not accept or pass `conditionContext` to `calculateBallModifier`**

File: `app/composables/useCapture.ts`, line 132

The `calculateCaptureRateLocal` function calls `calculateBallModifier(ballType)` without any condition context. This means client-side capture rate previews (used by `CombatantCard.vue`) will never show conditional modifiers for any ball type. A GM selecting a Timer Ball on round 5 would see a +5 modifier in the CombatantCard preview instead of -15.

The server-side `getCaptureRate()` correctly passes `conditionContext` to the API, and `attemptCapture()` passes it through. But the local calculation path is broken for conditionals.

```typescript
// Current (line 132):
const ballResult = calculateBallModifier(ballType)

// Should be:
const ballResult = calculateBallModifier(ballType, params.conditionContext)
```

The params interface also needs a `conditionContext?: Partial<BallConditionContext>` field.

This is HIGH because it produces incorrect capture rate previews for every conditional ball type, and the CombatantCard is the primary UI for checking capture rates before throwing.

**H2: `rate.post.ts` auto-context is missing several fields that `attempt.post.ts` populates**

File: `app/server/api/capture/rate.post.ts`, lines 125-135 vs `app/server/api/capture/attempt.post.ts`, lines 234-331

The rate preview endpoint populates only 5 context fields: `targetLevel`, `targetTypes`, `targetWeightClass`, `targetMovementSpeed`, `targetSpecies`. The attempt endpoint populates all 13+ fields including `encounterRound`, `targetGender`, `targetEvolvesWithStone`, `targetEvoLine`, `activePokemonLevel`, `activePokemonGender`, `activePokemonEvoLine`, `trainerOwnsSpecies`.

This means the rate preview will show incorrect results for most conditional balls:
- **Level Ball**: always shows 0 (no `activePokemonLevel`)
- **Love Ball**: always shows 0 (no gender or evo line data)
- **Moon Ball**: always shows 0 (no `targetEvolvesWithStone`)
- **Nest Ball**: works (has `targetLevel`)
- **Repeat Ball**: always shows 0 (no `trainerOwnsSpecies`)
- **Timer/Quick Ball**: always shows round 1 (no `encounterRound`)
- **Dusk/Lure/Dive Ball**: correctly require GM override in both endpoints

The rate preview is the GM's decision-making tool -- if it shows the wrong modifier, the GM may choose the wrong ball. The `buildConditionContext` helper in `attempt.post.ts` should be extracted and shared, or the rate endpoint needs to populate the same fields.

Note: The rate endpoint does not receive `encounterId` or `trainerId`, which limits what it can auto-populate. At minimum, the request interface should accept these fields so the server can look them up. Alternatively, the rate endpoint should accept the same `encounterId` field that `attempt` does and run the same context builder.

### MEDIUM

**M1: `PokeBallDef.condition` field on the interface is dead code**

File: `app/constants/pokeBalls.ts`, lines 93-101

The `PokeBallDef` interface declares a `condition?: (context: BallConditionContext) => number` property, but no ball in the catalog actually populates it. The P1 implementation chose a separate evaluator registry pattern (`BALL_CONDITION_EVALUATORS` in `pokeBallConditions.ts`) instead of populating the `condition` field on each ball definition. This is a sound architectural choice (keeps the catalog pure data), but the dead `condition` property should be removed from the interface to avoid confusion. Future developers may try to add condition functions to the catalog entries, not realizing the evaluator registry is the canonical location.

The `conditionDescription` field IS used (present on 13 ball entries), so that should remain.

**M2: `buildConditionContext` and `checkEvolvesWithStone`/`deriveEvoLine` are private to `attempt.post.ts` but should be shared**

File: `app/server/api/capture/attempt.post.ts`, lines 234-382

Three helper functions (`buildConditionContext`, `checkEvolvesWithStone`, `deriveEvoLine`) are defined as private functions inside the attempt endpoint file. These are:
1. Needed by `rate.post.ts` (per H2 above)
2. General-purpose utilities for species data analysis
3. The file is already 382 lines, and extracting these helpers would reduce it while enabling reuse

These should be extracted to a shared location, e.g., `app/server/utils/ballConditionContext.ts` or `app/server/services/capture-context.service.ts`. This directly enables the fix for H2.

**M3: `conditionContext` in `captureAttempt.test.ts` mock does not test conditional ball behavior**

File: `app/tests/unit/api/captureAttempt.test.ts`, lines 268-391

The test suite mocks `calculateBallModifier` globally, which means it never exercises the actual conditional logic path. The mock returns static values regardless of context. While this is correct for unit-testing the API handler in isolation, there are no integration tests that verify the full flow: `attempt.post.ts` -> `buildConditionContext` -> `calculateBallModifier` -> `evaluateBallCondition`.

Specifically, `buildConditionContext` (the most complex new function, 150 lines with encounter lookup, combatant parsing, species data queries) has zero test coverage. It handles:
- Encounter round lookup with null handling
- Combatant JSON parsing with fainted-Pokemon filtering
- Active Pokemon species data lookup for evo line
- Trainer species ownership count
- Stone evolution detection from JSON triggers
- Evo line derivation from JSON triggers
- GM override merging

This needs at least a dedicated unit test file for `buildConditionContext` (mock Prisma, verify all fields populated correctly), or the existing test file should add tests that use a less aggressive mock to verify context construction.

## What Looks Good

1. **Pure function architecture**: The evaluator registry pattern in `pokeBallConditions.ts` is excellent. Each evaluator is a standalone pure function, easily testable, easily extensible. The registry avoids coupling ball definitions to evaluation logic. This is better than the original design spec's suggestion of putting condition functions on the ball definitions.

2. **Comprehensive test coverage for evaluators**: 85 tests covering all 13 evaluators with condition-met, condition-not-met, missing data, boundary values, and case-insensitive matching. The integration tests at the bottom verify end-to-end `calculateBallModifier` behavior. This is thorough.

3. **-0 fix**: Proactively caught and fixed the `-0` edge case in Timer Ball (round 1) and Heavy Ball (WC 1) before it could cause display issues. Good defensive coding.

4. **Server context auto-population**: `buildConditionContext` in `attempt.post.ts` is well-designed. It auto-populates from DB data, handles missing data gracefully (defaults to safe values), and lets GM overrides take priority via spread. The `checkEvolvesWithStone` and `deriveEvoLine` helpers are pragmatic -- they derive data from existing `evolutionTriggers` JSON rather than requiring schema changes.

5. **Backward compatibility**: All changes are additive. Existing callers work without modification. New parameters default to safe values.

6. **Commit granularity**: 12 commits at appropriate granularity. Each commit produces a working state. The P0 fixes are clearly separated from P1 work. The -0 fix is its own commit.

7. **File sizes**: All files are within limits. The largest is `pokeBallConditions.test.ts` at 673 lines (test files are allowed to be larger). Source files range from 166 to 434 lines.

8. **Immutability**: No mutations detected. Context objects are built with spread operators. No reactive state is mutated.

9. **Design spec adherence**: Implementation matches spec-p1.md closely. The evaluator registry, condition signatures, and ball logic all match the spec's pseudocode. The deviation from spec (separate registry vs `condition` on `PokeBallDef`) is an improvement.

10. **app-surface.md**: Updated with full Poke Ball system documentation including the new `pokeBallConditions.ts` file and all public functions.

## Verdict

**CHANGES_REQUIRED**

The two HIGH issues mean conditional ball modifiers will display incorrectly in two primary UI paths: the CombatantCard inline preview (H1) and the capture rate preview endpoint (H2). These are the GM's decision-making tools for ball selection -- showing wrong data is a significant correctness bug.

## Required Changes

1. **H1**: Add `conditionContext?: Partial<BallConditionContext>` to `calculateCaptureRateLocal` params, pass it to `calculateBallModifier(ballType, params.conditionContext)`.

2. **H2**: Extract `buildConditionContext`, `checkEvolvesWithStone`, and `deriveEvoLine` from `attempt.post.ts` to a shared service file. Update `rate.post.ts` to accept `encounterId`/`trainerId` in its request body and use the shared context builder to populate the full set of condition context fields. If `encounterId`/`trainerId` are not provided, fall back to the current partial context (species data fields only).

3. **M1**: Remove the dead `condition` property from `PokeBallDef` interface. Keep `conditionDescription`.

4. **M2**: Addressed as part of H2 (extraction enables reuse).

5. **M3**: Add unit tests for `buildConditionContext` covering encounter round lookup, active Pokemon resolution, species ownership check, stone evolution detection, evo line derivation, and GM override merging.
