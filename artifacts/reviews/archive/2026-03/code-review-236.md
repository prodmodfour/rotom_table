---
review_id: code-review-236
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/composables/useWebSocket.ts
  - app/composables/useSwitching.ts
  - app/pages/gm/index.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/SwitchPokemonModal.vue
  - app/types/combat.ts
  - app/constants/statusConditions.ts
  - app/stores/encounter.ts
  - app/types/encounter.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-01T09:35:00Z
follows_up: code-review-232
---

## Review Scope

Re-review of feature-011 Pokemon Switching Workflow P0 fix cycle. The developer addressed all 11 issues from code-review-232 (C1, H1, H2, M1, M2, M3) and rules-review-208 (CRITICAL-001, HIGH-001, HIGH-002, MEDIUM-001, MEDIUM-002) across 8 fix commits. This review verifies each fix against the original issue, checks for regressions, and confirms PTU recall side-effects are mechanically correct.

Decree compliance checked: decree-006 (initiative reordering), decree-021 (League two-phase), decree-033 (fainted switch timing), decree-034 (Roar/Whirlwind).

## Fix Verification

### CRITICAL-001 (rules-review-208): Trapped Condition Check — RESOLVED

**Commit:** 3c513d09
**File:** `app/server/services/switching.service.ts`, lines 364-370

The developer added step 3b to `validateSwitch()` after the recalled combatant is found (step 3). The check reads `statusConditions` from the entity and `tempConditions` from the combatant, merges them, and blocks recall if either `'Trapped'` or `'Bound'` is present. The positioning is correct -- the check runs before ownership validation, range check, and action availability, meaning a Trapped Pokemon is rejected immediately.

The check also examines `tempConditions` (temporary conditions on the combatant, cleared at turn end), which is defensive but correct since Trapped could theoretically be applied as a temporary condition in future extensions.

One note: `'Bound'` is included in the check, but "Bound" is not a recognized `StatusCondition` in the PTU type system (`combat.ts` line 4-9) or in `statusConditions.ts`. In PTU, "Bound" refers to Action Points being bound (p.226), not a combat status condition. This is a harmless no-op (the condition can never match since no code path applies "Bound" as a status condition), but see MEDIUM-001 below for the documentation concern.

**Verdict:** Fix is correct. Trapped Pokemon are now properly blocked from recall per PTU p.247.

### C1 (code-review-232): WebSocket `pokemon_switched` Handler — RESOLVED

**Commit:** 7416ab3d
**File:** `app/composables/useWebSocket.ts`, lines 195-197

A `case 'pokemon_switched'` handler was added to `handleMessage()` that calls `getEncounterStore().updateFromWebSocket(message.data.encounter)`. This matches the broadcast payload shape from `switch.post.ts` (line 262-274), which sends `{ type: 'pokemon_switched', data: { ..., encounter: responseEncounter } }`.

Group View and Player View will now correctly update their encounter state when a switch occurs. The handler follows the exact pattern used by `encounter_update` and `encounter_served`.

**Verdict:** Fix is correct.

### H1 (code-review-232): Undo Snapshot for Switch — RESOLVED

**Commit:** 9dd916e6
**File:** `app/pages/gm/index.vue`, lines 391-393

`handleSwitchPokemon()` now calls `encounterStore.captureSnapshot('Switch Pokemon')` before opening the switch modal. This captures the pre-switch encounter state, which is the correct approach since the snapshot must reflect the state before the switch happens.

The `handleSwitchCompleted()` function (lines 398-408) calls `refreshUndoRedoState()` after the switch succeeds, following the pattern used by every other state-modifying action in the GM page.

**Verdict:** Fix is correct. Switching is now undoable via Ctrl+Z, and the undo history chain is preserved.

### H2 (code-review-232): encounter_update WebSocket Broadcast — RESOLVED

**Commit:** 9dd916e6
**File:** `app/pages/gm/index.vue`, lines 398-408

`handleSwitchCompleted()` now broadcasts an `encounter_update` event via WebSocket after the switch succeeds. The implementation uses `await nextTick()` before the broadcast (line 402) to ensure Vue reactivity has processed the store update, then sends the full encounter state. This follows the exact pattern used by `nextTurn`, `startEncounter`, `handleSetWeather`, and `handleDeclarationBroadcast`.

This provides a secondary sync path for Group/Player views alongside the server-side `pokemon_switched` broadcast. Both paths converge on `updateFromWebSocket()`, which handles idempotent updates correctly via the surgical merge logic.

**Verdict:** Fix is correct.

### M1 (code-review-232): canShowSwitchButton Trainer Check — RESOLVED

**Commit:** 79c1d6de
**File:** `app/components/encounter/CombatantCard.vue`, lines 341-355

`canShowSwitchButton` no longer returns `true` for all human combatants. It now checks whether the trainer (identified by `entityId`) actually owns any Pokemon in the encounter by querying `encounterStore.encounter?.combatants.some(c => c.type === 'pokemon' && (c.entity as Pokemon).ownerId === trainerEntityId)`. NPC guards or bystanders without Pokemon will not show a Switch button.

The Pokemon branch (lines 350-353) correctly checks `!!pokemon.ownerId` -- wild Pokemon without owners don't show a Switch button.

**Verdict:** Fix is correct.

### M3 (code-review-232): Switch Button Disabled Logic — RESOLVED

**Commit:** 79c1d6de
**File:** `app/components/encounter/CombatantCard.vue`, lines 362-397

The `isSwitchDisabled` computed now handles both cases correctly:

- **Trainer card (lines 369-381):** Checks if it is the trainer's turn OR if any of their owned Pokemon's turns are active. Finds the current-turn combatant and checks `standardActionUsed` on the correct initiator.
- **Pokemon card (lines 383-394):** Checks if it is this Pokemon's turn OR if the Pokemon's trainer's turn is active. Same initiator logic.

This mirrors the server-side `validateActionAvailability()` logic in `switching.service.ts`, which checks both `isTrainerTurn` and `isPokemonTurn`. The button is now enabled when a switch can legitimately be initiated from either the trainer's or Pokemon's turn.

**Verdict:** Fix is correct and consistent with server validation.

### HIGH-001 / HIGH-002 / MEDIUM-002 (rules-review-208): Recall Side-Effects — RESOLVED

**Commits:** de0ece19 (constant), 726e5591 (DB update)
**Files:** `app/constants/statusConditions.ts` lines 27-37, `app/server/api/encounters/[id]/switch.post.ts` lines 160-177

The developer created `RECALL_CLEARED_CONDITIONS` in the centralized `statusConditions.ts` constant file (lines 27-37), which includes all volatile conditions (`Asleep`, `Bad Sleep`, `Confused`, `Flinched`, `Infatuated`, `Cursed`, `Disabled`, `Enraged`, `Suppressed`) plus the switching-clearable conditions (`Stuck`, `Slowed`, `Tripped`, `Vulnerable`). The JSDoc comment (lines 28-33) correctly cites PTU p.247-248 and explains what is NOT cleared (persistent conditions, Fainted, Dead, Trapped).

In `switch.post.ts`, step 2b (lines 160-177) executes the recall side-effects:
1. Reads the recalled Pokemon's DB record
2. Parses `statusConditions` from JSON
3. Filters out all `RECALL_CLEARED_CONDITIONS` using a Set for O(1) lookup
4. Updates the DB record with: persistent-only conditions, `temporaryHp: 0`, `stageModifiers: JSON.stringify({})`

This single DB update addresses all three rules-review issues:
- **HIGH-001:** Volatile conditions cleared via the filter against `RECALL_CLEARED_CONDITIONS`
- **HIGH-002:** `temporaryHp` set to 0 per PTU p.247 ("lost if the user is recalled in a Poke Ball")
- **MEDIUM-002:** `stageModifiers` reset to empty object per PTU p.234 ("remain until the Pokemon or Trainer is switched out")

The placement of this DB update (after removal from encounter, before building the new combatant) is correct -- the recalled Pokemon's persistent state is cleaned up before any subsequent operations.

**Verdict:** All three fixes are correct. PTU recall side-effects are now mechanically complete.

### MEDIUM-001 (rules-review-208): Whirlwind Comment Fix — RESOLVED

**Commit:** b1a0df8d
**File:** `app/types/combat.ts`, line 121

The `SwitchAction.forced` JSDoc comment was changed from `"Whether forced by a move (Roar, Whirlwind, etc.)"` to `"Whether forced by a move with recall mechanics (Roar, etc.) -- per decree-034, only moves with explicit recall text qualify"`. This correctly removes the Whirlwind reference and cites decree-034. Whirlwind is a push move with no recall mechanic per the decree.

**Verdict:** Fix is correct. Decree-034 compliance verified.

### M2 (code-review-232): Over-Fetch Documentation — RESOLVED

**Commit:** b1a0df8d
**File:** `app/composables/useSwitching.ts`, lines 17-25

The developer added a documentation comment acknowledging the over-fetch from the full character endpoint. The comment explains that a dedicated `/api/characters/:id/pokemon` endpoint does not exist yet, marks this as a "P1 optimization target," and notes that the current approach "works correctly but transfers unnecessary character data."

**Verdict:** Fix is acceptable. The over-fetch is documented and tracked for future optimization.

## Issues

### MEDIUM

#### MEDIUM-001. Spurious `'Bound'` Condition Check in Trapped Validation

**File:** `app/server/services/switching.service.ts`, line 368
**Severity:** MEDIUM

```typescript
if (allRecalledConditions.includes('Trapped') || allRecalledConditions.includes('Bound')) {
```

The Trapped validation check also tests for `'Bound'`, but "Bound" is not a recognized `StatusCondition` in the codebase. The `StatusCondition` type union in `combat.ts` does not include "Bound." The `ALL_STATUS_CONDITIONS` array in `statusConditions.ts` does not include "Bound." No code path in the application ever applies "Bound" as a status condition. In PTU 1.05, "Bound" refers to Action Points being bound by Features/Stratagems (p.226), not a combat status condition that prevents recall.

This check is a no-op (it will never match), but it is misleading. A future developer reading this code will think "Bound" is a known condition that prevents recall, which could lead to confusion or incorrect implementation of AP-binding features.

**Fix:** Remove the `|| allRecalledConditions.includes('Bound')` clause. If a "Bound" status condition is ever added in the future (e.g., via Bind/Wrap moves), it should be added explicitly at that time with proper PTU rule citations. File as a ticket if not fixed now.

## What Looks Good

1. **Centralized RECALL_CLEARED_CONDITIONS constant.** The rules-review-208 recommended centralizing the volatile conditions list, and the developer placed it in `constants/statusConditions.ts` alongside the existing condition category arrays. The constant is reusable for encounter-end cleanup and Pokemon Center healing. The JSDoc comment is thorough and correct.

2. **Recall side-effects are batched into a single DB update.** The combined `prisma.pokemon.update()` clearing volatile statuses, temp HP, and stage modifiers is efficient (1 DB call instead of 3) and atomically correct.

3. **Set-based condition filtering.** The use of `new Set(RECALL_CLEARED_CONDITIONS)` with `.has()` for O(1) lookup is a good performance pattern, even if the current list is small.

4. **WebSocket handler follows existing patterns.** The `pokemon_switched` case in `useWebSocket.ts` is minimal and correct, matching the `encounter_served` handler pattern exactly.

5. **isSwitchDisabled computed is thorough.** The trainer card and Pokemon card branches both correctly resolve the current-turn combatant and check `standardActionUsed` on the initiator. The logic mirrors the server-side validation, reducing the risk of UI/server disagreement.

6. **Undo snapshot timing is correct.** Capturing before the modal opens (not after the switch) ensures the snapshot contains the pre-switch state. This matches the pattern used by other undoable actions in the GM page.

7. **handleSwitchCompleted broadcast uses nextTick.** Awaiting `nextTick()` before broadcasting ensures the encounter store has been updated by the API response, so the broadcast payload reflects the post-switch state. This is consistent with all other broadcast points in the GM page.

8. **Commit granularity is excellent.** 8 commits, each addressing a specific review issue or logically grouped set of issues. No unrelated changes bundled. The resolution log in the ticket accurately maps commits to review issues.

9. **Decree-034 compliance is explicit.** The `SwitchAction.forced` comment now cites the decree by number, making the design rationale traceable. This is good practice.

## Verdict

**APPROVED**

All 11 issues from code-review-232 and rules-review-208 have been correctly addressed. The PTU recall side-effects (Trapped block, volatile condition clearing, temporary HP clearing, combat stage reset) are mechanically correct per PTU 1.05 p.234/p.247-248. The WebSocket sync, undo/redo integration, and UI logic fixes are consistent with existing codebase patterns. Decree compliance is maintained (decree-002 diagonal distance, decree-006 initiative insertion, decree-021 League phases, decree-034 Roar/Whirlwind).

The single MEDIUM issue (spurious `'Bound'` condition check) is not blocking because it is a no-op that does not affect correctness. It should be cleaned up as part of P1 implementation or filed as a minor ticket.

P0 is approved for merge. P1 implementation (League restriction, fainted switch, forced switch) can proceed.

## Remaining Items (Non-Blocking)

| ID | Severity | File | Description |
|----|----------|------|-------------|
| MEDIUM-001 | MEDIUM | `app/server/services/switching.service.ts:368` | Remove spurious `'Bound'` condition check from Trapped validation — "Bound" is not a recognized StatusCondition in this system |
