---
review_id: rules-review-174
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 65cfcc8
mechanics_verified:
  - dynamic-initiative-reorder
  - type-status-immunity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#initiative
  - core/07-combat.md#combat-stages
  - core/07-combat.md#status-conditions
reviewed_at: 2026-02-27T10:02:00Z
follows_up: rules-review-169
---

## Decrees Checked

- **decree-006** (initiative-speed-cs): "Dynamically reorder initiative when Speed combat stages change, but never grant extra turns due to reordering." Active, directly applicable.
- **decree-012** (type-immunity-enforcement): "Enforce type-based status immunities server-side with a GM override flag." Active, directly applicable.
- **decree-005** (status-cs-auto-apply): "Auto-apply combat stage changes from status conditions with source tracking." Active, indirectly applicable (breather re-applies surviving condition CS, status.post.ts auto-applies CS on add/remove).

No decree violations found.

## Mechanics Verified

### 1. Speed Change Detection in stages.post.ts (commit 65cfcc8 -- fix for CRITICAL-1/HIGH-1)

- **Rule:** Per decree-006: "When a Speed CS change occurs, immediately recalculate initiative values for all combatants and re-sort the remaining turn order." Initiative reorder must trigger if and only if the speed combat stage actually changed value.
- **Implementation:** `stages.post.ts` line 50: `const speedChanged = stageResult.changes.speed != null && stageResult.changes.speed.change !== 0`
- **Verification by case analysis:**
  - **Non-speed change** (e.g., `{ attack: 2 }`): `stageResult.changes` contains only `attack`. `stageResult.changes.speed` is `undefined`. `undefined != null` evaluates to `false` (because `undefined == null` is `true` in JavaScript loose equality). Short-circuits to `speedChanged = false`. No reorder triggered. **CORRECT.**
  - **Speed change with actual delta** (e.g., `{ speed: 2 }` from CS 0): `stageResult.changes.speed` is `{ previous: 0, change: 2, current: 2 }`. `!= null` is `true`. `.change !== 0` is `true`. `speedChanged = true`. Reorder triggered. **CORRECT.**
  - **Speed change with zero delta** (e.g., `{ speed: 2 }` when already at +6): `stageResult.changes.speed` is `{ previous: 6, change: 0, current: 6 }`. `!= null` is `true`. `.change !== 0` is `false`. `speedChanged = false`. No reorder triggered. **CORRECT.**
  - **Mixed changes including speed** (e.g., `{ attack: 1, speed: -2 }`): `stageResult.changes.speed` is present with non-zero change. Both guards pass. `speedChanged = true`. Reorder triggered. **CORRECT.**
- **Previous bug:** The prior code `stageResult.changes.speed?.change !== 0` evaluated to `true` when speed was absent from changes (because `undefined !== 0` is `true` in JavaScript). This caused initiative reorders on every stage change operation, not just speed changes. The `sortByInitiativeWithRollOff` function re-rolls d20 tie-breakers on each call, so spurious invocations silently corrupted turn order.
- **Status:** CORRECT -- fix resolves both code-review-192 CRITICAL-1 and rules-review-169 HIGH-1.

### 2. Initiative Reorder Mechanics (unchanged, verified still correct)

- **Rule:** "Initiative is simply their Speed Stat" (`core/07-combat.md` p.227). Per decree-006: combatants who have already acted retain their position; only unacted combatants are re-sorted.
- **Implementation:** `calculateCurrentInitiative()` in `combatant.service.ts` (lines 777-795) computes `applyStageModifier(baseSpeed, speedCS) + focusSpeedBonus + initiativeBonus`. `reorderInitiativeAfterSpeedChange()` in `encounter.service.ts` (lines 320-436) splits turn order into acted (slots 0 through currentTurnIndex, inclusive) and unacted (remaining slots), re-sorts only unacted by new initiative with tie-breaker roll-offs, and returns the updated turn order.
- **PTU Correctness:** Initiative formula correctly applies the stage multiplier table (+20% per positive stage, -10% per negative stage) to base speed before adding equipment focus bonus and initiative bonus. The acted/unacted split prevents double turns per decree-006. Tie-breaker roll-offs match PTU p.227: "Ties in Initiative should be settled with a d20 roll off."
- **Status:** CORRECT

### 3. Trigger Points Across All Three Endpoints (verified no regression)

- **stages.post.ts** (line 50): Fixed in commit 65cfcc8. Uses `stageResult.changes.speed != null && stageResult.changes.speed.change !== 0`. See analysis in section 1 above. **CORRECT.**
- **breather.post.ts** (lines 90, 126-127, 174): Uses `speedCsBefore !== speedCsAfter` comparison around the reset+reapply cycle. This was correctly fixed in commit 654b97b and remains unchanged by commit 65cfcc8. Properly handles: (a) Paralyzed combatant breathers -- speed goes from -4 to 0 to -4 (re-applied), no net change, no reorder; (b) combatant with +3 Speed CS and no surviving status -- speed goes from +3 to 0, reorder triggers; (c) combatant with only non-speed stages -- speed stays at 0, no reorder. **CORRECT.**
- **status.post.ts** (lines 84-88): Uses `allChangedStatuses.some(s => getStatusCsEffect(s)?.stat === 'speed')`. This correctly identifies Paralysis (the only status with a speed CS effect, at -4) as speed-affecting. This was not touched by commit 65cfcc8 and was already correct in the prior fix cycle. **CORRECT.**

### 4. Type-Based Status Immunities (ptu-rule-104, decree-012)

- **Rule:** PTU p.239:
  - Electric immune to Paralysis
  - Fire immune to Burn
  - Ghost cannot be Stuck or Trapped
  - Ice immune to Frozen
  - Poison and Steel immune to Poison (Poisoned, Badly Poisoned)
- **Implementation:** `typeStatusImmunity.ts` `TYPE_STATUS_IMMUNITIES` map contains all six type entries matching the PTU p.239 list exactly. `status.post.ts` (lines 52-69) checks immunity for Pokemon combatants only, rejects with HTTP 409 and informative message listing immune type, and accepts `body.override` to force through per decree-012. `StatusConditionsModal.vue` displays IMMUNE tags on newly-added immune statuses and provides "Force Apply (GM Override)" button that passes `override: true`.
- **PTU Correctness:** All type-immunity pairs from p.239 are correctly represented. Ghost/Stuck and Ghost/Trapped use the correct condition names. Grass immunity to Powder moves is correctly excluded (that is a move keyword immunity, not a status condition immunity). Human combatants correctly bypass the immunity check (trainers have no type in PTU by default).
- **Status:** CORRECT -- commit 65cfcc8 does not touch this subsystem, and it was verified correct in rules-review-169.

### 5. Status CS Auto-Application (decree-005, unchanged)

- **Rule:** Per decree-005: "When Burn is applied, automatically apply -2 Def CS tagged as source: Burn." Burn: -2 Def CS (p.246), Paralysis: -4 Speed CS (p.247), Poisoned/Badly Poisoned: -2 SpDef CS (p.247).
- **Implementation:** `statusConditions.ts` STATUS_CS_EFFECTS correctly maps all four conditions. `combatant.service.ts` `applyStatusCsEffects` and `reverseStatusCsEffects` use `stageSources` array for clean tracking and reversal. `reapplyActiveStatusCsEffects` clears sources and re-applies for surviving conditions after breather.
- **Status:** CORRECT -- unchanged by commit 65cfcc8.

### 6. Turn State Reset on New Round (commit 44e9b49, unchanged)

- **Rule:** PTU p.227-228: Each round, participants get one Standard, one Shift, and one Swift Action.
- **Implementation:** `next-turn.post.ts` `resetCombatantsForNewRound()` (lines 212-227) resets both legacy fields (`hasActed`, `actionsRemaining`, `shiftActionsRemaining`, `readyAction`) and the `turnState` object to full defaults.
- **Status:** CORRECT -- unchanged by commit 65cfcc8.

## Condition Taxonomy Audit (per L1 lesson)

Verified the following condition lists against PTU 1.05 Chapter 7:

- **PERSISTENT_CONDITIONS** (`statusConditions.ts`): `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']` -- matches PTU p.246 "Persistent Status Conditions" section which lists Burned, Frozen, Paralyzed, Poisoned, and Badly Poisoned. **CORRECT.**
- **VOLATILE_CONDITIONS** (`statusConditions.ts`): `['Asleep', 'Bad Sleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']` -- matches PTU p.247 "Volatile Status Conditions" section. **CORRECT.**
- **OTHER_CONDITIONS** (`statusConditions.ts`): `['Fainted', 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable']` -- matches PTU p.248 "Other Conditions" section. **CORRECT.**
- **TYPE_STATUS_IMMUNITIES** (`typeStatusImmunity.ts`): All six entries match PTU p.239 exactly. **CORRECT.**
- **BREATHER_CURED_CONDITIONS** (`breather.post.ts`): All volatile conditions except Cursed, plus Slowed and Stuck -- matches PTU p.245 "cured of all Volatile Status effects and the Slow and Stuck conditions" with the Cursed exception correctly noted. **CORRECT.**

## Summary

Commit 65cfcc8 correctly resolves the `speedChanged` false positive that was identified in code-review-192 (CRITICAL-1) and rules-review-169 (HIGH-1). The fix replaces the flawed optional chaining pattern (`stageResult.changes.speed?.change !== 0`, where `undefined !== 0` evaluates to `true`) with an explicit null guard (`stageResult.changes.speed != null && stageResult.changes.speed.change !== 0`), which correctly evaluates to `false` when speed is not present in the changes object.

All three initiative reorder trigger points (`stages.post.ts`, `breather.post.ts`, `status.post.ts`) now correctly fire only when speed CS actually changes. The initiative reorder mechanics themselves (acted/unacted split, tie-breaker roll-offs, no extra turns) remain correct per decree-006. Type-based status immunities remain correct per decree-012. Status CS auto-application remains correct per decree-005.

No regressions detected. No new issues found.

## Rulings

1. **speedChanged null guard pattern:** The `!= null` loose equality check is the correct idiom here. It catches both `undefined` (key absent from object) and `null` (explicitly null value) in a single guard, and is semantically clearer than alternatives like `Boolean()` or nullish coalescing.
2. **Commit 65cfcc8 scope:** The fix is surgically correct -- it changes exactly one line in exactly one file, addressing the root cause without side effects. The other trigger points (`breather.post.ts`, `status.post.ts`) use different detection patterns appropriate to their context and were not affected.

## Verdict

**APPROVED**

No required changes. Both ptu-rule-099 and ptu-rule-104 are correctly implemented after this fix cycle.
