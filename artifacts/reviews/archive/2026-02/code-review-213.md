---
review_id: code-review-213
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-037, refactoring-094
domain: combat
commits_reviewed:
  - 8b306f7
  - 3f779f8
  - cca85f6
files_reviewed:
  - app/components/encounter/MoveTargetModal.vue
  - app/composables/useMoveCalculation.ts
  - artifacts/tickets/in-progress/bug/bug-037.md
  - artifacts/tickets/in-progress/refactoring/refactoring-094.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T03:15:00Z
follows_up: null
---

## Review Scope

Two tickets addressed in a single developer branch:

1. **bug-037 (P3, combat):** MoveTargetModal was passing `targetsRef` as both `targets` and `allCombatants` to `useMoveCalculation()`. This made non-target enemies invisible to the decree-003 rough terrain LoS check, meaning the -2 accuracy penalty for targeting through enemy-occupied squares would only fire if the enemy was also a selectable target.

2. **refactoring-094 (P4, combat):** The `combatantsOnGrid` computed in `useMoveCalculation.ts` was a trivial passthrough (`computed(() => allCombatants.value)`) left over after refactoring-088. It added indirection with zero abstraction value.

Three commits reviewed: one bug fix, one refactoring, one docs (ticket status moves).

## Verification Points

### 1. MoveTargetModal now passes full encounter combatant list

**Verified.** Line 233 imports `useEncounterStore()`. Lines 251-256 create a computed:

```ts
const allEncounterCombatants = computed((): Combatant[] =>
  encounterStore.encounter?.combatants ?? []
)
```

Line 296 passes it as the 4th argument:

```ts
} = useMoveCalculation(moveRef, actorRef, targetsRef, allEncounterCombatants)
```

The `?? []` fallback is correct -- when no encounter is loaded, an empty array is a safe default (no combatants means no rough terrain check fires, which is the correct behavior for the edge case).

### 2. Decree-003 rough terrain penalty now sees non-target enemies

**Verified.** The `enemyOccupiedCells` computed (line 108-127 in `useMoveCalculation.ts`) iterates `allCombatants.value`, which now includes every combatant in the encounter -- not just selectable targets. The `isEnemySide()` filter correctly identifies hostiles based on the three-side system (players/allies vs enemies). The `actor.value.id` skip (line 113) correctly avoids counting the actor itself.

The rough terrain LoS trace in `targetsThroughRoughTerrain()` (lines 146-220) correctly checks `enemyOccupiedCells.value.has(key)` at line 193 for intervening cells only. Per decree-025, endpoint cells (attacker and target positions) are excluded at line 190: `!actorCells.has(key) && !targetCells.has(key)`. Both decrees are satisfied.

### 3. combatantsOnGrid passthrough cleanly removed

**Verified.** Grep for `combatantsOnGrid` across the entire `app/` directory returns zero results. The computed was removed and its single usage in `enemyOccupiedCells` was replaced with direct `allCombatants.value` (line 112). No dangling references.

### 4. Correct usage of allCombatants in enemyOccupiedCells

**Verified.** The `enemyOccupiedCells` computed at line 112 now reads:

```ts
for (const combatant of allCombatants.value) {
```

This is the parameter passed from the caller. The `useMoveCalculation` function signature (line 34-38) accepts `allCombatants: Ref<Combatant[]>` as its 4th argument, which is now sourced from `encounterStore.encounter?.combatants` in MoveTargetModal.

### 5. Decree compliance check

- **decree-003 (ACTIVE, vtt):** Compliant. All combatants are now visible to the enemy-occupied cell computation. Enemy squares along LoS correctly trigger -2 accuracy.
- **decree-025 (ACTIVE, vtt-grid):** Compliant. Endpoint exclusion at line 190 (`!actorCells.has(key) && !targetCells.has(key)`) is unchanged and correct. Only intervening rough terrain triggers the penalty.

### 6. Existing tests unaffected

The unit tests in `app/tests/unit/composables/useMoveCalculation.test.ts` already pass separate `targets` and `allCombatants` refs (the test fixtures were written for the 4-argument signature). No test changes were needed and none were made.

### 7. Commit granularity

Correct. Three atomic commits:
- `8b306f7` -- bug fix (1 file: MoveTargetModal.vue)
- `3f779f8` -- refactoring (1 file: useMoveCalculation.ts)
- `cca85f6` -- docs (2 ticket files moved to in-progress with fix logs)

Each commit produces a working state. The bug fix was committed before the refactoring, which is the correct order (fix correctness first, then clean up).

## Issues

None found.

## What Looks Good

1. **Minimal, surgical fix.** The bug-037 fix adds exactly 7 lines (import + computed + argument change) with no unnecessary modifications. The approach of sourcing from `encounterStore.encounter?.combatants` is the canonical way to access the full combatant list.

2. **Comment quality.** The 3-line comment above `allEncounterCombatants` (lines 251-253) clearly explains why the targets prop is insufficient and what `allCombatants` needs to contain. Future developers will understand the distinction immediately.

3. **Safe fallback.** The `?? []` on the computed handles the null-encounter edge case without needing a separate guard.

4. **Clean removal.** The `combatantsOnGrid` removal in refactoring-094 leaves no traces. The replacement is direct and obvious.

5. **Correct commit ordering.** Bug fix before refactoring ensures the correctness fix is independently revertable.

## Verdict

**APPROVED.** Both tickets are correctly addressed. The bug-037 fix restores proper decree-003 behavior by sourcing the full combatant list from the encounter store. The refactoring-094 cleanup removes a trivial indirection. No correctness, performance, or style issues found.

## Required Changes

None.
