---
review_id: rules-review-230
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - f770f4a2
  - dc586754
  - 3fa0426f
  - 4736332b
  - 017edf4c
  - a6741505
  - c273ab1f
  - 0c4bd69d
  - f75c776a
mechanics_verified:
  - flanking-detection
  - flanking-adjacency
  - flanking-size-requirements
  - flanking-evasion-penalty
  - flanking-fainted-exclusion
  - flanking-side-hostility
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Page 232 (Flanking)
  - core/02-character-creation.md#Page 15 (Evasion from stats)
  - errata-2.md (no flanking errata)
reviewed_at: 2026-03-01T16:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Flanking Detection Algorithm (PTU p.232)

- **Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other." (`core/07-combat.md#Page 232`)
- **Implementation:** `checkFlanking()` in `app/utils/flankingGeometry.ts` (lines 146-194) collects all foes adjacent to the target via `areAdjacent()`, then checks all pairs for non-adjacency. If any pair of adjacent foes is NOT adjacent to each other, the target is flanked.
- **Status:** CORRECT

The algorithm correctly implements the two conditions: (1) foes must be adjacent to the target, and (2) at least one pair of those foes must NOT be adjacent to each other. For P0 (1x1 tokens only), this is sufficient since N=2 for Small/Medium combatants.

**Edge case verification:**
- 3 foes in a line along one side: all adjacent to each other, NOT flanked. Correct.
- 2 foes on opposite sides of target: not adjacent to each other, target IS flanked. Correct.
- 2 foes on adjacent diagonals (e.g., NE and E): these are adjacent to each other (distance dx=1, dy=1), NOT flanked. Correct per PTU rules.
- 2 foes at NW and SE of target: not adjacent (dx=2, dy=2), IS flanked. Correct.

### 2. Flanking Size Requirements (PTU p.232)

- **Rule:** "For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_FOES_REQUIRED` in `app/utils/flankingGeometry.ts` (lines 27-32): `{ 1: 2, 2: 3, 3: 4, 4: 5 }`. The `checkFlanking()` function uses `FLANKING_FOES_REQUIRED[targetSize] ?? 2` to look up the requirement. The early return at line 158-165 checks `adjacentFoes.length < requiredFoes`.
- **Status:** CORRECT

The size-to-requirement mapping is accurate: 1x1 (Small/Medium) = 2, 2x2 (Large) = 3, 3x3 (Huge) = 4, 4x4 (Gigantic) = 5. The fallback `?? 2` is safe for any unknown sizes.

**Note for P1:** The current pair-checking algorithm at lines 170-185 only searches for a non-adjacent PAIR. For Large+ targets (requiring 3+ non-mutually-adjacent foes), the algorithm will need to be extended. Currently, for `targetSize > 1`, finding any non-adjacent pair would incorrectly trigger flanking when 3+ foes are required. However, since P0 explicitly scopes to 1x1 tokens only and the composable defaults token size to 1, this is acceptable for P0.

### 3. Flanking Evasion Penalty (PTU p.232)

- **Rule:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_EVASION_PENALTY = 2` in `flankingGeometry.ts` (line 38). `getFlankingPenalty()` in `useFlankingDetection.ts` (lines 111-112) returns 2 when flanked, 0 otherwise. In `useMoveCalculation.ts` (line 402): `Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)`.
- **Status:** CORRECT

The penalty correctly reduces the accuracy threshold by 2 (making the target easier to hit), which is the mathematical equivalent of reducing evasion by 2. The penalty is applied after the evasion cap (`Math.min(9, evasion)`), which is correct because the flanking penalty should reduce the effective evasion regardless of the cap -- a flanked target with capped evasion should still be easier to hit.

The penalty applies to all three evasion types (Physical, Special, Speed) because `getTargetEvasion()` takes the max of the applicable evasions BEFORE the flanking penalty is subtracted, so whichever evasion the defender uses, the -2 still applies. This matches the PTU text "a -2 penalty to their Evasion" (all evasion types).

### 4. 8-Directional Adjacency (PTU p.232)

- **Rule:** PTU uses 8-directional adjacency for flanking. The rulebook examples show diagonal adjacency is valid for flanking. (`core/07-combat.md#Page 232`)
- **Implementation:** `NEIGHBOR_OFFSETS` in `flankingGeometry.ts` (lines 17-21) includes all 8 directions. `areAdjacent()` checks `dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)`.
- **Status:** CORRECT

### 5. Fainted/Dead Exclusion

- **Rule:** Fainted combatants cannot meaningfully participate in combat and should not flank or be flanked.
- **Implementation:** `positionedCombatants` in `useFlankingDetection.ts` (lines 42-57) filters by `hp > 0 && !isDead` where `isDead` checks for the 'Dead' status condition.
- **Status:** CORRECT (with minor note, see MED-1)

### 6. Side-Based Hostility

- **Rule:** Flanking requires FOES -- combatants on opposing sides. Same-side combatants cannot flank each other.
- **Implementation:** `useFlankingDetection.ts` (line 73) uses `isEnemySide(target.side, c.side)` from `combatSides.ts`, which correctly identifies players+allies as friendly to each other and enemies as hostile to both.
- **Status:** CORRECT

### 7. Single Combatant Cannot Flank Alone (PTU p.232)

- **Rule:** "a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone." (`core/07-combat.md#Page 232`)
- **Implementation:** For P0 (1x1 tokens only), a single 1x1 foe can only be adjacent from one cell, so the pair-finding loop at lines 170-185 requires at least 2 foes in `adjacentFoes` before it can find a pair. The early return at line 158 requires `adjacentFoes.length >= requiredFoes` (minimum 2). A single combatant cannot produce a pair.
- **Status:** CORRECT (for P0; P1 needs explicit single-combatant guard for multi-tile attackers)

### 8. Decree Compliance

- **decree-003** (All tokens passable; enemy-occupied = rough terrain): Flanking detection is independent of movement/passability. The flanking system detects adjacency for penalty purposes, not for movement blocking. No conflict.
- **decree-010** (Multi-tag terrain): Flanking detection does not interact with terrain flags. No conflict.
- **decree-023** (Burst shapes use PTU diagonal): Flanking uses 8-directional adjacency (Chebyshev distance = 1), not burst shapes. Flanking adjacency is a cell-neighbor check, not a distance measurement. No conflict.
- **decree-025** (Exclude endpoints from rough terrain penalty): The flanking penalty and rough terrain penalty are independent modifiers in the accuracy threshold formula. Both are correctly applied as separate additive terms (lines 399-402 of useMoveCalculation.ts). No conflict.
- **Status:** All decrees respected. No violations.

## Issues

### MED-1: Fainted Status Condition Not Explicitly Checked

**File:** `app/composables/useFlankingDetection.ts:45-49`
**Severity:** MEDIUM

The fainted check uses `hp > 0` which correctly excludes fainted Pokemon (they have 0 HP). However, the 'Fainted' status condition from `types/combat.ts` is not explicitly checked. While HP <= 0 is the reliable indicator, a data inconsistency where a combatant has the 'Fainted' condition but somehow retains HP > 0 would let them participate in flanking. Adding `|| statusConditions.includes('Fainted')` to the isDead check would provide defense-in-depth.

This is MEDIUM because HP <= 0 is the canonical check for fainted state in PTU, and the code correctly uses it. The status condition check would be a safety net for edge cases.

### MED-2: Flanking Penalty Applied After Evasion Cap -- Document Design Decision

**File:** `app/composables/useMoveCalculation.ts:396-402`
**Severity:** MEDIUM

The flanking penalty is subtracted from the accuracy threshold AFTER the evasion cap (`Math.min(9, evasion)`) is applied:
```typescript
const effectiveEvasion = Math.min(9, evasion)
// ...
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

PTU says "-2 to their Evasion" which could be interpreted as reducing evasion BEFORE the cap (which would be less impactful for high-evasion targets). The current implementation reduces the capped evasion, which is more impactful. Both interpretations are defensible:
- **Before cap:** evasion 11 -> 11-2=9 -> cap at 9 = 9 (flanking does nothing)
- **After cap (current):** evasion 11 -> cap at 9 -> 9-2 = 7 (flanking always reduces by 2)

The current approach is arguably more correct because the flanking penalty should always have a meaningful effect. However, this is an ambiguity that should be documented. If this interpretation is contested, a decree-need ticket should be filed.

**Recommendation:** No code change needed. Add a comment documenting the design decision, or file a decree-need if the team disagrees.

## Summary

The P0 flanking detection implementation is a faithful rendering of the PTU p.232 flanking rules for 1x1 tokens. The core algorithm correctly identifies when a combatant is flanked (2+ non-adjacent foes surrounding the target), the evasion penalty is applied correctly in the accuracy threshold formula, visual indicators are properly wired to the reactive flanking map, and side-based hostility is correctly computed.

The architecture is clean: pure geometry functions in `flankingGeometry.ts` with no framework dependencies, a reactive composable in `useFlankingDetection.ts` that bridges geometry to Vue reactivity, and integration points in the accuracy calculation (`useMoveCalculation.ts`) and visual rendering (`useGridRendering.ts`, `VTTToken.vue`, `GridCanvas.vue`).

No critical or high-severity PTU rule violations were found. The two medium-severity issues are defensive-coding recommendations, not correctness bugs.

## Code Quality Notes (Senior Review)

### Architecture: GOOD

- **SRP followed:** Pure geometry utility separate from reactive composable, separate from rendering integration. Each file has a single responsibility.
- **DIP followed:** `useMoveCalculation` receives flanking penalty via optional callback injection (`options.getFlankingPenalty`), allowing non-VTT encounters to work without flanking. GridCanvas exposes `getFlankingPenalty` for parent components.
- **OCP followed:** `useGridRendering` accepts `flankingMap` as an optional parameter, preserving backward compatibility.

### Code Quality: GOOD

- Constants (`NEIGHBOR_OFFSETS`, `FLANKING_FOES_REQUIRED`, `FLANKING_EVASION_PENALTY`) are named, exported, and documented.
- Functions have clear JSDoc comments with PTU rule references.
- Immutability respected: no mutation of input arrays, new objects returned.
- Type safety: `FlankingStatus`, `FlankingMap`, `FlankingSize` types in `types/combat.ts` are well-defined.
- The `drawFlankingIndicator` correctly uses `ctx.save()`/`ctx.restore()` to avoid canvas state leakage.

### Integration: GOOD

- `GridCanvas.vue` instantiates `useFlankingDetection` with the combatants ref and passes `flankingMap` to rendering, `isTargetFlanked` to VTTToken, and `getFlankingPenalty` to the exposed API.
- `MoveTargetModal.vue` instantiates `useFlankingDetection` independently with `allEncounterCombatants` (the full encounter combatant list, not just the selectable targets). This is correct -- flanking detection needs all combatants to determine adjacency.
- Watchers in `GridCanvas.vue` re-render when `flankingMap` changes (line 399-401), ensuring visual indicators update reactively.

### Minor Observations

- **MED-CODE-1:** The `useFlankingDetection` is instantiated in BOTH `GridCanvas.vue` (for visual indicators) and `MoveTargetModal.vue` (for accuracy penalty). Both use the same `allEncounterCombatants` source and will produce identical `FlankingMap` values. While not a bug, this is a minor redundancy. P2 could consolidate to a single instance exposed from the encounter store. Acceptable for P0.

- **MED-CODE-2:** The `drawFlankingIndicators` function uses `Date.now() % 1500 / 1500` for the pulse animation (line 389). Since `render()` is called on state changes (not on a requestAnimationFrame loop), the pulse animation will only animate when something triggers a re-render (token move, selection change, etc.). If continuous pulsing is desired during idle states, a requestAnimationFrame loop would be needed. The CSS-based `flanking-pulse` animation on VTTToken handles the idle case for the HTML token layer.

## Rulings

1. **Flanking adjacency uses 8-directional (Chebyshev = 1) neighbors.** This is consistent with PTU's general adjacency model and the flanking examples on p.232.

2. **Flanking penalty is applied AFTER the evasion cap of 9.** This ensures the -2 penalty always has an effect. If contested, file decree-need.

3. **Fainted combatants (HP <= 0) cannot flank or be flanked.** The HP check is the canonical fainted indicator.

4. **The flanking penalty reduces the accuracy threshold (making the target easier to hit), which is mathematically equivalent to reducing evasion by 2.** This matches PTU's "-2 penalty to their Evasion."

## Verdict

**APPROVED**

No critical or high-severity PTU rule violations. The implementation correctly captures the flanking detection algorithm, size-based requirements, evasion penalty, side hostility, fainted exclusion, and visual feedback for P0 (1x1 tokens). The two medium-severity notes are defensive recommendations, not blocking issues. P1 will need to extend the algorithm for multi-tile tokens (3+ foe requirement, multi-tile attacker counting, single-combatant guard).

## Required Changes

None. Both medium issues are recommendations, not requirements.

## Recommended Improvements (Non-Blocking)

1. Add `includes('Fainted')` to the alive check in `useFlankingDetection.ts` for defense-in-depth (MED-1).
2. Add a code comment in `useMoveCalculation.ts` documenting the design decision to apply flanking penalty after the evasion cap (MED-2).
3. Consider consolidating the dual `useFlankingDetection` instances in P2 when the encounter store integration is added (MED-CODE-1).
