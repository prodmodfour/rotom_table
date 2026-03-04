---
review_id: rules-review-170
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-103
domain: vtt
commits_reviewed:
  - 1b4cbe4
  - 4ef0b08
  - bbb2590
  - aac53fb
  - c69a877
mechanics_verified:
  - mixed-terrain-speed-averaging
  - capability-deduplication
  - movement-modifier-order
  - path-terrain-analysis
  - flood-fill-speed-constraint
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#movement-and-shifting
  - decree-011
  - decree-008
  - decree-010
reviewed_at: 2026-02-27T12:00:00Z
follows_up: rules-review-164
---

## Mechanics Verified

### Mixed-Terrain Speed Averaging (PTU p.231)

- **Rule:** "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value. For example, if a Pokemon has Overland 7 and Swim 5, they can shift a maximum of 6 meters on a turn that they use both Capabilities." (`core/07-combat.md`, p.231)
- **Implementation:** `calculateAveragedSpeed` in `app/utils/combatantCapabilities.ts` collects distinct capability types along a path via `seenCapabilities: Set<string>`, stores their speed values in `capabilitySpeeds: number[]` (array, not Set), averages them, and floors the result via `Math.floor(sum / capabilitySpeeds.length)`.
- **Status:** CORRECT. The fix in commit `1b4cbe4` changed `capabilitySpeeds` from `Set<number>` to `number[]`, resolving the value-deduplication bug identified in rules-review-164 M-001. The 3-capability case now produces correct results: Overland 6 + Swim 6 + Burrow 3 = `Math.floor((6+6+3)/3)` = 5, not the incorrect `(6+3)/2` = 4 that the Set produced. The 2-capability PTU example case (Overland 7 + Swim 5 = 6) remains correct.

### Capability Deduplication

- **Rule:** PTU says to average the Movement **Capabilities** used, not the terrain types. Multiple terrain types that use the same capability (e.g., normal + hazard both use Overland) count as one capability in the average.
- **Implementation:** `seenCapabilities: Set<string>` keyed on `'overland'`, `'swim'`, `'burrow'` prevents the same capability from being counted multiple times. The `capabilitySpeeds.push(speed)` only executes when `!seenCapabilities.has(capabilityKey)`.
- **Status:** CORRECT. The deduplication is by capability name (string), while the speed storage is by value (number array). This combination correctly handles both: (a) multiple terrains mapping to the same capability are deduplicated, and (b) multiple distinct capabilities with the same speed value are preserved. No change from rules-review-164 -- this was already correct.

### Movement Modifier Application Order

- **Rule:** PTU p.231 (Stuck, movement = 0), p.234 (Speed Combat Stage modifier), p.253 (Slowed halves movement) -- modifiers apply to the effective movement speed for the turn.
- **Implementation:** `buildSpeedAveragingFn` (line 276) computes raw averaged capability speed via `calculateAveragedSpeed`, then applies `applyMovementModifiers` to the result. Order: (1) raw capability speeds per terrain type, (2) average distinct capabilities, (3) apply Stuck/Slowed/Speed CS/Sprint.
- **Status:** CORRECT. Modifiers are applied once after averaging, not to individual capabilities before averaging. This matches PTU intent -- the averaged value IS the movement budget, and modifiers adjust that budget. Stuck correctly returns 0 early (line 100-101), bypassing all downstream modifiers.

### Path Terrain Analysis (A* Reconstruction)

- **Rule:** Per decree-011, terrain types must be detected along the actual movement path, not approximated from start/end positions.
- **Implementation:** `calculatePathCost` in `usePathfinding.ts` reconstructs the full A* path via `closedNodes` parent-pointer map. `isValidMove` in `useGridMovement.ts` (line 525-527) passes the reconstructed path to `getAveragedSpeedForPath`, which collects terrain types from each cell via `terrainStore.getTerrainAt` and feeds them to `calculateAveragedSpeed`.
- **Status:** CORRECT. The fix commits did not modify the path reconstruction logic. It remains sound -- parent pointers trace from destination to start, with a fallback for the start node remaining in `openSet` (line 323-328). No regressions.

### Flood-Fill Speed Constraint (Movement Range Display)

- **Rule:** Movement range display must account for speed averaging -- a cell is only reachable if the path cost to it fits within the averaged speed for the terrain types encountered along that path.
- **Implementation:** `getMovementRangeCellsWithAveraging` in `usePathfinding.ts` explores with `maxSpeed` as the outer budget, accumulates terrain types per-path in `pathTerrainTypes: Set<string>`, and checks `totalCost > getAveragedSpeed(pathTerrainTypes)` to prune unreachable cells (line 533).
- **Status:** CORRECT. The conservative approximation limitation is now documented in the JSDoc (commit `aac53fb`). The documentation accurately describes the edge case, why it errs conservatively, and why `isValidMove` (which uses full A* path analysis) ensures no invalid moves can be executed.

### Decree Compliance

- **decree-008** (water terrain cost = 1): Water base cost remains 1 in terrain store. Swim speed selection for averaging operates independently of cost. COMPLIANT.
- **decree-010** (multi-tag terrain): Terrain type lookup uses `getTerrainAt` returning the base type, independent of rough/slow flags. Speed averaging operates on base terrain types only. Slow flag still doubles movement cost via the terrain cost getter, which is separate from the speed averaging path. COMPLIANT.
- **decree-011** (mixed-terrain speed averaging): Path-based averaging implemented per the ruling. Both `isValidMove` (A* path analysis) and movement range display (flood-fill with terrain tracking) use averaging. The averaging formula `Math.floor(sum / count)` matches the PTU example. COMPLIANT.

## Fix Verification

### CRIT-2 / M-001 Fix (commit 1b4cbe4): `Set<number>` to `number[]`

**Original issue:** `capabilitySpeeds: Set<number>` deduplicates by numeric value, producing incorrect averages when distinct capabilities share the same speed value.

**Fix applied:** Changed declaration to `const capabilitySpeeds: number[] = []`, changed `.add(speed)` to `.push(speed)`, changed `.size` to `.length`, and removed unnecessary `Array.from()` conversions.

**Verification:** The current code at `combatantCapabilities.ts` lines 136-169 uses `number[]` throughout. The only `.size` remaining in the function is `terrainTypes.size` (parameter Set, correct). The fix is complete and correct. No regressions -- the `seenCapabilities: Set<string>` deduplication for capability names is untouched.

### CRIT-1 / M-002 Fix (commit 4ef0b08): Undefined `speed` variable in `drawExternalMovementPreview`

**Original issue:** In `drawExternalMovementPreview`, `speed` was only declared in the `else` branch. When `canUseAveraging` was true, the `drawSpeedBadge` call on line 574 referenced an undefined variable.

**Fix applied:** Added `let displaySpeed: number` before the `if/else` block (line 535). Both branches now set `displaySpeed`. The speed badge call uses `displaySpeed` (line 578). This mirrors the pattern already used in `drawMovementRange` (lines 392-417).

**Verification:** The current code at `useGridRendering.ts` lines 534-578 correctly declares `displaySpeed` before the branch, sets it in both the `canUseAveraging` path (line 551) and the fallback path (line 553), and uses it for the badge (line 578). No undefined variable reference. Fix is complete and correct.

### MED-1 Fix (commit bbb2590): Use canonical utility functions in `getMaxPossibleSpeed`

**Original issue:** `getMaxPossibleSpeed` accessed `pokemon.capabilities?.swim` and `pokemon.capabilities?.burrow` directly instead of using the imported `getSwimSpeed`/`getBurrowSpeed` utilities, creating a duplicate code path.

**Fix applied:** Replaced direct property access with `getSwimSpeed(combatant)` and `getBurrowSpeed(combatant)` calls. Added `getSwimSpeed, getBurrowSpeed` to the import statement.

**Verification:** The current code at `useGridMovement.ts` lines 174-186 uses `getOverlandSpeed(combatant)`, `getSwimSpeed(combatant)`, and `getBurrowSpeed(combatant)` -- all canonical utilities from `combatantCapabilities.ts`. The import on line 6 includes all three. The `Pokemon` type import is still needed for other usages (lines 65, 214). No regressions.

### MED-2 Fix (commit aac53fb): Conservative approximation documentation

**Original issue:** The flood-fill's conservative approximation behavior was undocumented.

**Fix applied:** Added 11-line JSDoc block to `getMovementRangeCellsWithAveraging` explaining: (1) the flood-fill stores cheapest-cost path per cell only, (2) a higher-cost path with fewer terrain types might yield higher averaged speed, (3) why this is acceptable (conservative, validated by A*, rare edge case).

**Verification:** The current code at `usePathfinding.ts` lines 410-420 contains the documentation. The explanation is accurate and matches the actual algorithmic behavior. The three justification points are sound.

## Regression Analysis

1. **`calculateAveragedSpeed` API unchanged**: Still accepts `(Combatant, Set<string>)`, returns `number`. All callers (`getAveragedSpeedForPath`, `buildSpeedAveragingFn`) are unaffected.
2. **`drawExternalMovementPreview` rendering unchanged**: Only variable naming changed; the rendering logic (range cells, origin marker, speed badge, arrow, distance label) is identical.
3. **`getMaxPossibleSpeed` behavior unchanged**: The utility functions return identical values to the direct property access they replaced. The `combatantCanSwim`/`combatantCanBurrow` guards ensure the same conditions apply.
4. **No new code paths introduced**: All four fixes are minimal, targeted changes to existing code. No new functions, no new branches, no new types.
5. **GridCanvas.vue and IsometricCanvas.vue unchanged**: Both canvas components pass the same callbacks (`getMaxPossibleSpeed`, `buildSpeedAveragingFn`, `getTerrainTypeAt`) as before. The fix commits did not touch these files.

## Summary

All four issues from code-review-187 and rules-review-164 have been correctly resolved:
- CRIT-2/M-001: `Set<number>` replaced with `number[]` -- arithmetic mean of distinct capability speeds is now correct for 3+ capabilities with shared values.
- CRIT-1/M-002: Undefined `speed` variable replaced with properly scoped `displaySpeed` -- group view external movement preview no longer crashes with terrain.
- MED-1: Direct capability property access replaced with canonical utility functions -- single source of truth for speed lookups.
- MED-2: Conservative approximation documented in JSDoc -- limitation is explained with accurate justification.

The core PTU p.231 speed averaging mechanic remains correctly implemented across all code paths: A* validation (`isValidMove`), flood-fill range display (`getMovementRangeCellsWithAveraging`), and WebSocket preview rendering. Decree-011 compliance is maintained. No regressions detected.

## Rulings

1. **Previous rulings from rules-review-164 reaffirmed:** PTU averaging = arithmetic mean of distinct capability speeds, floored. Modifiers apply after averaging. Terrain types map to capabilities for deduplication.
2. **No new ambiguities discovered.** All four fixes are straightforward corrections to the existing implementation.

## Verdict

**APPROVED** -- All issues from the previous review have been resolved correctly. The implementation faithfully translates PTU p.231 mixed-terrain speed averaging and complies with decrees 008, 010, and 011. No new issues found.
