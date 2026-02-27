---
review_id: code-review-066
commit: f2fe6a1
ticket: bug-017
domain: vtt-grid
status: APPROVED_WITH_ISSUES
date: 2026-02-20
reviewer: senior-reviewer
---

# Code Review 066: Add Earth and Rough Terrain Types (bug-017)

## Commit

`f2fe6a1` -- `feat: add Earth and Rough terrain types to VTT grid system`

## Files Reviewed

1. `app/types/spatial.ts`
2. `app/stores/terrain.ts`
3. `app/composables/useCanvasDrawing.ts`
4. `app/composables/useCanvasRendering.ts`
5. `app/components/vtt/TerrainPainter.vue`
6. `app/tests/unit/stores/terrain.test.ts`

---

## Issues

### MEDIUM-1: `useGridMovement.ts` caller never passes `canBurrow` -- Earth terrain always impassable in pathfinding

**File:** `app/composables/useGridMovement.ts:73`

The `getMovementCost` and `isPassable` getters now accept `canBurrow` as a fourth parameter, but the only production caller in `useGridMovement.ts` hardcodes `false` for `canSwim` and does not pass `canBurrow` at all:

```typescript
// Current code (line 73)
return terrainStore.getMovementCost(x, y, false) // TODO: Pass canSwim based on combatant
```

This means Earth terrain will always be treated as impassable (Infinity) in the A* pathfinding and movement range display, even for Pokemon with Burrow capability. The parameter was added to the store getter but the calling code was not updated.

This is the same pattern as the existing `canSwim` TODO. Both capability flags need to be threaded from the current combatant's `MovementSpeeds` data (where `burrow > 0` implies `canBurrow = true` and `swim > 0` implies `canSwim = true`).

**Action:** File a follow-up ticket for threading `canSwim` and `canBurrow` from combatant movement speeds into `useGridMovement`. The store-level logic is correct; the integration is incomplete. This is not a regression (Water terrain had the same gap before this commit), but it should be tracked.

### MEDIUM-2: Duplicate `drawTerrainPattern` implementations across two composables

**Files:** `app/composables/useCanvasDrawing.ts:286-313` and `app/composables/useCanvasRendering.ts:133-160`

The earth and rough drawing code is identical between the two composables, and the pre-existing patterns (blocking, water, hazard, elevated, difficult) were already duplicated. This commit adds 29 more lines of exact-duplicate canvas drawing code.

The pre-existing `difficult` case is actually NOT identical between the two files -- `useCanvasDrawing.ts` uses a grid-math dot pattern while `useCanvasRendering.ts` uses a simpler loop. This inconsistency predates this commit but is worth noting because the new earth/rough cases ARE identical. The duplication is a maintenance risk: future changes to one file can easily miss the other.

**Action:** This is pre-existing tech debt, not introduced by this commit. Note for future refactoring -- the `drawTerrainPattern` function should live in one place and be imported by both composables. No blocking action required for this commit.

### MEDIUM-3: Rough terrain accuracy penalty is not enforced anywhere in the combat system

**File:** `app/stores/terrain.ts:23`

The comment says `// Normal movement cost but -2 accuracy penalty when targeting through` but there is zero code that applies this penalty during attack resolution. Searching the codebase for any accuracy modifier tied to rough terrain yields no results outside of comments, type annotations, and matrix/review artifacts.

The terrain type is correctly defined and persisted, and the UI correctly displays the cost label as `1x/-2 acc`, but a GM using Rough terrain would get no automated accuracy penalty. The PTU rule (p.231) states: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."

This is acknowledged in the ticket Fix Log ("the stacking is a GM decision per encounter setup") and in the combat matrix (combat-R062). However, the terrain painter now advertises `-2 acc` in its UI without the system enforcing it.

**Action:** The missing enforcement is a separate feature (combat-R062 in the matrix). Not a bug in this commit, but the UI description implies automation that does not exist. Either:
- (a) Update the rough description to clarify it is a visual marker only: `"Rough terrain - -2 accuracy penalty (manual, not auto-applied)"`, OR
- (b) File a follow-up ticket for combat system integration.

Option (b) is already tracked in the combat matrix. No blocking action.

---

## What Looks Good

1. **Type union updated correctly.** The `TerrainType` union in `spatial.ts` now has all 8 types with accurate PTU-referenced comments. The union is the single source of truth and TypeScript will enforce exhaustive handling.

2. **Store logic is correct.** The `getMovementCost` getter for earth terrain uses an explicit `if` block before falling through to `TERRAIN_COSTS`, which correctly handles the conditional-passability pattern. The `isPassable` getter mirrors this logic. Both default `canBurrow` to `false`, which is the safe default (conservative -- blocks rather than allowing).

3. **All terrain type lists are in sync.** Verified 6 locations where terrain types are listed:
   - `spatial.ts` type union (8 types)
   - `terrain.ts` TERRAIN_COSTS (8 keys)
   - `terrain.ts` TERRAIN_COLORS (8 keys)
   - `useCanvasDrawing.ts` switch cases (8 cases including implicit no-op for 'normal')
   - `useCanvasRendering.ts` switch cases (8 cases)
   - `TerrainPainter.vue` terrainTypes array (8 entries)
   - Tests enumerate all 8 types

   Dynamic consumers (`useGridRendering.ts`, `useTerrainPersistence.ts`, terrain API) use keyed lookups or generic `TerrainType` and require no changes. Confirmed correct.

4. **UI layout handles 8 types well.** Grid changed from `repeat(3, 1fr)` to `repeat(4, 1fr)` giving a clean 2x4 grid for 8 terrain types. The legend also iterates the same array.

5. **Canvas patterns are visually distinct.** Earth (downward arrow) vs Elevated (upward arrow) provides clear directional contrast. Rough (jagged line) is visually distinct from all other patterns. The earth/rough patterns match exactly between both composables.

6. **Tests are thorough.** 7 new test cases covering:
   - Earth movement cost without burrow (explicit `false, false`)
   - Earth movement cost with default params (no burrow implicit)
   - Earth movement cost with burrow (`false, true`)
   - Rough movement cost (normal = 1)
   - Earth passability without/with burrow
   - Rough passability (always passable)
   - Color definitions for all 8 types

7. **Renaming "Difficult" to "Slow" matches PTU terminology.** This aligns with the PTU rulebook which calls it "Slow Terrain." Good consistency improvement.

8. **Terrain persistence is unaffected.** The `terrain.put.ts` API and `useTerrainPersistence.ts` composable both use generic `TerrainType` from the type union and store/load via JSON serialization. New terrain types are automatically supported without code changes.

---

## Verdict

**APPROVED WITH ISSUES.** The core implementation is correct and complete. The three MEDIUM issues are:
- MEDIUM-1: Pre-existing gap (canSwim TODO already existed), now also applies to canBurrow. Track with follow-up ticket.
- MEDIUM-2: Pre-existing tech debt (duplicate drawTerrainPattern). No action for this commit.
- MEDIUM-3: Accuracy penalty not enforced. Already tracked in combat matrix. UI description could be clearer but not blocking.

None of these are regressions introduced by this commit. The commit delivers what the ticket specified.
