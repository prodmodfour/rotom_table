---
review_id: code-review-190
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-101
domain: vtt-grid
commits_reviewed:
  - d271ec2
  - f10cad0
  - 3fd2f35
  - a3ec3e0
  - 8e61bf7
files_reviewed:
  - app/stores/terrain.ts
  - app/server/api/encounters/[id]/terrain.put.ts
  - app/components/vtt/TerrainPainter.vue
  - app/tests/unit/stores/terrain.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-27T12:00:00Z
follows_up: code-review-185
---

## Review Scope

Re-review of 5 fix cycle commits (d271ec2..8e61bf7) addressing all 5 issues from code-review-185 (CHANGES_REQUIRED). The prior review identified 1 CRITICAL, 2 HIGH, and 2 MEDIUM issues. This re-review verifies each fix and checks for new regressions.

Decree compliance verified:
- **decree-008**: Water cost is 1 in `TERRAIN_COSTS.water`. Confirmed at `stores/terrain.ts:27`.
- **decree-010**: Multi-tag `TerrainFlags { rough, slow }` on `TerrainCell`. Confirmed. `rough` affects accuracy only (no movement cost), `slow` doubles movement cost. Confirmed in `getMovementCost` at line 162.
- **decree-011**: Speed averaging references in `useGridMovement.ts` are untouched by this fix cycle. Confirmed.

Prior rules-review-162 was APPROVED with two medium observations (M1 rough terrain accuracy gap -> ptu-rule-108, M2 Naturewalk gap -> ptu-rule-112). Both tickets exist in `artifacts/tickets/open/ptu-rule/`. No action needed from this fix cycle.

## Issue Resolution Verification

### CRITICAL-1 (was: broken unit tests) -> RESOLVED

**Commit:** 8e61bf7 — `test: fix broken terrain store tests and add multi-tag coverage`

Verified all specific issues identified in code-review-185:

1. **Signature fix**: `setTerrain(3, 3, 'elevated', 5)` changed to `setTerrain(3, 3, 'elevated', undefined, 5)` (line 89). Correct — `undefined` for flags, `5` for elevation.

2. **Signature fix**: `setTerrain(3, 3, 'hazard', 0, 'Lava pit')` changed to `setTerrain(3, 3, 'hazard', undefined, 0, 'Lava pit')` (line 99). Correct.

3. **Legacy test subject replacement**: Tests that were using `'difficult'` as a generic terrain type (e.g., brush painting, erase, fill, reset) now use `'blocking'`, `'water'`, or `'hazard'` instead. This is correct — tests for legacy conversion behavior are in dedicated test cases.

4. **Stale expectations updated**:
   - `paintMode` initial value: `'difficult'` -> `'water'` (line 17). Matches store state at `terrain.ts:121`.
   - `TERRAIN_COSTS.water`: `2` -> `1` (line 48). Matches `terrain.ts:27`.
   - Water+swim cost: `2` -> `1` (line 280). Correct per decree-008.
   - `paintMode` after reset: `'difficult'` -> `'water'` (line 599). Matches reset action at `terrain.ts:347`.

5. **New coverage added** (all verified by reading test file):
   - `getFlagsAt` getter: empty cell (default flags), set cell (lines 170-183)
   - `isRoughAt` getter: empty, with rough, without rough (lines 186-208)
   - `isSlowAt` getter: empty, with slow, without slow (lines 210-232)
   - `setPaintFlags` action: set flags, immutability check (lines 383-401)
   - `togglePaintFlag` action: toggle each flag, independence check (lines 403-437)
   - `migrateLegacyCell` function: all 4 branches + preservation test (lines 725-810):
     - difficult without flags -> normal + slow
     - rough without flags -> normal + rough
     - difficult with flags -> normal + slow merged
     - rough with flags -> normal + rough merged
     - non-legacy with flags -> passthrough
     - non-legacy without flags -> default flags added
     - position/elevation/note preservation
   - Slow flag cost doubling: normal+slow=2, rough has no cost impact (lines 241-253)
   - Water+slow=2, water default=1 (lines 276-288)
   - `DEFAULT_FLAGS` and `FLAG_COLORS` constants (lines 28-41)
   - `paintFlags` initial state (lines 21-25)
   - Legacy conversion in `setTerrain`: difficult->normal+slow, rough->normal+rough, merge with provided flags (lines 123-151)
   - `applyTool` with paint flags (lines 467-477)
   - `fillRect` with flags (lines 528-535)
   - Export flags in state (lines 637-646)
   - Import migration for legacy types (lines 664-703)
   - Reset includes paintFlags (lines 587-603)

This is thorough coverage. All 4 branches of `migrateLegacyCell` are tested, the signature migration is complete, and the stale expectations are updated. RESOLVED.

### HIGH-1 (was: no server-side validation of flags) -> RESOLVED

**Commit:** a3ec3e0 — `fix: add Zod validation for flags in terrain PUT endpoint`

Verified at `app/server/api/encounters/[id]/terrain.put.ts`:

- Replaced `interface`-based typing with Zod schema validation (lines 4-30).
- `terrainFlagsSchema` uses `.strict()` (line 11) — rejects extra properties. Correct.
- `terrainCellSchema` validates position (x, y numbers, optional z), type (enum of valid types), elevation (number), optional note (string), optional flags (strict boolean pair). Correct.
- `terrainStateBodySchema` validates the request body with optional `enabled` boolean and optional `cells` array.
- `safeParse` on line 37 with proper 400 error response including issue messages (lines 38-43).
- The validated `body` (line 45) is used for all downstream logic.

This comprehensively addresses the issue. Invalid types, extra properties, null flags, and wrong-typed flag values are all rejected. RESOLVED.

### HIGH-2 (was: legacy types in setTerrain) -> RESOLVED

**Commit:** f10cad0 — `fix: add runtime legacy type conversion in setTerrain`

Verified at `app/stores/terrain.ts:235-259`:

- Lines 240-246: Runtime conversion of legacy types. If `type` is `'difficult'` or `'rough'`, `resolvedType` becomes `'normal'`. The flags are merged: `difficult` sets `slow: true` on base flags, `rough` sets `rough: true` on base flags. This uses `{ ...baseFlags, slow: true }` which correctly merges provided flags with the legacy conversion.
- Line 248: Uses `resolvedType` (not `type`) for the "remove if fully default" check.
- Line 254: Uses `resolvedType` in the stored cell object.

The approach chosen was option (b) from code-review-185 — runtime conversion in the setter itself, matching `migrateLegacyCell` behavior. This is the cleaner approach and prevents the latent bug identified in the original review. RESOLVED.

### MEDIUM-1 (was: emoji icons in TerrainPainter) -> RESOLVED

**Commit:** 3fd2f35 — `fix: replace emoji icons with Phosphor Icons in TerrainPainter`

Verified at `app/components/vtt/TerrainPainter.vue`:

- Lines 187-196: Import block now includes `PhCircle`, `PhProhibit`, `PhWaves`, `PhShovel`, `PhWarning`, `PhArrowFatLineUp` alongside existing `PhCrosshairSimple` and `PhHourglass`.
- Lines 220-258: Each `baseTerrainTypes` entry now uses a Phosphor Icon component reference instead of an emoji string.
- Line 29: Template renders the icon via `<component :is="terrain.icon" :size="16" />`.
- Icon choices are sensible: Circle for normal, Prohibit for blocking, Waves for water, Shovel for earth, Warning for hazard, ArrowFatLineUp for elevated.
- Consistent with flag buttons which already used Phosphor Icons.

RESOLVED.

### MEDIUM-2 (was: let mutation in getMovementCost) -> RESOLVED

**Commit:** d271ec2 — `fix: replace let mutation with immutable pattern in getMovementCost`

Verified at `app/stores/terrain.ts:159-162`:

```typescript
const baseCost = TERRAIN_COSTS[terrain]
return flags.slow ? baseCost * 2 : baseCost
```

Clean ternary replacement. No `let`, no mutation. Matches the exact fix suggested in code-review-185. RESOLVED.

## New Issues

### MEDIUM-1: Test file at 811 lines, exceeds 800-line max

**File:** `app/tests/unit/stores/terrain.test.ts` (811 lines)

The test file is 11 lines over the 800-line project maximum. This is marginal and the file is well-organized with clear `describe` blocks. The excess comes from the comprehensive coverage additions required by CRITICAL-1, which was the right trade-off. However, the guideline applies to all files.

**Recommended action:** File a ticket for a future refactoring pass that splits the test file into two files (e.g., `terrain.test.ts` for store operations + `terrain-migration.test.ts` for `migrateLegacyCell` and legacy conversion). The `migrateLegacyCell` tests (lines 725-810, ~86 lines) are a natural extraction point as they test a standalone exported function.

This is not blocking because: (a) it is 11 lines over, (b) the file is well-structured, (c) splitting now would create a churn commit that is not part of the fix scope.

## What Looks Good

1. **Fix granularity is excellent.** Five commits, each addressing exactly one issue from code-review-185, in a logical order (MED-2 -> HIGH-2 -> MED-1 -> HIGH-1 -> CRIT-1). The test fix is last because it depends on the store changes being stable.

2. **Legacy type conversion in setTerrain** (HIGH-2 fix) is well-designed. The conversion logic mirrors `migrateLegacyCell` behavior, correctly merges provided flags with legacy-implied flags, and prevents the inconsistent state described in the original review. The spread-based immutable approach (`{ ...baseFlags, slow: true }`) is clean.

3. **Zod validation in PUT endpoint** (HIGH-1 fix) is comprehensive. The `.strict()` on the flags schema prevents extra property injection. The `safeParse` pattern with proper error reporting follows project patterns. The schema includes the `z` coordinate as optional on position, which is forward-thinking for isometric support.

4. **Test coverage is thorough and well-organized.** The 399 new lines of tests cover all the gaps identified in CRITICAL-1: flag getters, paint flag actions, legacy conversion in setTerrain, legacy migration function (all branches), slow flag cost doubling, import migration, export flags, and reset state. The tests are readable with clear intent in each test name.

5. **Immutable patterns consistently applied.** The `getMovementCost` fix (MED-2) and `setTerrain` legacy conversion (HIGH-2) both use `const` + spread/ternary rather than `let` mutation. `setPaintFlags` uses `{ ...flags }` to prevent external mutation.

6. **Decree compliance remains intact.** Water cost = 1 per decree-008. Multi-tag flags per decree-010. Speed averaging untouched per decree-011. All comments cite decree numbers.

7. **File sizes within bounds:** terrain.ts (381), terrain.put.ts (106), TerrainPainter.vue (595). The test file is marginally over (811) — addressed as MEDIUM-1 above.

## Verdict

**APPROVED**

All 5 issues from code-review-185 are properly resolved. The fixes are clean, well-scoped, and maintain decree compliance. The one new medium issue (test file 11 lines over the 800-line limit) is not blocking — it should be addressed in a future refactoring pass.

Rules-review-162 (APPROVED) compliance confirmed: M1 (rough terrain accuracy) tracked as ptu-rule-108, M2 (Naturewalk) tracked as ptu-rule-112. Both tickets exist in the open queue. No new rules concerns from the fix cycle.
