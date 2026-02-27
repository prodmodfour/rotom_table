---
review_id: code-review-085
review_type: code
reviewer: senior-reviewer
follows_up: [code-review-082, code-review-083]
trigger: changes-required-followup
target_tickets: [ptu-rule-072, ptu-rule-068]
commits_reviewed:
  - 072f167
  - ca0ea5c
  - 1f56392
files_reviewed:
  - app/composables/useGridMovement.ts
  - app/tests/unit/composables/useGridMovement.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-20T05:00:00Z
---

## Review Scope

Follow-up review of three commits addressing the CHANGES_REQUIRED verdicts from code-review-082 (CRITICAL: Stuck early-return, HIGH: movement modifier test coverage) and code-review-083 (CRITICAL: Stuck floor override, HIGH: no unit tests, MEDIUM: Math.floor asymmetry). Also incorporates the Math.trunc fix from rules-review-072 (HIGH: symmetric Speed CS rounding).

## Issue Resolution Verification

### ptu-rule-072: Stuck early-return (CRITICAL from code-review-082 + code-review-083)

**Original bug:** `applyMovementModifiers()` set `modifiedSpeed = 0` for Stuck but continued executing. Three downstream paths could raise it above 0: (1) Speed CS negative triggered `Math.max(modifiedSpeed, 2)`, (2) Speed CS positive added directly to 0, (3) minimum floor `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` restored it to 1.

**Fix (commit 072f167):** Changed `modifiedSpeed = 0` to `return 0`. Single-line change, clean diff:

```typescript
// Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
// Early-return so no downstream modifier (Speed CS, Sprint, min floor) can override
if (conditions.includes('Stuck')) {
  return 0
}
```

**Verification:**
- The early return bypasses all subsequent code: Slowed (line 90), Speed CS (line 99-108), Sprint (line 111-113), and the minimum floor (line 116). None of these can execute for a Stuck combatant. Correct.
- The `return 0` is unconditional -- no edge case can override it. The scenarios from code-review-082 (Stuck + CS -2, Stuck + CS +6, Stuck + base > 0) all produce 0 now.
- Comment is accurate and references the correct PTU pages.

**Status:** RESOLVED.

### ptu-rule-068: Math.trunc for symmetric rounding (HIGH from rules-review-072)

**Original bug:** `Math.floor(clamped / 2)` produced asymmetric penalties for odd negative Speed CS values. CS -1 gave -1 penalty (should be 0), CS -3 gave -2 (should be -1), CS -5 gave -3 (should be -2). PTU says negative CS "reduces your movement equally."

**Fix (commit ca0ea5c):** Replaced `Math.floor(clamped / 2)` with `Math.trunc(clamped / 2)`. Single-token change.

**Verification (line 102 of current file):**
```typescript
const stageBonus = Math.trunc(clamped / 2)
```

`Math.trunc` rounds toward zero for both positive and negative values:
- `Math.trunc(1/2) = 0`, `Math.trunc(-1/2) = 0` -- symmetric
- `Math.trunc(3/2) = 1`, `Math.trunc(-3/2) = -1` -- symmetric
- `Math.trunc(5/2) = 2`, `Math.trunc(-5/2) = -2` -- symmetric
- `Math.trunc(6/2) = 3`, `Math.trunc(-6/2) = -3` -- symmetric (same as Math.floor for even)

The updated comment (lines 97-98) accurately describes the behavior. The PTU page reference (p.234, "reduces movement equally") is correct.

**Status:** RESOLVED.

### Unit tests for applyMovementModifiers (HIGH from code-review-083)

**Context:** `applyMovementModifiers` had 4 bugs across 2 review cycles with zero test coverage. code-review-083 flagged this as HIGH priority.

**Fix (commit 1f56392):**
1. Extracted `applyMovementModifiers` from the `useGridMovement` composable closure to a top-level `export function`. This makes it directly importable for unit testing without needing to mock Pinia stores, Nuxt composables, or Ref objects.
2. Added 38 unit tests in `app/tests/unit/composables/useGridMovement.test.ts`.

**Function extraction verification:**
- The diff shows a clean cut-and-paste from inside `useGridMovement()` to module scope. The function signature, body, and comments are identical.
- The internal caller at line 182 (`baseSpeed = applyMovementModifiers(combatant, baseSpeed)`) now calls the module-level export instead of the closure-scoped const. No other callers exist (confirmed via grep -- only 2 references in the source file: the definition at line 78 and the call at line 182).
- The function has no dependencies on the composable's closure (no `terrainStore`, no `options`, no `tokens`). It only reads `combatant.entity.statusConditions`, `combatant.tempConditions`, and `combatant.entity.stageModifiers`. The extraction is safe.

**Test coverage verification:**

All 38 tests pass (`vitest run` from `app/` directory). Test organization:

| Describe block | Tests | Coverage |
|---------------|-------|----------|
| no conditions (baseline) | 3 | Identity behavior, various speeds, base speed 0 |
| Stuck condition | 6 | Basic Stuck, multiple base speeds, Stuck+CS+6, Stuck+Sprint, Stuck+CS+6+Sprint, Stuck+CS-6 |
| Slowed condition | 5 | Even halving, odd halving (floor), minimum 1, base speed 0 |
| Speed Combat Stage modifier | 12 | CS +6/+4/+2/+1, CS -6/-1, floor of 2 enforcement, symmetry (+1/-1, +3/-3, +5/-5), clamping beyond +6/-6 |
| Sprint | 3 | +50%, floor on odd result, speed 1 |
| condition interactions | 7 | Slowed+CS+, Slowed+CS-, Slowed+Sprint, Slowed+CS+Sprint, Stuck+Slowed, CS on high speed, CS- on high speed |
| minimum speed floor | 2 | Min 1 for non-zero base, no min for base 0 |

**Bug regression coverage check:**

The 4 bugs identified across code-review-077, code-review-082, code-review-083, and rules-review-072/073 are all explicitly tested:

1. **Bug: Stuck halved instead of blocking** (code-review-077 H1) -- Tests "should return 0 for Stuck combatant" and "should return 0 regardless of base speed" cover this. Stuck returns 0, not `floor(speed/2)`.

2. **Bug: Speed CS multiplicative instead of additive** (code-review-077 M2) -- Tests "should add +3 for Speed CS +6 (additive: floor(6/2))" and all other CS tests verify additive behavior. The result is `base + bonus`, not `base * multiplier`.

3. **Bug: Stuck overridden by CS/Sprint/floor** (code-review-082 CRITICAL, code-review-083 C1) -- Six dedicated Stuck tests verify Stuck wins over every possible override path: CS+6, Sprint, CS+6+Sprint, CS-6 (which triggers the min-2 floor). All return 0.

4. **Bug: Math.floor asymmetric for negative CS** (rules-review-072 HIGH) -- Three explicit symmetry tests verify `|bonus(+N)| == |penalty(-N)|` for N=1,3,5. Plus the "CS -1 symmetric with +1: trunc(-1/2) = 0" test directly checks the previously-buggy case.

**Test quality observations:**

- The `makeCombatant` helper creates minimal stubs with only the fields `applyMovementModifiers` accesses. Clean, focused, no over-specification.
- Types are correctly imported from project type definitions (`StatusCondition`, `StageModifiers`, `Combatant`).
- Every test has a descriptive name and inline comment showing the expected calculation trace (e.g., `// Slowed: floor(5/2) = 2, then CS +6: 2 + 3 = 5`). This makes failures self-documenting.
- No mutation of test objects between tests -- each test creates its own combatant via `makeCombatant()`.

**Status:** RESOLVED.

## Cross-Check: code-review-082 Required Changes

| Required Change | Severity | Status |
|----------------|----------|--------|
| Stuck handler: `return 0` instead of `modifiedSpeed = 0` | CRITICAL | RESOLVED (commit 072f167) |
| Unit tests for `resetDailyUsage()` | HIGH | Out of scope for this review (separate commit f9ecba1, not in target tickets) |

## Cross-Check: code-review-083 Required Changes

| Required Change | Severity | Status |
|----------------|----------|--------|
| Stuck = 0 overridden by minimum floor to 1 | CRITICAL | RESOLVED (commit 072f167) |
| Speed CS can override Stuck (CS +6 gives speed 3) | HIGH | RESOLVED (commit 072f167, same fix) |
| No unit test coverage for applyMovementModifiers | HIGH | RESOLVED (commit 1f56392, 38 tests) |
| `pass` action reactive mutation | MEDIUM | Out of scope (separate ticket, not in target) |

## Cross-Check: rules-review-072 Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Stuck = 0 overridden by minimum floor | CRITICAL | RESOLVED (commit 072f167) |
| Math.floor asymmetric for negative CS | HIGH | RESOLVED (commit ca0ea5c) |

## What Looks Good

1. **Commit granularity:** Three separate commits for three distinct changes (Stuck fix, Math.trunc fix, test extraction + tests). Each commit is self-contained with a descriptive message. The commit messages reference the correct ticket IDs and explain the "why."

2. **Function extraction pattern:** Moving `applyMovementModifiers` to module scope for testability is the correct approach. The function was already a pure function with no closure dependencies -- it only needed `combatant` and `speed` as inputs. The extraction makes this explicit and enables direct import in tests without mocking the composable's infrastructure.

3. **Test thoroughness:** 38 tests for a 40-line function is comprehensive. The tests cover every branch (Stuck, Slowed, CS positive, CS negative, CS zero, Sprint, minimum floor) and every meaningful interaction (Stuck+CS, Stuck+Sprint, Stuck+CS+Sprint, Slowed+CS, Slowed+Sprint, Slowed+CS+Sprint). The symmetry tests for Math.trunc are a particularly good addition -- they would have caught the original Math.floor bug.

4. **Comment quality:** The inline comments in `applyMovementModifiers` are accurate, reference specific PTU pages, and explain the mathematical reasoning (especially the Math.trunc rationale at lines 97-98).

5. **File size:** `useGridMovement.ts` is 331 lines (well under 800). The test file is 335 lines. Both within limits.

## Verdict

**APPROVED** -- All three fixes are correct, the function extraction is safe, and the 38 unit tests provide comprehensive regression coverage for every bug identified across the previous 4 review cycles. The Stuck early-return is the right architectural choice (short-circuit over flag-tracking). The Math.trunc change produces correct symmetric rounding. Both tickets (ptu-rule-072, ptu-rule-068) can be marked as done.
