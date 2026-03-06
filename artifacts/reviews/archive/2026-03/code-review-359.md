---
review_id: code-review-359
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-151
domain: healing
commits_reviewed:
  - 5a701371
  - 1a659564
  - 1178fe72
files_reviewed:
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/action.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/server/api/encounters/[id]/pass.post.ts
  - app/types/combat.ts
  - app/utils/injuryMechanics.ts
  - artifacts/tickets/open/refactoring/refactoring-145.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-06T16:30:00Z
follows_up: code-review-351
---

## Review Scope

Re-review of the D2 fix cycle for ptu-rule-151 (Heavily Injured standard-action penalty). The prior review (code-review-351) found 2 HIGH and 1 MEDIUM issue. This review verifies the 3 D2 commits that address those findings:

- **5a701371** — `switch.post.ts`: Add heavily injured penalty to standard switch path (H1 fix)
- **1a659564** — `move.post.ts`: Await actor penalty DB sync (H2 fix)
- **1178fe72** — `refactoring-145.md`: Update ticket to include switch.post.ts (M1 bookkeeping)

Also re-read all 10 action endpoints plus next-turn.post.ts and pass.post.ts to verify full consistency.

### Decree Compliance

- **decree-050** (Sprint consumes only Standard Action): Sprint endpoint still sets `shiftActionUsed: true`, violating decree-050. This is a pre-existing issue tracked by ptu-rule-143 (open). NOT introduced or worsened by this changeset.
- **decree-032** (Cursed tick on actual Standard Action): Unaffected. The Cursed tick in next-turn.post.ts reads `standardActionUsed`, which is unchanged.
- **decree-033** (Fainted switch on trainer's next turn): switch.post.ts fainted switch path correctly does NOT apply the heavily injured penalty (Shift Action, not Standard Action). Consistent with decree-033.
- **decree-047** (Other conditions do not clear on faint by default): All penalty blocks call `applyFaintStatus` which handles decree-005/047 condition clearing. No violations.
- **decree-053** (Recall clearing per RAW): switch.post.ts recall side-effects use `applyRecallSideEffects` with source-aware clearing. Pre-existing, not modified by D2.

No active decrees are violated.

## Issues

No issues found. All three findings from code-review-351 have been resolved.

## Verification of H1 Fix (switch.post.ts standard switch path)

The standard switch branch (lines 311-365) now applies the full heavily injured penalty chain after `markActionUsed(updatedInitiator, 'standard')`:

1. Checks `checkHeavilyInjured(injuries)` on the initiating combatant
2. Applies `applyHeavilyInjuredPenalty` if heavily injured and HP > 0
3. Calls `applyFaintStatus` if HP reaches 0 (decree-005 compliance)
4. Runs `checkDeath` with `unclampedHp` for death threshold evaluation
5. Applies `Dead` status condition if death check passes
6. Awaits `syncEntityToDatabase` with `currentHp`, `statusConditions`, and `stageModifiers` (on faint)
7. Sets `heavilyInjuredPenaltyApplied: true` on turnState to prevent double-application
8. Includes `heavilyInjuredPenalty` in the response payload

This exactly matches the pattern in recall.post.ts and release.post.ts. The fainted switch path (Shift Action, line 305-309) and forced switch path (no action cost, line 303-304) correctly skip the penalty.

The `isLeague` variable (line 80) is correctly used for the death check's League Battle HP-death suppression.

## Verification of H2 Fix (move.post.ts await)

Line 288 now reads `await syncEntityToDatabase(actor, {...})` instead of `dbUpdates.push(syncEntityToDatabase(...))`. The sync is properly awaited after `Promise.all(dbUpdates)` has already resolved (lines 191-193 for target damage syncs), so the actor penalty sync runs sequentially and any errors will propagate to the endpoint's catch block.

This matches the pattern in all other 9 endpoints (sprint line 88, action line 104, breather line 220, use-item line 225, engage line 212, mount line 92, recall line 257, release line 305, switch line 353).

## Verification of M1 Deferral (refactoring-145)

The refactoring ticket at `artifacts/tickets/open/refactoring/refactoring-145.md` has been updated to include `switch.post.ts` in the affected files list (10 endpoints total). The ticket correctly notes ~350+ lines of duplicated code. This is appropriately tracked as a P3/MEDIUM follow-up.

## Full Consistency Check

Re-read all 10 action endpoints. Verified:

| Endpoint | Standard Action? | Penalty Applied? | Awaited? | Flag Set? | Response? |
|----------|-----------------|-----------------|----------|-----------|-----------|
| move.post.ts | Always | Yes | Yes (D2 fix) | Yes | Yes |
| sprint.post.ts | Always | Yes | Yes | Yes | Yes |
| breather.post.ts | Always | Yes | Via bulk sync at line 220 | Yes | Yes |
| action.post.ts | When `standard` | Yes | Yes | Yes | Yes |
| use-item.post.ts | Always | Yes | Yes | Yes | Yes |
| engage.post.ts | Always | Yes | Yes | Yes | Yes |
| mount.post.ts | When `standard` | Yes | Yes | Yes | Yes |
| recall.post.ts | When 2 Pokemon | Yes | Yes | Yes | Yes |
| release.post.ts | When 2 Pokemon | Yes | Yes | Yes | Yes |
| switch.post.ts | Standard switch only | Yes (D2 fix) | Yes | Yes | Yes |

All 10 endpoints follow the same pattern. The next-turn.post.ts deferred fallback (lines 123-176) correctly guards with `!penaltyAlreadyApplied`, ensuring no double-application.

Endpoints correctly excluded: pass.post.ts (forfeiting, not taking actions), disengage (Swift Action), dismount (no standard cost), hold-action (skips turn), living-weapon/disengage (Swift Action), intercept endpoints (Interrupt actions), declare (declaration only), position (movement only), aoo-resolve (out-of-turn).

## What Looks Good

1. **H1 fix is structurally sound.** The penalty block in switch.post.ts is placed after `markActionUsed` and before DB persistence (line 372), so the combatant snapshot includes the penalty HP. The `heavilyInjuredHpLoss` and `heavilyInjuredCombatantId` variables are properly hoisted above the mode-dependent branches (lines 301-302) and only populated in the standard switch branch.

2. **H2 fix is minimal and correct.** Only 4 characters changed (removing `dbUpdates.push(` wrapper and replacing with `await`). No risk of unintended side effects.

3. **Response payload is consistent.** switch.post.ts now includes `heavilyInjuredPenalty` in the response (lines 438-444), matching the shape used by all other endpoints: `{ combatantId, hpLost, fainted }`.

4. **Commit granularity is appropriate.** One commit per fix (H1 and H2 as separate commits), plus a bookkeeping commit for the refactoring ticket update.

5. **ptu-rule-157 resolution is correct.** The switch.post.ts coverage gap identified in rules-review-316 is resolved by the same H1 fix commit. The ticket has been moved to resolved/.

## Verdict

**APPROVED**

All three findings from code-review-351 have been addressed:
- H1 (switch.post.ts missing penalty): Fixed with complete penalty chain matching the established pattern across 9 other endpoints.
- H2 (move.post.ts unawaited sync): Fixed by replacing fire-and-forget push with direct await.
- M1 (duplicated penalty logic): Deferred to refactoring-145, which has been updated to include switch.post.ts.

The implementation is consistent across all 10 Standard Action endpoints, the double-application guard is intact, and no active decrees are violated. ptu-rule-157 (filed from rules-review-316) is resolved by the H1 fix.
