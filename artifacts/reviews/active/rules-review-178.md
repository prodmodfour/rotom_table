---
review_id: rules-review-178
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 11a42f3
  - 8a3e507
  - 06bcb11
mechanics_verified:
  - temporary-condition-lifetime-during-declaration
  - trainer-acted-state-at-phase-transition
  - resolution-action-economy-reset
  - three-phase-turn-progression-integrity
  - declaration-order-preservation
  - initiative-reorder-phase-awareness
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative — League Battles)
  - core/07-combat.md#Page 244 (Take a Breather — Tripped/Vulnerable)
  - core/07-combat.md#Page 239 (Maneuver: Sprint)
  - core/07-combat.md#Page 240 (Maneuver: Trip)
reviewed_at: 2026-02-27T19:50:00Z
follows_up: rules-review-175
---

## Review Scope

Re-review of ptu-rule-107 fix cycle. The initial implementation was approved in rules-review-175 (APPROVED). The senior reviewer (code-review-198) identified one CRITICAL and two HIGH issues, all with PTU mechanics implications. This review verifies the fix commits correctly address those issues per PTU 1.05 rules.

**Fix commits reviewed:**
- `11a42f3` — Skip tempConditions clearing during declaration phase (C1 fix)
- `8a3e507` — Reset hasActed for all trainers at declaration->resolution transition (H1 fix)
- `06bcb11` — Unit tests for three-phase flow (M2 fix)

**Decrees verified:**
- decree-021: Two-phase trainer system. Fixes do not alter the declaration/resolution flow validated in rules-review-175. Declaration order (low-to-high) and resolution order (high-to-low) remain intact. **Compliant.**
- decree-006: Dynamic initiative reorder. Not directly modified by these fixes. Phase-aware reorder verified in rules-review-175. **Not impacted.**
- decree-005: Auto-apply CS from status conditions. Not impacted. **Not impacted.**

## Mechanics Verified

### 1. Temporary Condition Lifetime During Declaration Phase (C1 Fix)

- **Rule:** PTU temporary conditions last "until the end of [the combatant's] next turn" (various sources, e.g., Take a Breather on `core/07-combat.md#Page 244`: "They then become Tripped and are Vulnerable until the end of their next turn"). The Sprint maneuver (`core/07-combat.md#Page 239`) lasts "for the rest of your turn." These conditions end when the combatant actually takes their turn -- performing actions, moving, and executing game-mechanical effects.
- **Decree:** Per decree-021, "Declaration phase (trainer_declaration): Trainers declare actions in order from lowest to highest speed. Actions are recorded but NOT executed." The declaration phase is explicitly not an execution phase. Trainers are recording intent, not acting.
- **The Bug:** Before the fix, `next-turn.post.ts` unconditionally cleared `tempConditions = []` on line 65 when advancing past a combatant, regardless of phase. This meant a trainer with Sprint or Tripped from a prior Pokemon phase would lose those conditions during declaration, before their actual turn (resolution).
- **The Fix (11a42f3):** Two changes:
  1. Line 67: Added `if (currentPhase !== 'trainer_declaration')` guard around `currentCombatant.tempConditions = []`. Temporary conditions are now preserved during declaration.
  2. Lines 206-208 in `resetResolvingTrainerTurnState`: Added `trainer.tempConditions = []`. Temporary conditions are now cleared when the trainer's resolution turn begins (the actual "next turn" in PTU terms).
- **Analysis:** This is the correct PTU interpretation. A declaration is a meta-game step -- the trainer states intent, but no game-mechanical actions occur. "Until the end of your next turn" means the next time the combatant actually acts (uses Standard/Shift/Swift actions, moves, executes effects). In League Battles, that happens during the resolution phase, not declaration. A trainer who was Tripped during a prior Pokemon phase remains Tripped through declaration (they can't move anyway during declaration -- it's just intent recording) and the Trip is cleared when their resolution turn arrives, where they would need to spend a Shift Action getting up per PTU Trip rules.
- **Status:** CORRECT

### 2. Trainer Acted State at Phase Transition (H1 Fix)

- **Rule:** PTU p.227: "In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." Declaration and resolution are two distinct steps. After all trainers declare, they enter the resolution phase -- their "actual" turns.
- **The Bug:** Before the fix, when transitioning from declaration to resolution, only the first resolving trainer had `hasActed` reset (via `resetResolvingTrainerTurnState`). All other trainers still had `hasActed = true` from the declaration phase's turn-progression marking. This created an inconsistent state where UI components checking `hasActed` would incorrectly show non-first trainers as "already acted" before their resolution turn.
- **The Fix (8a3e507):** Added `resetAllTrainersForResolution(combatants, resolutionOrder)` which uses a Set of trainer IDs from the resolution order and resets `hasActed = false` for all of them. This runs before `resetResolvingTrainerTurnState` which then gives the first resolver full action economy.
- **Analysis:** This correctly models the PTU intent. At the start of the resolution phase, no trainer has yet acted in the game-mechanical sense. The declaration phase marked them as "acted" purely for internal turn-index progression, not because they consumed game actions. Resetting all trainers' `hasActed` flags at the phase boundary correctly represents that all trainers are entering a new action phase where none has yet resolved. The first resolver then gets full action economy immediately, and subsequent resolvers get it when their turn comes (via the mid-resolution `resetResolvingTrainerTurnState` call on line 148).
- **Status:** CORRECT

### 3. Resolution Action Economy Reset

- **Rule:** PTU trainers get "one Standard Action, one Shift Action, and one Swift Action" on their turn (`core/07-combat.md#Page 227`). Per decree-021, trainers "do NOT get action economy during the declaration phase. The declaration phase is purely for recording intent. The actual standard/shift/swift actions are consumed during resolution."
- **Implementation (verified in source):** `resetResolvingTrainerTurnState` (lines 200-218 of `next-turn.post.ts`) sets:
  - `hasActed = false`
  - `actionsRemaining = 2` (Standard + Swift)
  - `shiftActionsRemaining = 1`
  - `tempConditions = []` (new, from C1 fix)
  - Full `turnState` reset with all action flags false
- **Analysis:** The action economy values (2 actions remaining, 1 shift) match the standard PTU turn allocation. The `tempConditions` clearing is now correctly placed here (see mechanic #1). This function is called both at phase transition (for the first resolver) and mid-resolution (for subsequent resolvers on line 148), ensuring every resolving trainer gets fresh action economy.
- **Status:** CORRECT

### 4. Three-Phase Turn Progression Integrity

- **Rule:** PTU p.227: "all Trainers should take their turns, first, before any Pokemon act" and the two-phase trainer subdivision within that.
- **Implementation:** The three-phase cycle remains unchanged from the initial implementation (approved in rules-review-175):
  - `trainer_declaration` exhausted -> `trainer_resolution` (now with full hasActed reset)
  - `trainer_resolution` exhausted -> `pokemon`
  - `pokemon` exhausted -> new round, back to `trainer_declaration`
- **Analysis:** The fixes do not alter the phase transition logic structure. Phase transitions still occur at the correct boundaries (when `currentTurnIndex >= turnOrder.length`). The resolution order is still `[...trainerTurnOrder].reverse()` (high-to-low speed). The declaration order for new rounds is still the stored `trainerTurnOrder` (low-to-high speed). Declarations are still cleared on new round start (`clearDeclarations = true`).
- **Status:** CORRECT (unchanged from rules-review-175)

### 5. Declaration Order Preservation

- **Rule:** PTU p.227: "Trainers declare their actions in order from lowest to highest speed."
- **Implementation:** The declaration order is determined by `trainerTurnOrder` which is sorted ascending at encounter start (`sortByInitiativeWithRollOff(trainers, false)` in `start.post.ts` line 99). This order is preserved through phase transitions -- when starting a new round, `turnOrder = [...trainerTurnOrder]` (line 137 of `next-turn.post.ts`).
- **Analysis:** Neither fix commit modifies `trainerTurnOrder` or the declaration phase's turn order. The ascending sort (lowest speed first) is preserved. Verified that `resetAllTrainersForResolution` only modifies `hasActed` -- it does not touch turn orders.
- **Status:** CORRECT (unchanged from rules-review-175)

### 6. Initiative Reorder Phase Awareness (decree-006 interaction)

- **Rule:** Per decree-006, initiative reorders dynamically on speed changes. Per decree-021, sort direction depends on current phase.
- **Implementation:** `reorderInitiativeAfterSpeedChange` in `encounter.service.ts` (lines 320-436) was not modified by any fix commit. The phase-aware logic verified in rules-review-175 remains intact:
  - `trainer_declaration`: ascending sort
  - `trainer_resolution`: descending sort
  - `pokemon`: descending sort
- **Analysis:** No impact from the fix commits. The interaction between decree-006 and decree-021 remains correctly implemented.
- **Status:** CORRECT (unchanged from rules-review-175)

## Unit Test Mechanics Verification (06bcb11)

The unit tests in `app/tests/unit/api/league-battle-phases.test.ts` (598 lines) replicate the pure functions from `next-turn.post.ts` and verify the following PTU-relevant scenarios:

1. **Phase transitions** (lines 232-356): Full round cycle with 2 trainers (speed 30, 80) and 2 Pokemon (speed 90, 60). Verifies:
   - Declaration order: `['trainer-slow', 'trainer-fast']` (low-to-high) -- CORRECT per PTU p.227
   - Resolution order: `['trainer-fast', 'trainer-slow']` (high-to-low) -- CORRECT per PTU p.227
   - Pokemon order: `['poke-1', 'poke-2']` (high-to-low) -- CORRECT per PTU p.227
   - Round increment and declarations cleared at round boundary -- CORRECT

2. **C1 fix verification** (lines 358-423): Trainer with `tempConditions: ['Sprint']` during declaration phase -- conditions preserved. Same trainer during resolution phase -- conditions cleared. Also verifies `resetResolvingTrainerTurnState` clears tempConditions. -- CORRECT per PTU "until next turn" semantics.

3. **H1 fix verification** (lines 425-469): Three trainers go through declaration. At transition to resolution, ALL three have `hasActed = false`. -- CORRECT per PTU: no trainer has "acted" yet at resolution start.

4. **Declaration endpoint validation** (lines 471-542): Verifies phase check, current-turn check, duplicate check, trainer-only check, valid action types. -- CORRECT per decree-021 intent.

5. **Resolution turn state management** (lines 544-597): Verifies fresh action economy (2 standard, 1 shift) for resolving trainers. -- CORRECT per PTU p.227 action types.

The test helper `simulateNextTurn` (lines 119-225) faithfully mirrors the `next-turn.post.ts` logic including both C1 and H1 fixes. The replicated pure functions match the source. This provides mechanical confidence that the tested behavior matches the implementation.

## Summary

All three fix commits correctly address the PTU mechanics issues identified in code-review-198:

1. **C1 (tempConditions during declaration):** Fixed correctly. PTU temporary conditions ("until next turn") now persist through the declaration phase and are cleared at resolution, which is the trainer's actual turn in the action-economy sense. This correctly handles Sprint (self-buff lasting "rest of your turn"), Trip (opponent knocked over, spends Shift to get up), Vulnerable (no evasion, cleared at end of next turn), and Take a Breather consequences (Tripped + Vulnerable until end of next turn).

2. **H1 (hasActed reset for all trainers):** Fixed correctly. All trainers enter the resolution phase with `hasActed = false`, accurately representing that no trainer has yet taken game-mechanical actions. The first resolver immediately gets full action economy, subsequent resolvers get it as their resolution turn arrives.

3. **M2 (unit tests):** Tests correctly verify the PTU mechanics. Declaration/resolution/pokemon ordering matches PTU p.227. Temporary condition persistence and clearing are verified. Phase transition state is verified for all trainers, not just the first.

## Rulings

1. **Declaration is not a "turn" for temporary condition purposes:** CONFIRMED. Per decree-021, declaration is "recording intent, not executing." PTU temporary conditions expire on the combatant's actual turn, which in League Battles is the resolution phase. The C1 fix correctly implements this interpretation.

2. **All trainers enter resolution with clean acted state:** CONFIRMED. At the boundary between declaration and resolution, all trainers should appear as "not yet acted" because resolution is their actual turn phase. The H1 fix correctly implements this.

3. **Resolution action economy matches standard PTU turn:** CONFIRMED. Each resolving trainer receives the standard PTU action allocation (1 Standard, 1 Shift, 1 Swift). The `resetResolvingTrainerTurnState` function provides this correctly.

4. **Test mechanical accuracy:** CONFIRMED. The unit tests use correct speed values, correct sort orders, and correctly verify the PTU-mandated phase progression.

## Verdict

**APPROVED** -- All three fix commits correctly implement PTU 1.05 mechanics. The C1 fix preserves temporary conditions through the declaration phase per PTU "until next turn" semantics. The H1 fix resets all trainer acted flags at the declaration-to-resolution boundary, correctly reflecting that resolution is the actual turn. Unit tests verify the mechanical correctness of the three-phase flow. No new PTU mechanics issues introduced.

## Required Changes

None.
