---
review_id: code-review-073
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-018, bug-019
domain: vtt-grid, scenes
commits_reviewed:
  - be63a3f
  - ef080be
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/MoveTargetModal.vue
  - app/stores/terrain.ts (verified API)
  - app/types/encounter.ts (verified Combatant type)
  - app/composables/useRangeParser.ts (verified isInRange signature)
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
scenarios_to_rerun:
  - combat-move-targeting
reviewed_at: 2026-02-20T19:30:00Z
follows_up: code-review-071
---

## Review Scope

Follow-up review of the **wiring commits** for bug-018 (LoS blocking terrain) and bug-019 (multi-cell token range). The initial pure-function implementations were approved in code-review-071 and code-review-072. This review covers the integration of those functions into the targeting flow via `useMoveCalculation.ts` and the UI feedback in `MoveTargetModal.vue`.

**Commit be63a3f** (bug-018 wiring): +137/-3 across 2 files
- `useMoveCalculation.ts`: imports terrain store + useRangeParser, adds `isBlockingTerrain()` helper, `targetRangeStatus` computed, `inRangeTargets`/`outOfRangeTargets` filtered lists, exposes all in return object
- `MoveTargetModal.vue`: destructures new return values, adds `isTargetInRange()` / `getOutOfRangeReason()` helpers, wraps click handler with guard, adds `:disabled` + out-of-range CSS class + reason text display

**Commit ef080be** (bug-019 wiring): +10/-2 in 1 file
- `useMoveCalculation.ts`: extracts `tokenSize` from actor/target combatants, passes as `attackerSize`/`targetSize` to both `isInRange()` calls (primary check and LoS-only fallback)

## Verification Checklist

### 1. Terrain Store API Usage -- CORRECT

`isBlockingTerrain` at line 83-85 of `useMoveCalculation.ts`:
```typescript
const isBlockingTerrain = (x: number, y: number): boolean => {
  return terrainStore.getTerrainAt(x, y) === 'blocking'
}
```

Verified against `stores/terrain.ts:58`: `getTerrainAt` returns `TerrainType` (a string union including `'blocking'`). The comparison is correct. The terrain store getter returns `state.defaultType` (which is `'normal'`) for cells not in the map, so unknown cells will not be treated as blocking. Correct.

The previous review (code-review-071) suggested `isBlockingFn` could use `getTerrainCost === Infinity`. The chosen approach (`getTerrainAt === 'blocking'`) is more readable and semantically clear. Both are functionally equivalent for the current terrain type system. Approved.

### 2. Combatant `tokenSize` Access -- CORRECT

`useMoveCalculation.ts` lines 111-112:
```typescript
const attackerSize = actor.value.tokenSize || 1
const targetSize = target.tokenSize || 1
```

Verified: `Combatant.tokenSize` is a required `number` field (encounter.ts:52). The `|| 1` fallback is a defensive pattern consistent with the rest of the codebase (grid-placement.service.ts:52, combatant.service.ts:545, encounter-templates load.post.ts:94 all use the same pattern). Since `tokenSize` defaults to `1` in the combatant service, the fallback only triggers if `tokenSize` were somehow `0` (a data bug). Acceptable defensive coding.

### 3. `isInRange()` Wiring -- CORRECT

**Primary check** (line 114-121): Passes all 6 arguments: `actorPos`, `target.position`, `parsedMoveRange.value`, `isBlockingTerrain`, `attackerSize`, `targetSize`. Matches the `isInRange` signature at useRangeParser.ts:301-307.

**LoS-only fallback** (line 128-135): For determining the *reason* when a target is out of range, calls `isInRange` without `isBlockingFn` (passing `undefined`) but WITH token sizes. This correctly differentiates "out of range" from "blocked by terrain." The `undefined` hole for `isBlockingFn` is the positional-arg pattern flagged in code-review-072 MEDIUM-3, but since this is the wiring code that was anticipated, it's the expected outcome. Both calls pass token sizes, which is correct.

### 4. Non-VTT Graceful Degradation -- CORRECT

Lines 99-108: If `actorPos` is undefined or `target.position` is undefined, the target is marked as in range. This is correct behavior: non-VTT encounters (no grid) should not block targeting. Both null checks are present and the early `continue` avoids unnecessary computation.

### 5. MoveTargetModal UI Changes -- CORRECT

- **Disabled state:** `:disabled="!isTargetInRange(target.id)"` prevents native click events on the button.
- **Click guard:** `handleToggleTarget` adds a JS-level guard on top of the HTML disabled attribute. Defense-in-depth -- good.
- **Original `toggleTarget` not exposed in template:** Verified -- the template only calls `handleToggleTarget`. The original `toggleTarget` is destructured from the composable but only used inside the wrapper. No bypass path.
- **Visual feedback:** `target-btn--out-of-range` class sets `opacity: 0.4`, `cursor: not-allowed`, transparent borders, and neutralizes hover effects. Clean.
- **Reason text:** `target-btn__range-info` replaces the HP display for out-of-range targets via `v-if/v-else`. Uses italic text at `$font-size-xs`. Semantically clear.
- **CSS specificity:** The `&--out-of-range` rule is placed after `--miss` in the cascade, so it will override correctly if both classes were ever present (they shouldn't be, since a disabled target can't be selected).

### 6. Missed Callers -- NONE

Grepped for `isInRange` across all `.ts` and `.vue` files. The only application-code caller is `useMoveCalculation.ts`. All other occurrences are in test files and documentation. No missed wiring points.

### 7. Immutability -- VERIFIED

`targetRangeStatus` builds a fresh `status` object and returns it from a `computed()`. No mutation of reactive state. `inRangeTargets` and `outOfRangeTargets` use `.filter()` which creates new arrays. The `handleToggleTarget` wrapper does not mutate -- it calls `toggleTarget` which does use `.push()` and `.splice()` on `selectedTargets`, but those mutations are on a `ref<string[]>()` (the composable's own state), which is the standard Vue pattern for array refs. No immutability violations.

### 8. File Sizes

| File | Lines | Limit | Status |
|---|---|---|---|
| `useMoveCalculation.ts` | 599 | 800 | OK |
| `MoveTargetModal.vue` | 869 | 800 | OVER (pre-existing) |
| `useRangeParser.ts` | 775 | 800 | OK (25 lines headroom) |

## Issues

### MEDIUM-1: `MoveTargetModal.vue` is 869 lines, exceeding the 800-line limit

**File:** `app/components/encounter/MoveTargetModal.vue`

The file was already 826 lines before commit `be63a3f` added 43 more. The breakdown is: template (226 lines), script (87 lines), style (552 lines). The SCSS section is 552 lines -- the bloat is entirely in styles, not logic. The script section is lean at 87 lines because the composable extraction (commit `686bc9e`) was done correctly.

**This is pre-existing and was not caused by these commits.** The wiring commit added necessary UI feedback (disabled state, reason display, CSS classes) -- none of which can be reasonably omitted.

**Fix:** File a refactoring ticket to extract SCSS into a separate file or extract sub-components. The natural split point would be moving the damage/accuracy display styles into a shared SCSS partial, since many of those styles (`.accuracy-result`, `.effectiveness-badge`, `.damage-breakdown`) are encounter-domain patterns that could be reused. This is out of scope for the current bug fixes.

**Verdict on this issue:** Not blocking. The 800-line limit primarily targets logic complexity. A file with 87 lines of script and 552 lines of scoped SCSS is not a maintainability problem in the same way a 800-line script would be. But it should be tracked.

### MEDIUM-2: `inRangeTargets` and `outOfRangeTargets` computed values are destructured but never used in the template

**File:** `app/components/encounter/MoveTargetModal.vue:260-261`, `app/composables/useMoveCalculation.ts:151-160`

The modal destructures `inRangeTargets` and `outOfRangeTargets` from the composable, but the template iterates over `targets` (the original unfiltered prop) and uses `isTargetInRange()` per-target to apply disabled/styling. The `inRangeTargets`/`outOfRangeTargets` computed lists are unused.

This is not a bug -- the current approach (iterate all, conditionally disable) is actually the correct UX pattern because it shows the GM *all* targets with visual feedback for why some are unavailable. Filtering them out entirely would hide information.

**Fix:** Either (a) remove `inRangeTargets`/`outOfRangeTargets` from the destructuring in MoveTargetModal.vue if they're not planned for use, or (b) keep them if a future UI change will use them (e.g., a "show only in-range targets" toggle). The composable should still export them for other potential consumers. Remove just the unused destructuring in the modal.

## What Looks Good

- **Reason differentiation is a thoughtful UX touch.** The two-pass approach (first check with LoS, then without) correctly distinguishes "Out of range" from "Blocked by terrain (no line of sight)". This gives the GM actionable information -- they know whether moving closer or clearing terrain is the fix. Well designed.

- **Graceful degradation for non-VTT encounters.** The `!actorPos` and `!target.position` guards ensure the range/LoS system is purely additive. Encounters without a grid continue to work exactly as before. No regression risk for existing workflows.

- **Clean composable boundary.** All range/LoS logic lives in `useMoveCalculation.ts`. The modal is a thin UI consumer -- it destructures, renders, and delegates. The 87-line script section is evidence the composable extraction from commit `686bc9e` was well-designed and these wiring additions fit naturally.

- **Defense-in-depth on target selection.** Both HTML `:disabled` and the JS `handleToggleTarget` guard prevent out-of-range selection. The wrapper pattern keeps the original `toggleTarget` clean and reusable.

- **Token size integration is minimal and correct.** Commit `ef080be` is only 10 lines added -- it extracts `tokenSize` from the combatant objects and passes them through. No over-engineering, no unnecessary abstractions. The `|| 1` fallback matches project conventions.

- **Both `isInRange` calls receive token sizes.** The fallback call (for reason determination) correctly passes `attackerSize`/`targetSize` even though it omits `isBlockingFn`. This means the "out of range" message is accurate for multi-cell tokens too, not just single-cell.

## Verdict

**APPROVED** -- Both wiring commits are correct, clean, and well-integrated. The terrain store API is used correctly (`getTerrainAt === 'blocking'`). The combatant `tokenSize` is accessed with appropriate defensive defaults matching project conventions. The `isInRange` calls pass all required arguments in the correct order. The UI feedback is clear and non-destructive (disabled with reason, not hidden). No immutability violations, no missed callers, no error handling gaps.

The two MEDIUM issues are housekeeping items (pre-existing file size, unused destructured variables) that do not affect correctness or user experience.

## Required Changes

None blocking. File a refactoring ticket for MoveTargetModal.vue SCSS extraction (MEDIUM-1). Remove unused `inRangeTargets`/`outOfRangeTargets` destructuring or document planned use (MEDIUM-2).

## Scenarios to Re-run

- `combat-move-targeting` -- end-to-end verification that move targeting modal shows range/LoS status, disables out-of-range targets, and correctly applies token size to range checks
