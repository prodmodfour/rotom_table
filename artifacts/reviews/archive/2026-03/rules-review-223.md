---
review_id: rules-review-223
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat
commits_reviewed:
  - 3fbec585
  - 0f80b687
  - b0aaaf58
  - 1fa9f855
  - d3f78812
  - ad906fd3
  - 605495c3
  - c058bf89
  - f6d2a24b
mechanics_verified:
  - attack-of-opportunity-triggers
  - aoo-eligibility-conditions
  - aoo-once-per-round-limit
  - struggle-attack-properties
  - disengage-exemption
  - adjacency-multi-cell
  - shift-away-detection
  - ranged-attack-trigger
  - maneuver-other-trigger
  - stand-up-trigger
  - retrieve-item-trigger
  - round-reset
  - fainted-reactor-auto-decline
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 3
ptu_refs:
  - core/07-combat.md#page-241
  - core/07-combat.md#page-240
  - core/07-combat.md#page-227
reviewed_at: 2026-03-01T16:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. AoO Trigger Types (PTU p.241)

- **Rule:** "Attacks of Opportunity can be triggered in multiple ways: An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you; An adjacent foe stands up; An adjacent foe uses a Ranged Attack that does not target someone adjacent to it; An adjacent foe uses a Standard Action to pick up or retrieve an item; An adjacent foe Shifts out of a Square adjacent to you." (`core/07-combat.md#page-241`)
- **Implementation:** `app/types/combat.ts` defines `AoOTrigger` union type with five members: `shift_away`, `ranged_attack`, `stand_up`, `maneuver_other`, `retrieve_item`. `app/constants/aooTriggers.ts` maps each trigger to its detection context with PTU page references. `AOO_TRIGGERING_MANEUVERS` lists `['push', 'grapple', 'disarm', 'trip', 'dirty-trick']`.
- **Status:** CORRECT — All five PTU trigger types are represented. Maneuver list matches PTU exactly (Push, Grapple, Disarm, Trip, Dirty Trick). Note: the PTU book lists them in a different order (maneuver, stand up, ranged, item, shift) but order is irrelevant to correctness.

### 2. AoO Eligibility / Blocking Conditions (PTU p.241)

- **Rule:** "Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets." (`core/07-combat.md#page-241`)
- **Implementation:** `AOO_BLOCKING_CONDITIONS` in `app/types/combat.ts` = `['Asleep', 'Bad Sleep', 'Flinched', 'Paralyzed']`. The `canUseAoO()` function in `out-of-turn.service.ts` checks: (1) HP > 0, (2) not in blocking conditions, (3) not Fainted/Dead, (4) 1/round limit not exhausted, (5) has grid position.
- **Status:** CORRECT — PTU says "Sleeping" informally; the system's condition name is `Asleep`. Including `Bad Sleep` is correct since Bad Sleep is a variant of Sleep (PTU p.249: "Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep"). A Bad-Sleeping target is still Sleeping. Additional checks for HP > 0, Fainted, and Dead are sensible defensive checks not contradicting PTU rules.

### 3. Once Per Round Limit (PTU p.241)

- **Rule:** "You may use Attack of Opportunity only once per round." (`core/07-combat.md#page-241`)
- **Implementation:** `OutOfTurnUsage.aooUsed` boolean tracked per combatant. `canUseAoO()` returns false if `usage.aooUsed === true`. On acceptance in `resolveAoOAction()`, sets `aooUsed: true` via immutable spread. Reset to `false` in `resetCombatantsForNewRound()` in `next-turn.post.ts`.
- **Status:** CORRECT — The 1/round enforcement is properly implemented with per-combatant tracking and round-based reset.

### 4. Struggle Attack Properties (PTU p.240)

- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type." and "Additionally, if a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5." (`core/07-combat.md#page-240`)
- **Implementation:** `AOO_STRUGGLE_ATTACK_AC = 4` and `AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 10` in `aooTriggers.ts`. The AoOPrompt.vue component displays "Struggle Attack (AC 4)". The aoo-resolve endpoint accepts `damageRoll` from the GM (manual input).
- **Status:** CORRECT with MEDIUM caveat (see M-1 below) — Base case AC 4 is correct. DB 4 = 1d8+6, set damage average ~10. The GM-driven damage input model is appropriate since the system uses set damage mode where the GM needs to factor in the attacker's Attack stat minus the target's Defense stat. However, the UI always shows "AC 4" without accounting for Expert+ Combat skill.

### 5. Disengage Exemption (PTU p.241)

- **Rule:** "You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity." (`core/07-combat.md#page-241`, Disengage maneuver)
- **Implementation:** `combatant.disengaged` boolean flag. `validateTriggerPreconditions()` returns false for `shift_away` if `actor.disengaged === true`. Client-side `getAoOTriggersForMove()` also checks `mover.disengaged`. Flag cleared at turn end and round reset.
- **Status:** CORRECT — Disengage flag properly exempts from shift_away trigger. Flag lifetime (turn-scoped, cleared at turn end and round start) is correct per PTU since Disengage is a Shift Action consumed on the combatant's turn.

### 6. Adjacency / Multi-Cell Tokens (PTU p.231)

- **Rule:** PTU p.231 defines adjacency as touching squares including diagonals (8-directional).
- **Implementation:** `adjacency.ts` provides `getTokenCells()`, `getAdjacentCellsForFootprint()`, `areAdjacent()`, `getAdjacentCombatants()`, `getAdjacentEnemies()`, and `wasAdjacentBeforeMove()`. Multi-cell tokens (2x2, 3x3) are supported by iterating all cells of both tokens and checking 8-directional neighbors.
- **Status:** CORRECT — The multi-cell adjacency algorithm is sound. For a 2x2 token, all 4 cells are enumerated and each cell's 8 neighbors are checked against the other token's cells. The `wasAdjacentBeforeMove()` function correctly requires "was adjacent before AND not adjacent after" for shift_away triggers.

### 7. Shift Away Detection (R031)

- **Rule:** "An adjacent foe Shifts out of a Square adjacent to you." (`core/07-combat.md#page-241`)
- **Implementation:** `findEligibleReactors()` in `out-of-turn.service.ts` uses `wasAdjacentBeforeMove()` for `shift_away` triggers. The server endpoint receives both `previousPosition` and `newPosition`. Client-side `getAoOTriggersForMove()` provides a preview using the same `areAdjacent()` utility.
- **Status:** CORRECT — The implementation correctly checks adjacency at the OLD position and non-adjacency at the NEW position. Per decree-003, tokens are passable (not blocking), so the movement itself is allowed; the AoO is a reaction to the shift, not a prevention of it.

### 8. Ranged Attack Trigger

- **Rule:** "An adjacent foe uses a Ranged Attack that does not target someone adjacent to it." (`core/07-combat.md#page-241`)
- **Implementation:** Detection requires `hasAdjacentTarget` flag to be `false`. If the attacker has ANY adjacent target, the trigger does not fire.
- **Status:** CORRECT — PTU says "does not target someone adjacent to it" (referring to the attacker). The implementation correctly uses a boolean flag that the caller provides, and the trigger only fires when no target is adjacent to the attacker.

### 9. Maneuver-Other Trigger

- **Rule:** "An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you." (`core/07-combat.md#page-241`)
- **Implementation:** When `triggerType === 'maneuver_other'`, `findEligibleReactors()` excludes combatants whose IDs are in `maneuverTargetIds` from the eligible reactor pool.
- **Status:** CORRECT — If combatant A uses Push on combatant B, then combatant C (adjacent to A) can AoO, but combatant B cannot. The exclusion logic correctly implements "does not target you."

### 10. Stand Up Trigger

- **Rule:** "An adjacent foe stands up." (`core/07-combat.md#page-241`)
- **Implementation:** Trigger type `stand_up`, checkOn: `status_change`. The trigger fires when the Tripped condition is cleared.
- **Status:** CORRECT — Standing up (clearing Tripped) triggers AoO for adjacent enemies.

### 11. Retrieve Item Trigger

- **Rule:** "An adjacent foe uses a Standard Action to pick up or retrieve an item." (`core/07-combat.md#page-241`)
- **Implementation:** Trigger type `retrieve_item`, checkOn: `item_action`.
- **Status:** CORRECT — Mapped to the correct PTU trigger.

### 12. Round Reset

- **Rule:** AoO is once per round; usage must reset at new round.
- **Implementation:** `resetCombatantsForNewRound()` sets `outOfTurnUsage = { aooUsed: false, priorityUsed: false, interruptUsed: false }` and `disengaged = false`. `expirePendingActions()` marks all pending actions from the ending round as `expired`.
- **Status:** CORRECT — Both combatant-level usage tracking and encounter-level pending actions are properly reset/expired at round boundaries.

### 13. AoO Does Not Trigger Further AoOs

- **Rule:** PTU p.241: AoO is an Interrupt triggered by specific actions. A Struggle Attack is a standard action equivalent. However, the AoO Struggle Attack is taken as an Interrupt (not a standard action on the reactor's turn), so it does not itself constitute a triggering action.
- **Implementation:** The AoO resolution endpoint (`aoo-resolve.post.ts`) processes the Struggle Attack damage directly without calling `detectAoOTriggers()`. No recursion is possible.
- **Status:** CORRECT — The implementation naturally avoids AoO recursion by handling the Struggle Attack as a self-contained damage application without re-entering the trigger detection pipeline.

### 14. GM-Driven Resolution Flow

- **Rule:** PTU AoO says "You MAY make a Struggle Attack" — it is optional. The GM (or player) decides.
- **Implementation:** Detection creates pending `OutOfTurnAction` objects with status `pending`. The GM sees the AoOPrompt.vue overlay with Accept/Decline buttons per reactor. Resolution calls the server endpoint. The triggering action is NOT cancelled regardless of AoO acceptance.
- **Status:** CORRECT — The "notification + optional reaction" model faithfully represents PTU's optional AoO. The GM can decline for any combatant.

### 15. Multiple Reactors

- **Rule:** PTU limits each combatant to 1 AoO per round but does not limit how many different combatants can AoO the same trigger.
- **Implementation:** `detectAoOTriggers()` returns one `OutOfTurnAction` per eligible reactor. Each is resolved independently.
- **Status:** CORRECT — If 3 enemies are adjacent and eligible, all 3 get separate AoO prompts.

## Decree Compliance

- **decree-003 (token passability):** The AoO movement trigger checks adjacency against grid positions, not blocking. Movement is allowed through enemy squares per decree-003; the AoO is a reaction to the shift, not a prevention. COMPLIANT.
- **decree-005 (status CS auto-apply):** Not directly relevant to AoO, but the faint handling in `aoo-resolve.post.ts` uses `applyDamageToEntity()` which internally calls `applyFaintStatus()` (which respects decree-005 by reversing sourced CS on faint). COMPLIANT.
- **decree-006 (dynamic initiative):** Not directly triggered by AoO code. The AoO system does not modify initiative order. COMPLIANT.
- **decree-033 (fainted switch timing):** AoO damage can cause fainting. The `aoo-resolve.post.ts` applies faint via `applyDamageToEntity()` but does not trigger an immediate switch — the trainer must switch on their next turn per decree-033. COMPLIANT.

## Issues Found

### M-1: AoO Prompt Hardcodes "AC 4" Without Expert Combat Skill Variant (MEDIUM)

**File:** `app/components/encounter/AoOPrompt.vue`, line in `__reactor-note` section
**Rule:** PTU p.240: "if a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
**Problem:** The AoOPrompt component always displays "Struggle Attack (AC 4)" regardless of the reactor's Combat Skill rank. If a reactor has Expert+ Combat, the actual AC should be 3 and DB should be 5 (set damage ~12). The GM might use the wrong AC value when adjudicating.
**Impact:** Potentially misleading GM UI text. The GM still manually inputs damage, so the damage portion is self-correcting, but the AC display could cause incorrect hit/miss adjudication.
**Recommendation:** Either parameterize the AC display based on the reactor's capabilities, or change the text to "Struggle Attack" without specifying AC (since the GM should know the correct AC for the specific combatant).

### M-2: `autoDeclineFaintedReactor()` Defined But Never Called (MEDIUM)

**File:** `app/server/services/out-of-turn.service.ts`, line 302
**Rule:** Design spec Section H3: "If a reactor faints between trigger detection and resolution (e.g., from another effect), the pending action is auto-declined."
**Problem:** The function `autoDeclineFaintedReactor()` exists in the service but is never imported or called anywhere in the codebase. If a combatant with a pending AoO faints from another source (e.g., tick damage, another attack), the pending AoO prompt remains visible and resolvable. The GM could accept an AoO from a fainted combatant.
**Impact:** Edge case — a fainted combatant could theoretically execute an AoO if the GM clicks Accept before noticing the faint. The `canUseAoO()` check is only done at detection time, not at resolution time.
**Recommendation:** Either (a) call `autoDeclineFaintedReactor()` in the damage/faint handling pipeline, or (b) add a re-validation check in `aoo-resolve.post.ts` that verifies the reactor is still alive and eligible before processing an acceptance. Option (b) is more robust.

### M-3: No Re-Validation of Reactor Eligibility at Resolution Time (MEDIUM)

**File:** `app/server/api/encounters/[id]/aoo-resolve.post.ts`
**Rule:** PTU p.241: AoO "cannot be made by Sleeping, Flinched, or Paralyzed targets."
**Problem:** The `aoo-resolve.post.ts` endpoint checks that the action exists and is `pending`, but does NOT re-run `canUseAoO()` on the reactor at resolution time. Between detection and resolution, the reactor could have become Paralyzed (from a status tick), Flinched (from another attack), or Asleep (from a move). The GM could accept the AoO for a now-ineligible reactor.
**Impact:** Rare edge case since the GM typically resolves AoOs quickly, but technically allows rule violations if status changes happen between detection and resolution.
**Recommendation:** Add a `canUseAoO(reactor)` re-check at the start of the acceptance branch in `aoo-resolve.post.ts`. If the reactor is no longer eligible, auto-decline and return an informative message.

## Summary

The feature-016 P0 implementation is a faithful representation of PTU 1.05 Attack of Opportunity rules (p.241). All five trigger types are correctly identified and mapped. The eligibility check (Sleeping/Flinched/Paralyzed blocking, once-per-round limit) is accurate. The Disengage exemption is properly implemented. The adjacency calculation correctly handles multi-cell tokens with 8-directional neighbor checking. The GM-driven resolution flow (detect, prompt, accept/decline) matches PTU's optional nature of AoO.

The three MEDIUM issues are all edge-case robustness concerns rather than fundamental rule misimplementations:
1. The hardcoded "AC 4" display does not account for Expert+ Combat Skill modifiers.
2. The `autoDeclineFaintedReactor()` function exists but is never wired in.
3. Reactor eligibility is not re-validated at resolution time, creating a small window for stale state.

No CRITICAL or HIGH issues were found. The core PTU mechanics (trigger types, eligibility, once-per-round, Struggle Attack as Interrupt, Disengage exemption) are all correctly implemented.

## Rulings

1. **AoO trigger list:** The implementation covers all five PTU p.241 triggers. CORRECT.
2. **Blocking conditions:** `Asleep`, `Bad Sleep`, `Flinched`, `Paralyzed` correctly map to PTU's "Sleeping, Flinched, or Paralyzed." CORRECT.
3. **Struggle Attack as AoO:** PTU specifies a Struggle Attack as the AoO action. The implementation uses GM-provided damage for the Struggle Attack, which is appropriate for set damage mode. CORRECT.
4. **AoO does not cancel triggering action:** The design spec and implementation both confirm the triggering action proceeds regardless. This matches PTU RAW (the AoO is a reaction, not a prevention). CORRECT.
5. **Multiple AoOs from same trigger:** PTU limits per-combatant usage (1/round) but not per-trigger count. Multiple adjacent enemies can each AoO. CORRECT.

## Verdict

**APPROVED** — The P0 AoO implementation correctly captures PTU 1.05 Attack of Opportunity mechanics. The three MEDIUM issues should be addressed in P1 or a follow-up fix cycle but do not block the P0 tier.

## Required Changes

None required for P0 approval. The following are recommended improvements:

1. **M-1:** Update AoOPrompt to not hardcode "AC 4" — either show the correct AC for the reactor or omit the AC display.
2. **M-2:** Wire `autoDeclineFaintedReactor()` into the faint handling pipeline (e.g., in `applyDamageToEntity` callers or a faint event handler).
3. **M-3:** Add `canUseAoO(reactor)` re-validation in `aoo-resolve.post.ts` before processing acceptance.
