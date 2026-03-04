---
review_id: code-review-312
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-131
domain: combat
commits_reviewed:
  - 784004b5
  - 67718020
  - 656a2042
  - 23ae58af
  - 557b3164
  - 430857a3
  - e75e1808
files_reviewed:
  - app/composables/useCapture.ts
  - app/components/capture/CapturePanel.vue
  - app/components/encounter/CombatantCaptureSection.vue
  - app/composables/usePlayerRequestHandlers.ts
  - app/server/api/capture/attempt.post.ts
  - app/components/player/PlayerCapturePanel.vue
  - app/tests/unit/api/captureAttempt.test.ts
  - app/utils/damageCalculation.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-131.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Review Scope

7 commits implementing ptu-rule-131: replace the hardcoded `roll >= 6` Poke Ball accuracy check with the centralized `calculateAccuracyThreshold` utility, per decree-042 (full accuracy system applies to Poke Ball throws). Changes span the composable (`useCapture.ts`), GM-side capture panel (`CapturePanel.vue`), encounter capture section (`CombatantCaptureSection.vue`), player request handler (`usePlayerRequestHandlers.ts`), server endpoint (`attempt.post.ts`), player UI (`PlayerCapturePanel.vue`), and tests.

Decree compliance checked: decree-042 (full accuracy system), decree-040 (flanking after evasion cap), decree-025 (exclude endpoints from rough terrain check), decree-013/014/015 (capture rate -- not affected by this change).

## Issues

### CRITICAL

**C1: Double `Math.max(1, ...)` clamping produces incorrect threshold when rough terrain and high accuracy stage combine**

File: `app/composables/useCapture.ts`, lines 287-288

```typescript
const baseThreshold = calculateAccuracyThreshold(6, accuracyStage, speedEvasion)
const threshold = Math.max(1, baseThreshold - flankingPenalty + roughTerrainPenalty)
```

`calculateAccuracyThreshold` already clamps its result to `Math.max(1, ...)` internally (damageCalculation.ts line 124). The capture code then applies flanking and rough terrain on top and clamps again. This produces divergent results from the move accuracy system in `useMoveCalculation.ts` (line 404), which applies ALL modifiers in a single expression with one `Math.max(1, ...)`.

**Concrete failing scenario:** AC=6, accuracyStage=8, speedEvasion=0, roughTerrainPenalty=2, flankingPenalty=0.
- Capture code: `baseThreshold = max(1, 6+0-8) = 1`, then `max(1, 1-0+2) = 3`. **Result: 3**
- Move system: `max(1, 6+0-8-0+2) = max(1, 0) = 1`. **Result: 1**

The capture system makes it harder to hit than it should be. The inner clamp "erases" the accuracy advantage before rough terrain adds on top. Per decree-042, Poke Ball throws must use the same accuracy system as moves.

**Fix:** Do not call `calculateAccuracyThreshold` if you need to apply flanking/rough terrain afterward. Either:
(a) Compute the full threshold inline: `Math.max(1, 6 + Math.min(9, speedEvasion) - accuracyStage - flankingPenalty + roughTerrainPenalty)`, matching `useMoveCalculation.ts` line 404 exactly.
(b) Extend `calculateAccuracyThreshold` to accept optional flanking/roughTerrain parameters so the clamp happens once.

### HIGH

**H1: Inaccurate code comments and app-surface.md claim `calculateAccuracyThreshold` is "the same utility used by useMoveCalculation.ts" -- it is not**

Files: `app/composables/useCapture.ts` (lines 267-268), `.claude/skills/references/app-surface.md`

The comment says: "Uses calculateAccuracyThreshold(6, accuracyStage, speedEvasion) from damageCalculation.ts -- the same utility used by useMoveCalculation.ts."

`useMoveCalculation.ts` does NOT import or call `calculateAccuracyThreshold`. It implements the threshold calculation inline at line 404:
```typescript
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

The `calculateAccuracyThreshold` function in `damageCalculation.ts` was written as a reusable utility but was never actually adopted by the move system. Claiming it is "the same utility" is misleading and will confuse future developers who trust the comment and assume the two systems are already unified.

**Fix:** Update the comment in `useCapture.ts` and the app-surface.md description to say the function is from `damageCalculation.ts` without claiming `useMoveCalculation.ts` uses it. Optionally note that `useMoveCalculation.ts` uses an equivalent inline formula.

### MEDIUM

**M1: Server trusts client-provided `accuracyThreshold` without independent validation**

File: `app/server/api/capture/attempt.post.ts`, lines 54-59

The server accepts `accuracyThreshold` from the client and uses it directly for accuracy validation. It only checks that the value is a positive integer. A malicious or buggy client could send `accuracyThreshold: 1` to make any roll (except nat 1) pass the accuracy gate, bypassing Speed Evasion and terrain penalties entirely.

The server has access to the Pokemon entity and could independently compute Speed Evasion, but it would need the trainer's accuracy stages and encounter context to fully validate. The backwards-compatibility default of 6 is a reasonable fallback.

This is MEDIUM rather than HIGH because the app is a single-user GM tool (not a competitive multiplayer game), and the GM is the one sending the requests. However, the pattern of trusting client-computed security-relevant values is worth flagging for future reference.

**Fix (acceptable for now):** Add a server-side log warning when the provided threshold differs significantly from the base AC 6 (e.g., `threshold > 12` or `threshold < 2`), so the GM can spot anomalies. Alternatively, add a comment documenting why server-side recomputation is not feasible and why client trust is acceptable here.

**M2: Resolution log in ptu-rule-131.md lists wrong commit hashes**

File: `artifacts/tickets/open/ptu-rule/ptu-rule-131.md`, Resolution Log section

The commit hashes in the Resolution Log (`feb43aac`, `a6da1c6e`, `b7e070a1`, `28ec7da9`, `62b8f57e`, `ac95e811`) do not match the actual commit hashes being reviewed (`784004b5`, `67718020`, `656a2042`, `23ae58af`, `557b3164`, `430857a3`). This appears to be a rebase or cherry-pick artifact where the original commits were rewritten but the resolution log was not updated. Mismatched hashes break traceability.

**Fix:** Update the Resolution Log hashes to match the actual commits on the review branch.

## What Looks Good

1. **Clean interface design.** `CaptureAccuracyParams` is well-typed with clear defaults and JSDoc. Making all fields optional with `?? 0` defaults preserves backward compatibility elegantly.

2. **Correct decree-042 compliance for the core approach.** The decision to use `calculateAccuracyThreshold(6, ...)` with the Poke Ball AC of 6 correctly implements decree-042's ruling that Poke Ball throws use the full accuracy system. The flanking and rough terrain parameters are correctly identified as requiring VTT grid context with appropriate comments about future extension.

3. **Consistent dual-path coverage.** Both capture paths (GM CapturePanel via `CombatantCaptureSection` and player request via `usePlayerRequestHandlers`) correctly compute and pass accuracy params from encounter combatant data. Neither path was missed.

4. **Good test coverage.** Two new test cases for custom threshold validation cover the critical decree-042 behavior (roll passes default but fails custom threshold, and roll meets custom threshold). The existing tests were updated to match the new error messages.

5. **Server backwards compatibility.** The `accuracyThreshold ?? 6` fallback ensures existing callers that do not provide a threshold continue to work against the base AC 6.

6. **Correct `speedEvasion` source.** `CombatantCaptureSection.vue` reads `pokemonCombatant.speedEvasion` from the combatant record, which is pre-computed by the encounter system from stats + combat stages. This is the correct source -- it matches how `useMoveCalculation.ts` obtains target evasion.

7. **Commit granularity is appropriate.** 7 commits for 7 logical changes, each touching a small number of files. The progression (core logic -> UI -> data flow -> server -> cleanup -> docs) is well-ordered.

## Verdict

**CHANGES_REQUIRED**

The double `Math.max(1, ...)` clamping (C1) is a correctness bug that produces a divergent accuracy threshold from the move system under specific modifier combinations. Per decree-042, Poke Ball accuracy must follow the same system as move accuracy. The fix is straightforward: unify the threshold computation into a single expression with one clamp.

## Required Changes

1. **C1 (CRITICAL):** Fix the double `Math.max(1, ...)` in `useCapture.ts` `rollAccuracyCheck`. Compute the full threshold in a single expression: `Math.max(1, 6 + Math.min(9, speedEvasion) - accuracyStage - flankingPenalty + roughTerrainPenalty)`. This matches the formula in `useMoveCalculation.ts` line 404.

2. **H1 (HIGH):** Remove the claim that `useMoveCalculation.ts` uses `calculateAccuracyThreshold`. Update the comment in `useCapture.ts` (line 267-268) and the app-surface.md description to accurately describe the relationship.

3. **M1 (MEDIUM):** Add a code comment in `attempt.post.ts` near the threshold validation (line 54) documenting why client trust is acceptable (single-user GM tool, full server-side recomputation not feasible without duplicating encounter context).

4. **M2 (MEDIUM):** Update the Resolution Log commit hashes in `ptu-rule-131.md` to match the actual commits.
