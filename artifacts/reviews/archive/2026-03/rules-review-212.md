---
review_id: rules-review-212
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-011
domain: combat
commits_reviewed:
  - 3c513d09
  - de0ece19
  - 726e5591
  - 7416ab3d
  - 9dd916e6
  - 79c1d6de
  - b1a0df8d
  - b33e6063
mechanics_verified:
  - trapped-prevents-recall
  - volatile-status-clear-on-recall
  - temporary-hp-clear-on-recall
  - combat-stage-clear-on-recall
  - recall-cleared-conditions-list
  - switch-button-visibility
  - websocket-sync-on-switch
  - undo-redo-snapshot-on-switch
  - whirlwind-comment-decree-034
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#page-229-pokemon-switching
  - core/07-combat.md#page-234-combat-stages
  - core/07-combat.md#page-246-persistent-afflictions
  - core/07-combat.md#page-247-volatile-afflictions
  - core/07-combat.md#page-247-trapped
  - core/07-combat.md#page-247-temporary-hit-points
reviewed_at: 2026-03-01T09:36:00Z
follows_up: rules-review-208
---

## Fix Cycle Summary

This re-review verifies the 8 fix commits addressing ALL 5 issues from rules-review-208 (CRITICAL-001, HIGH-001, HIGH-002, MEDIUM-001, MEDIUM-002) and ALL 6 issues from code-review-232 (C1, H1, H2, M1, M2, M3). Each fix is verified against the PTU 1.05 rulebook and applicable decrees.

---

## Mechanics Verified

### 1. Trapped Condition Prevents Recall (CRITICAL-001 fix)

- **Rule:** "Trapped: A Pokemon or Trainer that is Trapped cannot be recalled. Ghost Type Pokemon are immune to the Trapped Condition." (`core/07-combat.md#page-247`)
- **Implementation:** `switching.service.ts:validateSwitch()` lines 364-370 now include step 3b, which checks both `statusConditions` and `tempConditions` arrays on the recalled combatant's entity for `'Trapped'` or `'Bound'`. If found, returns `{ valid: false, error: 'Pokemon is Trapped and cannot be recalled', statusCode: 400 }`.
- **Assessment:** The Trapped check is correctly positioned after step 3 (recalled combatant found) and before ownership checks. It checks both `statusConditions` (persistent DB array) and `tempConditions` (transient combatant array), ensuring coverage regardless of where the Trapped condition was applied.
- **Note on `'Bound'`:** The code also checks for `'Bound'`, which is not a PTU status condition (PTU uses "Bound" only for AP binding in features/stratagems). This is defensive but harmless -- `'Bound'` will never appear in a status conditions array, so the check has no functional impact. Not blocking.
- **Status:** CORRECT

### 2. RECALL_CLEARED_CONDITIONS Constant (HIGH-001 prerequisite)

- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls." (`core/07-combat.md#page-247`). Also: "Stuck... This condition may be removed by switching" (p.248). "Slowed... This condition may be removed by switching" (p.248).
- **Implementation:** `constants/statusConditions.ts` lines 34-37 define `RECALL_CLEARED_CONDITIONS` as:
  - All of `VOLATILE_CONDITIONS`: `Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed`
  - Plus: `Stuck, Slowed, Tripped, Vulnerable`
- **Assessment:** The list is comprehensive and correctly includes all volatile afflictions listed under PTU p.247 plus the movement-related conditions (Stuck, Slowed) that PTU p.248 explicitly says are "removed by switching." Tripped and Vulnerable are reasonably included as they are combat-scoped conditions that should reset on recall (a Pokemon re-released from a Poke Ball is not still mid-trip). The constant is centralized for reuse across systems (switching, encounter end, Pokemon Center healing).
- **Pre-existing concern (not a regression):** `Asleep` is categorized as volatile in `VOLATILE_CONDITIONS`, but PTU p.246 lists Sleep under "Persistent Afflictions" with the text "Persistent Afflictions are retained even if the Pokemon is recalled into its Poke Ball. Sleeping Pokemon will naturally awaken given time." This means recalling a sleeping Pokemon should NOT cure its Sleep condition per RAW. However, this classification predates the fix cycle -- it exists in the `VOLATILE_CONDITIONS` constant which was not introduced by this PR. The fix cycle correctly uses whatever `VOLATILE_CONDITIONS` provides. This pre-existing classification issue warrants a separate decree-need ticket (see MEDIUM-001 below) but does NOT block this fix cycle.
- **Status:** CORRECT (uses the existing classification; pre-existing Sleep classification concern noted separately)

### 3. Volatile Conditions Cleared on Recall (HIGH-001 fix)

- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls." (`core/07-combat.md#page-247`)
- **Implementation:** `switch.post.ts` lines 160-177, after step 2 (removal from combatants), fetches the recalled Pokemon's DB record, parses its `statusConditions` JSON, filters out all conditions in `RECALL_CLEARED_CONDITIONS` using a `Set` for O(1) lookups, and persists the filtered list back to the DB.
- **Assessment:** The implementation correctly strips volatile and switching-curable conditions from the persistent DB record while preserving persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned). The `Set`-based filtering is efficient and correct. When the Pokemon is later re-released, `buildPokemonEntityFromRecord` will load only the persistent conditions from the DB.
- **Status:** CORRECT

### 4. Temporary HP Cleared on Recall (HIGH-002 fix)

- **Rule:** "Temporary Hit Points are... lost if the user is recalled in a Poke Ball." (`core/07-combat.md#page-247`)
- **Implementation:** `switch.post.ts` line 173 sets `temporaryHp: 0` in the same `prisma.pokemon.update` call that clears volatile conditions. Combined with the volatile condition clearing into a single atomic DB update.
- **Assessment:** The `temporaryHp` field is correctly zeroed on the DB record. When the Pokemon is re-released, it will load with 0 temp HP. This matches PTU RAW exactly.
- **Status:** CORRECT

### 5. Combat Stages Cleared on Recall (MEDIUM-002 fix)

- **Rule:** "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter." (`core/07-combat.md#page-234`)
- **Implementation:** `switch.post.ts` line 174 sets `stageModifiers: JSON.stringify({})` in the same DB update. Additionally, `buildCombatantFromEntity` (in `combatant.service.ts` line 605-616) explicitly creates fresh default stage modifiers on combat entry with the comment "Reset stageModifiers to defaults for combat entry (PTU p.235: stages are combat-scoped)."
- **Assessment:** Double protection: (1) the DB record is explicitly zeroed on recall, and (2) `buildCombatantFromEntity` initializes fresh stages regardless of DB state. This eliminates the data hygiene concern from rules-review-208 MEDIUM-002. Even if a code path somehow skipped the DB reset, the combatant builder would still start clean. Belt and suspenders.
- **Status:** CORRECT

### 6. WebSocket `pokemon_switched` Handler (code-review-232 C1 fix)

- **Rule:** N/A (infrastructure, not game logic)
- **Implementation:** `useWebSocket.ts` lines 195-197 add `case 'pokemon_switched'` to the `handleMessage` switch statement, calling `getEncounterStore().updateFromWebSocket(message.data.encounter)`.
- **Assessment:** The handler correctly extracts `message.data.encounter` (matching the broadcast payload structure from `switch.post.ts` line 262-274 which nests the encounter under `data.encounter`). Group View and Player View will now update when a switch occurs.
- **Status:** CORRECT

### 7. Undo Snapshot and WebSocket Broadcast (code-review-232 H1/H2 fix)

- **Rule:** N/A (infrastructure, not game logic)
- **Implementation:** `pages/gm/index.vue`:
  - `handleSwitchPokemon` (line 392) now calls `encounterStore.captureSnapshot('Switch Pokemon')` before opening the modal, capturing pre-switch state.
  - `handleSwitchCompleted` (lines 398-409) calls `refreshUndoRedoState()` after the modal closes, then broadcasts `encounter_update` via WebSocket with the full encounter state.
- **Assessment:** The undo snapshot is correctly captured before the modal opens (before the switch is executed), following the same pattern as other combat actions. The WebSocket broadcast in the `@switched` handler ensures Group/Player views get the `encounter_update` event as well as the `pokemon_switched` event (matching the dual-broadcast pattern used by other state-modifying actions).
- **Status:** CORRECT

### 8. Switch Button Visibility (code-review-232 M1 fix)

- **Rule:** N/A (UI logic)
- **Implementation:** `CombatantCard.vue` lines 341-355, `canShowSwitchButton` now checks:
  - For trainers: whether they own at least one Pokemon in the encounter (queries `encounterStore.encounter?.combatants`)
  - For Pokemon: whether they have an `ownerId` (i.e., are owned by a trainer)
- **Assessment:** NPC guards and bystanders without Pokemon will no longer show a Switch button. Wild Pokemon (no owner) will also not show it. Correct.
- **Status:** CORRECT

### 9. Switch Button Disabled Logic (code-review-232 M3 fix)

- **Rule:** PTU p.229: "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts."
- **Implementation:** `CombatantCard.vue` lines 362-397, `isSwitchDisabled` now correctly handles both directions:
  - For trainer cards: checks if it's the trainer's turn OR any of their owned Pokemon's turns, then checks `standardActionUsed` on the initiating combatant (whoever's turn it is).
  - For Pokemon cards: checks if it's this Pokemon's turn OR its trainer's turn, then checks `standardActionUsed` on the initiating combatant.
- **Assessment:** This correctly mirrors the server-side `validateActionAvailability` logic. A switch can be initiated from either the trainer's or Pokemon's turn, and the Standard Action is consumed on whichever combatant's turn it is. The button will be enabled when the switch is actually available, regardless of which card the GM clicks.
- **Status:** CORRECT

### 10. Whirlwind Comment and Over-fetch Documentation (code-review-232 M2/rules-review-208 MEDIUM-001 fix)

- **Rule:** Per decree-034: "Whirlwind is a push move, not a forced switch."
- **Implementation:** `types/combat.ts` line 121, the `SwitchAction.forced` JSDoc now reads: `"Whether forced by a move with recall mechanics (Roar, etc.) -- per decree-034, only moves with explicit recall text qualify"`. The Whirlwind reference has been removed.
- **Assessment:** Correctly removes the misleading Whirlwind reference per decree-034. The updated comment accurately reflects the decree ruling.
- **Additional:** `useSwitching.ts` lines 17-25 add a comment documenting the over-fetch from the character endpoint, noting it as a P1 optimization target. This addresses code-review-232 M2.
- **Status:** CORRECT

---

## Decree Compliance

### decree-002: PTU alternating diagonal for range
**Status: Compliant.** `checkRecallRange()` continues to use `ptuDiagonalDistance` for the 8m recall range calculation. No changes in this fix cycle.

### decree-006: Dynamic initiative reorder
**Status: Compliant.** `insertIntoTurnOrder()` is unchanged. The fix cycle did not touch initiative insertion logic.

### decree-021: True two-phase League Battles
**Status: Compliant.** League battle turn order insertion is unchanged. The fix cycle did not touch League-specific logic.

### decree-033: Fainted switch on trainer's next turn
**Status: Not applicable to P0.** Fainted switch is P1 scope. No impact from this fix cycle.

### decree-034: Roar/Whirlwind
**Status: Compliant.** The `SwitchAction.forced` JSDoc comment has been corrected to remove the Whirlwind reference per this decree.

---

## Summary

All 11 issues from the previous reviews (rules-review-208 + code-review-232) have been correctly addressed:

| Issue | Fix Commit | Verified |
|-------|-----------|----------|
| CRITICAL-001 (Trapped check) | 3c513d09 | Correct -- blocks recall of Trapped Pokemon |
| HIGH-001 (volatile clearing) | de0ece19 + 726e5591 | Correct -- centralized constant, DB filter on recall |
| HIGH-002 (temp HP clearing) | 726e5591 | Correct -- `temporaryHp: 0` on recall |
| MEDIUM-001 (Whirlwind comment) | b1a0df8d | Correct -- decree-034 compliant |
| MEDIUM-002 (stage clearing) | 726e5591 | Correct -- DB reset + builder defense |
| C1 (WS handler) | 7416ab3d | Correct -- `pokemon_switched` case added |
| H1 (undo snapshot) | 9dd916e6 | Correct -- pre-switch snapshot captured |
| H2 (WS broadcast) | 9dd916e6 | Correct -- `encounter_update` broadcast on completion |
| M1 (button visibility) | 79c1d6de | Correct -- checks actual Pokemon ownership |
| M2 (over-fetch doc) | b1a0df8d | Correct -- documented as P1 optimization |
| M3 (disabled logic) | 79c1d6de | Correct -- checks both trainer and Pokemon turns |

No regressions detected. The recall side-effects (volatile clearing, temp HP clearing, stage clearing) are applied atomically in a single DB update, which is efficient and prevents partial-state issues.

---

## Rulings

### MEDIUM-001: Pre-existing Sleep Classification May Conflict with PTU RAW

- **Severity:** MEDIUM (pre-existing, NOT introduced by this fix cycle)
- **Rule:** PTU p.246: "Persistent Afflictions are retained even if the Pokemon is recalled into its Poke Ball. Sleeping Pokemon will naturally awaken given time."
- **File:** `app/constants/statusConditions.ts`, line 12 (`VOLATILE_CONDITIONS` includes `'Asleep'`)
- **Issue:** PTU p.246 lists Sleep (Asleep) under the "Persistent Afflictions" heading and explicitly states persistent afflictions are "retained even if the Pokemon is recalled." However, the codebase classifies `Asleep` as a volatile condition. Since `RECALL_CLEARED_CONDITIONS` includes all of `VOLATILE_CONDITIONS`, recalling a sleeping Pokemon will cure its Sleep, which contradicts PTU RAW.
- **Impact:** Recalling a sleeping Pokemon removes the Sleep condition when it should persist. This is a pre-existing classification issue in `VOLATILE_CONDITIONS` that was NOT introduced by the fix cycle -- the fix cycle correctly uses whatever list `VOLATILE_CONDITIONS` provides.
- **Recommendation:** File a `decree-need` ticket to rule on whether Sleep should be reclassified as persistent (matching PTU RAW) or remain volatile (gameplay convenience). The PTU text is clear -- Sleep is persistent -- but the video games treat it as volatile-like, which may be the design intent. A decree is needed to resolve the ambiguity.
- **This does NOT block the fix cycle.** The fix cycle is correct in its scope. The Sleep classification is a broader concern that affects multiple systems (encounter end, Pokemon Center, switching).

---

## Verdict

**APPROVED**

All 11 issues from rules-review-208 and code-review-232 have been correctly fixed. The recall side-effects (Trapped blocking, volatile condition clearing, temporary HP clearing, combat stage clearing) are mechanically correct per PTU 1.05 p.247-248. The WebSocket sync, undo/redo integration, and UI logic fixes are also correct. Decree compliance is maintained across all applicable decrees (decree-002, decree-006, decree-021, decree-033, decree-034).

One pre-existing MEDIUM concern (Sleep/Asleep classification as volatile vs. persistent) is noted for a future decree-need ticket but does NOT block this approval. The fix cycle did not introduce this classification and should not be held responsible for it.

P0 switching workflow is approved to proceed.

---

## Required Changes

None. All issues resolved.
