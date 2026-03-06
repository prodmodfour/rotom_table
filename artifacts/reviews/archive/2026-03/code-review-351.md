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
  - app/server/api/encounters/[id]/pass.post.ts
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/server/utils/turn-helpers.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 1
reviewed_at: 2026-03-06T14:45:00Z
follows_up: null
---

## Review Scope

Reviewed the ptu-rule-151 implementation: Heavily Injured standard-action faint penalty. 12 commits across 11 files. The fix adds immediate HP loss (equal to injury count) when a Heavily Injured combatant takes a Standard Action during combat. A `heavilyInjuredPenaltyApplied` flag on TurnState prevents double-application with the existing deferred check in next-turn.post.ts.

PTU 1.05 p.250: "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."

Also verified against: errata-2.md (no modifications to this mechanic), all active decrees (no decree governs the heavily injured standard-action penalty directly).

### Decree Compliance

- **decree-050** (Sprint consumes only Standard Action): Sprint endpoint correctly marks `standardActionUsed: true` and applies the penalty. The endpoint still sets `shiftActionUsed: true` which violates decree-050, but that is a pre-existing issue tracked by ptu-rule-143 (still open) and is NOT introduced by this changeset.
- **decree-032** (Cursed tick fires only on actual Standard Action use): Unaffected by this change. The Cursed tick in next-turn.post.ts reads `standardActionUsed` which is unchanged by this PR.

No active decrees are violated by this implementation.

## Issues

### HIGH

#### H1: `switch.post.ts` standard switch path missing immediate heavily injured penalty

**File:** `app/server/api/encounters/[id]/switch.post.ts`, lines 306-314

A standard Pokemon switch (non-fainted, non-forced) consumes a Standard Action per PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon from its Poke Ball as a Standard Action." The endpoint calls `markActionUsed(updatedInitiator, 'standard')` at line 313, which sets `standardActionUsed: true`. However, no heavily injured penalty is applied.

The deferred fallback in next-turn.post.ts will catch this case (since `standardActionUsed` is true and `heavilyInjuredPenaltyApplied` is not set), so the penalty is **not lost** at turn end. However, this violates the ticket's stated design intent of immediate faint/death resolution. A heavily injured trainer performing a standard switch who should faint from the penalty will not faint until their turn ends via next-turn.post.ts. In the interim, their Pokemon could still act, which is incorrect if the trainer is supposed to be dead/fainted.

The fainted switch (Shift Action) and forced switch (no action cost) paths correctly do NOT need the penalty.

**Severity:** HIGH -- missed coverage path; inconsistent with the 9 other endpoints that apply the penalty immediately. The deferred fallback prevents total rules omission, but immediate resolution is the stated design requirement.

**Fix:** Add the heavily injured penalty block to `switch.post.ts` inside the standard switch branch (the `else` at line 306), after `markActionUsed` is called, matching the pattern in recall.post.ts/release.post.ts.

---

#### H2: `move.post.ts` actor penalty DB sync is fire-and-forget (unawaited promise)

**File:** `app/server/api/encounters/[id]/move.post.ts`, line 288

The `dbUpdates` array is `await Promise.all(dbUpdates)` at line 191-193. The actor's heavily injured penalty sync at line 288 pushes a new promise to `dbUpdates` AFTER this `Promise.all` has already resolved. The promise is created and begins executing, but is never awaited.

If this sync fails, the error is silently swallowed (unhandled promise rejection). The encounter's combatant JSON snapshot will correctly reflect the penalty HP, but the entity DB table (Pokemon/HumanCharacter) will retain stale HP. When the encounter is next loaded, `loadEncounter` rebuilds from the entity table, causing the HP to revert.

All other endpoints in this changeset correctly use `await syncEntityToDatabase(...)` directly (sprint.post.ts line 88, action.post.ts line 104, breather.post.ts line 220, use-item.post.ts line 225, etc.).

**Severity:** HIGH -- silent data loss risk. Entity table HP diverges from encounter state. On encounter reload, the penalty HP reverts, effectively nullifying the penalty.

**Fix:** Replace `dbUpdates.push(syncEntityToDatabase(...))` at line 288 with `await syncEntityToDatabase(...)`, matching the pattern in all other endpoints in this changeset.

### MEDIUM

#### M1: ~35 lines of identical penalty logic duplicated across 9 endpoints

**Files:** All 9 action endpoints with the penalty block (move, sprint, breather, action, use-item, engage, mount, recall, release)

The heavily injured penalty block (check injuries -> apply penalty -> handle faint -> death check -> sync to DB -> set flag) is copy-pasted across 9 endpoint files with only variable name differences. This is approximately 300+ lines of duplicated code.

The `injuryMechanics.ts` utility already provides the pure calculation functions. A higher-level helper encapsulating the full server-side workflow (check -> apply -> faint -> death -> sync -> flag) would reduce each endpoint to ~5 lines and ensure consistency when the logic changes.

**Severity:** MEDIUM -- maintainability risk. Any future change to the penalty logic must be applied to 9+ files simultaneously. The duplication also makes the switch.post.ts omission (H1) less obvious during development.

**Fix:** Extract a shared helper function into a server utility and replace the inline blocks. Can be a follow-up refactoring ticket, but should be filed now.

## What Looks Good

1. **HP loss formula is correct.** `applyHeavilyInjuredPenalty` in `app/utils/injuryMechanics.ts` computes `hpLoss = injuries` (line 181: `currentHp - hpLoss`). This matches PTU p.250: "lose Hit Points equal to the number of Injuries they currently have." The function also correctly handles the edge case where `currentHp <= 0` (returns 0 loss) and preserves `unclampedHp` for death threshold checks.

2. **This is HP loss, not damage.** The penalty correctly uses direct HP subtraction (not the `calculateDamage` pipeline), so it does NOT trigger massive damage injury checks. PTU p.250 uses "lose Hit Points" language, not "take Damage." The existing damage trigger (in damage.post.ts) correctly uses the same `applyHeavilyInjuredPenalty` but through the separate "takes Damage" code path. The two triggers are properly independent.

3. **Double-application guard is sound.** The `heavilyInjuredPenaltyApplied` boolean on TurnState prevents both inline and deferred application from firing. The flag is: (a) set to `true` by each endpoint that applies the penalty, (b) checked in next-turn.post.ts via `=== true` (so undefined defaults to false), (c) implicitly cleared at round boundaries when `resetCombatantsForNewRound` rebuilds turnState from scratch without the flag.

4. **Faint and death resolution chains are complete.** Every penalty block calls `applyFaintStatus` when HP reaches 0 (decree-005 compliance: CS reversal and condition clearing), then runs `checkDeath` with the unclamped HP for threshold evaluation, applies `Dead` status when appropriate, and handles League Battle HP-death suppression via `isLeagueBattle`.

5. **Entity sync includes stageModifiers on faint.** All penalty blocks correctly include `stageModifiers` in the sync payload when a faint occurs, ensuring decree-005 CS reversals are persisted to the entity DB record.

6. **Non-standard-action endpoints correctly excluded.** Verified that these endpoints do NOT apply the penalty: `pass.post.ts` (forfeiting actions, not taking them), `disengage.post.ts` (Swift Action per PTU), `dismount.post.ts` (no standard action cost), `hold-action.post.ts` (skips turn), `living-weapon/disengage.post.ts` (Swift Action), `aoo-resolve.post.ts` (out-of-turn, no standard action consumed), `priority.post.ts` (out-of-turn action, handled through its own service), `intercept-melee.post.ts` and `intercept-ranged.post.ts` (Interrupt actions, not Standard Actions per PTU p.227), `declare.post.ts` (declaration only, no action consumed), `position.post.ts` (movement only).

7. **Conditional application in mount/recall/release is correct.** Mount applies only when `actionCost === 'standard'` (expert mounting is free). Recall and release apply only when `actionType === 'standard'` (2-Pokemon operations). Single-Pokemon recall/release costs a Shift Action and correctly skips the penalty.

8. **Both trainers and Pokemon are covered.** The penalty is entity-type-agnostic, operating on `entity.injuries` and `entity.currentHp` which both entity types share. Pokemon are affected via move/sprint/breather/action. Trainers are affected via use-item/recall/release/mount/engage/switch.

9. **Commit granularity is good.** One commit per endpoint plus separate commits for the TurnState flag and the deferred guard. Clean history that is easy to review and bisect.

## Verdict

**CHANGES_REQUIRED**

Two high-severity issues must be addressed before approval:
- H1 is a coverage gap (switch.post.ts standard switch path missing immediate penalty)
- H2 is a data persistence bug (fire-and-forget sync in move.post.ts)

## Required Changes

1. **[H1]** Add immediate heavily injured penalty to `switch.post.ts` for the standard switch code path (lines 306-315), after `markActionUsed(updatedInitiator, 'standard')`. Apply the penalty to `updatedInitiator`. Follow the pattern in recall.post.ts. Set `heavilyInjuredPenaltyApplied: true` on the initiator's turnState. Sync to DB. Include penalty info in the response.

2. **[H2]** In `move.post.ts` line 288, change from `dbUpdates.push(syncEntityToDatabase(...))` to `await syncEntityToDatabase(...)` so the entity table write is properly awaited and errors are caught.

3. **[M1]** File a refactoring ticket to extract the duplicated penalty block into a shared helper function. This is not blocking but should be done while context is fresh.
