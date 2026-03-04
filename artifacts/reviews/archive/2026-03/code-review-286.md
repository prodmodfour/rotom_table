---
review_id: code-review-286
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-017
domain: capture
commits_reviewed:
  - 87c6b6df
  - a41b4d5a
  - 5e5f6de7
  - 183965e9
files_reviewed:
  - app/constants/pokeBalls.ts
  - app/utils/pokeBallConditions.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/services/ball-condition.service.ts
  - app/tests/unit/services/ball-condition.service.test.ts
  - app/tests/unit/utils/pokeBallConditions.test.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T19:30:00Z
follows_up: code-review-277
---

## Review Scope

Re-review of feature-017 P1 fix cycle. code-review-277 found 2 HIGH + 3 MEDIUM issues. The developer applied 4 fix commits targeting all 5 issues:

| CR-277 Issue | Fix Commit | Status |
|---|---|---|
| H1: `calculateCaptureRateLocal` missing conditionContext | `5e5f6de7` | Verified fixed |
| H2: `rate.post.ts` incomplete context auto-population | `a41b4d5a` | Verified fixed |
| M1: Dead `condition` property on PokeBallDef | `87c6b6df` | Verified fixed |
| M2: `buildConditionContext` private to attempt.post.ts | `a41b4d5a` (same commit as H2) | Verified fixed |
| M3: Zero test coverage for buildConditionContext | `183965e9` | Verified fixed |

Decrees checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy system). No violations. The fix commits do not alter the capture roll formula, status bonus separation, HP calculations, or accuracy validation. The fixes only correct context passing and code organization.

## Issues

None.

## Verification of Each Fix

### H1: `calculateCaptureRateLocal` now passes conditionContext (5e5f6de7)

**Before:** `calculateCaptureRateLocal` called `calculateBallModifier(ballType)` with no context, so CombatantCard previews showed incorrect modifiers for all 13 conditional balls.

**After:** The params interface now includes `conditionContext?: Partial<BallConditionContext>`, and line 140 reads:
```typescript
const ballResult = calculateBallModifier(ballType, params.conditionContext)
```

Verified in `app/composables/useCapture.ts` lines 125 and 140. The `conditionContext` is threaded through correctly. The change is minimal (5 lines) and surgical. Client-side previews now reflect conditional ball modifiers when the caller provides context.

### H2+M2: `buildConditionContext` extracted to shared service (a41b4d5a)

**Before:** `buildConditionContext`, `checkEvolvesWithStone`, and `deriveEvoLine` were private functions inside `attempt.post.ts`. `rate.post.ts` only populated 5 of 13 context fields inline. The rate preview was incorrect for Level Ball, Love Ball, Moon Ball, Repeat Ball, Timer Ball, and Quick Ball.

**After:** All three functions moved to `app/server/services/ball-condition.service.ts` (185 lines). Both endpoints import from the shared service:

- `attempt.post.ts` line 9: `import { buildConditionContext } from '~/server/services/ball-condition.service'`
- `rate.post.ts` line 6: `import { buildConditionContext } from '~/server/services/ball-condition.service'`

The `rate.post.ts` request interface now accepts `encounterId` and `trainerId` (lines 22-24). When `trainerId` is provided, the endpoint calls `buildConditionContext()` for full 13-field context (lines 136-144). When `trainerId` is absent, it falls back to the previous 5-field partial context (lines 146-163), preserving backward compatibility.

The `getCaptureRate` composable function gained optional `encounterId` and `trainerId` parameters (lines 84-85), which are passed to the API body (line 93).

Verified that the extracted code in `ball-condition.service.ts` is byte-identical to the removed code from `attempt.post.ts` (confirmed via the git diff). The three functions are now `export`ed rather than file-private.

The `SpeciesDataFields` interface in the service (lines 15-30) is slightly stricter than the original `attempt.post.ts` inline type -- it drops the unused `types?: string` field. This is correct; the catalog uses `type1`/`type2`, not a combined `types` string.

### M1: Dead `condition` property removed from PokeBallDef (87c6b6df)

**Before:** `PokeBallDef` declared `readonly condition?: (context: BallConditionContext) => number`. No ball in the catalog ever populated this field.

**After:** The property is removed. The `conditionDescription` field (used by 13 balls for UI display) is retained. Verified in `app/constants/pokeBalls.ts` lines 79-105: no `condition` property, `conditionDescription` still present at line 96.

### M3: 55 unit tests for buildConditionContext (183965e9)

New test file: `app/tests/unit/services/ball-condition.service.test.ts` (681 lines, 55 tests).

Coverage breakdown:
- **`checkEvolvesWithStone`** (18 tests): All 11 PTU Evolution Stones individually, generic "stone" keyword, case insensitivity, non-stone items (Metal Coat), level-up evolution, trade evolution, mixed triggers, empty/undefined/invalid inputs, empty requiredItem string.
- **`deriveEvoLine`** (8 tests): Single evolution (Pikachu->Raichu), branching evolution (Eevee->3 eeveelutions), self-reference deduplication, no triggers, undefined triggers, empty array triggers, invalid JSON, triggers without toSpecies.
- **`buildConditionContext`** (29 tests): Target field population from speciesData, highest movement speed derivation, evo line derivation, stone evolution detection, null speciesData fallbacks, single-type species, genderless Pokemon default, encounter round lookup (from DB, null currentRound, encounter not found, no encounterId), active Pokemon resolution (level/gender from combatants, fainted Pokemon skip, enemy Pokemon skip, no trainer Pokemon, genderless active Pokemon, trainer-type combatant skip), species ownership check (owns vs doesn't own), GM override merging (priority, merge semantics, empty overrides).

The Prisma mock pattern (`vi.hoisted` + `vi.mock`) matches the project's established pattern in other service tests. All tests use `beforeEach` with `vi.clearAllMocks()` to prevent state bleed.

Test quality is good: each test verifies a single behavior, assertions are specific (exact value checks, not just truthiness), and edge cases are well-represented (null fields, empty arrays, fainted combatants, missing encounter).

## What Looks Good

1. **Clean extraction pattern.** The `ball-condition.service.ts` follows the project's service architecture (see `server/services/CLAUDE.md` service inventory). It is correctly classified as a "pure functions" service with DB dependencies (it reads from Prisma but does not write). The service CLAUDE.md already lists it with the correct description.

2. **Backward-compatible rate endpoint.** The `rate.post.ts` gracefully handles the case when `trainerId` is absent by falling back to the previous partial-context behavior. Existing callers that do not pass `trainerId` or `encounterId` continue to work identically. The `conditionContext` GM override parameter is preserved in both paths.

3. **File sizes remain well within limits.** Largest source file is `pokeBalls.ts` at 410 lines. The extracted `ball-condition.service.ts` is 185 lines. `attempt.post.ts` dropped from ~382 to 258 lines after extraction. Test file at 681 lines is acceptable for test files.

4. **Commit granularity is appropriate.** Four commits, each addressing a clearly-scoped issue: one refactor (M1, dead code removal), one refactor + feature (H2+M2, extraction + rate endpoint enhancement), one fix (H1, conditionContext pass-through), one test (M3, 55 unit tests). Each commit produces a working state.

5. **app-surface.md is comprehensive.** The Poke Ball system entry at line 236 documents `ball-condition.service.ts` (buildConditionContext, checkEvolvesWithStone, deriveEvoLine), the rate endpoint's new `encounterId`/`trainerId` parameters, and `calculateCaptureRateLocal`'s conditionContext parameter.

6. **No decree violations.** The fix commits do not alter the capture roll formula (decree-013), status bonus separation (decree-014), HP calculations (decree-015), or accuracy validation (decree-042).

7. **No immutability violations.** Context objects are built with spread operators (`...autoContext, ...gmOverrides`). No reactive state mutation. No direct Prisma record mutation outside of the extraction refactor.

## Verdict

**APPROVED**

All 5 issues from code-review-277 are correctly resolved. The extraction to `ball-condition.service.ts` is clean, the `rate.post.ts` endpoint now auto-populates full condition context when `trainerId` is provided, `calculateCaptureRateLocal` passes `conditionContext` through to `calculateBallModifier`, the dead `condition` property is removed, and 55 unit tests cover the previously-untested `buildConditionContext` with thorough edge case coverage. No new issues introduced.

Feature-017 P1 (Poke Ball Type System — Conditional Ball Evaluators) is **P1-APPROVED**.

## Required Changes

None.
