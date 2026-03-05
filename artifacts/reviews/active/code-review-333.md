---
review_id: code-review-333
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-112
domain: encounter-tables
commits_reviewed:
  - 4851a5fa
  - 33977eed
  - 215669ab
  - 9df79032
  - 3237c0e3
  - a078083d
  - 6812b66c
files_reviewed:
  - app/stores/encounter.ts
  - app/composables/useEncounterUndoRedo.ts
  - app/composables/useEncounterSwitching.ts
  - app/composables/useEncounterOutOfTurn.ts
  - app/composables/useEncounterMounts.ts
  - app/composables/useEncounterCombatActions.ts
  - app/composables/CLAUDE.md
  - app/stores/CLAUDE.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Review Scope

Refactoring-112 decomposes the encounter store from 970 lines to 782 lines by extracting 5 composables: `useEncounterUndoRedo` (112 lines), `useEncounterSwitching` (132 lines), `useEncounterOutOfTurn` (339 lines), `useEncounterMounts` (223 lines), and `useEncounterCombatActions` (278 lines). The main store delegates to these via a `_buildContext()` pattern that passes closures over the Pinia `this` reference.

### Verification Performed

1. **All 58 consumer-referenced store properties verified present.** Cross-referenced all `encounterStore.<property>` usages across 45 consumer files against the store's exported getters and actions. All properties are accessible. (Note: `encounterStore.fetchEncounter` in `XpDistributionModal.vue` is a pre-existing bug, not introduced by this refactoring.)

2. **`_buildContext()` pattern verified correct.** The pattern creates closures that capture `this` (the Pinia store instance). Since Pinia always binds `this` to the store in action calls, `ctx.getEncounter()` correctly returns the reactive encounter reference. Synchronous composable functions (e.g., `toggleAgilityTraining`) that mutate the returned encounter object work because JavaScript passes objects by reference -- they mutate the same reactive object that Pinia tracks.

3. **`this` binding verified.** All 32 `_buildContext()` calls occur inside Pinia actions where `this` is guaranteed to be the store instance. No arrow function or callback context issues.

4. **Decree compliance verified.** Decrees 005, 012, 021, 033, 038, 047, 048 all govern server-side behavior. The store is a thin API client -- the refactoring preserves identical API calls with identical parameters. No decree violations.

5. **Commit granularity is correct.** Each extraction is a separate commit, and the final delegation rewrite is its own commit. This allows clean bisection if needed.

## Issues

### MEDIUM

**MEDIUM-001: Dead code in `useEncounterOutOfTurn` -- `enterBetweenTurns`/`exitBetweenTurns` exported but never used.**

The composable defines and exports `enterBetweenTurns()` and `exitBetweenTurns()` (lines 171-178, 332-333), but the main store keeps these as inline one-liners (lines 720-721) rather than delegating. The composable functions are dead code. Either delegate consistently or remove them from the composable's return object.

File: `app/composables/useEncounterOutOfTurn.ts` lines 170-178, 332-333
File: `app/stores/encounter.ts` lines 720-721

**MEDIUM-002: `toggleVisionCapability` calls `getHistory().pushSnapshot()` directly instead of using `this.captureSnapshot()`.**

Line 567 of the store imports and calls `getHistory()` directly from the composable module, bypassing the delegated `captureSnapshot` action. While this was the original behavior (pre-refactoring), the delegation pattern introduces a cleaner path via `this.captureSnapshot('Toggle vision capability')`. This inconsistency should be resolved now while the developer is already in the code. The direct `getHistory()` import at line 6 could then be removed.

File: `app/stores/encounter.ts` lines 6, 567

## What Looks Good

1. **Context pattern is well-designed.** Each composable declares its own typed context interface (e.g., `EncounterCombatActionsContext`), making dependencies explicit. The `useEncounterOutOfTurn` and `useEncounterCombatActions` contexts include `setBetweenTurns` while simpler composables omit it -- good interface segregation.

2. **No behavioral changes.** Every extracted function is a byte-for-byte copy of the original store action body, with `this.encounter` replaced by `ctx.getEncounter()` and `this.error = ...` replaced by `ctx.setError(...)`. The refactoring is purely structural.

3. **CLAUDE.md updates are thorough.** Both `app/composables/CLAUDE.md` and `app/stores/CLAUDE.md` were updated to reflect the new architecture, including the new "Encounter Store Delegates" domain grouping and the `_buildContext()` pattern documentation.

4. **File sizes are well within limits.** Main store at 782 lines (under 800). Largest composable is `useEncounterOutOfTurn` at 339 lines. Good distribution.

5. **The `getHistory()` singleton pattern is correctly preserved.** The lazy-initialized singleton in `useEncounterUndoRedo` ensures all callers share the same history state, matching the original module-level pattern.

## Verdict

**APPROVED.** The refactoring achieves its goal of reducing the encounter store below 800 lines while preserving all behavior. The two MEDIUM issues (dead code in the out-of-turn composable and inconsistent history access in `toggleVisionCapability`) should be addressed promptly but do not block merge.

## Required Changes

None blocking. File tickets for MEDIUM-001 and MEDIUM-002 for prompt follow-up.
