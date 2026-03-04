---
review_id: rules-review-167
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-101
domain: vtt-grid
commits_reviewed:
  - d271ec2
  - f10cad0
  - 3fd2f35
  - a3ec3e0
  - 8e61bf7
mechanics_verified:
  - water-terrain-base-cost
  - slow-terrain-movement-doubling
  - rough-terrain-accuracy-only
  - multi-tag-terrain-flags
  - legacy-type-migration
  - terrain-aware-speed-selection
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Basic-Terrain-Type (p.231)
  - core/07-combat.md#Slow-Terrain (p.231)
  - core/07-combat.md#Rough-Terrain (p.231)
  - decree-008
  - decree-010
  - decree-011
reviewed_at: 2026-02-27T12:00:00Z
follows_up: code-review-185
---

## Mechanics Verified

### 1. Water Terrain Base Cost (decree-008, PTU p.231)

- **Rule:** "Underwater: Underwater Terrain is any water that a Pokemon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability." (`core/07-combat.md` p.231). Water is classified under "Basic Terrain Type" -- NOT under Slow Terrain. Per decree-008: "water terrain defaults to movement cost 1 (basic terrain); the GM can mark specific water cells as slow terrain via the terrain painter."
- **Implementation:** `TERRAIN_COSTS.water = 1` in `app/stores/terrain.ts:27`. The comment cites decree-008. `getMovementCost` returns `Infinity` for water without swim capability (line 155), and returns the base cost of 1 for swimmers (line 159-162). The slow flag doubles this to 2 only when explicitly set by the GM.
- **Status:** CORRECT -- Water is basic terrain at cost 1. The swim speed selection in `getTerrainAwareSpeed` (`app/composables/useGridMovement.ts:69`) correctly selects Swim speed for water cells, providing the natural movement penalty via lower Swim speed rather than inflated terrain cost. No double-dip.

### 2. Slow Terrain Movement Doubling (PTU p.231, decree-010)

- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md` p.231)
- **Implementation:** `getMovementCost` in `app/stores/terrain.ts:159-162`:
  ```typescript
  const baseCost = TERRAIN_COSTS[terrain]
  return flags.slow ? baseCost * 2 : baseCost
  ```
  Uses immutable `const baseCost` and ternary expression (fix for code-review-185 MED-2). The slow flag doubles any base terrain cost, matching PTU's "treat every square meter as two."
- **Status:** CORRECT -- Slow terrain doubles movement cost. The `const`/ternary pattern is immutable per project coding standards. Edge cases verified: water + slow = cost 2 for swimmers (tested at terrain.test.ts:283-288), normal + slow = cost 2 (tested at terrain.test.ts:241-245).

### 3. Rough Terrain Accuracy Only (PTU p.231, decree-010)

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md` p.231). Rough Terrain has NO movement cost effect -- it only imposes an accuracy penalty.
- **Implementation:** The `rough` flag in `TerrainFlags` has zero impact on movement cost. `getMovementCost` only checks `flags.slow` (line 162), not `flags.rough`. The `isRoughAt` getter (line 178-181) exposes the flag for accuracy penalty checks. The accuracy integration is in `useMoveCalculation.ts` which checks rough terrain for the -2 penalty.
- **Status:** CORRECT -- Rough flag has no movement cost impact (verified by test at terrain.test.ts:248-253: normal + rough = cost 1). The accuracy penalty pathway is correctly separated from the movement cost pathway per decree-010's specification that "rough affects accuracy only, slow affects movement cost only."

### 4. Multi-Tag Terrain Flags (decree-010)

- **Rule:** Per decree-010: "use a multi-tag terrain system where cells can have multiple terrain flags simultaneously." PTU explicitly states "Most Rough Terrain is also Slow Terrain, but not always."
- **Implementation:** `TerrainFlags` interface (`app/types/spatial.ts:66-69`) has independent `rough: boolean` and `slow: boolean` fields. `TerrainCell` (line 73-79) has both a `type: TerrainType` (base terrain) and `flags: TerrainFlags`. The `TerrainPainter.vue` UI separates base terrain type selection from flag toggles, allowing any combination (e.g., Water + Rough + Slow).
- **Status:** CORRECT -- The multi-tag system faithfully models PTU's terrain overlay model where Slow and Rough are independent modifiers on top of a base terrain type. Cells can be simultaneously Rough and Slow. The `DEFAULT_FLAGS` constant (`{ rough: false, slow: false }`) ensures new cells start with no modifiers.

### 5. Legacy Type Migration (backward compatibility)

- **Rule:** No PTU rule directly -- this is a data model migration concern. Legacy terrain types `'difficult'` and `'rough'` in the `TerrainType` union must be converted to the new multi-tag format without data loss.
- **Implementation:** Two migration pathways:
  1. **Import-time migration:** `migrateLegacyCell()` in `app/stores/terrain.ts:59-114` converts `'difficult'` to `'normal' + { slow: true }` and `'rough'` to `'normal' + { rough: true }`. Handles all 4 branches: legacy with flags, legacy without flags, non-legacy with flags, non-legacy without flags. All branches create new objects (immutable).
  2. **Runtime setter migration** (fix for code-review-185 HIGH-2): `setTerrain` action (line 235-260) performs identical conversion at the point of write. If any code calls `setTerrain(x, y, 'difficult')`, it resolves to `type: 'normal'` with `{ slow: true }`. This prevents the inconsistent state identified in code-review-185 where legacy types could bypass import migration.
- **Status:** CORRECT from a PTU perspective -- `'difficult'` terrain maps to Slow Terrain (2x movement cost) and `'rough'` terrain maps to Rough Terrain (-2 accuracy). The conversion semantics are faithful: PTU's old "difficult terrain" was slow terrain with double cost, and "rough terrain" was accuracy-penalizing terrain.

### 6. Terrain-Aware Speed Selection (PTU p.231)

- **Rule:** "Basic Terrain Type affects which Movement Capability you use to Shift." (`core/07-combat.md` p.231). Water requires Swim; Earth requires Burrow; other terrain uses Overland.
- **Implementation:** `getTerrainAwareSpeed` in `app/composables/useGridMovement.ts:63-80` selects `caps.swim` for water terrain (when available), `caps.burrow` for earth terrain (when available), and `caps.overland` for everything else. This feeds into `getSpeed` (line 202-231) which applies movement modifiers afterward.
- **Status:** CORRECT -- Speed selection matches PTU basic terrain rules. Water terrain selects Swim speed at cost 1 (not the old cost 2). The speed averaging system (decree-011) for mixed-terrain paths builds on top of this per-cell speed selection via `calculateAveragedSpeed`.

## Fix Cycle Verification (code-review-185 Issues)

### CRIT-1: Broken unit tests -- RESOLVED

**Commit:** `8e61bf7` (test: fix broken terrain store tests and add multi-tag coverage)

All issues identified in code-review-185 CRIT-1 are resolved:

1. **setTerrain signature fix:** All calls updated to `(x, y, type, flags?, elevation?, note?)`. Line 89: `store.setTerrain(3, 3, 'elevated', undefined, 5)` -- `undefined` for flags, `5` for elevation. Line 99: `store.setTerrain(3, 3, 'hazard', undefined, 0, 'Lava pit')` -- correct parameter positioning.
2. **paintMode initial value:** Line 17: `expect(store.paintMode).toBe('water')` -- updated from `'difficult'`.
3. **Water cost expectations:** Line 48: `expect(TERRAIN_COSTS.water).toBe(1)` -- updated from `2`. Line 280: `expect(store.getMovementCost(0, 0, true)).toBe(1)` -- water+swim now returns 1.
4. **New test coverage added:**
   - `getFlagsAt` getter (lines 170-183): 2 tests (empty cell default, set cell flags)
   - `isRoughAt` getter (lines 186-207): 3 tests (empty, with rough, without rough)
   - `isSlowAt` getter (lines 210-231): 3 tests (empty, with slow, without slow)
   - `setPaintFlags` action (lines 383-401): 2 tests (set flags, immutability check)
   - `togglePaintFlag` action (lines 403-436): 3 tests (toggle rough, toggle slow, independence)
   - `migrateLegacyCell` function (lines 725-810): 7 tests (all 4 migration branches + pass-through + default flags + field preservation)
   - Slow flag cost doubling (lines 241-245): normal + slow = cost 2
   - Rough flag no-cost (lines 248-253): normal + rough = cost 1
   - Legacy conversion via setTerrain (lines 123-151): 4 tests (difficult->slow, rough->rough, flag merging)
   - Water + slow flag (lines 283-288): water + slow = cost 2 for swimmers
   - paintFlags initial state (lines 21-25): default `{ rough: false, slow: false }`
   - `DEFAULT_FLAGS` and `FLAG_COLORS` exports (lines 28-41): verified shape and existence

Total: ~47 new test cases added covering all new multi-tag functionality.

### HIGH-1: No server-side flags validation -- RESOLVED

**Commit:** `a3ec3e0` (fix: add Zod validation for flags in terrain PUT endpoint)

The PUT endpoint at `app/server/api/encounters/[id]/terrain.put.ts` now uses Zod schemas:
- `terrainFlagsSchema` (line 8-11): `z.object({ rough: z.boolean(), slow: z.boolean() }).strict()` -- the `.strict()` call rejects extra properties (addresses the `extraField` injection concern from code-review-185).
- `terrainCellSchema` (line 14-23): validates position, type (enum of valid types), elevation, optional note, and optional flags.
- `terrainStateBodySchema` (line 26-29): validates the top-level body.
- Validation runs before any DB operation (line 37-43), returning 400 with descriptive error messages on failure.

This addresses all attack vectors from code-review-185: wrong types (`"yes"` instead of boolean), extra properties, and explicit `null`. The `.strict()` on flags strips unknown fields. `z.boolean()` rejects non-booleans. `z.object().optional()` correctly handles both absent flags and `undefined`.

### HIGH-2: Legacy types in setTerrain -- RESOLVED

**Commit:** `f10cad0` (fix: add runtime legacy type conversion in setTerrain)

The `setTerrain` action (terrain.ts:235-260) now includes runtime conversion:
```typescript
const resolvedType: TerrainType = (type === 'difficult' || type === 'rough') ? 'normal' : type
const baseFlags = flags ?? { ...DEFAULT_FLAGS }
const cellFlags: TerrainFlags = type === 'difficult'
  ? { ...baseFlags, slow: true }
  : type === 'rough'
    ? { ...baseFlags, rough: true }
    : baseFlags
```

This mirrors `migrateLegacyCell` logic directly in the setter, preventing the inconsistent state where `setTerrain(x, y, 'difficult')` would create a cell with `type: 'difficult'` and `flags: { rough: false, slow: false }`. Now it creates `type: 'normal'` with `flags: { ..., slow: true }`.

The flag merging is also correct: if someone calls `setTerrain(x, y, 'difficult', { rough: true, slow: false })`, it produces `{ rough: true, slow: true }` -- the `slow: true` from the legacy conversion is merged with the caller's explicit `rough: true`.

### MED-1: Emoji icons in TerrainPainter -- RESOLVED

**Commit:** `3fd2f35` (fix: replace emoji icons with Phosphor Icons in TerrainPainter)

All 6 base terrain type buttons now use Phosphor Icon components:
- Normal: `PhCircle`
- Blocking: `PhProhibit`
- Water: `PhWaves`
- Earth: `PhShovel`
- Hazard: `PhWarning`
- Elevated: `PhArrowFatLineUp`

The template uses `<component :is="terrain.icon" :size="16" />` for dynamic rendering. The flag buttons already used `<PhCrosshairSimple>` and `<PhHourglass>`. This is now consistent per project guidelines (CLAUDE.md: "Use Phosphor Icons instead of emojis for UI elements").

### MED-2: let mutation in getMovementCost -- RESOLVED

**Commit:** `d271ec2` (fix: replace let mutation with immutable pattern in getMovementCost)

The `let cost = TERRAIN_COSTS[terrain]; if (flags.slow) { cost = cost * 2; }` pattern has been replaced with:
```typescript
const baseCost = TERRAIN_COSTS[terrain]
return flags.slow ? baseCost * 2 : baseCost
```

Immutable `const` + ternary expression. No mutation. Matches project coding standards.

## Compliance with Prior Rules Review

The task references "rules-review-162 APPROVED" as the prior rules review. No review with that exact ID exists in the active reviews directory. The closest terrain-domain rules reviews are:
- **rules-review-164** (ptu-rule-103, mixed-terrain speed averaging): CHANGES_REQUIRED with M-001 (Set number dedup) and M-002 (undefined speed variable). These issues are in `combatantCapabilities.ts` and `useGridRendering.ts` respectively -- separate files from the ptu-rule-101 fix cycle and unaffected by these commits.

The prior rules review identified two deferred issues as follow-up tickets:
- **ptu-rule-108** (rough terrain accuracy gap): Ticket exists at `artifacts/tickets/open/ptu-rule/ptu-rule-108.md`. The rough terrain accuracy penalty is correctly modeled in the data layer (`isRoughAt` getter, `TerrainFlags.rough`), but the integration with actual accuracy rolls is a separate ticket. This fix cycle did not claim to address ptu-rule-108.
- **ptu-rule-112** (Naturewalk gap): Ticket exists at `artifacts/tickets/open/ptu-rule/ptu-rule-112.md`. The `naturewalk` field exists on the Pokemon capabilities interface (`app/types/character.ts:42`) but is not yet integrated into the terrain movement system. This fix cycle did not claim to address ptu-rule-112.

Both deferred tickets remain open and are unaffected by this fix cycle. No regression.

## Decree Compliance

- **decree-008** (water cost = 1): `TERRAIN_COSTS.water = 1`. Comment cites decree. Tests verify `TERRAIN_COSTS.water === 1` and `getMovementCost(water, swim) === 1`. **COMPLIANT.**
- **decree-010** (multi-tag terrain): `TerrainFlags { rough, slow }` on `TerrainCell`. Rough affects accuracy only (no movement cost). Slow doubles movement cost. Flags are independent and combinable. **COMPLIANT.**
- **decree-011** (path-based speed averaging): Not directly modified by this fix cycle. The averaging system in `useGridMovement.ts` (`getAveragedSpeedForPath`, `buildSpeedAveragingFn`) continues to work correctly with the updated terrain costs. Water at cost 1 feeds into the averaging correctly. **COMPLIANT (unchanged).**

## Rulings

1. **Water is basic terrain at cost 1.** PTU p.231 classifies "Underwater" under "Basic Terrain Type." The movement constraint is Swim capability, not doubled cost. Per decree-008, the GM overlays Slow when rough currents are intended. The implementation is faithful.

2. **Slow Terrain doubles movement cost multiplicatively.** PTU p.231: "treat every square meter as two square meters instead." The formula `baseCost * 2` is correct. For water + slow: `1 * 2 = 2`. For normal + slow: `1 * 2 = 2`. For hazard + slow: `1 * 2 = 2`.

3. **Rough Terrain has zero movement cost impact.** PTU p.231 only specifies "-2 penalty to Accuracy Rolls" for Rough Terrain. No movement cost modifier. The implementation correctly excludes rough from cost calculation.

4. **Legacy type conversion preserves PTU semantics.** Converting `'difficult'` to `'normal' + slow` preserves the 2x movement cost. Converting `'rough'` to `'normal' + rough` preserves the -2 accuracy penalty. Both conversions are semantically faithful to what these legacy types represented.

5. **Runtime setter conversion is the correct fix for HIGH-2.** The alternative (only converting on import) left a gap where programmatic callers of `setTerrain` could create inconsistent state. The runtime conversion in `setTerrain` closes this gap without requiring TypeScript union narrowing (which would be a breaking change to the shared `TerrainType` type used across the serialization boundary).

## Summary

All 5 issues from code-review-185 have been properly resolved. The fix cycle commits are mechanically correct and faithful to PTU terrain rules. Water terrain costs 1 per decree-008. Slow terrain doubles movement cost per PTU p.231. Rough terrain affects accuracy only per PTU p.231. The multi-tag system per decree-010 allows cells to be simultaneously Rough and Slow. Legacy type migration is consistent between import and runtime setter. Server-side Zod validation prevents invalid flag data. Tests comprehensively cover all new functionality.

No new PTU rule issues were found. The deferred tickets (ptu-rule-108 rough accuracy integration, ptu-rule-112 Naturewalk) remain open and are unaffected by this fix cycle.

## Verdict

**APPROVED**

All mechanics are correctly implemented per PTU 1.05 rules and active decrees. All code-review-185 issues are resolved. No new issues found. Ready for merge.

## Required Changes

None.
