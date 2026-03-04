---
review_id: rules-review-172
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-108
domain: vtt-grid
commits_reviewed:
  - 0dd3605
  - 36571e9
  - 308f9ab
  - 95a99e6
mechanics_verified:
  - rough-terrain-accuracy-penalty
  - enemy-occupied-rough-terrain
  - painted-rough-terrain-flag
  - bresenham-line-of-fire-trace
  - accuracy-threshold-formula
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#p231-rough-terrain
  - core/07-combat.md#p2135-example-naturewalk
  - core/10-indices-and-reference.md#naturewalk-capability
reviewed_at: 2026-02-27T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Rough Terrain Accuracy Penalty (PTU p.231)

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md`, lines 476-478)
- **Implementation:** `getRoughTerrainPenalty()` in `useMoveCalculation.ts:229-234` returns a flat `2` if `targetsThroughRoughTerrain()` detects any rough cell along the Bresenham line trace, `0` otherwise. This penalty is added to the accuracy threshold in `getAccuracyThreshold()` at line 439: `Math.max(1, move.ac + effectiveEvasion - attackerAccuracyStage + roughPenalty)`.
- **Status:** CORRECT

The penalty is correctly:
- A flat -2 (not cumulative per cell) -- the function returns `true` on the FIRST rough cell found, producing a single +2 to the threshold.
- Applied as an increase to the accuracy threshold (higher roll needed), which is the correct direction for a penalty.
- The formula `ac + evasion - accuracyStage + roughPenalty` correctly models: base AC + evasion modifiers - attacker accuracy bonus + penalties.

### 2. Enemy-Occupied Squares as Rough Terrain (decree-003)

- **Rule:** "Squares occupied by enemies always count as Rough Terrain." (`core/07-combat.md`, line 485). Per decree-003: "enemy-occupied squares count as rough terrain per PTU p.231."
- **Implementation:** `enemyOccupiedCells` computed property (lines 114-133) builds a Set of `"x,y"` keys for all combatants on the enemy side relative to the actor. The `targetsThroughRoughTerrain()` function checks `enemyOccupiedCells.value.has(key)` at line 193 for each intermediate cell.
- **Status:** CORRECT

Side determination uses `isEnemySide()` from `utils/combatSides.ts`, which correctly handles the three-side model (players + allies vs enemies). The actor's own cells are excluded via `combatant.id === actor.value.id` check at line 119. Multi-cell tokens (large Pokemon) are correctly handled with the size loop at lines 124-129.

**RAW Note:** PTU p.231 line 479 says "Spaces occupied by **other** Trainers or Pokemon are considered Rough Terrain" -- this includes ally-occupied squares, not just enemies. However, per decree-003, only enemy-occupied squares are treated as rough terrain. The decree override is correct and takes precedence. No action needed.

### 3. Painted Rough Terrain via TerrainPainter (decree-010)

- **Rule:** Per decree-010, terrain uses a multi-tag flag system where the `rough` flag indicates the cell imposes the accuracy penalty. PTU p.231 describes rough terrain as "tall grass, shrubs, rocks, or anything else that might obscure attacks."
- **Implementation:** `terrainStore.isRoughAt(x0, y0)` is checked at line 197 for each intermediate cell. The `isRoughAt` getter in `terrain.ts:178-181` reads the `flags.rough` property from the cell's terrain data, returning `false` by default if no cell exists or no flags are set.
- **Status:** CORRECT

This is the core fix for ptu-rule-108. Previously, only enemy-occupied cells were checked. Now painted terrain cells with the `rough` flag are also detected. The check correctly:
- Reads from the multi-tag flag system (decree-010 compliant)
- Does NOT trigger on `slow`-only terrain (the test at line 246-258 explicitly verifies this)
- Works with any base terrain type that has the rough flag (e.g., water+rough is tested at line 232-244)

### 4. Bresenham Line-of-Fire Trace

- **Rule:** PTU does not specify a particular algorithm for determining "targeting through" terrain. Bresenham's line algorithm is the standard grid-based line-of-sight approach and is appropriate for a discrete grid.
- **Implementation:** Standard Bresenham algorithm at lines 182-213. Uses `closestCellPair()` from `useRangeParser` to find the nearest cell-pair between multi-cell tokens before tracing. Actor's own cells and target's own cells are excluded from the rough terrain check.
- **Status:** CORRECT

The algorithm:
- Traces from the closest actor cell to the closest target cell (correct for multi-size tokens)
- Excludes actor-occupied and target-occupied cells (lines 157-169, 191)
- Short-circuits on first rough cell found (correct for flat penalty)
- Handles both cardinal and diagonal lines correctly (Bresenham covers both)

### 5. Accuracy Threshold Formula Integration

- **Rule:** The accuracy threshold is the number a d20 roll must meet or exceed. PTU accuracy: roll d20 >= AC + Evasion - Accuracy Stage + penalties.
- **Implementation:** Line 439: `Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value + roughPenalty)` with `effectiveEvasion = Math.min(9, evasion)`.
- **Status:** CORRECT

The rough penalty is correctly added (positive value increases threshold = harder to hit). The `Math.max(1, ...)` floor ensures the threshold never drops below 1 (only a natural 1 misses). Natural 1 and natural 20 handling at lines 456-461 correctly overrides the threshold comparison.

### 6. Non-VTT Encounter Graceful Degradation

- **Rule:** When no grid positions are available (non-VTT encounters), terrain penalties should not apply.
- **Implementation:** `targetsThroughRoughTerrain()` returns `false` immediately if `actorPos` is null (line 149) or if the target has no position (line 151).
- **Status:** CORRECT

This ensures the system degrades gracefully in non-grid encounters. Tests at lines 297-318 cover both cases.

## Summary

The fix correctly implements the PTU rough terrain accuracy penalty for painted terrain cells. The core change is minimal and surgical: adding a single `terrainStore.isRoughAt(x0, y0)` check to the existing Bresenham line trace loop, alongside the already-working enemy-occupied check. Both decree-003 (enemy-occupied as rough) and decree-010 (multi-tag flags) are respected.

The accuracy threshold formula correctly integrates the penalty. The penalty is flat (not cumulative), which matches PTU RAW -- the rulebook says "a -2 penalty" not "a -2 penalty per square."

Test coverage is thorough with 12 tests covering: painted rough on LoS, painted rough off LoS, actor/target cell exclusion, diagonal lines, water+rough combo (decree-010), slow-only no-penalty, enemy-occupied, combined sources (flat not cumulative), no-position graceful degradation, and adjacent combatants.

## Rulings

### RULING-1: Flat penalty is correct per RAW

PTU p.231 says "a -2 penalty" (singular). The implementation returns either 0 or 2, never accumulates per cell. This matches the rulebook language. Even the example on p.2135 says "a penalty of 2" (singular) for targeting through rough terrain.

### RULING-2: Actor/target cell exclusion is correct

The Bresenham trace excludes the attacker's own cells and the target's own cells. This is the correct interpretation of "targeting **through**" rough terrain -- the rough terrain must be between attacker and target, not at either endpoint. The example on p.2135-2136 supports this: the Oddish is targeting "through" the grassy terrain at the target, implying the terrain is in the path, not at the endpoints.

### RULING-3: Enemy-only (not ally) per decree-003 overrides RAW

PTU p.231 line 479 says "Spaces occupied by **other** Trainers or Pokemon are considered Rough Terrain" which includes allies. However, decree-003 specifically rules that only enemy-occupied squares count as rough terrain. The implementation follows the decree, which is correct per the decree override hierarchy.

## Medium Issues

### MED-1: Naturewalk capability not checked for rough terrain bypass

**Rule:** "Certain types of Rough Terrain may be ignored by certain Pokemon, based on their capabilities." (`core/07-combat.md`, lines 480-482). "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." (`core/10-indices-and-reference.md`, lines 322-325). The example on p.2136 explicitly shows Oddish ignoring the rough terrain penalty because of Naturewalk.

**Current:** `getRoughTerrainPenalty()` applies the -2 penalty universally, regardless of whether the attacking Pokemon has Naturewalk for the terrain type covering the rough cells.

**Impact:** Pokemon with Naturewalk (Forest, Grassland) should not suffer the -2 accuracy penalty when targeting through rough terrain that matches their Naturewalk terrain type. This is an edge case -- it requires knowing both the attacker's capabilities AND the thematic terrain type of the rough cells (which the multi-tag system doesn't currently track beyond the `rough` boolean flag).

**Severity:** MEDIUM. This is a known limitation rather than a bug in the fix itself. The current terrain flag system has no "terrain theme" metadata (e.g., forest vs grassland vs tundra) to match against Naturewalk types. The fix correctly implements the base rough terrain penalty; Naturewalk exemption is a separate feature that would require extending the terrain data model. Recommend filing a separate ticket.

### MED-2: Target standing in rough terrain not checked (only "through")

**Rule:** PTU p.231: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."

**Current:** The implementation excludes the target's own cells from the rough terrain check (lines 191). If the target is standing IN rough terrain but there is no rough terrain BETWEEN the attacker and target, no penalty applies.

**Impact:** The word "through" is ambiguous. It could mean (a) the attack path passes through rough terrain between attacker and target, or (b) the attack travels through any rough terrain including where the target stands. Most tabletop interpretations favor (a): "through" means intervening terrain, not the endpoint. The implementation matches interpretation (a).

**Severity:** MEDIUM. This is an interpretive edge case. The current approach (excluding endpoints) is the more common tabletop ruling and matches the spirit of "obscuring attacks" -- terrain at the target's feet doesn't obscure the attack. If this is controversial, consider a decree-need ticket. Not a bug in the current fix.

## Verdict

**APPROVED.** The rough terrain accuracy penalty is correctly implemented per PTU p.231, decree-003, and decree-010. The core mechanic (flat -2 penalty when targeting through rough terrain) is sound. Both rough terrain sources (enemy-occupied squares and painted terrain cells) are checked along the Bresenham line-of-fire trace. The two MEDIUM issues are pre-existing limitations / design ambiguities, not bugs introduced by this fix. They should be tracked as separate tickets if the human deems them worth implementing.

## Required Changes

None. Both MEDIUM issues are pre-existing and do not block approval of this fix.

## Recommended Follow-Up Tickets

1. **Naturewalk rough terrain exemption** (MEDIUM): Pokemon with Naturewalk for the appropriate terrain type should bypass the -2 rough terrain accuracy penalty. Requires extending terrain data model with terrain theme metadata.
2. **Ally-occupied squares as rough terrain** (LOW, decree-need): RAW says "other Trainers or Pokemon" (includes allies), but decree-003 limits to enemies only. Current implementation follows decree. If the human wants strict RAW, a new decree-need should be filed.
