---
review_id: rules-review-264
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view
commits_reviewed:
  - 346b325d
  - 7e3d03ad
  - f4c5d437
mechanics_verified:
  - take-a-breather-action-cost
  - take-a-breather-effects-description
  - assisted-breather
  - healing-item-action-cost
  - healing-item-catalog-integration
  - request-only-model
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#page-245
  - core/07-combat.md#page-227
  - core/09-gear-and-items.md#page-276
  - errata-2.md#medic-training
reviewed_at: 2026-03-02T19:30:00Z
follows_up: null
---

## Mechanics Verified

### Take a Breather — Action Cost (R019)

- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible" (`core/07-combat.md#page-245`). Full Action defined as "Full Actions take both your Standard Action and Shift Action for a turn" (`core/07-combat.md#page-227`).
- **Implementation:** `canRequestBreather` computed in `PlayerHealingPanel.vue:162-164` checks `canUseStandardAction.value && canUseShiftAction.value && !!myActiveCombatant.value`. The confirm button is disabled when either action is used. The action cost display reads "Full Action (Standard + Shift)" (line 40).
- **Status:** CORRECT. Both Standard and Shift must be available, matching the Full Action requirement.

### Take a Breather — Effects Description (R018)

- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects **and the Slow and Stuck conditions**." (`core/07-combat.md#page-245`)
- **Implementation:** UI description text at line 30: "Reset combat stages, cure volatile conditions, remove Temp HP." Warning text at line 33: "You will become Tripped + Vulnerable and must Shift away from enemies."
- **Status:** CORRECT with MEDIUM note. The Tripped+Vulnerable consequence and the core effects (stages, temp HP, volatile cures) are accurately described. See MED-1 below regarding Slow/Stuck omission in the summary text.

### Take a Breather — Assisted Breather

- **Rule:** "This is a Full Action by both the assisting Trainer and their target (as an Interrupt for the target), and the assisting Trainer must be able to Shift to the target they intend to help. They then make a Command Check with a DC of 12. ... They then both become Tripped and are treated as having 0 Evasion until the end of their next turn." (`core/07-combat.md#page-245`)
- **Implementation:** `hasAdjacentAlly` computed (lines 171-182) checks for alive player-side combatants other than the active one. Checkbox disabled when no ally found. Assisted flag is sent with the breather request via WebSocket. Description text (line 55-56): "Adjacent ally uses their Standard Action. You become Tripped with 0 Evasion instead of Tripped+Vulnerable."
- **Status:** CORRECT with MEDIUM note. The request correctly sends the `assisted` flag. Full adjacency validation and Command Check DC 12 are deferred to GM-side execution, which is the correct pattern for a request-only model. See MED-2 below regarding the description text inaccuracy.

### Healing Item — Action Cost

- **Rule:** "Applying Restorative Items, or X Items is a Standard Action, which causes the target to forfeit their next Standard Action and Shift Action, unless the user has the 'Medic Training' Edge." (`core/09-gear-and-items.md#page-276`)
- **Implementation:** The Heal button in `PlayerCombatActions.vue:213` is gated on `:disabled="!canUseStandardAction"`. The healing item tab does not have additional action cost display, but item use is sent as a request requiring GM approval. The GM-side execution handles the actual action consumption and target action forfeiture.
- **Status:** CORRECT. The Standard Action gate is accurate for item use. Target forfeit is a GM-side concern correctly deferred to GM execution.

### Healing Item — Catalog Integration (Feature-020)

- **Rule:** Feature-020 provides the `HEALING_ITEM_CATALOG` constant with PTU-correct item definitions. Per decree-041, Awakening is correctly included at $200.
- **Implementation:** `PlayerHealingPanel.vue:125` imports `HEALING_ITEM_CATALOG` and `HealingItemDef` from `~/constants/healingItems`. The `healingItemsAvailable` computed (lines 209-215) checks catalog existence. The `availableHealingItems` computed (lines 220-226) filters trainer inventory against the catalog. The items tab conditionally renders only when `healingItemsAvailable` is true (line 17).
- **Status:** CORRECT. Graceful degradation when feature-020 is not available. No compile-time or runtime failures. Per decree-041, the catalog items are verified correct.

### Request-Only Model

- **Rule:** Design spec P2 requires players submit structured requests via WebSocket; GM approves/denies.
- **Implementation:** `requestBreather()` in `usePlayerCombat.ts:376-387` sends `{ type: 'player_action', data: { action: 'breather', ... } }` via WebSocket. `requestHealingItem()` at lines 394-409 sends `{ type: 'player_action', data: { action: 'use_healing_item', ... } }`. Neither function directly modifies encounter state. Both are typed in `PlayerActionType` union (player-sync.ts:15-16). `PlayerHealingPanel.vue` emits `request-sent` after sending, which closes the panel and shows a toast.
- **Status:** CORRECT. The player never directly executes healing logic. All actions route through WebSocket for GM approval.

### UI Disable Behavior

- **Rule:** Heal button should disable when Standard Action is used. Breather confirm should disable when either Standard or Shift is used.
- **Implementation:** Heal button: `:disabled="!canUseStandardAction"` (PlayerCombatActions.vue:213). Breather confirm: `:disabled="requestPending || !canRequestBreather"` where `canRequestBreather = canUseStandardAction && canUseShiftAction && !!myActiveCombatant` (PlayerHealingPanel.vue:62, 162-164). Panel closes on turn end via `watch(isMyTurn)` (PlayerCombatActions.vue:622-631).
- **Status:** CORRECT. The two-level gating (button for Standard, confirm for Standard+Shift) is intentional: the panel can be opened to read about the mechanic even if only Shift remains, but the confirm button is properly gated.

## Summary

The P2 Player Healing UI correctly implements the PTU Take a Breather and healing item request mechanics. All critical formulas and action cost gates are accurate. The request-only model is properly preserved -- no player-side state mutation occurs. Feature-020 integration is graceful with proper fallback behavior. Two MEDIUM description text issues found that do not affect game mechanics (player-facing text summaries, not calculations).

Per decree-032, the Cursed tick interaction with breather is not relevant here since the player UI does not execute the breather -- it only submits a request. The GM-side execution is responsible for applying Cursed tick rules. Per decree-005, combat stage re-application after breather (for active status conditions like Burn) is also a GM-side concern.

## Rulings

1. The Heal button gate on `!canUseStandardAction` alone (not requiring Shift too) is **intentionally correct** for the healing panel as a whole, since the items tab only requires Standard Action. The breather tab has its own additional Shift check on the confirm button.

2. The `hasAdjacentAlly` check (lines 171-182) is a client-side approximation using alive player-side combatants. It does not verify grid adjacency or the assisting trainer's available actions. This is **acceptable** because the design spec explicitly states "Full adjacency check happens on the GM side" and the player view does not have authoritative grid position data. The client check prevents obviously impossible requests but defers validation to the GM.

3. The `healTargets` filter (`hp < maxHp || hp <= 0`) is a simplified client-side check. The `hp <= 0` condition is technically redundant (subsumed by `hp < maxHp` for any non-zero maxHp), but this is a code quality observation, not a rules issue.

## Verdict

**APPROVED** -- 0 critical, 0 high, 2 medium issues. All game mechanics are correctly implemented. The two medium issues are description text improvements that do not affect gameplay correctness. They can be addressed in a future polish pass.

## Medium Issues (Non-Blocking)

### MED-1: Breather description omits Slow and Stuck conditions

**File:** `app/components/player/PlayerHealingPanel.vue:30`
**Current text:** "Reset combat stages, cure volatile conditions, remove Temp HP."
**PTU rule:** "cured of all Volatile Status effects **and the Slow and Stuck conditions**" (`core/07-combat.md#page-245`)
**Issue:** Slow and Stuck are not classified as Volatile Status effects in PTU. They are separate conditions explicitly listed in the Take a Breather effects. The UI summary omits them.
**Suggested fix:** Change to "Reset combat stages, cure volatile conditions and Slow/Stuck, remove Temp HP." or add a second line mentioning Slow/Stuck.
**Severity:** MEDIUM -- player-facing text is incomplete but does not affect actual game execution (GM executes the breather server-side with correct rules).

### MED-2: Assisted breather description says "Standard Action" instead of "Full Action"

**File:** `app/components/player/PlayerHealingPanel.vue:56`
**Current text:** "Adjacent ally uses their Standard Action."
**PTU rule:** "This is a Full Action by both the assisting Trainer and their target" (`core/07-combat.md#page-245`)
**Issue:** The assisting trainer spends a Full Action (Standard + Shift), not just a Standard Action. The description understates the action cost for the assisting ally.
**Suggested fix:** Change to "Adjacent ally uses their Full Action (Standard + Shift). Both become Tripped with 0 Evasion." This also adds that the assisting trainer becomes Tripped too, which the current text omits.
**Severity:** MEDIUM -- informational text inaccuracy. The actual cost is enforced GM-side, so gameplay is not affected. However, the player may incorrectly assume their ally only loses a Standard Action when volunteering to assist.
