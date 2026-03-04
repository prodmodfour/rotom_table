---
review_id: rules-review-169
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 654b97b
  - 44e9b49
  - 7d757e0
  - dff8a31
  - 4118ccf
  - 0172504
  - 9f19f93
  - b9e452a
mechanics_verified:
  - initiative-reorder-on-speed-cs-change
  - type-based-status-immunities
  - take-a-breather-initiative-reorder
  - turn-state-reset-on-new-round
  - status-cs-auto-application-after-breather
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative)
  - core/07-combat.md#Page 234-235 (Combat Stages)
  - core/07-combat.md#Page 239 (Type immunities)
  - core/07-combat.md#Page 245 (Take a Breather)
  - core/07-combat.md#Page 246-247 (Status Conditions)
reviewed_at: 2026-02-27T09:30:00Z
follows_up: code-review-186
---

## Decrees Checked

- **decree-006** (initiative-speed-cs): "Dynamically reorder initiative when Speed combat stages change, but never grant extra turns due to reordering." Active, directly applicable.
- **decree-012** (type-immunity-enforcement): "Enforce type-based status immunities server-side with a GM override flag." Active, directly applicable.
- **decree-005** (status-cs-auto-apply): "Auto-apply combat stage changes from status conditions with source tracking." Active, indirectly applicable (breather re-applies surviving condition CS).

All three decrees verified against implementation. No decree violations found.

## Mechanics Verified

### 1. Initiative Reorder on Speed CS Change (ptu-rule-099, decree-006)

- **Rule:** "Initiative is simply their Speed Stat" (`core/07-combat.md#Page 227`). Per decree-006: "When a Speed CS change occurs, immediately recalculate initiative values for all combatants and re-sort the remaining turn order. Combatants who have already acted this round retain their 'acted' flag -- reordering cannot give them a second turn."
- **Implementation:** `calculateCurrentInitiative()` in `combatant.service.ts` (line 777-795) computes `applyStageModifier(baseSpeed, speedCS) + focusSpeedBonus + initiativeBonus`. `reorderInitiativeAfterSpeedChange()` in `encounter.service.ts` (line 314-423) splits the turn order into acted (frozen) and unacted (re-sortable) segments, re-sorts unacted by new initiative with tie-breaker roll-offs, and returns the updated turn order.
- **PTU Correctness:** The initiative formula correctly mirrors `buildCombatantFromEntity` -- base speed stat with CS modifier applied via the standard stage multiplier table (+20%/-10% per stage), plus equipment focus bonus, plus initiative bonus. The acted/unacted split correctly implements decree-006's "never grant extra turns" rule: slots 0 through currentTurnIndex (inclusive of the currently-acting combatant) are frozen. Only unacted slots are re-sorted.
- **Status:** CORRECT

### 2. Trigger Point: stages.post.ts (commit 7d757e0 fix for HIGH-1)

- **Rule:** Per decree-006, initiative reorder should trigger when "Speed CS changes." The original code used `'speed' in body.changes` which triggered on key presence even if the change was 0 (clamped at bound). The fix changed to `stageResult.changes.speed?.change !== 0`.
- **Implementation:** `stages.post.ts` line 50: `const speedChanged = stageResult.changes.speed?.change !== 0`
- **Bug Found (HIGH-1 regression):** When `body.changes` does not contain 'speed' at all (e.g., only `{ attack: 2 }`), `stageResult.changes.speed` is `undefined`, so `stageResult.changes.speed?.change` evaluates to `undefined`, and `undefined !== 0` is `true` in JavaScript. This means **every** stage change triggers an initiative reorder, not just speed changes. This is strictly worse than the original bug -- the original only triggered on requests that included a 'speed' key; the fix triggers on ALL stage change requests. Since `reorderInitiativeAfterSpeedChange` calls `sortByInitiativeWithRollOff` which re-rolls d20 tie-breakers, this causes non-deterministic turn order corruption on every non-speed stage change.
- **Fix:** Use `stageResult.changes.speed?.change !== undefined && stageResult.changes.speed.change !== 0` or more idiomatically: `(stageResult.changes.speed?.change ?? 0) !== 0` or `!!stageResult.changes.speed?.change`.
- **Status:** INCORRECT (HIGH)

### 3. Trigger Point: breather.post.ts (commit 654b97b fix for MED-3)

- **Rule:** Per decree-006, breather should only trigger initiative reorder when speed CS actually changed after the reset+reapply cycle. The original code used `result.stagesReset` which triggered any time stages were non-default, even if only non-speed stages were reset.
- **Implementation:** `breather.post.ts` lines 90, 126-127: Captures `speedCsBefore = stages.speed ?? 0` before reset, then `speedCsAfter = entity.stageModifiers?.speed ?? 0` after reset+reapply, and checks `speedCsBefore !== speedCsAfter`.
- **PTU Correctness:** This correctly handles the breather flow: (1) stages reset to defaults (including equipment defaults for Heavy Armor), (2) surviving persistent condition CS re-applied via `reapplyActiveStatusCsEffects`, (3) compare final speed CS to pre-breather value. Example: a Paralyzed Pokemon at -4 Speed CS would have speedCsBefore=-4, then after reset to 0 and re-apply Paralysis -4, speedCsAfter=-4, so `speedCsChanged=false` -- correctly skipping the reorder since net speed didn't change. Conversely, a Pokemon with +3 Speed CS and no status conditions would have speedCsBefore=3, reset to 0, no re-apply, speedCsAfter=0, `speedCsChanged=true` -- correctly triggering reorder.
- **Status:** CORRECT

### 4. Trigger Point: status.post.ts (original commit 0172504)

- **Rule:** Per decree-006, initiative reorder should trigger when a status condition with a Speed CS effect is added or removed (e.g., Paralysis: -4 Speed CS).
- **Implementation:** `status.post.ts` lines 84-88: Checks `allChangedStatuses.some(s => getStatusCsEffect(s)?.stat === 'speed')`. This correctly identifies Paralysis (which has `stat: 'speed', value: -4`) as speed-affecting.
- **PTU Correctness:** Only Paralysis has a speed CS effect among the status conditions. The check correctly identifies when Paralysis is added or removed and triggers the reorder only for speed-affecting changes. The `override` flag for decree-012 does not interfere -- immune statuses that are forced through still correctly trigger the reorder chain.
- **Status:** CORRECT

### 5. Turn State Reset on New Round (commit 44e9b49 fix for HIGH-2)

- **Rule:** PTU p.227-228: "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action." A new round resets all action availability.
- **Implementation:** `next-turn.post.ts` `resetCombatantsForNewRound()` (line 139-154) now resets `turnState` to the full default object: `{ hasActed: false, standardActionUsed: false, shiftActionUsed: false, swiftActionUsed: false, canBeCommanded: true, isHolding: false }`. Previously only `hasActed`, `actionsRemaining`, `shiftActionsRemaining`, and `readyAction` were reset.
- **PTU Correctness:** All action types are correctly reset. The `canBeCommanded: true` default is correct -- there's no PTU rule preventing command on a new round. `isHolding: false` is correct -- held actions don't carry across rounds (PTU p.227: "once per round"). The redundant legacy fields (`hasActed`, `actionsRemaining`, `shiftActionsRemaining`) are also reset for backward compatibility.
- **Status:** CORRECT

### 6. Type-Based Status Immunities (ptu-rule-104, decree-012)

- **Rule:** PTU p.239 type immunity list:
  - Electric immune to Paralysis
  - Fire immune to Burn
  - Ghost cannot be Stuck or Trapped
  - Ice immune to Frozen
  - Poison and Steel immune to Poison (Poisoned, Badly Poisoned)
- **Implementation:** `typeStatusImmunity.ts` `TYPE_STATUS_IMMUNITIES` map matches all six type entries exactly. `status.post.ts` checks immunity for Pokemon combatants only (correct -- trainers have no type), rejects with 409 status code and informative message, and allows `body.override` to force through (per decree-012).
- **PTU Correctness:** All type-immunity pairs from p.239 are represented. The Ghost/Stuck and Ghost/Trapped entries correctly use the "Other" condition names ('Stuck', 'Trapped') rather than treating them as status afflictions. Grass immunity to Powder moves is correctly excluded -- that's a move keyword immunity, not a status condition immunity.
- **Edge Case:** The implementation only checks `combatant.type === 'pokemon'` for immunity. Human trainers can technically have types via certain Features (e.g., Elemental Connection), but this is an extremely rare edge case and the decree specifically discusses "Pokemon" immunity enforcement. The current behavior is acceptable.
- **Client Integration:** `StatusConditionsModal.vue` correctly displays IMMUNE tags for newly-added immune statuses, shows the Force Apply button when immune additions exist, and passes the override flag through the `save` emit. The `entityTypes` prop correctly supports empty arrays for human combatants (bypasses immunity checks).
- **Status:** CORRECT

### 7. Badly Poisoned CS Effect

- **Rule:** PTU p.246: "Poisoned: The target's Special Defense Value is lowered by 2 Combat Stages." The Badly Poisoned description (p.246 line 1566) says "When Badly Poisoned, the afflicted **instead** loses 5 Hit Points" -- this replaces the tick damage, not the CS effect. The CS effect is an inherent property of the Poisoned status family.
- **Implementation:** `statusConditions.ts` line 51: `{ condition: 'Badly Poisoned', stat: 'specialDefense', value: -2 }`. Both Poisoned and Badly Poisoned apply -2 SpDef CS.
- **PTU Correctness:** The "instead" in the RAW text refers to the tick damage replacement, not the CS effect. The -2 SpDef CS is a property of the Poisoned condition, and Badly Poisoned is explicitly described as a variant. Applying the CS to both is the standard community interpretation and mechanically correct.
- **Status:** CORRECT

### 8. Take a Breather Mechanics (breather.post.ts)

- **Rule:** PTU p.245: "set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Implementation:** Breather correctly: resets stages to defaults (with Heavy Armor equipment check), removes temp HP, cures VOLATILE_CONDITIONS minus Cursed plus Slowed/Stuck, re-applies surviving condition CS (decree-005), applies Tripped + Vulnerable as tempConditions, marks standard+shift actions used.
- **PTU Correctness:** The Cursed exclusion is correctly justified in comments (p.245: "the source of the Curse must either be Knocked Out or no longer within 12 meters"). The Tripped + Vulnerable application matches p.245: "They then become Tripped and are Vulnerable until the end of their next turn."
- **Note:** The assisted breather variant (p.245: "treated as having 0 Evasion until the end of their next turn") is not implemented, but that's a separate feature -- not a regression from the fix cycle.
- **Status:** CORRECT

### 9. StatusConditionsModal Immutability (commit b9e452a fix for MED-2)

- **Rule:** Not a PTU rule -- code quality fix. Replaced `.push()` and `.splice()` with spread operator and `.filter()`.
- **Implementation:** `StatusConditionsModal.vue` line 85: `statusInputs.value = [...statusInputs.value, status]` and line 87: `statusInputs.value = statusInputs.value.filter(s => s !== status)`.
- **Status:** CORRECT (no game logic impact, but cleaner reactivity)

## Summary

The fix cycle correctly addressed 4 of the 5 original issues from code-review-186:
- **HIGH-2** (turnState reset): Fully fixed. All turn state fields now reset on new round.
- **MED-1** (app-surface.md): Updated with new functions and utility.
- **MED-2** (mutable array ops): Replaced with immutable patterns.
- **MED-3** (breather spurious reorder): Correctly tracks speed CS before/after to avoid unnecessary reorders.

However, the fix for **HIGH-1** (stages.post.ts speed change detection) introduced a regression: the `?.change !== 0` check evaluates to `true` when `speed` is not in `stageResult.changes` at all (because `undefined !== 0` is `true`), causing every stage change request to trigger initiative reorder instead of only speed changes.

## Rulings

1. **Badly Poisoned -2 SpDef CS:** Confirmed correct per PTU RAW context. The "instead" in p.246 refers to tick damage replacement, not CS effect removal.
2. **Ghost Stuck/Trapped immunity:** Correctly classified as type-status immunity per p.239, despite Stuck/Trapped being "Other" conditions rather than status afflictions.
3. **Breather Cursed exclusion:** Correctly deferred to GM manual removal, matching RAW p.245 prerequisite requirements.

## Verdict

**CHANGES_REQUIRED**

## Required Changes

### HIGH-1: stages.post.ts speed change detection evaluates true for non-speed changes

**File:** `app/server/api/encounters/[id]/stages.post.ts` line 50
**Current:** `const speedChanged = stageResult.changes.speed?.change !== 0`
**Problem:** When `body.changes` does not include 'speed', `stageResult.changes.speed` is `undefined`, and `undefined?.change` is `undefined`, and `undefined !== 0` is `true`. This causes initiative reorder on EVERY stage change, not just speed changes. The `sortByInitiativeWithRollOff` function re-rolls d20 tie-breakers, so unnecessary calls corrupt turn order non-deterministically.
**Fix:** `const speedChanged = (stageResult.changes.speed?.change ?? 0) !== 0` -- coalesces undefined to 0 before comparison, correctly evaluating to false when speed is not in the changes.
**Severity:** HIGH -- produces incorrect game behavior (silent turn order corruption on every non-speed stage change).
