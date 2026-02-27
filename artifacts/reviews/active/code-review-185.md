---
review_id: code-review-185
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-001+ptu-rule-101
domain: vtt-grid
commits_reviewed:
  - 75fb072
  - 2279851
  - 0f00d30
  - b56dba8
  - 9e3d08a
  - 1e8837d
  - 96fad60
  - 0cb762d
  - 1aa6cc4
  - 0ca001a
files_reviewed:
  - app/types/spatial.ts
  - app/stores/terrain.ts
  - app/composables/useTerrainPersistence.ts
  - app/composables/useGridRendering.ts
  - app/composables/useIsometricOverlays.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useGridMovement.ts
  - app/composables/useElevation.ts
  - app/components/vtt/TerrainPainter.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/server/api/encounters/[id]/terrain.put.ts
  - app/server/api/encounters/[id]/terrain.get.ts
  - app/tests/unit/stores/terrain.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-02-26T21:45:00Z
follows_up: null
---

## Review Scope

Reviewed 10 commits from session 42 slave-4 implementing:
1. **refactoring-001**: Multi-tag terrain system (TerrainFlags interface, store refactoring, persistence, rendering, UI)
2. **ptu-rule-101**: Water terrain cost changed from 2 to 1 per decree-008

The refactoring changes the terrain data model from single-type-per-cell to a base terrain type + independent movement modifier flags (rough, slow). This is a significant structural change touching types, store, persistence, rendering (both 2D and isometric), the terrain painter UI, the server PUT endpoint, and the elevation composable.

Decree compliance verified:
- **decree-008**: Water cost is 1 in `TERRAIN_COSTS`. Confirmed.
- **decree-010**: Multi-tag `TerrainFlags { rough, slow }` on `TerrainCell`. Confirmed. Rough affects accuracy only (no movement cost), slow doubles movement cost. Confirmed in `getMovementCost`.

## Issues

### CRITICAL-1: Unit tests not updated -- broken `setTerrain` signature and stale expectations

**File:** `app/tests/unit/stores/terrain.test.ts`

The `setTerrain` method signature changed from `(x, y, type, elevation?, note?)` to `(x, y, type, flags?, elevation?, note?)`. The unit tests were not updated to match.

**Broken tests (will not compile or will produce wrong behavior):**

1. **Line 68:** `store.setTerrain(3, 3, 'elevated', 5)` -- the `5` is now interpreted as the `flags` parameter (type `TerrainFlags | undefined`), not `elevation`. This will set flags to `5` (truthy but not a valid TerrainFlags object) and elevation to the default `0`. The subsequent assertion `expect(cell?.elevation).toBe(5)` will fail.

2. **Line 78:** `store.setTerrain(3, 3, 'hazard', 0, 'Lava pit')` -- the `0` is now interpreted as `flags` (falsy, so `?? DEFAULT_FLAGS` will kick in), and `'Lava pit'` is now interpreted as `elevation` (a string where a number is expected). The test assertion `expect(cell?.note).toBe('Lava pit')` will fail because the note is now `undefined`.

3. **Line 395:** `store.setTerrain(5, 5, 'difficult', 0, 'test')` -- same pattern as above; `0` goes to flags, `'test'` goes to elevation.

**Stale value expectations:**
4. **Line 18:** `expect(store.paintMode).toBe('difficult')` -- initial paintMode changed from `'difficult'` to `'water'`. This test fails.
5. **Line 27:** `expect(TERRAIN_COSTS.water).toBe(2)` -- water cost changed to 1 per decree-008. This test fails.
6. **Line 129-133:** `expect(store.getMovementCost(0, 0, true)).toBe(2)` -- water+swim now returns 1, not 2. Fails.
7. **Line 368:** `expect(store.paintMode).toBe('difficult')` -- same as line 18.

**Additionally missing test coverage for new functionality:**
- No tests for `getFlagsAt`, `isRoughAt`, `isSlowAt` getters
- No tests for `setPaintFlags`, `togglePaintFlag` actions
- No tests for `migrateLegacyCell` function (critical for backward compatibility)
- No tests for the slow flag doubling movement cost in `getMovementCost`
- No tests for `DEFAULT_FLAGS` or `FLAG_COLORS` exports

This is CRITICAL because the existing tests will fail when run, meaning the codebase is in a broken-tests state. The signature change is a correctness issue that could also affect any other callers not yet discovered.

### HIGH-1: No server-side validation of `flags` in PUT endpoint

**File:** `app/server/api/encounters/[id]/terrain.put.ts`

The PUT endpoint accepts `flags?: TerrainFlags` on each cell but performs zero validation of the field. A malicious or buggy client could send:
- `flags: { rough: "yes", slow: 42 }` (wrong types)
- `flags: { rough: true, slow: true, extraField: "injected" }` (extra properties)
- `flags: null` (explicit null instead of omitted)

These would be serialized to JSON and stored in the DB. When loaded back, the `migrateLegacyCell` function checks `if (cell.flags)` -- an explicit `null` would pass this check in some runtime contexts, and extra properties would persist silently.

**Required fix:** Add validation to the PUT endpoint body. At minimum, validate that if `flags` is present, it has exactly `{ rough: boolean, slow: boolean }`. The project pattern calls for Zod validation per `coding-style.md`.

### HIGH-2: Legacy terrain types ('difficult', 'rough') still in TerrainType union and TERRAIN_COSTS, creating confusion

**File:** `app/types/spatial.ts`, `app/stores/terrain.ts`

The legacy types `'difficult'` and `'rough'` are marked with `// LEGACY` comments in the `TerrainType` union and `TERRAIN_COSTS` map, but they are still fully valid types that any code can set. There is no TypeScript mechanism preventing new code from using them. The `migrateLegacyCell` function converts them on import, but nothing prevents the store's `setTerrain` action from being called with `type: 'difficult'` -- which would create a cell that skips migration (migration only runs on import).

Concretely: if any code calls `terrainStore.setTerrain(x, y, 'difficult')`, the cell will have `type: 'difficult'` and `flags: { rough: false, slow: false }`. The `getMovementCost` getter will look up `TERRAIN_COSTS['difficult'] = 2`, which is correct for legacy data but confusing for the multi-tag model where cost should come from the `slow` flag. Meanwhile, the rendering code in `drawTerrain` will draw the legacy brown color for 'difficult' but won't draw any slow flag overlay (because `flags.slow` is false).

The TerrainPainter UI correctly excludes 'difficult' and 'rough' from the base type selector, so this is not user-facing yet. But it is a latent bug: any programmatic caller or test using these types will get inconsistent behavior.

**Required fix:** Either:
(a) Deprecate `'difficult'` and `'rough'` from the `TerrainType` union and add a runtime check in `setTerrain` that converts them to `'normal' + flags` (same as migration), OR
(b) Add a comment in `setTerrain` documenting that these types should never be set directly, and add a migration step inside `setTerrain` itself.

Option (a) is cleaner. File a ticket if not fixing now.

### MEDIUM-1: TerrainPainter uses emoji icons for terrain buttons instead of Phosphor Icons

**File:** `app/components/vtt/TerrainPainter.vue` (lines 212-249)

The terrain type buttons use emoji characters (`'○'`, `'■'`, `'≈'`, `'⛏'`, `'⚠'`, `'△'`). Per project guidelines (CLAUDE.md: "Use Phosphor Icons instead of emojis for UI elements"), these should use Phosphor Icon components. The flag buttons correctly use `<PhCrosshairSimple>` and `<PhHourglass>`, creating an inconsistency within the same component.

**Required fix:** Replace emoji icons with Phosphor Icon components for the base terrain type buttons.

### MEDIUM-2: `getMovementCost` uses `let` mutation for slow flag cost doubling

**File:** `app/stores/terrain.ts` (lines 158-166)

```typescript
let cost = TERRAIN_COSTS[terrain]
if (flags.slow) {
  cost = cost * 2
}
return cost
```

Per `coding-style.md`, the project enforces immutability patterns. This uses `let` and mutation. Should be:

```typescript
const baseCost = TERRAIN_COSTS[terrain]
return flags.slow ? baseCost * 2 : baseCost
```

This is a minor readability/consistency issue but violates the stated coding standard.

## What Looks Good

1. **TerrainFlags interface design** is clean and extensible. Two boolean flags (`rough`, `slow`) with clear PTU rule references. Easy to add future flags (e.g., `hazardous`, `sticky`).

2. **migrateLegacyCell function** is well-structured with proper handling of all edge cases: cells with flags already present, cells with legacy types + flags, cells with legacy types and no flags, and non-legacy types. Immutable return (creates new objects, never mutates input).

3. **Backward compatibility chain** is solid: GET endpoint returns raw DB data -> `importState` calls `migrateLegacyCell` on each cell -> legacy `'difficult'`/`'rough'` types become `'normal'` + flags. Existing saved encounters will load correctly.

4. **Rendering separation** between 2D (`useGridRendering.ts`) and isometric (`useIsometricOverlays.ts`) is well-maintained. Both render base terrain + flag overlays consistently with distinct visual indicators (slow = dots, rough = jagged line in 2D; slow/rough = filled diamond overlay in isometric).

5. **Decree compliance** is thorough. Water cost = 1 per decree-008. Multi-tag system per decree-010. Comments cite decree numbers throughout. `getMovementCost` correctly aggregates base terrain cost + slow flag multiplier. `rough` correctly has no movement cost impact (accuracy only).

6. **Elevation preservation** in `useElevation.ts` correctly reads existing `cell?.flags` and passes them through to `setTerrain`, preventing terrain flag loss when adjusting elevation. This was the fix in commit `1aa6cc4`.

7. **TerrainPainter UI** cleanly separates base terrain selection from flag toggles, with a live preview showing "Water + Rough + Slow" style descriptions. Legend includes both base types and flags.

8. **Commit granularity** is excellent -- 10 commits each doing one logical thing: types, store, persistence, endpoint, 2D rendering, isometric rendering, UI, docs, elevation fix, ticket docs.

9. **File sizes** are all within bounds: terrain.ts (376), useGridMovement.ts (458), useGridRendering.ts (564), useIsometricOverlays.ts (523), TerrainPainter.vue (586), useIsometricRendering.ts (783 -- under 800 limit).

## Verdict

**CHANGES_REQUIRED**

The broken unit tests (CRITICAL-1) must be fixed before merge. Tests calling `setTerrain` with the old signature will fail or produce corrupt data. The stale expectations (water cost = 2, paintMode = 'difficult') will also fail. Additionally, new functionality (flags getters, migration function, slow cost doubling) has zero test coverage.

## Required Changes

1. **CRITICAL-1 (must fix):** Update `app/tests/unit/stores/terrain.test.ts`:
   - Fix all `setTerrain` calls to use new signature `(x, y, type, flags?, elevation?, note?)`
   - Update `paintMode` initial value expectations from `'difficult'` to `'water'`
   - Update water cost expectation from `2` to `1`
   - Update water+swim cost expectation from `2` to `1`
   - Add tests for `getFlagsAt`, `isRoughAt`, `isSlowAt` getters
   - Add tests for `setPaintFlags`, `togglePaintFlag` actions
   - Add tests for `migrateLegacyCell` function (all 4 branches: legacy with flags, legacy without flags, non-legacy with flags, non-legacy without flags)
   - Add tests for slow flag doubling movement cost
   - Add tests for `paintFlags` initial state (`{ rough: false, slow: false }`)

2. **HIGH-1 (must fix):** Add server-side validation for `flags` field in `app/server/api/encounters/[id]/terrain.put.ts`. Validate each cell's flags as `{ rough: boolean, slow: boolean }` if present. Strip unknown properties.

3. **HIGH-2 (file ticket):** File a ticket to prevent direct use of legacy terrain types `'difficult'` and `'rough'` in `setTerrain`. Either add runtime conversion in the setter or narrow the TypeScript union for non-import contexts. This can be a follow-up ticket but should not be deferred indefinitely.

4. **MEDIUM-1 (fix now):** Replace emoji icons with Phosphor Icons in `TerrainPainter.vue` base terrain type buttons, per project guidelines.

5. **MEDIUM-2 (fix now):** Replace `let cost` mutation in `getMovementCost` with immutable ternary pattern.
