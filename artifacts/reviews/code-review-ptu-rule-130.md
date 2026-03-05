---
review_id: code-review-ptu-rule-130
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-130
domain: combat
commits_reviewed:
  - cc39b317
  - 02beecb7
  - 21a90b58
  - 2b4a7623
  - f6ae7952
  - 3fee2a90
  - e6fbf256
  - 0712e99a
  - 99796267
files_reviewed:
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/server/services/switching.service.ts
  - app/types/combat.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/tests/unit/services/switching.service.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-05T14:00:00Z
follows_up: null
---

## Review Scope

Review of the fainted recall+release League exemption fix (ptu-rule-130) plus the full standalone recall/release endpoint implementation (9 commits). The core fix ensures that when a fainted Pokemon is recalled via standalone recall and a replacement is released via standalone release, the pair detection correctly identifies this as a fainted switch and exempts the replacement from the League command restriction.

PTU p.229 reference verified: "they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."

**Decree check:**
- decree-033 (fainted switch on turn only): The recall endpoint enforces turn validation (lines 83-100), requiring the current turn to belong to the trainer or one of their owned Pokemon. A fainted Pokemon cannot initiate its own recall (it can't act), so the trainer must perform the recall on their own turn or another of their Pokemon's turns -- consistent with decree-033.
- decree-044 (remove phantom Bound condition): Commit 02beecb7 correctly removes the dead 'Bound' condition check from recall.post.ts, per decree-044.

## Issues

### MEDIUM

**M1: switching.service.ts exceeds 800-line threshold (829 lines)**

The file grew from 775 lines (pre-series) to 829 lines across this commit series due to adding `applyRecallSideEffects` (32 lines, good dedup from two endpoints) and expanding `checkRecallReleasePair` (5 net lines). The services CLAUDE.md already documents this as the largest hybrid service (~824 lines). The file is well-organized with clear section headers. Recommendation: File a follow-up ticket to evaluate extracting `applyRecallSideEffects` and the recall+release pair detection into a separate module (e.g., `recall-side-effects.service.ts` or incorporating into an existing sub-service). Not blocking because the overshoot is marginal and the code organization is clean.

**M2: No unit test coverage for `checkRecallReleasePair` with `recalledWasFainted` flag**

The existing `switching.service.test.ts` covers `validateForcedSwitch` and `validateSwitch` but does not test `checkRecallReleasePair` at all -- not the base pair detection, nor the new `isFaintedSwitch` path. Per Lesson 1 (verify test coverage for behavioral changes in refactoring reviews), the fainted switch exemption is a behavioral change that should have test coverage for: (a) pair with fainted recall returns `isFaintedSwitch: true`, (b) pair with non-fainted recall returns `isFaintedSwitch: false`, (c) mixed batch (one fainted, one not) returns `isFaintedSwitch: true`. `checkRecallReleasePair` is a pure function with no DB dependencies -- straightforward to test. File a follow-up ticket.

## What Looks Good

1. **Correct fainted detection timing.** The `wasFainted` check (recall.post.ts line 199) reads `pokemon.entity.currentHp <= 0` from the in-memory combatant entity, which preserves the HP state at time of recall. `applyRecallSideEffects` modifies only the DB record, not the in-memory entity, so the check is reliable.

2. **Clean data flow.** The `recalledWasFainted` field is recorded at recall time, stored in the SwitchAction record, and consumed by `checkRecallReleasePair` at pair detection time. The optional field (`recalledWasFainted?: boolean`) with strict `=== true` check (line 826) ensures backward compatibility with SwitchAction records that predate this fix.

3. **Symmetric implementation.** Both the recall endpoint (recall-after-release path, lines 223-239) and release endpoint (release-after-recall path, lines 273-289) pass `pairCheckAfter.isFaintedSwitch` to `canSwitchedPokemonBeCommanded`, ensuring the exemption works regardless of action order.

4. **Minimal, focused fix.** The core ptu-rule-130 fix (commit cc39b317) touches exactly 4 files with 26 insertions and 7 deletions. The SwitchAction type extension is clean and well-documented with JSDoc.

5. **Supporting commits are well-scoped.** Each commit in the series addresses a single concern: endpoint creation (99796267, 0712e99a), pair detection (e6fbf256), refactoring (3fee2a90), bug fixes (f6ae7952, 2b4a7623, 02beecb7), feature addition (21a90b58), and the final fix (cc39b317). Good commit granularity.

6. **decree-044 compliance.** The Bound condition removal in 02beecb7 correctly implements decree-044, and the tempConditions fix (reading from combatant instead of entity) catches a real bug where Trapped as a tempCondition would have been silently ignored.

7. **Consistent with switch.post.ts pattern.** The `canSwitchedPokemonBeCommanded` function handles all three exemptions (non-League, fainted, forced) identically whether called from switch.post.ts or from the recall/release pair detection path.

## Verdict

**APPROVED.** The core fix is correct, minimal, and well-integrated. The PTU rule reference is accurate. Decree-033 and decree-044 are respected. The two medium issues (file size marginally over threshold, missing unit tests for the new behavior) should be tracked as follow-up tickets but do not block this change.

## Required Changes

None -- approved as-is. Follow-up tickets recommended for M1 and M2.
