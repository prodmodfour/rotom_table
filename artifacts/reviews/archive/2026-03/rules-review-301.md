---
review_id: rules-review-301
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-125
domain: encounter
commits_reviewed:
  - ceb39066
  - 71058454
  - 0e71e396
  - 1551c5fb
  - cfc507a0
mechanics_verified:
  - component-extraction-logic-preservation
  - switch-action-cost-logic
  - fainted-switch-shift-action-logic
  - force-switch-decree-034-compliance
  - damage-heal-event-forwarding
  - combat-stages-event-forwarding
  - status-conditions-event-forwarding
  - temp-hp-event-forwarding
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - N/A (pure refactoring — no new PTU mechanics)
reviewed_at: 2026-03-04T14:50:00Z
follows_up: null
---

## Mechanics Verified

### Component Extraction Logic Preservation
- **Rule:** Pure refactoring — all game logic must be byte-identical before and after extraction.
- **Implementation:** Every computed property (`canShowSwitchButton`, `isSwitchDisabled`, `canShowFaintedSwitchButton`, `isFaintedSwitchDisabled`, `canShowForceSwitchButton`) and every action handler (`applyDamage`, `applyHeal`, `handleTempHpApply`, `handleStagesSave`, `handleStatusSave`, `handleActClick`) was moved verbatim from CombatantCard.vue to CombatantGmActions.vue. Diff confirms no line-level changes to logic bodies.
- **Status:** CORRECT

### Switch Action Cost Logic (Standard Action)
- **Rule:** Switching Pokemon costs a Standard Action (PTU p.236). Can be initiated on either the trainer's or their Pokemon's turn.
- **Implementation:** `isSwitchDisabled` in CombatantGmActions.vue checks `turnState.standardActionUsed` on the initiating combatant (whoever's turn it is — trainer or owned Pokemon). Logic is identical to the pre-extraction version.
- **Status:** CORRECT

### Fainted Switch Shift Action Logic
- **Rule:** Switching out a fainted Pokemon uses the trainer's Shift Action.
- **Implementation:** `isFaintedSwitchDisabled` checks `turnState.shiftActionUsed` on the trainer combatant. Must be the trainer's turn. Logic preserved exactly.
- **Status:** CORRECT

### Force Switch — decree-034 Compliance
- **Rule:** Per decree-034, Whirlwind is a push (not a forced switch). Force switch button is for Roar-type effects only.
- **Implementation:** Comment on line 301 of CombatantGmActions.vue correctly notes: "Whirlwind is a push, not a forced switch (decree-034)." The `canShowForceSwitchButton` computed only shows for owned Pokemon. No behavioral change from pre-extraction.
- **Status:** CORRECT

### Damage/Heal Event Forwarding
- **Rule:** Damage and healing values must pass through unmodified.
- **Implementation:** CombatantCard forwards via `@damage="(id, dmg) => $emit('damage', id, dmg)"` and `@heal="(id, amt, tmp, inj) => $emit('heal', id, amt, tmp, inj)"`. CombatantGmActions emits with matching signatures: `damage: [combatantId: string, damage: number]` and `heal: [combatantId: string, amount: number, tempHp?: number, healInjuries?: number]`. All parameters forwarded correctly.
- **Status:** CORRECT

### Combat Stages Event Forwarding
- **Rule:** Stage changes must include the `absolute` flag for set-vs-relative behavior.
- **Implementation:** `@stages="(id, changes, abs) => $emit('stages', id, changes, abs)"` — all three parameters forwarded. Emit signature matches: `stages: [combatantId: string, changes: Partial<StageModifiers>, absolute: boolean]`.
- **Status:** CORRECT

### Status Conditions Event Forwarding
- **Rule:** Status add/remove must include the `override` flag.
- **Implementation:** `@status="(id, add, rem, ovr) => $emit('status', id, add, rem, ovr)"` — all four parameters forwarded. The death override button on line 70-71 of CombatantCard remains in CombatantCard (not extracted), which is correct — it belongs to the death indicator UI section, not the GM actions panel.
- **Status:** CORRECT

### Temp HP Event Forwarding
- **Rule:** Temp HP is applied via the heal event with amount=0 and tempHp set.
- **Implementation:** `handleTempHpApply` emits `heal` with `(combatant.id, 0, amount)` — unchanged from original. TempHpModal receives `currentTempHp` prop correctly mapped from CombatantCard's `tempHp` computed.
- **Status:** CORRECT

## Summary

This is a clean mechanical extraction with zero behavioral changes. All game logic — switch action costs, fainted switch shift action checks, force switch visibility (per decree-034), damage/heal forwarding, stage modification, and status condition management — was moved verbatim into CombatantGmActions.vue. The event forwarding chain from CombatantGmActions -> CombatantCard -> parent is complete with all parameters correctly passed through.

File sizes are within limits: CombatantCard.vue at 585 lines (was 930), CombatantGmActions.vue at 396 lines. Both well under the 800-line threshold. Note: the ticket description states CombatantGmActions is 286 lines, but actual file is 396 lines (including template and SCSS). This is a documentation discrepancy, not a code issue.

SCSS was cleanly split: action-specific styles (`.action-row`, `.btn-icon`, `.use-item-btn`, `.form-input--sm`) moved to CombatantGmActions; card-level styles remain in CombatantCard. The `&__actions` block was removed from CombatantCard in commit 0e71e396 after the extraction.

No combat-domain decrees (001-046) were violated. decree-034 (Whirlwind is push, not forced switch) is correctly preserved in the force switch comment.

## Rulings

No new rulings needed. No ambiguities discovered.

## Verdict

**APPROVED** — Pure refactoring with no game logic changes. All mechanics preserved verbatim. No decree violations.

## Required Changes

None.
