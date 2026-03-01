---
review_id: rules-review-216
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - 2c86d50c
  - a86b86d0
  - a805fd75
  - 39c0bb06
  - 261d7771
  - 29e33886
  - 8fad2e34
  - d646b77a
mechanics_verified:
  - fainted-switch-shift-action
  - fainted-switch-timing-decree-033
  - forced-switch-no-action-cost
  - forced-switch-trapped-bypass
  - league-switch-restriction
  - league-fainted-switch-exemption
  - league-forced-switch-exemption
  - auto-skip-uncommandable-pokemon
  - recall-side-effects-on-switch
  - websocket-broadcast-switch-events
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 3
ptu_refs:
  - core/07-combat.md#page-229-pokemon-switching
  - core/07-combat.md#page-229-fainted-switch-shift-action
  - core/07-combat.md#page-229-league-switch-restriction
  - core/07-combat.md#page-230-league-battle-example
  - core/07-combat.md#page-232-full-contact-example
  - core/07-combat.md#page-247-volatile-afflictions
  - core/07-combat.md#page-247-trapped
reviewed_at: 2026-03-01T14:30:00Z
follows_up: rules-review-208
---

## P0 Fix Verification

Before reviewing P1 additions, verified that all P0 issues from rules-review-208 have been addressed:

- **CRITICAL-001 (Trapped check):** FIXED. `validateSwitch()` now includes step 3b checking both `statusConditions` and `tempConditions` for `Trapped` and `Bound` (`switching.service.ts:377-383`). Also correctly checks `tempConditions` array as a secondary source. The forced switch validation (`validateForcedSwitch`) correctly SKIPS this check with an explicit comment explaining the override.

- **HIGH-001 (Volatile status clearing on recall):** FIXED. `switch.post.ts:221-238` now uses `RECALL_CLEARED_CONDITIONS` from `constants/statusConditions.ts` to filter the recalled Pokemon's DB status conditions. Uses the decree-038 behavior-flag approach (`clearsOnRecall`) rather than a hardcoded volatile list. Sleep/Bad Sleep correctly excluded from recall clearing per decree-038 (`clearsOnRecall: false`).

- **HIGH-002 (Temp HP clearing on recall):** FIXED. Same DB update block sets `temporaryHp: 0` (`switch.post.ts:234`).

- **MEDIUM-001 (Whirlwind in forced comment):** FIXED. `SwitchAction.forced` JSDoc in `combat.ts:121` now reads: `"Whether forced by a move with recall mechanics (Roar, etc.) -- per decree-034, only moves with explicit recall text qualify"`. Correctly excludes Whirlwind reference.

- **MEDIUM-002 (stageModifiers on recall):** FIXED. Same DB update block sets `stageModifiers: JSON.stringify({})` (`switch.post.ts:235`).

All five P0 review issues are resolved. The recall side-effects are now correctly applied in a single DB update after combatant removal.

---

## Mechanics Verified

### 1. Fainted Switch as Shift Action

- **Rule:** "Trainers may Switch out Fainted Pokemon as a Shift Action." (`core/07-combat.md#page-229`)
- **Implementation:** `switching.service.ts:validateFaintedSwitch()` (lines 470-508) validates three conditions: (a) recalled Pokemon must be fainted (`entity.currentHp <= 0`), (b) it must be the trainer's turn (`currentTurnCombatantId === trainerId`), (c) trainer must have Shift Action available (`!shiftActionUsed`). The switch endpoint (`switch.post.ts:293-298`) marks only the Shift Action as used via `markActionUsed(updatedTrainer, 'shift')`, leaving the trainer's Standard Action available for other uses (e.g., throwing a Poke Ball).
- **PTU Verification:** The Full Contact example (p.232) confirms: "Trainer A recalls the Fainted Sandshrew as a Shift Action, and sends out Hoppip again as a Free Action. Since Sandshrew was fainted, no turn is lost." The recall = Shift Action, the release = Free Action (modeled as part of the same endpoint call). Trainer A still has their Standard Action available ("Trainer A still has his Standard Action, which he spends throwing a Poke Ball at the Raticate"). This matches the implementation exactly.
- **Status:** CORRECT

### 2. Fainted Switch Timing (decree-033)

- **Rule:** Per decree-033: "fainted Pokemon switching happens on the trainer's next available turn in initiative order, not as an immediate reaction."
- **Implementation:** Both server (`validateFaintedSwitch` checks `currentTurnCombatantId === trainerId`) and client (`isFaintedSwitchDisabled` in CombatantCard checks `currentId !== trainerCombatantId`) enforce that the fainted switch can only happen on the trainer's turn. The fainted Pokemon remains on the field (with fainted visual styling) until the trainer's initiative arrives.
- **Decree Compliance:** The implementation matches decree-033's ruling exactly. The "immediate case" (Pokemon faints on its own trainer's turn) is handled naturally -- since it's already the trainer's turn, the fainted switch can proceed immediately.
- **Status:** CORRECT

### 3. Forced Switch - No Action Cost

- **Rule:** PTU p.229 flowchart: "Are you Switching out a Fainted Pokemon or due to a forced effect such as Roar?" leads to "You may NOT Command your Pokemon" (in League) and implies the switch is handled differently. Forced switches are NOT initiated by the trainer.
- **Implementation:** `switch.post.ts:291-292` -- when `isForcedSwitch` is true, NO action is marked as used (empty block with comment). `validateForcedSwitch()` skips action availability check entirely and skips turn check (can happen on any combatant's turn). The `buildSwitchAction` records `actionType: 'forced_switch'` with `actionCost: 'shift'` (for logging only, not consumed).
- **Status:** CORRECT

### 4. Forced Switch - Trapped Bypass

- **Rule:** PTU does not explicitly state whether forced switches (Roar) override the Trapped condition. In the main Pokemon video games, Roar/Whirlwind override trapping effects. Per decree-034, Roar has its own recall mechanic distinct from voluntary switching.
- **Implementation:** `validateForcedSwitch()` (line 554) explicitly skips the Trapped check with comment: "NOTE: Trapped check is SKIPPED for forced switches -- the move overrides it."
- **Analysis:** There is no PTU 1.05 text or active decree governing whether forced switches override Trapped. The implementation follows video game precedent (Roar/Whirlwind break trapping). This is a reasonable design choice but represents an unresolved ambiguity. See MEDIUM-001.
- **Status:** NEEDS REVIEW (decree-need filed)

### 5. League Battle Switch Restriction

- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md#page-229`)
- **Implementation:** `switching.service.ts:canSwitchedPokemonBeCommanded()` (lines 599-615) returns `false` only when: (a) it IS a League Battle AND (b) it is NOT a fainted switch AND (c) it is NOT a forced switch. The switch endpoint (`switch.post.ts:260-261`) applies this to the new combatant's `turnState.canBeCommanded`.
- **Status:** CORRECT

### 6. League Fainted Switch Exemption

- **Rule:** PTU p.229 exempts fainted replacements: "unless... they were Recalling and replacing a Fainted Pokemon." The League example (p.230) confirms: "Since Sandshrew was fainted, no turn is lost."
- **Implementation:** `canSwitchedPokemonBeCommanded()` returns `true` when `isFaintedSwitch` is true, regardless of League status. The replacement Pokemon CAN be commanded.
- **Status:** CORRECT

### 7. League Forced Switch Exemption

- **Rule:** PTU p.229 exempts forced switches: "unless the Switch was forced by a Move such as Roar."
- **Implementation:** `canSwitchedPokemonBeCommanded()` returns `true` when `isForcedSwitch` is true, regardless of League status.
- **Status:** CORRECT

### 8. Auto-Skip Uncommandable Pokemon in League Pokemon Phase

- **Rule:** PTU p.229 restriction means the Pokemon effectively loses its turn. It should be automatically skipped during the Pokemon phase of initiative.
- **Implementation:** `next-turn.post.ts` contains `skipUncommandablePokemon()` function (lines 575-594) that advances the turn index past any Pokemon with `canBeCommanded === false` AND `currentHp > 0` (not fainted -- fainted skip is separate). This is called at four entry points: (a) mid-pokemon-phase turn advance (line 221), (b) transition from declaration to pokemon phase when all trainers skipped (line 249), (c) transition from resolution to pokemon phase (line 286), (d) transition from declaration to pokemon phase when no declarations (line 269). Skipped Pokemon are marked `hasActed = true`.
- **PTU Verification:** The auto-skip correctly models the PTU rule. A Pokemon that "cannot be commanded" has no turn during the pokemon phase. The `canBeCommanded` is reset to `true` at new round boundary via `resetCombatantsForNewRound()` (lines 510-514).
- **Status:** CORRECT

### 9. Recall Side-Effects Preserved Across Switch Modes

- **Rule:** PTU p.247: Volatile conditions, temp HP, and combat stages clear on recall regardless of switch type.
- **Implementation:** The recall side-effects DB update (`switch.post.ts:221-238`) runs unconditionally for ALL switch modes (standard, fainted, forced). The code path is shared -- it executes after `removeCombatantFromEncounter()` and before building the new combatant. This means a forced switch still properly clears volatile conditions, temp HP, and combat stages on the recalled Pokemon.
- **Status:** CORRECT

### 10. WebSocket Broadcast for Switch Events

- **Rule:** Design requirement -- all switch types should broadcast to connected clients for GM-Group sync.
- **Implementation:** `switch.post.ts:344-357` broadcasts a `pokemon_switched` event with `actionCost` ('standard', 'shift', or 'none'), `canActThisRound`, trainer/recalled/released names, and the full encounter response. The broadcast runs for all switch modes.
- **Status:** CORRECT

### 11. UI: Fainted Switch Button Visibility and Disabling

- **Rule:** Fainted switch should only be available when there's a fainted Pokemon, and only enabled on the trainer's turn with Shift Action available.
- **Implementation:** `CombatantCard.vue` -- `canShowFaintedSwitchButton` (lines 437-452) checks for trainer with fainted Pokemon OR fainted Pokemon with owner. `isFaintedSwitchDisabled` (lines 459-485) checks it's the trainer's turn and Shift Action is available.
- **Status:** CORRECT

### 12. UI: Force Switch Button Visibility

- **Rule:** Force switch is GM-triggered, available on any owned Pokemon.
- **Implementation:** `CombatantCard.vue` -- `canShowForceSwitchButton` (lines 492-496) shows for Pokemon combatants with an `ownerId`. No disable logic (GM can force switch at any time).
- **Status:** CORRECT

### 13. SwitchPokemonModal Mode Support

- **Rule:** The modal should adapt its UI and behavior based on switch mode.
- **Implementation:** `SwitchPokemonModal.vue` accepts `mode` prop ('standard' | 'fainted' | 'forced'). Title, badge, confirm button text, and League warning all adapt. The `confirmSwitch()` function passes `faintedSwitch` and `forced` flags through to `executeSwitch()`. League warning only shows for standard mode (fainted/forced are exempt).
- **Status:** CORRECT

### 14. GM Page Modal Resolution (Fainted Pokemon ID)

- **Rule:** When clicking "Fainted Switch" on a trainer card, the modal must receive the correct fainted Pokemon's combatant ID.
- **Implementation:** `gm/index.vue` -- `switchModalPokemonId` computed (line 456-477) handles fainted mode specifically: when `switchModalMode === 'fainted'` and the clicked combatant is a trainer, it finds the first fainted Pokemon owned by that trainer (`c.entity.currentHp <= 0`). This was addressed in commit 29e33886.
- **Status:** CORRECT

---

## Decree Compliance

### decree-033: Fainted switch on trainer's next turn

**Status: Compliant.** Both server (`validateFaintedSwitch` requires `currentTurnCombatantId === trainerId`) and client (`isFaintedSwitchDisabled` requires `currentId === trainerCombatantId`) enforce that fainted switching only happens on the trainer's turn. The design spec's Section H notes "for simplicity in P1, we enforce that it happens on the trainer's turn," which matches the decree. No immediate-reaction switching exists.

### decree-034: Roar uses 6m range; Whirlwind is a push

**Status: Compliant for P1 scope.** The forced switch implementation is a general-purpose GM tool -- it does not implement Roar-specific or Whirlwind-specific logic. The 8m recall range check (`checkRecallRange`) is correctly applied to forced switches in Full Contact mode. Roar's own 6m range is a P2 concern (move-specific mechanics). Whirlwind is correctly NOT modeled as a forced switch (per decree-034, it's a push). However, the UI button tooltip says "Force Switch (Roar, Whirlwind, etc.)" -- see MEDIUM-002.

### decree-038: Decouple condition behaviors from categories

**Status: Compliant.** The recall side-effects use `RECALL_CLEARED_CONDITIONS` derived from per-condition `clearsOnRecall` flags, not from category arrays. Sleep/Bad Sleep have `clearsOnRecall: false` and are correctly excluded from recall clearing.

---

## Summary

The P1 implementation of feature-011 (Pokemon Switching Workflow) is mechanistically sound. The three main additions -- fainted switch as Shift Action, forced switch with no action cost, and League Battle restriction with exemptions -- all correctly implement PTU 1.05 rules as stated on p.229-232 and confirmed by decree-033 and decree-034.

Key correctness points:
1. **Fainted switch costs only a Shift Action**, preserving the trainer's Standard Action for other uses. This matches the Full Contact example on p.232 where Trainer A switches the fainted Sandshrew as a Shift Action and still throws a Poke Ball.
2. **Fainted switch timing** correctly requires the trainer's turn per decree-033. No immediate-reaction switching.
3. **League restriction** correctly blocks the switched-in Pokemon from acting, with proper exemptions for fainted and forced switches.
4. **Auto-skip** in the pokemon phase correctly advances past uncommandable Pokemon at all four phase transition points.
5. **Recall side-effects** (volatile condition clearing, temp HP reset, stage modifier reset) run for ALL switch modes, including forced.
6. **All P0 review issues** (CRITICAL-001, HIGH-001, HIGH-002, MEDIUM-001, MEDIUM-002) have been properly fixed.

The three MEDIUM findings below are documentation and ambiguity issues, not mechanical correctness problems.

---

## Rulings

### MEDIUM-001: Forced Switch Bypassing Trapped Has No Decree

- **Severity:** MEDIUM
- **Rule:** PTU p.247: "Trapped: A Pokemon or Trainer that is Trapped cannot be recalled." No explicit exception is stated for forced switches.
- **File:** `app/server/services/switching.service.ts`, `validateForcedSwitch()` line 554
- **Issue:** The implementation skips the Trapped check for forced switches with the comment "the move overrides it." While this matches main-series Pokemon video game behavior (Roar/Whirlwind break trapping effects), PTU 1.05 does not explicitly state this exception. No active decree covers the Roar-vs-Trapped interaction. The implementation is a reasonable design choice following video game precedent, but it is an unresolved ambiguity.
- **Impact:** Low. The current behavior is defensible and matches player expectations from the video games. However, if the GM intends Trapped to block ALL switching including forced, the current code would not enforce that.
- **Recommendation:** File a `decree-need` ticket for the human to rule on whether forced switches (Roar) override the Trapped condition. Until ruled, the current implementation (video game precedent) is acceptable.

### MEDIUM-002: Force Switch UI References Whirlwind

- **Severity:** MEDIUM
- **Rule:** Per decree-034: "Whirlwind is a push move, not a forced switch."
- **File:** `app/components/encounter/CombatantCard.vue`, lines 208 and 212
- **Issue:** The Force Switch button has:
  - HTML comment: `<!-- Force Switch Button (GM-triggered, for move effects like Roar/Whirlwind) -->`
  - Title attribute: `title="Force Switch (Roar, Whirlwind, etc.)"`
  Both reference Whirlwind as a forced switch, contradicting decree-034. The P0 review (rules-review-208 MEDIUM-001) fixed the same issue in `combat.ts`, but the CombatantCard UI text was not corrected.
- **Impact:** Misleading UI text that could cause the GM to incorrectly use the Force Switch button for Whirlwind effects. Whirlwind is a push/displacement and should use VTT movement, not the switching workflow.
- **Fix:** Change the comment to `<!-- Force Switch Button (GM-triggered, for move effects like Roar) -->` and the title to `title="Force Switch (Roar, etc.)"`. Remove all Whirlwind references per decree-034.

### MEDIUM-003: Design Spec Section I References Whirlwind and Dragon Tail as Forced Switches

- **Severity:** MEDIUM
- **Rule:** Per decree-034: "Whirlwind is a push move, not a forced switch."
- **File:** `artifacts/designs/design-pokemon-switching-001/spec-p1.md`, Section I
- **Issue:** The spec text says: "Moves like Roar, Whirlwind, Dragon Tail, and Circle Throw force the target to switch Pokemon." Per decree-034, Whirlwind is explicitly NOT a forced switch. Dragon Tail and Circle Throw are not covered by decree-034 but should be individually analyzed against their PTU move text to determine if they have recall mechanics. The blanket grouping is inaccurate.
- **Impact:** Future implementations referencing this spec may incorrectly model Whirlwind as a forced switch. Dragon Tail and Circle Throw need their own PTU text analysis.
- **Fix:** Update Section I to reference only Roar (and other moves with explicit recall text per decree-034). Remove Whirlwind. Note that Dragon Tail and Circle Throw require individual move text review to determine if they qualify.

---

## Verdict

**APPROVED**

The P1 implementation correctly models PTU 1.05 fainted switching (Shift Action on trainer's turn), forced switching (no action cost, skips turn/action checks), and League Battle restrictions (uncommandable unless fainted/forced exemption). All P0 review issues are fixed. Decree-033, decree-034, and decree-038 are respected.

The three MEDIUM findings are documentation issues (Whirlwind references in UI and spec) and an ambiguity (Roar vs Trapped) that should be tracked but do not block approval. No incorrect game values are produced. No mechanics are missing or wrongly applied.

---

## Required Changes

None blocking. The following are recommended improvements:

1. **MEDIUM-001**: File a `decree-need` ticket for Roar-vs-Trapped ruling
2. **MEDIUM-002**: Remove Whirlwind references from CombatantCard Force Switch button comment and title per decree-034
3. **MEDIUM-003**: Update design spec Section I to remove Whirlwind per decree-034 and note that Dragon Tail/Circle Throw need individual move text analysis
