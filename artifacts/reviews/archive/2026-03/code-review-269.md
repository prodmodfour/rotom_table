---
review_id: code-review-269
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - 25d2f471
  - e8a289dd
  - 6554a7fe
  - de33c852
  - c1392c80
files_reviewed:
  - app/constants/pokeBalls.ts
  - app/utils/captureRate.ts
  - app/server/api/capture/rate.post.ts
  - app/server/api/capture/attempt.post.ts
  - app/composables/useCapture.ts
  - artifacts/designs/design-poke-ball-types-001/implementation-log.md
  - artifacts/tickets/open/feature/feature-017.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-02T14:30:00Z
follows_up: null
---

## Review Scope

P0 of feature-017 (Poke Ball Type System): ball catalog constants (25 PTU ball types), `ballModifier` parameter in `attemptCapture()`, `ballType` parameter in both capture API endpoints, and ball type support in the `useCapture` composable.

Design spec: `design-poke-ball-types-001/spec-p0.md` (Sections A-D).

Decree compliance checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate from volatile), decree-015 (real max HP for HP percentage).

## Issues

### HIGH

**H1. Existing capture attempt test does not mock `~/constants/pokeBalls` and will produce incomplete response data.**

File: `app/tests/unit/api/captureAttempt.test.ts` (not changed by this PR)

The test imports `attempt.post.ts` which now imports from `~/constants/pokeBalls`. The import will resolve (pure constant file, no side effects) so the test will not crash. However, the `attemptCapture` mock returns `{ success: true, roll: 30, modifiedRoll: 30, effectiveCaptureRate: 55, naturalHundred: false }` -- missing the new `ballModifier` field. The handler reads `ballModifier` from `ballResult.total` (not from `captureResult`), so the handler logic is fine. But the response object will include `ballModifier`, `ballType`, and `ballBreakdown` fields from the real `calculateBallModifier` function, meaning the test is now implicitly testing real ball logic instead of fully mocked behavior. The test currently passes, but it is fragile: if someone adds assertions on ball-related response fields, the lack of a `pokeBalls` mock will cause confusion.

**Required action:** Add a `vi.mock('~/constants/pokeBalls', ...)` to the existing test file, or add new test cases in a dedicated `pokeBalls.test.ts` that cover the ball modifier integration path. Per L1 (verify test coverage for behavioral changes), the ball modifier code path through `attemptCapture()` and the API endpoints needs at least basic test coverage. This is HIGH because it is a behavioral change (new parameter in `attemptCapture`) with zero dedicated test coverage.

### MEDIUM

**M1. `as const` assertion on `POKE_BALL_CATALOG` is meaningless due to `Record<string, PokeBallDef>` type annotation.**

File: `app/constants/pokeBalls.ts`, line 119 and 346.

The catalog is typed as `Record<string, PokeBallDef>` and then asserted `as const`. The `Record<string, PokeBallDef>` type widens the keys to `string`, so `as const` does not narrow the key type to a string literal union. The `as const` provides no benefit here -- it does not prevent mutation (the `readonly` modifiers on `PokeBallDef` fields handle that) and does not narrow the key type. This is misleading for future developers who might assume the keys are a narrow union.

**Required action:** Either remove `as const` (it does nothing), or change the type to `as const satisfies Record<string, PokeBallDef>` to get both narrow literal types and type checking. The latter is preferred as it enables type-safe key access in P1/P2.

**M2. `app-surface.md` was not updated to reflect the new `pokeBalls.ts` constant file.**

File: `.claude/skills/references/app-surface.md`

The capture section currently lists only `POST /api/capture/rate` and `POST /api/capture/attempt` with no mention of the new `ballType` parameter or the `app/constants/pokeBalls.ts` file. The design spec (Section A) introduces a new constant file (`pokeBalls.ts`) and modifies both API endpoint signatures. The checklist item "If new endpoints/components/routes/stores: was `app-surface.md` updated?" applies here -- a new constant file was added.

**Required action:** Add `pokeBalls.ts` to the constants listing in `app-surface.md`, and note the `ballType` optional parameter on the capture endpoints.

## What Looks Good

1. **Backward compatibility is perfect.** All new parameters default to `'Basic Ball'` with +0 modifier. No existing call sites need changes. The `attemptCapture()` function signature extends cleanly with an optional parameter at the end.

2. **Clean separation of concerns.** The ball modifier is computed upstream in the API layer and passed as a separate parameter to `attemptCapture()`, not mixed into the generic `modifiers` field. This enables clear breakdown reporting and will make P1 conditional logic straightforward to add.

3. **Catalog data matches PTU 1.05 exactly.** All 25 ball types verified against Chapter 9 (p.271-273). Every ball ID (01-25), name, base modifier, and description matches the book. Verified: Basic Ball +0, Great Ball -10, Ultra Ball -15, Master Ball -100, Safari Ball +0, Level Ball +0, Lure Ball +0, Moon Ball +0, Friend Ball -5, Love Ball +0, Heavy Ball +0, Fast Ball +0, Sport Ball +0, Premier Ball +0, Repeat Ball +0, Timer Ball +5, Nest Ball +0, Net Ball +0, Dive Ball +0, Luxury Ball -5, Heal Ball -5, Quick Ball -20, Dusk Ball +0, Cherish Ball -5, Park Ball -15.

4. **Ball modifier formula is correct per decree-013.** `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. Ball modifiers are negative values (e.g., Great Ball = -10) which reduce the roll, making capture easier. This matches PTU p.28: "rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll."

5. **Validation is consistent.** Both API endpoints validate `ballType` the same way: accept omission (default to Basic Ball), reject unknown types with HTTP 400. The validation check `if (body.ballType && !ballDef)` correctly avoids validating when no ball type is specified.

6. **`calculateBallModifier()` is well-structured for P1 extension.** The `_context` parameter is already typed but unused (P0 returns base modifier only). The return shape `{ total, base, conditional, conditionMet }` provides a clean breakdown that P1 will populate.

7. **`BallBreakdown` interface on the composable** matches the API response shape, providing consistent typing across client and server.

8. **Commit granularity is appropriate.** Four implementation commits (one per spec section A-D) plus one artifact update commit. Each commit is focused and produces a working state.

9. **`getAvailableBalls()` correctly filters Safari balls by default,** which is a forward-looking UX decision for P2.

10. **Post-capture effect identifiers** (`heal_full`, `loyalty_plus_one`, `raised_happiness`) are defined as string literals in the catalog data but not processed, which is correct for P0 per the design spec.

## Decree Compliance

- **decree-013 (1d100 system):** Confirmed. The implementation uses `Math.floor(Math.random() * 100) + 1` for 1d100. Ball modifiers integrate with this system. No d20 playtest elements.
- **decree-014 (Stuck/Slow separate):** Not affected by this PR. The `calculateCaptureRate()` function was not modified. Stuck/Slow handling remains correctly separate.
- **decree-015 (real max HP):** Not affected by this PR. The `calculateCaptureRate()` function was not modified. HP percentage calculation remains based on real max HP.

## Verdict

**APPROVED** with HIGH and MEDIUM issues to address.

H1 (test coverage for ball modifier path) should be addressed before P1 begins, as P1 will add conditional logic that builds on the same code path. The existing test file needs the `pokeBalls` mock added, and ideally a test case that verifies the ball modifier flows through `attemptCapture()` correctly.

M1 (`as const` ineffectiveness) and M2 (`app-surface.md` update) should be addressed as part of the P0 completion.

## Required Changes

1. **H1:** Add `vi.mock('~/constants/pokeBalls', ...)` to `captureAttempt.test.ts`, or create a new test file for ball modifier integration. Add at least one test that passes a non-default ball type and verifies the ball modifier appears in the response.
2. **M1:** Change `POKE_BALL_CATALOG` declaration to use `as const satisfies Record<string, PokeBallDef>` instead of `Record<string, PokeBallDef> = { ... } as const`.
3. **M2:** Update `app-surface.md` to document `pokeBalls.ts` in the constants section and note the `ballType` optional parameter on both capture endpoints.
