---
review_id: rules-review-319
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-151
domain: healing
commits_reviewed:
  - 5a701371
  - 1a659564
  - f990d135
  - 0ebb8f9f
  - aa320fb9
  - e454ec88
  - f56ff690
mechanics_verified:
  - heavily-injured-standard-action-penalty
  - switch-standard-action-penalty
  - move-actor-penalty-db-sync
  - double-application-guard
  - faint-resolution-after-penalty
  - death-check-after-penalty
  - non-standard-action-exclusion
  - conditional-standard-action-gates
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Heavily Injured (lines 1898-1905)
  - core/07-combat.md#Switching (p.229)
  - core/04-trainer-classes.md#Hardened (line 1913)
  - core/04-trainer-classes.md#Endurance (lines 2645-2655)
reviewed_at: 2026-03-06T16:30:00Z
follows_up: rules-review-316
---

## Re-Review Context

This is a follow-up to rules-review-316 (APPROVED with notes) and code-review-351 (CHANGES_REQUIRED). The D2 fix cycle addressed two HIGH issues from code-review-351:

- **H1:** `switch.post.ts` standard switch path missing immediate heavily injured penalty (commit 5a701371)
- **H2:** `move.post.ts` actor penalty DB sync was fire-and-forget / unawaited (commit 1a659564)
- **M1:** Duplicated penalty logic across 9 endpoints -- deferred as refactoring-145 (acceptable)

Additionally, ptu-rule-157 (filed from rules-review-316 HIGH-001: switch.post.ts timing inconsistency) is resolved by the H1 fix.

## Mechanics Verified

### 1. Switch Standard-Action Penalty (H1 fix -- commit 5a701371)
- **Rule:** "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat... they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md`, lines 1898-1905). PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon from its Poke Ball as a Standard Action." Standard switch = Standard Action.
- **Implementation:** `switch.post.ts` lines 311-365 now contain the full penalty block in the standard switch branch (`else` case, after fainted-switch and forced-switch branches are excluded). The code: (1) identifies the initiating combatant, (2) calls `markActionUsed(updatedInitiator, 'standard')`, (3) checks `checkHeavilyInjured(injuries)`, (4) applies `applyHeavilyInjuredPenalty`, (5) handles faint via `applyFaintStatus`, (6) runs `checkDeath` with unclamped HP, (7) applies Dead status if needed, (8) awaits `syncEntityToDatabase` for DB persistence, (9) sets `heavilyInjuredPenaltyApplied: true`.
- **Status:** CORRECT -- the penalty is now applied immediately when the Standard Action is consumed, matching the pattern of all other Standard Action endpoints. Fainted switch (Shift Action) and forced switch (no action cost) correctly skip the penalty.

### 2. Move Actor Penalty DB Sync (H2 fix -- commit 1a659564)
- **Rule:** The entity database record must reflect the penalty HP loss to ensure persistence across encounter reloads.
- **Implementation:** `move.post.ts` line 288 changed from `dbUpdates.push(syncEntityToDatabase(...))` to `await syncEntityToDatabase(...)`. The `dbUpdates` array was already `Promise.all`'d at lines 191-193, so appending after resolution made the sync fire-and-forget. The fix ensures the sync is properly awaited and any errors are propagated to the HTTP response.
- **Status:** CORRECT -- the entity table now reliably reflects the actor's post-penalty HP. This matches the pattern used in all other endpoints (sprint, action, breather, use-item, engage, mount, recall, release, switch).

### 3. Double-Application Guard (re-verified)
- **Rule:** The penalty must fire exactly once per Standard Action, not once inline AND again at turn end.
- **Implementation:** `heavilyInjuredPenaltyApplied?: boolean` on TurnState (`combat.ts` line 143). All 10 Standard Action endpoints (now including switch.post.ts) set this flag when the penalty fires. The deferred check in `next-turn.post.ts` line 124 reads `penaltyAlreadyApplied = currentCombatant.turnState?.heavilyInjuredPenaltyApplied === true` and skips when true (line 125). The flag is implicitly cleared at round start by `resetCombatantsForNewRound()` which constructs a fresh TurnState without the flag.
- **Status:** CORRECT -- switch.post.ts now participates in the guard, eliminating the gap that caused the timing inconsistency noted in rules-review-316.

### 4. Faint Resolution After Penalty (re-verified)
- **Rule:** If HP reaches 0 from the penalty, the combatant faints. Per decree-005, persistent/volatile conditions must be cleared and their CS effects reversed.
- **Implementation:** All 10 penalty blocks (including the new switch.post.ts block) check `penalty.newHp === 0` and call `applyFaintStatus(combatant)`. Stage modifiers are included in the DB sync payload when faint occurs.
- **Status:** CORRECT

### 5. Death Check After Penalty (re-verified)
- **Rule:** PTU p.251: Death at 10+ injuries or HP below min(-50, -200% maxHp). League battles suppress HP-based death.
- **Implementation:** All penalty blocks call `checkDeath(entity.currentHp, entity.maxHp, injuries, isLeagueBattle, penalty.unclampedHp)` using the unclamped HP for threshold comparison. `isLeagueBattle` is correctly derived from `record.battleType === 'trainer'` in switch.post.ts (line assigned as `isLeague` at line 80, used at line 339).
- **Status:** CORRECT

### 6. Non-Standard-Action Exclusion (re-verified)
- **Rule:** Only Standard Actions trigger the penalty. Shift Actions, Swift Actions, and Free Actions do not.
- **Implementation in switch.post.ts:** The penalty block is inside the standard switch branch only. Fainted switch (Shift Action, line 305) and forced switch (no action cost, line 303) correctly bypass the penalty block entirely. The response correctly includes `heavilyInjuredPenalty` data only when the penalty fires (line 438).
- **Status:** CORRECT

### 7. Conditional Standard-Action Gates (re-verified)
- **Rule:** Some endpoints conditionally consume a Standard Action depending on the operation variant.
- **Implementation across all endpoints:**
  - `mount.post.ts`: Guarded by `mountResult.actionCost === 'standard'` (expert = free)
  - `recall.post.ts`: Guarded by `actionType === 'standard'` (2 Pokemon = standard, 1 = shift)
  - `release.post.ts`: Guarded by `actionType === 'standard'` (same logic)
  - `action.post.ts`: Guarded by `body.actionType === 'standard'`
  - `switch.post.ts`: Guarded by the standard switch branch structure (not fainted, not forced)
- **Status:** CORRECT -- all conditional gates properly restrict the penalty to actual Standard Action consumption.

### 8. Complete Standard-Action Endpoint Coverage (re-verified)

| Endpoint | Standard Action? | Inline Penalty? | Verdict |
|----------|-----------------|----------------|---------|
| `move.post.ts` | Always | Yes (actor, now properly awaited) | CORRECT |
| `sprint.post.ts` | Always | Yes | CORRECT |
| `breather.post.ts` | Always (Full Action) | Yes | CORRECT |
| `action.post.ts` | When `actionType === 'standard'` | Yes (guarded) | CORRECT |
| `use-item.post.ts` | Always (Standard or Full-Round) | Yes (on user) | CORRECT |
| `living-weapon/engage.post.ts` | Always | Yes (on initiator) | CORRECT |
| `mount.post.ts` | When `actionCost === 'standard'` | Yes (guarded) | CORRECT |
| `recall.post.ts` | When 2 Pokemon (Standard) | Yes (guarded) | CORRECT |
| `release.post.ts` | When 2 Pokemon (Standard) | Yes (guarded) | CORRECT |
| `switch.post.ts` | Standard switch | **Yes (D2 fix)** | CORRECT |

All 10 Standard Action endpoints now apply the penalty immediately with proper DB sync.

## Decree Compliance

- **decree-050** (Sprint = Standard Action only): The penalty in `sprint.post.ts` correctly fires on the Standard Action use. The endpoint still sets `shiftActionUsed: true` which is a pre-existing decree-050 violation (ptu-rule-143), not introduced by this changeset.
- **decree-032** (Cursed tick fires only on actual Standard Action use): Unaffected. The Cursed tick in next-turn.post.ts is independent of this penalty.
- **decree-033** (Fainted Pokemon switch on trainer's next turn): The fainted switch path in switch.post.ts correctly costs a Shift Action and skips the Heavily Injured penalty. No conflict.
- **decree-047** (Other conditions do not clear on faint by default): Faint from the penalty triggers `applyFaintStatus` which handles condition clearing per decree-005/decree-047 rules. No conflict.
- **decree-053** (Other conditions clear on recall per RAW): The switch endpoint calls `applyRecallSideEffects` for the recalled Pokemon before the penalty is applied to the trainer/initiator. Penalty application and recall side-effects are independent operations. No conflict.

No active decrees are violated.

## Pre-existing Issues (not in D2 scope)

1. **ptu-rule-158** (MEDIUM, still open): `pass.post.ts` false-positive on the deferred Heavily Injured check. Pass sets `standardActionUsed: true` for bookkeeping but is not a real Standard Action. The deferred check fires incorrectly. Not addressed by D2 (correctly out of scope).

2. **Decree-050 violation in sprint.post.ts** (pre-existing): Sprint still sets `shiftActionUsed: true`. Tracked by ptu-rule-143 (still open). Not introduced by this changeset.

3. **Hardened and Endurance features not implemented**: PTU p.113 (Roughneck): "Hardened Pokemon... do not lose Hit Points from acting while Heavily Injured." PTU p.117 (Tumblr): "Endurance... ignore the Hit Point loss effects from acting while Heavily Injured for X rounds." Neither is checked by the implementation. Acceptable as a known feature gap -- these trainer class features are not yet in the system.

## Summary

The D2 fix cycle successfully resolves both HIGH issues from code-review-351:

1. **H1 resolved:** `switch.post.ts` now applies the Heavily Injured penalty immediately in the standard switch path, with full faint/death/DB-sync handling. The penalty block follows the exact same pattern as the other 9 endpoints. This also resolves ptu-rule-157.

2. **H2 resolved:** `move.post.ts` actor penalty DB sync changed from fire-and-forget (`dbUpdates.push(...)`) to properly awaited (`await syncEntityToDatabase(...)`). Entity table HP now reliably persists.

3. **M1 deferred:** Duplicated penalty logic across 10 endpoints tracked as refactoring-145. Acceptable deferral -- the duplication is consistent and each block is self-contained.

All 10 Standard Action endpoints now apply the Heavily Injured penalty immediately with:
- Correct HP loss formula (equal to injury count, PTU p.250)
- HP loss (not damage) distinction maintained
- Faint resolution with decree-005 CS reversal
- Death check with unclamped HP and League suppression
- Proper DB persistence via awaited `syncEntityToDatabase`
- Double-application guard via `heavilyInjuredPenaltyApplied` flag

## Rulings

1. The switch.post.ts penalty placement (inside the standard switch branch, after `markActionUsed`, before encounter DB persist) is CORRECT and matches the timing requirements.
2. The `await syncEntityToDatabase(...)` pattern in move.post.ts is CORRECT and consistent with all other endpoints.
3. The overall endpoint coverage (10 Standard Action endpoints with inline penalty, deferred fallback in next-turn.post.ts as safety net) is COMPLETE.
4. All D2 fixes maintain proper decree compliance.

## Verdict

**APPROVED** -- The D2 fix cycle resolves all code-review-351 findings (H1, H2). No new issues introduced. ptu-rule-157 is resolved by the switch.post.ts fix. ptu-rule-158 remains open as a pre-existing issue (out of D2 scope). The implementation correctly enforces PTU p.250 across all Standard Action code paths.

## Required Changes

None. All issues from code-review-351 are resolved.
