---
review_id: rules-review-181
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-112
domain: vtt-grid
commits_reviewed:
  - d9c0d81
  - 3b541b9
  - 2311d8f
  - c95021a
  - e5d6178
  - a34e706
  - 108239c
mechanics_verified:
  - naturewalk-terrain-bypass
  - naturewalk-slow-flag-bypass
  - naturewalk-rough-accuracy-bypass
  - naturewalk-enemy-occupied-exclusion
  - naturewalk-terrain-mapping
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Naturewalk (p.322)
  - core/07-combat.md#Terrain (p.231)
  - core/07-combat.md#Rough Terrain (p.476-485)
  - core/07-combat.md#Example (p.2136)
  - core/04-trainer-classes.md#Survivalist (p.4694)
  - core/04-trainer-classes.md#Breeder (p.2800)
reviewed_at: 2026-02-27T23:35:00Z
follows_up: rules-review-177
---

## Review Scope

Rules review of the ptu-rule-112 fix cycle (Naturewalk terrain bypass). This review verifies PTU correctness of the Naturewalk implementation against:

- **PTU 1.05 p.322** (10-indices-and-reference.md line 322-325): "Naturewalk is always listed with Terrain types in parentheses, such as Naturewalk (Forest and Grassland). Pokemon with Naturewalk treat all listed terrains as Basic Terrain."
- **PTU 1.05 p.209** (07-combat.md line 2135-2138): Example showing Oddish with Naturewalk (Forest, Grassland) is "not hindered by the grassy terrain" when other Pokemon would take the -2 rough terrain accuracy penalty.
- **PTU 1.05 p.231** (07-combat.md line 476-480): "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."
- **PTU 1.05 p.276** (04-trainer-classes.md line 2800-2801): "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (capability definition -- note this covers status immunity, which is separate from terrain flag bypass)
- **decree-003**: Enemy-occupied squares count as rough terrain; Naturewalk does NOT bypass this.
- **decree-010**: Multi-tag terrain system with discrete rough/slow flags.
- **decree-025**: Endpoint cells excluded from rough terrain accuracy penalty check.

## PTU Correctness Analysis

### 1. "Treat all listed terrains as Basic Terrain" (p.322)

**Basic Terrain** in PTU means: no movement cost modifier (no slow penalty) and no accuracy penalty (no rough penalty). The implementation correctly interprets this as:

- **Movement (slow flag bypass):** `getTerrainCostForCombatant` returns base cost instead of doubled cost when `naturewalkBypassesTerrain` returns true for the cell's base terrain type. This means a cell with slow+rough flags on normal terrain, for a Pokemon with Naturewalk (Forest), costs 1 instead of 2. Correct.

- **Accuracy (rough flag bypass):** `targetsThroughRoughTerrain` skips the painted rough terrain penalty when `naturewalkBypassesTerrain` returns true for the cell's base terrain type. This matches the p.209 example where Oddish is not penalized. Correct.

### 2. Terrain Name Mapping (NATUREWALK_TERRAIN_MAP)

PTU lists 9 terrain types for Naturewalk (from the Survivalist class, p.469): Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.

All 9 are present in `NATUREWALK_TERRAIN_MAP`. The mappings to app base terrain types are:

| PTU Terrain | App Base Types | Rationale |
|------------|---------------|-----------|
| Grassland | normal | Grass/plain terrain uses normal base type |
| Forest | normal | Forest uses normal base type with rough/slow flags |
| Wetlands | water, normal | Wetland edges are normal, water areas are water |
| Ocean | water | Deep water terrain |
| Tundra | normal | Snow/ice terrain uses normal base type |
| Mountain | elevated, normal | Elevated terrain for peaks, normal for foothills |
| Cave | earth, normal | Underground uses earth, cave floors use normal |
| Urban | normal | City terrain uses normal base type |
| Desert | normal | Sandy terrain uses normal base type |

These mappings are reasonable given the app's generic base terrain types. The known limitation (multiple PTU terrains map to the same base type) is well-documented and inherent to the terrain painter's design.

### 3. Naturewalk Data Extraction

Two data sources are checked:
- `capabilities.naturewalk`: Direct string array (e.g., `['Forest', 'Grassland']`)
- `capabilities.otherCapabilities`: Parsed from strings like `"Naturewalk (Forest, Grassland)"`

The parser handles comma separators, "and" separators, and single terrain entries. Deduplication via `Set` prevents double-counting when both sources contain the same terrain. This covers all formats found in the PTU seeder data.

### 4. Decree Compliance

**decree-003 (enemy-occupied rough):** The `targetsThroughRoughTerrain` function checks enemy-occupied cells BEFORE painted rough terrain. Enemy-occupied cells return `true` immediately without checking Naturewalk. Per decree-003, this is correct: "Squares occupied by enemies always count as Rough Terrain" is a game mechanic, not painted terrain, and Naturewalk does not interact with it.

Test verification: `should NOT bypass enemy-occupied rough terrain even with matching Naturewalk (decree-003)` -- actor has Naturewalk for all terrain types, enemy on the line, penalty still applies (returns 2). Additionally: `should still penalize when enemy-occupied rough exists alongside bypassed painted rough` -- painted rough bypassed but enemy rough still triggers. Both tests pass.

**decree-010 (multi-tag terrain):** The implementation uses the `flags.slow` and `terrainStore.isRoughAt()` checks from the multi-tag system. Naturewalk bypasses individual flags, not the base terrain type. A cell can be rough+slow, and Naturewalk correctly bypasses both flags independently (slow in movement, rough in accuracy). Correct.

**decree-025 (endpoint exclusion):** The endpoint exclusion logic in `targetsThroughRoughTerrain` (actorCells/targetCells Sets) was pre-existing and unchanged by these commits. The Naturewalk bypass only applies to intermediate cells that pass the endpoint check. Correct.

### 5. Edge Cases

**Blocking terrain:** Naturewalk never bypasses blocking terrain. The impassable check at line 379 (`terrain === 'blocking'`) returns Infinity before the Naturewalk check runs. Test: `should return Infinity for blocking terrain even with Naturewalk`. Correct.

**Water without swim:** A Pokemon with Naturewalk (Ocean) but no Swim capability cannot enter water terrain. The capability gate at line 381 (`terrain === 'water' && !canSwim`) returns Infinity before the Naturewalk check. Test: `should return Infinity for water terrain without swim even with Naturewalk (Ocean)`. Correct per PTU: Naturewalk treats terrain as Basic (no penalties), but does not grant the movement capability to enter the terrain.

**Earth without burrow:** Same logic -- earth returns Infinity for non-burrowers. The earth base cost fix (commit 2311d8f) correctly handles the edge case where `TERRAIN_COSTS['earth']` is Infinity (generic blocking) but a burrower with Cave Naturewalk should get cost 1. Correct.

**Unrecognized Naturewalk terrain:** A terrain name not in `NATUREWALK_TERRAIN_MAP` (e.g., "Swamp") returns `undefined` from the lookup, so `naturewalkBypassesTerrain` returns false. Test: `should return false for unrecognized Naturewalk terrain name`. Correct fail-safe behavior.

### 6. Scope Boundary: Status Condition Immunity

PTU p.276 states Naturewalk grants "Immunity to Slowed or Stuck in its appropriate Terrains." The current implementation does NOT handle this -- it only handles terrain flag bypass (movement cost and accuracy penalty). Status condition immunity (preventing the Slowed/Stuck conditions while on matching terrain) is a separate behavioral rule that would require tracking combatant position + terrain + Naturewalk at condition-application time. This is outside the scope of ptu-rule-112, which specifically addresses terrain flag bypass. A future ticket may be warranted if this rule is needed.

## What Looks Good

1. **The p.209 example is faithfully implemented.** Oddish with Naturewalk (Forest, Grassland) in a forest encounter: rough terrain accuracy penalty is bypassed for normal-type cells with rough flag, but enemy-occupied rough still applies. This matches the book example exactly.

2. **"Treat as Basic Terrain" is correctly decomposed** into two independent effects: no slow cost doubling (movement) and no rough accuracy penalty. Each is bypassed separately in the appropriate composable.

3. **The decree compliance test suite is exemplary.** Three dedicated tests for decree-003 (enemy-occupied rough not bypassed, even with all Naturewalk terrains), proper endpoint exclusion per decree-025, and multi-tag flag handling per decree-010.

4. **Test coverage exercises every terrain type mapping category** -- normal (Forest), water (Ocean, Wetlands), elevated (Mountain), earth (Cave) -- verifying the NATUREWALK_TERRAIN_MAP works correctly for each base type.

5. **The earth terrain base cost fix is rules-correct.** Earth terrain with burrow capability costs 1 (Basic Terrain equivalent), and Naturewalk should not change that to Infinity.

## Verdict

**APPROVED**

The Naturewalk terrain bypass implementation is PTU-correct per p.322, p.209, and p.231. Decree compliance with decree-003, decree-010, and decree-025 is verified through both code review and dedicated test cases. The fix cycle adds comprehensive test coverage and resolves all issues from the previous review. No PTU rule violations found.
