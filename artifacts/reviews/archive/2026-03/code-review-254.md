---
review_id: code-review-254
review_type: code+rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - 0ba282e7
  - 017edf4c
  - 4736332b
  - 3fa0426f
  - dc586754
  - a6741505
  - f770f4a2
  - f75c776a
files_reviewed:
  - app/types/combat.ts
  - app/utils/flankingGeometry.ts
  - app/composables/useFlankingDetection.ts
  - app/composables/useCanvasDrawing.ts
  - app/composables/useGridRendering.ts
  - app/composables/useMoveCalculation.ts
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/encounter/MoveTargetModal.vue
  - app/utils/combatSides.ts (reference)
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 4
reviewed_at: 2026-03-01T17:30:00Z
follows_up: null
---

## Review Scope

First review of feature-014 P0 (VTT Flanking Detection). Combined senior code review and game logic rules review. 8 commits across 9 files implementing:
- Section A: `flankingGeometry.ts` pure utility (NEIGHBOR_OFFSETS, FLANKING_FOES_REQUIRED, checkFlanking, areAdjacent, getAdjacentCells, getOccupiedCells)
- Section B: `useFlankingDetection` composable (reactive FlankingMap from combatant positions)
- Section C: Visual indicators (canvas drawFlankingIndicator + VTTToken CSS flanking-pulse + useGridRendering integration)
- Section D: Evasion penalty (getAccuracyThreshold in useMoveCalculation, wired via MoveTargetModal)

Decree check: decree-003 (tokens passable, enemy=rough), decree-010 (multi-tag terrain), decree-023 (burst PTU diagonal), decree-025 (endpoint exclusion). No flanking-specific decrees exist. No decree violations found.

PTU rule verification: Compared implementation against PTU p.232 raw text. The flanking algorithm is correct for the P0 scope (1x1 tokens).

## Issues

### HIGH

**HIGH-1: Duplicate flanking visual indicators create confusing double-border**

Both the canvas layer (`drawFlankingIndicators` in `useGridRendering.ts` line 383-407) and the HTML token layer (`vtt-token--flanked` CSS in `VTTToken.vue` line 238-248) render independent dashed orange borders around flanked tokens. The canvas draws a 3px dashed stroke at pixel offset `(x+1.5, y+1.5)` with size `(width-3, height-3)`, while the CSS `::after` pseudo-element draws a 2px dashed border at `inset: -2px`. Both are visible simultaneously, creating a double-border effect where one pulsates (CSS `flanking-pulse` animation) and the other is static (canvas renders only on demand, not in an animation loop).

**Fix required:** Choose ONE visual indicator. The CSS approach is preferable because:
1. It actually animates (CSS `animation` runs continuously without a render loop).
2. The canvas approach requires an animation loop (see HIGH-2) to pulse, which doesn't exist.
3. CSS is cheaper than re-rendering the entire canvas at 60fps.

Remove `drawFlankingIndicators` from `useGridRendering.ts` (lines 152-155 and 383-407) and `drawFlankingIndicator` from `useCanvasDrawing.ts` (lines 327-365). Keep the CSS `vtt-token--flanked` class. Remove `drawFlankingIndicator` from the `useCanvasDrawing` return object.

Alternatively, if the canvas indicator is preferred (e.g., for group view where VTTToken may not be visible), keep both but suppress one via a flag.

Files: `app/composables/useGridRendering.ts`, `app/composables/useCanvasDrawing.ts`, `app/components/vtt/VTTToken.vue`

---

**HIGH-2: Canvas flanking pulse animation never animates (no render loop)**

`drawFlankingIndicators` in `useGridRendering.ts` line 389 computes `const pulse = (Date.now() % 1500) / 1500` to create a time-based pulse effect. However, there is no `requestAnimationFrame` loop or `setInterval` driving continuous re-renders. The canvas is only rendered reactively (on data changes, resize, scroll). The pulse value is computed once per render and produces a static opacity. The animation effect described in the design spec and code comments never occurs.

If the canvas indicator is kept (see HIGH-1), a render loop is required. This would re-render the entire grid at ~60fps just for a border animation, which is wasteful. This further supports removing the canvas indicator in favor of CSS.

If a canvas indicator IS desired without a full render loop, consider: (a) a separate animation canvas layer for overlays, or (b) a small `setInterval` that only redraws the overlay portion.

File: `app/composables/useGridRendering.ts` lines 383-407

---

### MEDIUM

**MED-1: `FLANKING_EVASION_PENALTY` constant defined but never used**

`flankingGeometry.ts` line 38 exports `FLANKING_EVASION_PENALTY = 2`, but the composable `useFlankingDetection.ts` line 112 hardcodes the magic number `2` instead of importing the constant:

```typescript
return isTargetFlanked(combatantId) ? 2 : 0
```

**Fix required:** Import and use the constant:

```typescript
import { FLANKING_EVASION_PENALTY } from '~/utils/flankingGeometry'
...
return isTargetFlanked(combatantId) ? FLANKING_EVASION_PENALTY : 0
```

Files: `app/composables/useFlankingDetection.ts`, `app/utils/flankingGeometry.ts`

---

**MED-2: `FlankingSize` type is dead code**

`app/types/combat.ts` line 214 defines `FlankingSize = 'small' | 'medium' | 'large' | 'huge' | 'gigantic'` but it is never imported or used anywhere in the codebase. The actual code uses numeric sizes (`1`, `2`, `3`, `4`) mapped via `FLANKING_FOES_REQUIRED`. This type has no consumers.

**Fix required:** Either remove `FlankingSize` (if P1 won't use it -- the spec shows numeric-keyed lookups throughout), or add a comment marking it as P1 scaffolding with a reference to where it will be used.

File: `app/types/combat.ts`

---

**MED-3: `app-surface.md` not updated with new composable and utility**

The app-surface document (`.claude/skills/references/app-surface.md`) was not updated to reflect the addition of `app/utils/flankingGeometry.ts` and `app/composables/useFlankingDetection.ts`, nor the new props/exposed methods on `GridCanvas.vue` and `VTTToken.vue`. Per project guidelines, new composables, utilities, and component API changes should be registered in the app surface map.

**Fix required:** Add entries for:
- `app/utils/flankingGeometry.ts` — pure flanking geometry (constants, adjacency checks, checkFlanking)
- `app/composables/useFlankingDetection.ts` — reactive flanking map composable
- `VTTToken.vue` — new `isFlanked` prop
- `GridCanvas.vue` — new `getFlankingPenalty` exposed method

File: `.claude/skills/references/app-surface.md`

---

**MED-4: Redundant `useFlankingDetection` instantiation in MoveTargetModal**

`MoveTargetModal.vue` (line 260) creates its own independent instance of `useFlankingDetection(allEncounterCombatants)`, while `GridCanvas.vue` (line 210) already instantiates one and exposes `getFlankingPenalty` via `defineExpose`. Both compute the exact same flanking state from the same underlying data (the encounter store's combatant list).

This is functionally correct but architecturally redundant. Two independent `computed()` chains process the same combatant data whenever any position changes. For P0 with typical encounter sizes (4-10 combatants), the performance impact is negligible. However, this creates a maintenance risk: if flanking logic changes (P1 multi-tile), both instances must be updated.

**Fix required:** Pass `getFlankingPenalty` from the parent component that owns the GridCanvas ref, rather than instantiating a second composable. If MoveTargetModal is opened outside a VTT context (non-grid encounter), fallback to a no-op `() => 0`.

Alternatively, if the composable approach is preferred for simplicity, document the intentional duplication with a comment explaining why.

Files: `app/components/encounter/MoveTargetModal.vue`, `app/components/vtt/GridCanvas.vue`

---

## PTU Rules Verification

### Flanking Algorithm Correctness (PTU p.232)

**Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other."

**Implementation:** `checkFlanking()` filters foes to those adjacent to the target, then searches for any pair of foes NOT adjacent to each other. For 1x1 targets (P0), this is correct.

**Verified scenarios:**
- 2 foes on opposite sides (e.g., left and right) -> foes not adjacent -> flanked. CORRECT.
- 2 foes on adjacent sides (e.g., left and top-left) -> foes ARE adjacent -> not flanked. CORRECT.
- 3 foes, two adjacent plus one non-adjacent -> at least one non-adjacent pair found -> flanked. CORRECT.
- 1 foe adjacent -> below threshold (need 2) -> not flanked. CORRECT.
- 2 foes both on same diagonal line (e.g., top-right and bottom-right of target) -> they are 2 cells apart vertically, NOT adjacent to each other -> flanked. CORRECT per PTU 8-directional adjacency.

### Evasion Penalty (PTU p.232)

**Rule:** "they take a -2 penalty to their Evasion."

**Implementation:** `getFlankingPenalty()` returns 2 when flanked. `getAccuracyThreshold()` subtracts this from the threshold: `ac + evasion - accuracy_stage - flankingPenalty + roughPenalty`. Since threshold is what the attacker needs to roll, subtracting 2 makes the target easier to hit. CORRECT -- this is equivalent to reducing evasion by 2.

### Size Requirements (PTU p.232)

**Rule:** "Large: 3, Huge: 4, Gigantic: 5."

**Implementation:** `FLANKING_FOES_REQUIRED = { 1: 2, 2: 3, 3: 4, 4: 5 }`. CORRECT mapping. P0 only processes 1x1 tokens; multi-tile flanking logic is explicitly deferred to P1. The early-out `adjacentFoes.length < requiredFoes` correctly gates the threshold for non-1x1 tokens even if they were somehow present.

**Note:** The pairwise search algorithm is only correct for `requiredFoes = 2`. For `requiredFoes >= 3` (Large+), finding any non-adjacent pair would incorrectly declare flanking without verifying 3+ non-pairwise-adjacent foes. This is acceptable for P0 (1x1 only) but must be addressed in P1.

### Self-Flank Prevention (PTU p.232)

**Rule:** "a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required."

**Implementation:** The algorithm counts distinct combatant IDs. A single combatant can only appear once in the `foes` array. If only one foe is adjacent, `adjacentFoes.length < 2` triggers the early return. CORRECT.

### Fainted/Dead Exclusion

**Implementation:** `positionedCombatants` filters out combatants with `currentHp <= 0` or `Dead` status condition. CORRECT -- fainted combatants cannot flank or be flanked.

### Side-Based Hostility

**Implementation:** Uses `isEnemySide()` from `combatSides.ts`. Players and allies are friendly; enemies oppose both. Same side never hostile. CORRECT and consistent with existing rough terrain checks in `useMoveCalculation.ts`.

### Decree Compliance

- **decree-003** (tokens passable, enemy=rough): Not directly relevant to flanking. The flanking system is independent of movement blocking. No conflict.
- **decree-010** (multi-tag terrain): Not relevant to flanking detection. No conflict.
- **decree-023** (burst PTU diagonal): Not relevant to flanking adjacency. Flanking uses 8-directional adjacency which is correct per PTU.
- **decree-025** (endpoint exclusion from rough penalty): The rough terrain penalty in `useMoveCalculation.ts` is independent of flanking. The flanking penalty is correctly applied as a separate term. No conflict.

No decree violations found.

---

## What Looks Good

1. **Clean separation of concerns.** The pure geometry utility (`flankingGeometry.ts`) has zero Vue/framework dependencies and is fully unit-testable. The composable layer (`useFlankingDetection.ts`) handles reactivity. The visual layer (canvas + CSS) handles display. The accuracy layer (`useMoveCalculation.ts`) handles game mechanics. This follows SRP per project guidelines.

2. **Correct PTU rule implementation for P0 scope.** The flanking algorithm correctly identifies non-adjacent foe pairs around a 1x1 target. The -2 evasion penalty is correctly applied as a threshold reduction. The size lookup table is correct. Self-flanking is prevented.

3. **Proper use of existing patterns.** The code reuses `isEnemySide()` from `combatSides.ts` (same utility used by rough terrain). The composable follows the same pattern as other composables (accepting `Ref<Combatant[]>`, returning computed values). The accuracy threshold formula integrates cleanly with existing rough terrain and accuracy stage modifiers.

4. **Good commit granularity.** 8 commits for 4 sections: types, utility, composable, canvas drawing, grid rendering, CSS, accuracy calculation, MoveTargetModal wiring. Each commit produces a working state.

5. **Defensive coding.** `?? 0` fallback on `currentHp`, `?? []` on `statusConditions`, `|| 1` on `tokenSize`, `?? 2` fallback on `FLANKING_FOES_REQUIRED` lookup. Optional chaining on `flankingMap?.value`.

6. **Well-documented code.** JSDoc comments reference PTU page numbers. Algorithm comments explain the O(n^2) complexity is negligible for typical encounter sizes.

7. **Immutability preserved.** No mutations of reactive objects. `flankingMap` is built as a new object each computation. `FlankingCombatant` is a mapped copy, not a reference to the original combatant.

---

## Verdict

**CHANGES_REQUIRED**

Two HIGH issues must be addressed before approval:

1. **HIGH-1 + HIGH-2 (related):** The duplicate canvas + CSS flanking indicators create a confusing double-border effect, and the canvas version's pulse animation never animates because there is no render loop. The simplest fix is to remove the canvas indicator entirely (keep CSS only). This also eliminates the dead `drawFlankingIndicator` function and simplifies `useGridRendering.ts`.

2. Four MEDIUM issues require fixes (constant usage, dead type, app-surface update, redundant instantiation).

---

## Required Changes

1. **Remove canvas flanking indicator** (HIGH-1 + HIGH-2): Delete `drawFlankingIndicators()` from `useGridRendering.ts`, delete `drawFlankingIndicator()` from `useCanvasDrawing.ts` and its return. Remove the `flankingMap` option from `UseGridRenderingOptions` and the rendering call at line 152-155. The CSS `vtt-token--flanked` class provides the correct animated visual.

2. **Use `FLANKING_EVASION_PENALTY` constant** (MED-1): Import from `flankingGeometry.ts` in `useFlankingDetection.ts` and use it instead of hardcoded `2`.

3. **Remove or document `FlankingSize` type** (MED-2): Remove from `combat.ts` if P1 won't use it, or add a `// Used in P1 for size-category-based flanking checks` comment.

4. **Update `app-surface.md`** (MED-3): Add entries for the new utility, composable, and component API changes.

5. **Resolve redundant composable instantiation** (MED-4): Either pass `getFlankingPenalty` from parent to `MoveTargetModal` as a prop, or document the intentional duplication.
