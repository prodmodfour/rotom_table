---
review_id: code-review-192
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-099+104
domain: combat
commits_reviewed:
  - 7d757e0
  - 44e9b49
  - b9e452a
  - 654b97b
  - 7edb01d
  - 3d39f9b
files_reviewed:
  - app/server/api/encounters/[id]/stages.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/utils/typeStatusImmunity.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/in-progress/ptu-rule/ptu-rule-099.md
  - artifacts/tickets/in-progress/ptu-rule/ptu-rule-104.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-27T18:30:00Z
follows_up: code-review-186
---

## Review Scope

Re-review of the fix cycle for code-review-186, which found 2 HIGH and 3 MEDIUM issues across ptu-rule-099 (dynamic initiative reorder, decree-006) and ptu-rule-104 (type-based status immunity, decree-012). Six commits addressing the five identified issues.

This review verifies each fix against its original issue and checks for regressions.

## Issues

### CRITICAL-1: stages.post.ts HIGH-1 fix is logically inverted — triggers reorder on ALL stage changes instead of only speed changes

**File:** `app/server/api/encounters/[id]/stages.post.ts`, line 50

**Original issue (HIGH-1):** `'speed' in body.changes` triggered reorder when speed key was present but value didn't actually change.

**Applied fix:**
```typescript
const speedChanged = stageResult.changes.speed?.change !== 0
```

**Problem:** When `speed` is NOT in `body.changes`, the `updateStageModifiers` function (combatant.service.ts, line 489) only iterates over keys in `body.changes` and only adds those keys to `stageResult.changes`. Therefore:

1. GM sends `{ attack: 2 }` (no speed key)
2. `stageResult.changes` = `{ attack: { previous: 0, change: 2, current: 2 } }`
3. `stageResult.changes.speed` = `undefined`
4. `stageResult.changes.speed?.change` = `undefined` (optional chaining returns undefined)
5. `undefined !== 0` = **`true`**
6. `speedChanged` = `true` -- **incorrect**

This means every non-speed stage change (attack, defense, specialAttack, etc.) now triggers a full initiative reorder, which is strictly worse than the original bug. The original only triggered when `speed` was explicitly in the request; this triggers on every stage change request.

The consequence is the exact same "spurious tie-breaker re-rolls that silently corrupt turn order" problem from HIGH-1, but now for 100% of stage change operations instead of only the subset that included the speed key.

**Root cause:** The developer used optional chaining (`?.`) instead of the truthiness guard that was suggested in code-review-186. Optional chaining evaluates to `undefined` when the chain short-circuits, and `undefined !== 0` is `true` in JavaScript. The review's suggested fix used a different pattern:

```typescript
// code-review-186 suggested:
stageResult.changes.speed && stageResult.changes.speed.change !== 0

// developer used (WRONG):
stageResult.changes.speed?.change !== 0
```

**Fix:** Use an explicit truthiness check to ensure speed is actually in the changes before checking the delta:
```typescript
const speedChanged = stageResult.changes.speed != null && stageResult.changes.speed.change !== 0
```

Or equivalently, the pattern from the original review:
```typescript
const speedChanged = Boolean(stageResult.changes.speed) && stageResult.changes.speed.change !== 0
```

## Fixes That Look Good

### HIGH-2 fix (44e9b49): turnState reset in resetCombatantsForNewRound -- CORRECT

The `resetCombatantsForNewRound` function now properly resets the `turnState` object alongside the legacy fields. The reset values are correct:
- `hasActed: false` -- combatant has not acted yet in the new round
- `standardActionUsed: false` -- standard action available
- `shiftActionUsed: false` -- shift action available
- `swiftActionUsed: false` -- swift action available
- `canBeCommanded: true` -- Pokemon can be commanded
- `isHolding: false` -- not holding an action

This matches the default turnState structure used in `buildCombatantFromEntity` and correctly addresses the stale turnState bug that was exposed by the hasActed WebSocket sync.

The comment documenting that mutation is acceptable here (because combatants are freshly parsed from JSON with no shared references) is appropriate.

### MED-2 fix (b9e452a): StatusConditionsModal immutable patterns -- CORRECT

`toggleStatus` now uses `[...statusInputs.value, status]` for add and `.filter(s => s !== status)` for remove. Both are proper immutable patterns that replace the previous `.push()` and `.splice()` mutations. The `clearAllStatuses` function (`statusInputs.value = []`) was already using reassignment (not mutation), so it correctly required no change.

### MED-3 fix (654b97b): Breather speed CS tracking -- CORRECT

The fix captures `speedCsBefore` from `stages.speed ?? 0` before the reset, and `speedCsAfter` from `entity.stageModifiers?.speed ?? 0` after `reapplyActiveStatusCsEffects` runs. The comparison `speedCsBefore !== speedCsAfter` correctly determines whether the breather cycle actually changed the speed CS value. This properly handles:
- Combatant with +2 Attack CS but 0 Speed CS: speed unchanged, no reorder
- Combatant with +3 Speed CS and no surviving status: speed goes from +3 to 0, reorder triggers
- Combatant with +3 Speed CS and Paralysis (survives breather): speed goes from +3 to -4 (Paralysis reapplied), reorder triggers
- Combatant with -4 Speed CS from Paralysis only: speed goes from -4 to -4 (reset then reapplied), no reorder

### MED-1 fix (7edb01d): app-surface.md updated -- CORRECT

Three additions properly document the new capabilities:
1. `typeStatusImmunity.ts` utility with all four exported functions
2. `calculateCurrentInitiative` in combatant.service.ts
3. `reorderInitiativeAfterSpeedChange` and `saveInitiativeReorder` in encounter.service.ts

### Ticket updates (3d39f9b): Properly documented -- CORRECT

Both ptu-rule-099 and ptu-rule-104 tickets now include fix cycle logs referencing the correct commits and describing each fix.

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue: the HIGH-1 fix in `stages.post.ts` uses optional chaining that evaluates `undefined !== 0` as `true`, causing initiative reorders to trigger on ALL stage change operations instead of only when speed CS actually changed. This is a regression that makes the bug strictly worse than the original.

The other four fixes (HIGH-2, MED-1, MED-2, MED-3) are all correctly implemented.

## Required Changes

1. **CRITICAL-1**: In `app/server/api/encounters/[id]/stages.post.ts` line 50, replace `stageResult.changes.speed?.change !== 0` with a pattern that first checks whether speed is present in the changes object before comparing the delta:
   ```typescript
   const speedChanged = stageResult.changes.speed != null && stageResult.changes.speed.change !== 0
   ```
