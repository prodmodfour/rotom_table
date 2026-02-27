---
review_id: code-review-186
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 255ef94
  - a36d075
  - 0f3f5ef
  - 065fb8c
  - 9f19f93
  - e6d3d1b
  - ac3ad08
  - 610f9f7
  - 0172504
  - 704bcd6
  - fd7db73
  - 07ea6da
  - d634863
  - 6f75c85
  - 002e5cf
  - 9592a5d
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/stages.post.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/stores/encounter.ts
  - app/stores/encounterCombat.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useTypeChart.ts
  - app/utils/typeStatusImmunity.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
  - app/components/encounter/GMActionModal.vue
  - app/types/encounter.ts
  - app/constants/statusConditions.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-02-26T20:15:00Z
follows_up: null
---

## Review Scope

Reviewing the combined implementation of ptu-rule-099 (dynamic initiative reorder on Speed CS change, per decree-006) and ptu-rule-104 (type-based status immunity enforcement, per decree-012). 16 commits across 16 files, 703 lines added.

Both features are P1 combat domain improvements sourced from binding design decrees. The implementation touches server services, API endpoints, client stores, composables, and Vue components.

## Issues

### HIGH-1: Initiative reorder triggers on speed key presence, not actual speed change

**File:** `app/server/api/encounters/[id]/stages.post.ts`, line 50

```typescript
const speedChanged = 'speed' in body.changes
```

This checks whether the request body contains a `speed` key, not whether the speed CS actually changed value. If the GM sends `{ speed: 0 }` (delta of 0), or sends a value that gets clamped to the same value (e.g., sending `+1` when already at `+6`), the initiative reorder will fire unnecessarily. This causes:
- Unnecessary database writes (saving combatants + turn orders)
- Re-rolling of tie-breaking dice (`sortByInitiativeWithRollOff` re-rolls d20s for tied combatants), which silently changes the turn order for combatants that tied on initiative even though no speed change occurred
- Incorrect behavior: a no-op stage change should not reshuffle the turn order

**Fix:** Use the `stageResult.changes` return value to check for actual speed change:
```typescript
const speedChanged = stageResult.changes.speed && stageResult.changes.speed.change !== 0
```

### HIGH-2: `resetCombatantsForNewRound` does not reset `turnState` (pre-existing, now load-bearing)

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`, lines 139-146

```typescript
function resetCombatantsForNewRound(combatants: any[]) {
  combatants.forEach((c: any) => {
    c.hasActed = false
    c.actionsRemaining = 2
    c.shiftActionsRemaining = 1
    c.readyAction = null
  })
}
```

This resets `c.hasActed` (legacy field) but does NOT reset `c.turnState.hasActed`, `c.turnState.standardActionUsed`, etc. While this pre-dates this PR, the WebSocket surgical update (commit e6d3d1b) now explicitly syncs `hasActed` to the client. If a combatant's `turnState.hasActed` remains `true` from the previous round, the client-side `combatantsWithActions` getter (encounter store, line 87) will report the combatant as unable to act even at the start of a new round.

This was previously masked because the full `turnState` object gets overwritten via `Object.assign(existing.entity, incomingCombatant.entity)` -- but wait, `turnState` lives on the combatant, not the entity. The surgical update does sync `existing.turnState = incomingCombatant.turnState` (line 417), but the server sends stale `turnState` because `resetCombatantsForNewRound` never resets it.

**Fix:** Add `turnState` reset to `resetCombatantsForNewRound`:
```typescript
c.turnState = {
  hasActed: false,
  standardActionUsed: false,
  shiftActionUsed: false,
  swiftActionUsed: false,
  canBeCommanded: true,
  isHolding: false
}
```

**Note:** This is a pre-existing bug now made more visible by the new hasActed sync. File a separate ticket if preferred, but this must be fixed before the initiative reorder feature is reliable.

### MEDIUM-1: `app-surface.md` not updated for new utility and service functions

**File:** `.claude/skills/references/app-surface.md`

The new `app/utils/typeStatusImmunity.ts` utility is a shared module used by both server and client but is not registered in `app-surface.md`. Additionally, the new `calculateCurrentInitiative` (combatant service) and `reorderInitiativeAfterSpeedChange` / `saveInitiativeReorder` (encounter service) functions represent significant new capabilities of the service layer that should be documented.

**Fix:** Add entries for the new utility and the new service functions to `app-surface.md`.

### MEDIUM-2: StatusConditionsModal uses mutable array operations

**File:** `app/components/encounter/StatusConditionsModal.vue`, lines 83-89

```typescript
const toggleStatus = (status: StatusCondition) => {
  const index = statusInputs.value.indexOf(status)
  if (index === -1) {
    statusInputs.value.push(status)      // mutation
  } else {
    statusInputs.value.splice(index, 1)  // mutation
  }
}
```

And line 92:
```typescript
const clearAllStatuses = () => {
  statusInputs.value = []
}
```

The `toggleStatus` method uses `.push()` and `.splice()` to mutate the reactive array in place. Per project coding standards (CLAUDE.md + coding-style.md), immutable patterns should be used. While Vue's reactivity system handles array mutations correctly, the project has a hard rule against mutation for consistency.

**Fix:**
```typescript
const toggleStatus = (status: StatusCondition) => {
  const index = statusInputs.value.indexOf(status)
  if (index === -1) {
    statusInputs.value = [...statusInputs.value, status]
  } else {
    statusInputs.value = statusInputs.value.filter(s => s !== status)
  }
}
```

### MEDIUM-3: Redundant initiative reorder in breather endpoint when speed CS didn't change

**File:** `app/server/api/encounters/[id]/breather.post.ts`, line 168

```typescript
if (result.stagesReset && record.isActive) {
```

The breather endpoint triggers initiative reorder whenever `stagesReset` is true. However, `stagesReset` checks if ANY stage was non-default, not specifically speed. If a combatant only had +2 Attack CS and took a breather, the initiative reorder fires even though speed CS was unchanged (still 0 before and after). This causes the same tie-breaker re-roll problem as HIGH-1.

After `reapplyActiveStatusCsEffects` runs, the combatant's speed may differ from what it was before the breather IF they had a Paralysis (which survives breather). So the reorder is only necessary when the pre-breather speed CS was non-zero OR the combatant has a speed-affecting status condition.

**Fix:** Track whether speed CS actually changed before/after the breather reset + reapply cycle, and only trigger reorder if it did. Example:
```typescript
const speedBefore = stages.speed ?? 0
// ... reset and reapply ...
const speedAfter = entity.stageModifiers?.speed ?? 0
const speedChanged = speedBefore !== speedAfter
```

## What Looks Good

1. **Shared type-status immunity utility** (`typeStatusImmunity.ts`): Clean extraction of the immunity map and helper functions. Well-documented with PTU page references. The `findImmuneStatuses` helper returns structured data that makes error messages informative.

2. **`calculateCurrentInitiative` function** (combatant service): Correctly mirrors `buildCombatantFromEntity` logic but uses current CS-modified speed. Properly accounts for human equipment bonuses (Focus speed bonus). Returns without mutating -- pure function.

3. **`reorderInitiativeAfterSpeedChange` function** (encounter service): Correctly implements decree-006 semantics. The split of acted/unacted slots based on `turnIndex` position (not the `hasActed` flag) is the right approach since `turnIndex` is the authoritative position indicator. League battle handling with separate trainer/pokemon orders and correct sort direction (ascending for declaration, descending for pokemon phase) is properly implemented.

4. **Decree compliance:**
   - Per decree-006: initiative reorders immediately on speed change, only unacted combatants are re-sorted, acted combatants are frozen. All three trigger points (stages, status, breather) are covered.
   - Per decree-012: server rejects immune statuses with 409 and informative message. GM override via `override: true` parameter. Client shows IMMUNE tags, warning banner, and "Force Apply" button. Quick-add in GMActionModal shows alert guiding user to full modal.
   - Per decree-005: status CS effects are properly reversed/applied during status changes, and `reapplyActiveStatusCsEffects` is correctly called in the breather endpoint after stage reset.

5. **Client-side UX for immunity** (StatusConditionsModal): IMMUNE tags on individual checkboxes, a warning banner summarizing all immune conflicts, and a separate "Force Apply (GM Override)" button that only appears when needed. The computed properties for `immuneWarnings`, `hasImmuneAdditions`, and `isNewAndImmune` are well-structured.

6. **Override propagation chain**: The override flag correctly flows through CombatantCard -> CombatantSides -> GMActionModal -> useEncounterActions -> encounterCombat store -> status API. Each layer properly declares the `override: boolean` parameter in its emit/function signature.

7. **Error handling for 409**: `useEncounterActions.handleStatus` catches the 409 error from the type immunity check and shows an informative alert guiding the GM to use the full StatusConditionsModal for override. This is better than silently swallowing the error.

8. **Commit granularity**: 16 commits for two features across 16 files. Each commit addresses a single logical change. The progression is sensible: service layer first, then API triggers, then client-side propagation.

9. **WebSocket hasActed sync** (commit e6d3d1b): Correctly identified that the surgical update was missing the `hasActed` field, which is now needed for the Group View to correctly reflect acted/unacted state after initiative reorders.

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues require fixes before approval:

- **HIGH-1** can cause silent turn-order corruption (tie-breaker re-rolls on no-op speed changes). A one-line fix using `stageResult.changes.speed?.change !== 0`.
- **HIGH-2** is a pre-existing bug now made load-bearing by the hasActed WebSocket sync. The `resetCombatantsForNewRound` function must reset `turnState` to ensure new-round state is correct. This should be fixed in the same branch since the PR adds the sync that exposes the bug.

The three MEDIUM issues (app-surface.md, array mutation, redundant breather reorder) should also be addressed in this cycle.

## Required Changes

1. **HIGH-1**: In `stages.post.ts`, replace `'speed' in body.changes` with `stageResult.changes.speed?.change !== 0` to only trigger reorder on actual speed CS changes.
2. **HIGH-2**: In `next-turn.post.ts`, add full `turnState` reset to `resetCombatantsForNewRound`.
3. **MEDIUM-1**: Update `app-surface.md` with the new utility file and service functions.
4. **MEDIUM-2**: Replace `.push()` and `.splice()` in StatusConditionsModal's `toggleStatus` with immutable patterns.
5. **MEDIUM-3**: In `breather.post.ts`, track speed CS before/after the reset+reapply cycle and only trigger initiative reorder when speed actually changed.
