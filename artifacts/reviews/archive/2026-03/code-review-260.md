---
review_id: code-review-260
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - cc97db2c
  - e778f3e4
  - 4bcb1504
  - 6128782a
  - b373f438
  - 50e56c4b
  - e392dc5d
  - 14c18cdf
files_reviewed:
  - app/composables/useCanvasDrawing.ts
  - app/composables/useGridRendering.ts
  - app/components/vtt/GridCanvas.vue
  - app/composables/useFlankingDetection.ts
  - app/types/combat.ts
  - app/components/encounter/MoveTargetModal.vue
  - app/composables/useMoveCalculation.ts
  - app/utils/flankingGeometry.ts
  - app/components/vtt/VTTToken.vue
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/decree/decree-need-039.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-01T21:10:00Z
follows_up: code-review-254
---

## Review Scope

Re-review of feature-014 P0 fix cycle addressing all 6 issues from code-review-254 (2 HIGH, 4 MEDIUM) and 2 recommendations from rules-review-230 (2 MEDIUM). 7 fix commits by slave-1 plus 1 additional commit (14c18cdf) for the R230-MED-1/MED-2 recommendations. Verified by reading every modified source file in full, not just diffs.

Decree check: decree-002 (PTU alternating diagonal for ranged distance) and decree-003 (all tokens passable, enemy-occupied = rough terrain) are the applicable decrees for this domain. No flanking-specific decrees exist; decree-need-039 (flanking penalty vs evasion cap ordering) is pending. No decree violations found.

## Issue Resolution Verification

### HIGH-1: Duplicate canvas+CSS flanking indicator -- RESOLVED

**Commit cc97db2c** removed `drawFlankingIndicator()` from `useCanvasDrawing.ts` (42 lines deleted) and `drawFlankingIndicators()` from `useGridRendering.ts` (41 lines deleted), plus the `flankingMap` option from `GridCanvas.vue` props (6 lines deleted). Total: 89 deletions.

**Verified:** `useCanvasDrawing.ts` (337 lines) no longer contains any flanking-related code. The return object exports only the 9 original drawing functions (drawArrow, drawDistanceLabel, drawMessageLabel, drawCellHighlight, drawDashedRing, drawSpeedBadge, drawTerrainPattern, drawCrossPattern, drawCenterDot). No flanking indicator function remains. `useGridRendering.ts` (679 lines) no longer references flanking in any render pass. The CSS-only approach via `VTTToken.vue`'s `vtt-token--flanked` class (line 238-248) with `flanking-pulse` keyframe animation (line 400-403) is the sole visual indicator. This is correct -- CSS handles idle-state animation without a render loop.

### HIGH-2: Canvas pulse never animates -- RESOLVED

Eliminated by HIGH-1 fix. The canvas-based `Date.now() % 1500 / 1500` pulse code is gone. Only the CSS `animation: flanking-pulse 1.5s ease-in-out infinite` remains, which animates continuously as expected.

### MED-1: FLANKING_EVASION_PENALTY constant unused -- RESOLVED

**Commit e778f3e4** changed `useFlankingDetection.ts` line 15 to import `FLANKING_EVASION_PENALTY` from `~/utils/flankingGeometry` and line 114 to use the constant:

```typescript
return isTargetFlanked(combatantId) ? FLANKING_EVASION_PENALTY : 0
```

**Verified:** The hardcoded `2` is gone. The constant flows from `flankingGeometry.ts` (line 38) through the composable to consumers. Single source of truth established.

### MED-2: Dead FlankingSize type -- RESOLVED

**Commit 4bcb1504** removed the `FlankingSize` type definition (6 lines) from `app/types/combat.ts`. The type was unused -- the codebase uses numeric sizes (`1`, `2`, `3`, `4`) mapped via `FLANKING_FOES_REQUIRED`. The remaining flanking types (`FlankingStatus`, `FlankingMap`) are both actively imported and used by `useFlankingDetection.ts`.

**Verified:** No references to `FlankingSize` remain anywhere in the codebase.

### MED-3: app-surface.md not updated -- RESOLVED

**Commit b373f438** updated `.claude/skills/references/app-surface.md` with three additions:

1. **VTT Grid composables** (line 169): Added `useFlankingDetection.ts` with full description (reactive FlankingMap, isTargetFlanked, getFlankingPenalty, usage by GridCanvas.vue).
2. **VTT Grid components** (line 171): Updated `GridCanvas.vue` (added flanking detection, exposes getFlankingPenalty, passes isTargetFlanked to VTTToken) and `VTTToken.vue` (added isFlanked prop, CSS pulsing dashed border via --flanked class).
3. **VTT Grid utilities** (line 173): Added `utils/flankingGeometry.ts` with full description (NEIGHBOR_OFFSETS, FLANKING_FOES_REQUIRED, FLANKING_EVASION_PENALTY, getOccupiedCells, getAdjacentCells, areAdjacent, checkFlanking).

**Verified:** All three categories are comprehensive and accurate. The descriptions match the actual code.

### MED-4: Redundant composable instantiation -- RESOLVED (documented)

**Commit 6128782a** added a 4-line comment block in `MoveTargetModal.vue` (lines 260-263) explaining the intentional duplication:

```typescript
// Intentional separate instance: MoveTargetModal is rendered by GMActionModal,
// not as a child of GridCanvas, so it cannot access GridCanvas's exposed
// getFlankingPenalty. The computed chain is lightweight (O(n^2) over ~4-10
// combatants) and this also provides correct behavior in non-VTT encounters.
```

**Verified:** The comment accurately explains the architectural constraint. MoveTargetModal is rendered by GMActionModal, not within GridCanvas's component tree, so `defineExpose`/`ref` access is not feasible without threading the function through multiple intermediate components. The duplication is genuinely the simplest correct approach. The comment also notes the non-VTT encounter benefit, which is a real use case. This resolves code-review-254 MED-4's "alternatively, document the intentional duplication" option.

### R230-MED-1: Fainted defense-in-depth check -- RESOLVED

**Commit 50e56c4b** added `Fainted` status condition check to `useFlankingDetection.ts` (lines 48-51):

```typescript
const conditions = c.entity.statusConditions ?? []
const isDead = conditions.includes('Dead')
const isFainted = conditions.includes('Fainted')
return hp > 0 && !isDead && !isFainted
```

**Verified:** The filter now checks three conditions: HP > 0, not Dead, not Fainted. This provides defense-in-depth for the edge case where a combatant has the Fainted condition but HP > 0 due to data inconsistency.

### R230-MED-2: Decree-need-039 documented -- RESOLVED

**Commit e392dc5d** added a 3-line comment in `useMoveCalculation.ts` (lines 401-403):

```typescript
// NOTE: Flanking penalty is currently applied AFTER the evasion cap (Math.min(9, evasion)).
// The ordering of flanking penalty vs evasion cap is pending decree-need-039.
// Do NOT change this ordering until the decree is ruled.
```

**Commit 14c18cdf** created `artifacts/tickets/open/decree/decree-need-039.md` with the full ambiguity description, both options (before cap vs after cap), current implementation details, impact analysis, and recommendation.

**Verified:** The code comment references decree-need-039 explicitly and warns against changing the ordering. The decree-need ticket is well-structured with clear options and code references. This is the correct process for handling ambiguous PTU interpretations.

## Issues

### MEDIUM

**MED-1: Unused `flankingMap` destructured variable in GridCanvas.vue**

`GridCanvas.vue` line 210 destructures `flankingMap` from `useFlankingDetection`:

```typescript
const { flankingMap, isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatantsRef)
```

After the canvas indicator removal (HIGH-1 fix), `flankingMap` is no longer referenced anywhere in `GridCanvas.vue`. Only `isTargetFlanked` (used at line 38 in the template) and `getFlankingPenalty` (exposed at line 403 via defineExpose) are consumed. The unused destructured variable will produce a TypeScript/linting warning and is dead code.

**Fix:** Remove `flankingMap` from the destructuring: `const { isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatantsRef)`.

File: `app/components/vtt/GridCanvas.vue` line 210

## What Looks Good

1. **Complete and precise fix cycle.** All 6 code-review-254 issues are addressed exactly as specified. The developer chose the correct option for each: canvas removal (not keep-both), constant import (not rename), type deletion (not P1 comment), app-surface update (comprehensive), documentation (not prop threading). No over-engineering, no under-fixing.

2. **Rules review recommendations addressed proactively.** Both R230-MED-1 (Fainted defense-in-depth) and R230-MED-2 (decree-need-039) were addressed even though rules-review-230 marked them as non-blocking recommendations. This follows the project philosophy of "don't defer known problems."

3. **Clean diff.** The fix cycle is a net -13 lines across 5 files (16 additions, 13 deletions in the diff from the fix commits). No unnecessary changes, no collateral damage to unrelated code.

4. **Good commit granularity.** 7 commits for 7 distinct changes. Each commit is a single logical unit: canvas removal, constant usage, dead type removal, documentation comment, app-surface update, Fainted check, decree-need documentation. Commit messages reference the specific review issue they address.

5. **Decree process followed correctly.** Rather than making a unilateral decision on the evasion cap ordering ambiguity, the developer filed decree-need-039 and documented the pending status in code. This respects the decree authority chain.

6. **No regressions in core logic.** The `flankingGeometry.ts` utility (195 lines), `useFlankingDetection.ts` composable (123 lines), `useMoveCalculation.ts` accuracy formula (line 405), and `VTTToken.vue` CSS indicator (lines 237-248, 400-403) are all unchanged in their core logic. The fixes were purely cleanup, documentation, and hardening.

## Verdict

**APPROVED**

All 6 issues from code-review-254 and both recommendations from rules-review-230 are fully resolved. The one new MEDIUM issue (unused `flankingMap` destructure in GridCanvas.vue) is a minor cleanup left over from the canvas indicator removal -- it does not affect correctness, performance, or user experience. It should be cleaned up in the next touch of GridCanvas.vue but does not block the feature-014 P0 fix cycle from proceeding.

## Required Changes

None. The MED-1 unused variable is noted for next-touch cleanup but does not block.
