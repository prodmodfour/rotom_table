---
review_id: code-review-351
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-151
domain: healing
commits_reviewed:
  - f56ff690
  - 4a525c0a
  - e454ec88
  - aa320fb9
  - 0ebb8f9f
  - f990d135
  - 4ff2b83e
  - 30dedb97
  - 16298b50
  - b77a2c64
  - 9a289679
  - 2555c6e7
files_reviewed:
  - app/types/combat.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/action.post.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/utils/injuryMechanics.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/pass.post.ts
  - app/server/api/encounters/[id]/disengage.post.ts
  - app/server/api/encounters/[id]/dismount.post.ts
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/interrupt.post.ts
  - app/server/api/encounters/[id]/hold-action.post.ts
  - app/server/api/encounters/[id]/release-hold.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/server/api/encounters/[id]/declare.post.ts
  - app/server/utils/turn-helpers.ts
  - app/server/services/switching.service.ts
  - app/server/services/out-of-turn.service.ts
  - app/server/services/intercept.service.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 1
reviewed_at: 2026-03-06T14:30:00Z
follows_up: null
---

## Review Scope

Reviewing the ptu-rule-151 implementation: Heavily Injured standard-action faint penalty. 12 commits adding immediate HP loss when a Heavily Injured combatant (5+ injuries) takes a Standard Action during combat. The penalty equals the combatant's injury count (PTU p.250). Added to 9 action endpoints with a double-application guard flag in TurnState, and a guard on the existing deferred check in next-turn.post.ts.

### Decree Compliance

- **decree-050** (Sprint consumes only Standard Action): Sprint endpoint correctly marks `standardActionUsed: true` and applies the penalty. Compliant.
- **decree-032** (Cursed tick fires only on actual Standard Action use): Not directly affected by this change; the Cursed tick in next-turn.post.ts uses `standardActionUsed` which is unmodified. Compliant.

No other active decrees are violated by this implementation.

## Issues

### HIGH-001: `switch.post.ts` standard switch missing immediate heavily injured penalty

**File:** `app/server/api/encounters/[id]/switch.post.ts`, lines 306-314

A standard Pokemon switch (non-fainted, non-forced) explicitly costs a Standard Action (PTU p.229). The `switch.post.ts` endpoint calls `markActionUsed(updatedInitiator, 'standard')` which sets `standardActionUsed: true`, but does NOT apply the immediate heavily injured penalty.

The deferred fallback in `next-turn.post.ts` will catch this case (since `standardActionUsed` is true and `heavilyInjuredPenaltyApplied` is not set), so the penalty is not lost. However, the ticket's stated goal is "immediate HP loss penalty at action time." The switch endpoint is the only standard-action endpoint that relies entirely on the deferred path rather than applying the penalty immediately. This creates an inconsistency: a heavily injured trainer performing a standard switch will not see immediate faint/death resolution -- they won't faint until their turn ends, potentially allowing them to take additional actions (like moves from their other Pokemon) in the interim.

This is the same class of endpoint as recall (2-Pokemon) and release (2-Pokemon), both of which received the immediate penalty. Standard switch should too.

**Severity:** HIGH -- inconsistent behavior, delayed faint resolution allows potentially invalid state (dead trainer continues acting).

**Fix:** Add the same heavily injured penalty block to `switch.post.ts` inside the standard switch branch (the `else` branch at line 306), after `markActionUsed` is called.

---

### HIGH-002: `move.post.ts` actor penalty sync is fire-and-forget (unawaited promise)

**File:** `app/server/api/encounters/[id]/move.post.ts`, line 288

The `dbUpdates` array is awaited at line 191-193 via `Promise.all(dbUpdates)`. The actor's heavily injured penalty sync at line 288 pushes a new promise to `dbUpdates` AFTER this `Promise.all` has already resolved. This promise is never awaited. It runs as a fire-and-forget operation.

If the sync fails, the error is silently swallowed (unhandled promise rejection). The combatant snapshot in the encounter JSON will have the correct HP, but the entity table (Pokemon or HumanCharacter) may retain stale HP. On next encounter load, the entity is rebuilt from the entity table, causing HP to revert.

Other endpoints in this implementation correctly use `await syncEntityToDatabase(...)` directly (see sprint.post.ts line 88, action.post.ts line 104, etc.).

**Severity:** HIGH -- silent data loss on entity table, HP revert on encounter reload.

**Fix:** Replace `dbUpdates.push(syncEntityToDatabase(...))` with `await syncEntityToDatabase(...)` at line 288, matching the pattern used in all other endpoints in this changeset.

---

### MEDIUM-001: ~40 lines of identical penalty logic duplicated across 9 endpoints

**Files:** All 9 action endpoints with the penalty block

The heavily injured penalty block (check injuries, apply penalty, handle faint, death check, sync to DB, set flag) is copy-pasted across 9 endpoint files with only variable name differences (combatant vs user vs rider vs initiatorCombatant). This is approximately 360 lines of duplicated code.

The `injuryMechanics.ts` utility already provides the pure calculation functions (`checkHeavilyInjured`, `applyHeavilyInjuredPenalty`, `checkDeath`). A higher-level helper function could encapsulate the full workflow: check -> apply -> faint -> death -> sync -> flag. Something like:

```typescript
async function applyHeavilyInjuredStandardActionPenalty(
  combatant: Combatant,
  isLeagueBattle: boolean
): Promise<{ hpLost: number; fainted: boolean; isDead: boolean }>
```

This would reduce each endpoint's penalty code from ~35 lines to ~5 lines and ensure all endpoints stay consistent when the logic changes (e.g., if a new decree modifies the penalty behavior).

**Severity:** MEDIUM -- maintainability issue. Any future change to the penalty logic (new decree, edge case fix) must be applied to 9+ files simultaneously. The risk of drift is high.

**Fix:** Extract a shared helper function and replace the inline blocks. This can be done as a follow-up refactoring ticket since the logic is correct (except HIGH-002), but it should be done NOW while the developer is in this code.

## What Looks Good

1. **HP loss formula is correct.** `applyHeavilyInjuredPenalty` correctly computes `hpLoss = injuries` (not a flat value), clamps to 0, and preserves the unclamped value for death threshold checks. The utility functions in `injuryMechanics.ts` are clean and well-documented.

2. **Double-application guard is sound.** The `heavilyInjuredPenaltyApplied` flag on TurnState cleanly prevents the deferred check in `next-turn.post.ts` from re-applying the penalty when the inline endpoint already applied it. The flag is correctly reset each round via `resetCombatantsForNewRound` (which rebuilds turnState from scratch without preserving the flag).

3. **Faint and death resolution chains are complete.** Each endpoint correctly calls `applyFaintStatus` when HP reaches 0 (satisfying decree-005 for CS reversal and condition clearing), then runs `checkDeath` with the unclamped HP for threshold checks, and applies the `Dead` status condition when appropriate. League Battle HP-death suppression is handled via `isLeagueBattle` parameter.

4. **Entity sync includes stageModifiers on faint.** All penalty blocks correctly include `stageModifiers` in the sync payload when a faint occurs, ensuring decree-005 CS reversals are persisted.

5. **Non-standard-action endpoints correctly excluded.** Verified: `disengage.post.ts` (Shift Action), `dismount.post.ts` (no action cost), `pass.post.ts` (forfeiting, not taking), `hold-action.post.ts` (skips turn), `release-hold.post.ts` (grants actions), `declare.post.ts` (declaration only), `living-weapon/disengage.post.ts` (Swift Action), `aoo-resolve.post.ts` (Free Action), `position.post.ts` (movement only) -- none of these consume a Standard Action and correctly do NOT apply the penalty.

6. **Conditional application in mount/recall/release is correct.** Mount only applies when `actionCost === 'standard'` (expert mounting is free). Recall and release only apply when `actionType === 'standard'` (2-Pokemon operations). Single-Pokemon recall/release uses a Shift Action and correctly skips the penalty.

7. **Commit granularity is good.** One commit per endpoint plus separate commits for the TurnState flag and the deferred guard. Easy to review and bisect.

8. **Trainer and Pokemon coverage.** The penalty is entity-type-agnostic -- it operates on `combatant.entity.injuries` and `combatant.entity.currentHp`, which both Trainers and Pokemon have. Both entity types are covered.

## Verdict

**CHANGES_REQUIRED**

## Required Changes

1. **HIGH-001:** Add immediate heavily injured penalty to `switch.post.ts` for standard switch mode, matching the pattern in the other standard-action endpoints.

2. **HIGH-002:** In `move.post.ts`, change the actor penalty sync from `dbUpdates.push(syncEntityToDatabase(...))` to `await syncEntityToDatabase(...)` so the entity table write is not fire-and-forget.

3. **MEDIUM-001:** Extract the heavily injured standard-action penalty into a shared helper function (in `injuryMechanics.ts` or a new server utility) and replace the inline blocks in all 9+ endpoints. If this is deferred, file a refactoring ticket NOW (not "later").
