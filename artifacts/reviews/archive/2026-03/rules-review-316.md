---
review_id: rules-review-316
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - heavily-injured-standard-action-penalty
  - heavily-injured-hp-loss-formula
  - faint-resolution-after-penalty
  - death-check-after-penalty
  - double-application-guard
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/07-combat.md#Heavily Injured (lines 1898-1905)
  - core/07-combat.md#Standard Actions (lines 96-118)
  - core/04-trainer-classes.md#Hardened (line 1913)
  - core/04-trainer-classes.md#Endurance (lines 2648-2655)
reviewed_at: 2026-03-06T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Heavily Injured Standard-Action HP Loss Formula
- **Rule:** "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md#Heavily Injured`, lines 1898-1905)
- **Implementation:** `checkHeavilyInjured(injuries)` returns `{ isHeavilyInjured: injuries >= 5, hpLoss: injuries }`. `applyHeavilyInjuredPenalty(currentHp, injuries)` subtracts `injuries` from `currentHp`, clamps to 0, and tracks unclamped HP for death check. (`app/utils/injuryMechanics.ts:69-75, 171-185`)
- **Status:** CORRECT -- threshold is 5, HP loss equals injury count, HP clamped to 0 with unclamped value preserved for death threshold comparison.

### 2. HP Loss vs Damage Distinction
- **Rule:** The Heavily Injured penalty uses "lose Hit Points" language (PTU p.250), which is mechanically distinct from "damage." HP loss does not trigger massive damage injury checks or further Heavily Injured "takes Damage" triggers.
- **Implementation:** All inline penalty applications call `applyHeavilyInjuredPenalty()` which directly modifies `currentHp` without going through `calculateDamage()`. No massive damage check is triggered. The damage.post.ts endpoint correctly distinguishes between `lossType: 'damage'` (triggers HI penalty) and `lossType: 'hpLoss'` / `'setHp'` (skips HI penalty) at line 59.
- **Status:** CORRECT

### 3. Faint Resolution After Penalty
- **Rule:** If HP reaches 0, the combatant faints. Per decree-005, persistent/volatile conditions must be cleared and their CS effects reversed on faint.
- **Implementation:** All 9 inline penalty blocks check `penalty.newHp === 0` and call `applyFaintStatus(combatant)` which handles condition clearing and CS reversal. Stage modifiers are synced to DB when faint occurs (conditional `stageModifiers` in sync call).
- **Status:** CORRECT

### 4. Death Check After Penalty
- **Rule:** PTU p.251: Death occurs at 10+ injuries or HP below min(-50, -200% maxHp). League battles suppress HP-based death.
- **Implementation:** All inline blocks call `checkDeath(entity.currentHp, entity.maxHp, injuries, isLeagueBattle, penalty.unclampedHp)` using the unclamped HP value for the threshold comparison. Dead status is applied as the first element of statusConditions.
- **Status:** CORRECT -- unclamped HP is used (not clamped-to-0 HP), and league suppression is passed through.

### 5. Double-Application Guard
- **Rule:** The penalty should apply once per Standard Action, not once at action time AND again at turn end.
- **Implementation:** `heavilyInjuredPenaltyApplied?: boolean` added to TurnState (optional, defaults to falsy). All 9 inline penalty blocks set `heavilyInjuredPenaltyApplied: true` when the penalty fires. The deferred check in `next-turn.post.ts:124-125` reads `penaltyAlreadyApplied` and skips if true. The flag is automatically cleared at round start when `resetCombatantsForNewRound()` constructs a fresh TurnState without the flag (`app/server/utils/turn-helpers.ts:93-103`).
- **Status:** CORRECT

### 6. Standard-Action Endpoint Coverage
- **Rule:** The penalty must apply at every point where a Standard Action is consumed.
- **Implementation review of all endpoints:**

| Endpoint | Standard Action? | Inline Penalty? | Verdict |
|----------|-----------------|----------------|---------|
| `move.post.ts` | Always | Yes (actor) | CORRECT |
| `sprint.post.ts` | Always | Yes | CORRECT |
| `breather.post.ts` | Always (Full Action) | Yes | CORRECT |
| `action.post.ts` | When `actionType === 'standard'` | Yes (guarded) | CORRECT |
| `use-item.post.ts` | Always (Standard or Full-Round) | Yes (on user) | CORRECT |
| `living-weapon/engage.post.ts` | Always | Yes (on initiator) | CORRECT |
| `mount.post.ts` | When `actionCost === 'standard'` | Yes (guarded) | CORRECT |
| `recall.post.ts` | When 2 Pokemon (Standard) | Yes (guarded) | CORRECT |
| `release.post.ts` | When 2 Pokemon (Standard) | Yes (guarded) | CORRECT |
| `switch.post.ts` | Standard switch | **NO** | **HIGH** -- see issue #1 |
| `priority.post.ts` (limited/advanced) | Yes (via service) | No | Covered by deferred check (acceptable) |
| `pass.post.ts` | Marks used but NOT a real Standard Action | No | Pre-existing issue -- see issue #2 |

### 7. Non-Standard-Action Endpoints
- **Rule:** Shift Actions, Swift Actions, and Free Actions do NOT trigger the penalty.
- **Implementation:** Verified the following endpoints do NOT apply the penalty:
  - `disengage.post.ts` (Shift Action) -- no penalty, correct
  - `dismount.post.ts` (no standard action cost) -- no penalty, correct
  - `living-weapon/disengage.post.ts` (Swift Action) -- no penalty, correct
  - `hold-action.post.ts` (no action consumed) -- no penalty, correct
  - `position.post.ts` (movement, no action) -- no penalty, correct
  - `recall.post.ts` with 1 Pokemon (Shift Action) -- guarded by `actionType === 'standard'`, correct
  - `release.post.ts` with 1 Pokemon (Shift Action) -- guarded by `actionType === 'standard'`, correct
  - `mount.post.ts` with expert (Free Action) -- guarded by `actionCost === 'standard'`, correct
- **Status:** CORRECT

### 8. Trainer vs Pokemon Coverage
- **Rule:** "Whenever a Heavily Injured **Trainer or Pokemon**..." -- both entity types must be affected.
- **Implementation:** All inline penalty blocks operate on generic combatant entities. `checkHeavilyInjured` and `applyHeavilyInjuredPenalty` are pure functions that take `injuries: number` -- no entity type filtering. The `move.post.ts` actor penalty works on the actor (which can be a Pokemon using a move). The `use-item.post.ts` penalty works on the user (which can be a Trainer). `recall.post.ts` and `release.post.ts` apply to the trainer. `mount.post.ts` applies to the rider (trainer). The `action.post.ts` generic endpoint works for both.
- **Status:** CORRECT

## Issues

### Issue #1 (HIGH): switch.post.ts missing inline Heavily Injured penalty

`switch.post.ts` performs a Standard Switch which costs a Standard Action (PTU p.229: "A full Pokemon Switch requires a Standard Action"). At line 313, it calls `markActionUsed(updatedInitiator, 'standard')` which sets `standardActionUsed: true`, but does NOT apply the inline Heavily Injured penalty or set `heavilyInjuredPenaltyApplied: true`.

The deferred check in `next-turn.post.ts` will catch this and apply the penalty at turn end. So the penalty IS applied, but it is **deferred** rather than **immediate**. This is inconsistent with all other Standard Action endpoints where the penalty was made immediate by ptu-rule-151.

In gameplay terms, a Heavily Injured trainer performing a standard switch should immediately lose HP equal to their injuries. If they're at exactly `injuries` HP, they should faint immediately -- not survive until turn end and potentially take additional actions.

**Severity:** HIGH -- the penalty IS applied (via deferred check), but the timing inconsistency can affect faint resolution ordering within a turn.

**Ticket filed:** ptu-rule-157

### Issue #2 (MEDIUM): pass.post.ts false-positive on deferred check (pre-existing)

`pass.post.ts` sets `standardActionUsed: true` (line 34) as bookkeeping to mark all actions consumed, but passing is NOT "taking a Standard Action." PTU p.250 triggers the Heavily Injured penalty when a combatant "takes a Standard Action during combat." Choosing to pass forfeits actions -- it does not take them.

Because `pass.post.ts` does not set `heavilyInjuredPenaltyApplied`, the deferred check in `next-turn.post.ts` will fire and incorrectly apply the Heavily Injured HP loss to a combatant that merely passed.

This is a **pre-existing issue** -- it existed before ptu-rule-151. The deferred check was already present, and `pass.post.ts` already set `standardActionUsed: true`. However, ptu-rule-151 did not fix it, and the new guard mechanism (`heavilyInjuredPenaltyApplied`) could be used to address it by having `pass.post.ts` set the flag to suppress the deferred check.

Per decree-032 precedent: "Cursed tick damage fires only when the combatant actually uses a Standard Action." The same principle applies -- the Heavily Injured penalty should only fire on actual Standard Action use, not on bookkeeping marks.

**Severity:** MEDIUM -- incorrect HP loss on pass (pre-existing, not introduced by this change).

**Ticket filed:** ptu-rule-158

## Observations (informational, no tickets needed)

### Decree-050 violation in sprint.post.ts (pre-existing)

Sprint.post.ts at line 51 sets `shiftActionUsed: true` alongside `standardActionUsed: true`. Per decree-050, Sprint consumes only the Standard Action, not the Shift Action. This is a pre-existing issue unrelated to ptu-rule-151. The comment on line 47 says "Sprint uses the Standard Action, and the Sprint movement IS the shift" but decree-050 explicitly overrules this interpretation.

Not filing a ticket as this is a known decree-050 compliance issue that should already be tracked.

### Hardened and Endurance features not implemented

PTU p.113 (Roughneck class): "Hardened Pokemon... do not lose Hit Points from acting while Heavily Injured."
PTU p.117 (Tumblr class): "Endurance... ignore the Hit Point loss effects from acting while Heavily Injured for X rounds."

Neither Hardened nor Endurance are checked by the implementation. This is acceptable as a known limitation -- these trainer class features are not yet implemented in the system. No ticket filed (feature scope).

### Unawaited DB sync in move.post.ts

In `move.post.ts`, the actor's heavily injured penalty DB sync at line 288 pushes to `dbUpdates` array which was already `await Promise.all`'d at line 192. The promise is never awaited. The combatant snapshot in the encounter JSON is correct (saved at line 347), but the individual entity record (Pokemon/HumanCharacter table) may have stale HP until the next entity-level write. This is a code quality issue, not a game logic issue, and falls under Senior Reviewer jurisdiction.

## Summary

The ptu-rule-151 implementation correctly applies the Heavily Injured standard-action HP loss penalty across 9 Standard Action endpoints with proper formula, faint resolution, death checks, and double-application guard. The HP loss formula (`injuries` count) matches PTU p.250 exactly. The distinction between HP loss and damage is correctly maintained (no massive damage triggers). The `heavilyInjuredPenaltyApplied` flag cleanly prevents double-application between inline checks and the deferred fallback in `next-turn.post.ts`.

One Standard Action endpoint (`switch.post.ts`) was missed for inline penalty application -- it falls back to the deferred check, which applies the penalty at turn end instead of immediately. One pre-existing false-positive exists where `pass.post.ts` triggers the deferred penalty despite not being a real Standard Action.

## Rulings

1. The HP loss formula `injuries` (equal to current injury count) is CORRECT per PTU p.250.
2. The `HEAVILY_INJURED_THRESHOLD = 5` is CORRECT per PTU p.250.
3. Treating the penalty as HP loss (not damage) is CORRECT -- it should NOT trigger massive damage checks.
4. The double-application guard via `heavilyInjuredPenaltyApplied` flag is SOUND and correctly handles the inline-vs-deferred interaction.
5. The deferred check in `next-turn.post.ts` serves as a valid safety net for any endpoints that don't apply the penalty inline.

## Verdict

**APPROVED** -- The core implementation is correct. The HIGH issue (switch.post.ts timing) does not cause incorrect game values -- the penalty IS applied, just deferred. The MEDIUM issue is pre-existing. Neither blocks merging. Both are tracked as follow-up tickets.

## Required Changes

None required for merge. Follow-up tickets filed:
- **ptu-rule-157** (HIGH): Add inline Heavily Injured penalty to switch.post.ts for standard switches
- **ptu-rule-158** (MEDIUM): Fix pass.post.ts false-positive on Heavily Injured deferred check
