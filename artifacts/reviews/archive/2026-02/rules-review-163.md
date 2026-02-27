---
review_id: rules-review-163
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 8b7728d
  - 19b063e
  - f5a22bf
  - 666e010
  - 9245d99
  - c1ed289
  - 590dffb
  - ac2c68c
  - 77fa3bb
  - 4e8d498
  - a81da94
  - 55c6fc8
  - 6e8c203
  - 9a8ff96
  - a9c9193
  - cd9e090
mechanics_verified:
  - initiative-recalculation
  - speed-cs-initiative-effect
  - turn-order-reorder
  - acted-flag-double-turn-prevention
  - type-status-immunity-enforcement
  - gm-override-bypass
  - status-cs-auto-apply-interaction
  - take-a-breather-initiative-interaction
  - league-battle-phase-reorder
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Initiative
  - core/07-combat.md#Combat-Stages
  - core/07-combat.md#Speed-Combat-Stages-and-Movement
  - core/07-combat.md#Persistent-Afflictions
  - core/07-combat.md#Type-Immunities
  - errata-2.md
reviewed_at: 2026-02-26T21:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Initiative Recalculation (ptu-rule-099)

- **Rule:** "Initiative is simply their Speed Stat" (`core/07-combat.md` line 58-59). "Ties in Initiative should be settled with a d20 roll off." (line 75). Per decree-006: "When a Speed CS change occurs, immediately recalculate initiative values for all combatants and re-sort the remaining turn order."
- **Implementation:** `calculateCurrentInitiative()` in `combatant.service.ts` (lines 776-794) reads the combatant's current Speed CS from `entity.stageModifiers.speed`, applies the CS multiplier via `applyStageModifier(baseSpeed, speedCS)`, adds focus speed bonus for humans, then adds `initiativeBonus`. This mirrors `buildCombatantFromEntity` exactly, using `currentStats.speed` (the calculated stat including base + level-up + nature) rather than base stats. The CS multiplier table (`STAGE_MULTIPLIERS` in `damageCalculation.ts`) correctly uses +20%/stage positive, -10%/stage negative, rounded down.
- **Status:** CORRECT

### 2. Turn Order Reorder (ptu-rule-099)

- **Rule:** Per decree-006: "Combatants who have already acted this round retain their 'acted' flag -- reordering cannot give them a second turn. Combatants who haven't acted yet are re-sorted by updated initiative among the remaining slots."
- **Implementation:** `reorderInitiativeAfterSpeedChange()` in `encounter.service.ts` (lines 314-423) splits the turn order at `currentTurnIndex + 1`: slots 0 through currentTurnIndex are frozen (acted + currently acting), slots after are re-sorted. The re-sort uses `sortByInitiativeWithRollOff()` which handles tie-breaking with d20 roll-offs per PTU p.75. The function recalculates initiative for ALL combatants first (line 323-325), then only re-sorts the unacted portion.
- **Status:** CORRECT

### 3. Acted Flag / Double-Turn Prevention (ptu-rule-099)

- **Rule:** Per decree-006: "Reordering cannot give them a second turn."
- **Implementation:** The position-based approach (everything at or before `currentTurnIndex` is frozen) is actually more robust than using the `hasActed` boolean. If a combatant at position 3 has already acted and the current turn is position 5, the combatant at position 3 stays in the frozen portion regardless. The current combatant (at `currentTurnIndex`) is also frozen, preventing them from being re-sorted into a later position where they'd act again. The WebSocket surgical update in `encounter.ts` store (line 414) correctly syncs `hasActed` for client display, and line 413 syncs `initiative` so the group view sees updated initiative values.
- **Status:** CORRECT

### 4. Speed CS Trigger Points (ptu-rule-099)

- **Rule:** Per decree-006: "This applies to any effect that changes Speed CS mid-round."
- **Implementation:** Three trigger points implemented:
  1. `stages.post.ts` (line 50-75): Checks `'speed' in body.changes` -- triggers when speed CS is directly modified.
  2. `status.post.ts` (line 82-114): Checks if any added/removed status has a CS effect on speed via `getStatusCsEffect()`. Currently only Paralysis (-4 Speed CS per PTU p.247) triggers this.
  3. `breather.post.ts` (line 165-213): Triggers when stages are reset (any previous speed CS is cleared). After reset, `reapplyActiveStatusCsEffects()` re-applies Paralysis speed CS if still active, then the reorder recalculates initiative from the new CS state.
  All three check `record.isActive` before triggering.
- **Status:** CORRECT

### 5. League Battle Phase Handling (ptu-rule-099)

- **Rule:** PTU League Battles have declaration phase (low-to-high speed) and pokemon phase (high-to-low speed). Initiative reorder should respect both phases.
- **Implementation:** `reorderInitiativeAfterSpeedChange()` handles league battles (lines 361-408) by:
  - Reordering trainer declaration list ascending (`false`) and pokemon list descending (`true`)
  - Using `-1` as `turnIndex` for the inactive phase so all combatants in that phase get fully re-sorted
  - The active phase uses `currentTurnIndex` to preserve acted positions
  - Phase detection at lines 368-370 compares the first combatant ID in `currentTurnOrder` and `trainerTurnOrder`
- **Status:** CORRECT

### 6. Type-Based Status Immunity Enforcement (ptu-rule-104)

- **Rule:** PTU p.239: "Electric Types are immune to Paralysis", "Fire Types are immune to Burn", "Ghost Types cannot be Stuck or Trapped", "Ice Types are immune to being Frozen", "Poison and Steel Types are immune to Poison" (`core/07-combat.md` lines 1044-1055). Per decree-012: "Server endpoint must check the target's types against the type-immunity mapping before applying a status condition. If the target is immune, the request is rejected with an informative error."
- **Implementation:** `TYPE_STATUS_IMMUNITIES` in `typeStatusImmunity.ts` maps: Electric->Paralyzed, Fire->Burned, Ghost->Stuck+Trapped, Ice->Frozen, Poison->Poisoned+Badly Poisoned, Steel->Poisoned+Badly Poisoned. Server checks in `status.post.ts` (lines 50-69) call `findImmuneStatuses()` before applying, returning 409 with informative messages. Check only applies to Pokemon combatants (`combatant.type === 'pokemon'`), which is correct since type immunities are Pokemon-specific.
- **Verification against PTU:**
  - Electric -> Paralysis: CORRECT (p.247: "Electric Type Pokemon are immune to Paralysis")
  - Fire -> Burn: CORRECT (p.246: "Fire-Type Pokemon are immune to becoming Burned")
  - Ghost -> Stuck, Trapped: CORRECT (p.250: "Ghost Type Pokemon are immune to the Stuck Condition", "Ghost Type Pokemon are immune to the Trapped Condition")
  - Ice -> Frozen: CORRECT (p.246: "Ice-Type Pokemon are immune to becoming Frozen")
  - Poison/Steel -> Poisoned: CORRECT (p.247: "Poison and Steel-Type Pokemon are immune to becoming Poisoned")
  - Badly Poisoned included with Poison/Steel: CORRECT. Badly Poisoned is described as a variant of Poisoned (p.247: "When Badly Poisoned, the afflicted instead loses 5 Hit Points") -- same condition, same immunity.
  - Grass NOT included: CORRECT. PTU p.239 says "Grass Types are immune to the effects of all Moves with the Powder Keyword" -- this is move-level immunity (Poison Powder misses Grass types), not status-level immunity (a Grass type can still be Poisoned by non-Powder means like Toxic Spikes).
- **Status:** CORRECT

### 7. GM Override Bypass (ptu-rule-104)

- **Rule:** Per decree-012: "An `override: true` parameter allows the GM to force the status condition through, covering edge cases like ability-based type changes, homebrew rules, or other special scenarios."
- **Implementation:** `status.post.ts` (line 57): `if (immuneStatuses.length > 0 && !body.override)` -- rejects only when override is falsy. Client chain:
  - `StatusConditionsModal.vue`: "Force Apply (GM Override)" button calls `applyWithOverride()` which emits `save` with `override: true`
  - `CombatantCard.vue`: Status emit signature includes `override: boolean` (line 207), handler at line 337-340 propagates it
  - `CombatantSides.vue`: Propagates override through event chain (lines 25, 52, 81, 110)
  - `GMActionModal.vue`: Quick status add emits with override parameter (line 186)
  - `useEncounterActions.ts`: `handleStatus()` (line 75) accepts override, passes to `encounterCombatStore.updateStatusConditions()` which sends it in the API body (line 50)
  - On 409 rejection: `useEncounterActions.ts` (lines 91-96) catches 409, shows informative alert directing user to the full modal for override
- **Status:** CORRECT

### 8. Interaction: Status CS Auto-Apply + Initiative Reorder (decree-005 + decree-006)

- **Rule:** Per decree-005, applying Paralysis auto-applies -4 Speed CS. Per decree-006, Speed CS changes trigger initiative reorder. These two decrees must work together.
- **Implementation:** In `status.post.ts`, the flow is:
  1. Type immunity check (decree-012)
  2. `updateStatusConditions()` which auto-applies CS effects (decree-005) -- Paralysis adds -4 Speed CS
  3. Check if any changed status affects Speed CS (lines 84-88)
  4. If yes, trigger `reorderInitiativeAfterSpeedChange()` (decree-006)
  The speed CS is already updated on the combatant entity when the reorder runs, so `calculateCurrentInitiative()` picks up the new speed CS correctly.
- **Status:** CORRECT

### 9. Take a Breather + Initiative Reorder Interaction (decree-005 + decree-006)

- **Rule:** Take a Breather (PTU p.245) resets all combat stages. Per decree-005, persistent status CS effects (Burn/Paralysis/Poison) survive and are re-applied. Per decree-006, this speed change should trigger initiative reorder.
- **Implementation:** In `breather.post.ts`:
  1. Reset stages to defaults (line 94)
  2. `reapplyActiveStatusCsEffects(combatant)` re-applies Paralysis -4 Speed CS if still active (line 122)
  3. Trigger `reorderInitiativeAfterSpeedChange()` if stages were reset and encounter is active (line 168)
  The `reorderInitiativeAfterSpeedChange()` recalculates all initiative values using the post-breather stage state, which correctly reflects the re-applied Paralysis CS.
- **Status:** CORRECT

## Medium Issues

### M-1: Immune tag visibility only shows for checked-and-new statuses

**File:** `app/components/encounter/StatusConditionsModal.vue` (lines 117-122)
**Observation:** The `getImmuneLabel()` function only shows the IMMUNE tag when a status is both checked in the UI AND is a new addition. This means if the GM is browsing available statuses without checking them, they have no visual cue about which ones the target is immune to. Per the PTU rules, type immunities are permanent properties of the Pokemon and should ideally be visible at all times for GM awareness.
**Severity:** MEDIUM (UX improvement, not a game logic error)
**Impact:** The GM has to check a status first to see if it's immune, rather than seeing immunity indicators proactively. The server-side enforcement (409 rejection) still prevents incorrect application, so no incorrect game state can result.
**Recommendation:** Consider always showing IMMUNE tags on statuses where the entity's types grant immunity, regardless of checkbox state. This is a UX enhancement, not a rules correctness issue.

## Summary

Both implementations are PTU-correct and faithfully execute the binding decrees.

**ptu-rule-099 (Dynamic Initiative Reorder):** The `calculateCurrentInitiative()` function correctly derives initiative from CS-modified speed using the PTU stage multiplier table. The `reorderInitiativeAfterSpeedChange()` function correctly splits the turn order into frozen (acted) and re-sortable (unacted) segments using position-based logic, which is more robust than boolean flags. Tie-breaking uses d20 roll-offs per PTU p.75. All three trigger points (direct stage change, status CS auto-apply, breather reset) correctly check `isActive` and handle the interaction between decree-005 and decree-006. League battle dual-phase ordering is handled correctly with ascending trainer and descending pokemon sorts.

**ptu-rule-104 (Type-Based Status Immunity Enforcement):** The `TYPE_STATUS_IMMUNITIES` map exactly matches PTU 1.05 p.239 and the persistent affliction descriptions at p.246-250. The server-side enforcement with 409 rejection on immune status + GM override bypass pattern exactly matches decree-012. The check correctly applies only to Pokemon combatants and correctly excludes Grass-type Powder immunity (which is move-level, not status-level). The client-side UI shows warnings and provides a "Force Apply" path.

## Rulings

1. **Position-based acted tracking is preferred over boolean `hasActed`:** The implementation uses `currentTurnIndex` to determine acted vs unacted combatants, rather than checking `combatant.hasActed`. This is the correct approach because it handles edge cases where `hasActed` might be stale or inconsistent. The turn order position is the authoritative source of who has acted.

2. **Grass type exclusion from `TYPE_STATUS_IMMUNITIES` is correct:** Grass immunity to Powder-keyword moves is a move-level effect, not a status condition immunity. A Grass-type Pokemon can be Poisoned by non-Powder means (e.g., Toxic Spikes, abilities).

3. **`Badly Poisoned` sharing Poison/Steel immunity is correct:** PTU treats Badly Poisoned as a severity variant of Poisoned, described in the same paragraph. The immunity text ("Poison and Steel-Type Pokemon are immune to becoming Poisoned") applies to both variants.

## Verdict

**APPROVED** -- Zero critical or high severity issues. One medium UX suggestion (immune tag visibility) that does not affect game logic correctness. All PTU rules verified against rulebook text. Both decree-006 and decree-012 are faithfully implemented. Interaction with decree-005 (status CS auto-apply) is properly handled at all trigger points.

## Required Changes

None. The medium issue is a UX recommendation, not a blocking change.
