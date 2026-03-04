---
review_id: code-review-193
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-103
domain: vtt
commits_reviewed:
  - 1b4cbe4
  - 4ef0b08
  - bbb2590
  - aac53fb
  - c69a877
files_reviewed:
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridRendering.ts
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T08:45:00Z
follows_up: code-review-187
---

## Review Scope

Re-review of ptu-rule-103 fix cycle (4 commits fixing code-review-187 issues + 1 original implementation commit for context). Verified each of the 4 issues (2 CRITICAL, 2 MEDIUM) from code-review-187 is correctly resolved with no regressions introduced. Checked decree compliance against decree-011 (speed averaging), decree-008 (water cost 1), decree-010 (multi-tag terrain).

## Issue Resolution Verification

### CRIT-1 (code-review-187 C1): Undefined `speed` variable in `drawExternalMovementPreview`

**Commit:** 4ef0b08
**File:** `app/composables/useGridRendering.ts`, lines 534-578

**Verified fixed.** The developer declared `let displaySpeed: number` at line 535 (before the `if/else` branch), sets it in both the averaging branch (line 551: `displaySpeed = options.getSpeed(token.combatantId)`) and the non-averaging branch (line 553: `displaySpeed = options.getSpeed(token.combatantId)`). The speed badge call at line 578 now uses `drawSpeedBadge(ctx, badgeX, badgeY, displaySpeed)`. This exactly mirrors the pattern already established in `drawMovementRange` (lines 391-441). No undefined variable reference remains.

### CRIT-2 (code-review-187 C2): `Set<number>` silently drops duplicate speed values

**Commit:** 1b4cbe4
**File:** `app/utils/combatantCapabilities.ts`, lines 133-169

**Verified fixed.** `capabilitySpeeds` changed from `new Set<number>()` to `const capabilitySpeeds: number[] = []`. All operations updated:
- `.add(speed)` replaced with `.push(speed)` (line 158)
- `.size` replaced with `.length` (lines 163, 164)
- Removed intermediate `Array.from(capabilitySpeeds)` conversions since it is already an array (lines 164, 168-169)

The comment at lines 133-135 correctly explains why an array is needed: "capabilitySpeeds is an array (not a Set) to preserve duplicate speed values from distinct capabilities (e.g., Overland 6 + Swim 6 + Burrow 3 must average as (6+6+3)/3=5, not (6+3)/2=4)."

The `seenCapabilities` `Set<string>` is correctly preserved -- it prevents the same capability key (e.g., "overland") from being counted twice when multiple terrain types map to the same capability. The array only collects speed values from distinct capabilities, which is the correct behavior.

### MED-1 (code-review-187 M1): Duplicate capability access in `getMaxPossibleSpeed`

**Commit:** bbb2590
**File:** `app/composables/useGridMovement.ts`, lines 166-186

**Verified fixed.** The direct property access pattern:
```typescript
const pokemon = combatant.entity as Pokemon
speeds.push(pokemon.capabilities?.swim ?? 0)
```
was replaced with the canonical utilities:
```typescript
speeds.push(getSwimSpeed(combatant))
```
Same for burrow. The import at line 6 was updated to include `getSwimSpeed` and `getBurrowSpeed`. This eliminates the duplicate code path and ensures consistency if the utility functions are modified in the future.

### MED-2 (code-review-187 M2): Missing documentation for conservative approximation

**Commit:** aac53fb
**File:** `app/composables/usePathfinding.ts`, lines 411-421

**Verified fixed.** An 11-line JSDoc block was added to `getMovementRangeCellsWithAveraging` explaining the conservative approximation. The comment clearly describes: (1) what the limitation is (only stores cheapest-cost path per cell), (2) what could go wrong (higher-cost path with fewer terrain types might yield higher averaged speed), (3) why it is acceptable (conservative -- never shows unreachable cells; validated by A* in isValidMove; edge case requires specific terrain layouts). This is thorough documentation of a non-trivial algorithmic trade-off.

## Decree Compliance

- **decree-011**: Speed averaging implementation intact and correct. The CRIT-2 fix (Set to array) actually improves decree compliance -- the averaging formula now correctly handles the case where distinct capabilities share the same speed value, producing a more accurate average per PTU p.231.
- **decree-008**: Water terrain cost remains 1. The `getSpeedForTerrain` and `calculateAveragedSpeed` functions select swim speed for water terrain without applying any additional cost multiplier. Compliant.
- **decree-010**: Multi-tag terrain (rough/slow flags) is orthogonal to the speed averaging system and untouched by these fixes. Compliant.

## Regression Check

1. **`drawMovementRange`** (useGridRendering.ts:375-442): Already used `displaySpeed` pattern before the fix cycle. Not modified by fix commits. No regression.

2. **`drawExternalMovementPreview`** (useGridRendering.ts:516-613): Fix introduced `displaySpeed` following the exact same pattern as `drawMovementRange`. Both the averaging and non-averaging branches now set `displaySpeed` before it is used. The `rangeCells` variable is also correctly scoped in both branches.

3. **`isValidMove`** (useGridMovement.ts:460-544): Calls `getAveragedSpeedForPath` which calls `calculateAveragedSpeed`. The array fix flows through correctly. No change to `isValidMove` itself, so the terrain-aware A* pathfinding and occupancy checks are unaffected.

4. **`buildSpeedAveragingFn`** (useGridMovement.ts:276-285): Returns a lambda calling `calculateAveragedSpeed`. The array fix flows through correctly. Used by `getMovementRangeCellsWithAveraging` in the flood-fill. No regression.

5. **`getMaxPossibleSpeed`** (useGridMovement.ts:166-186): Now uses `getSwimSpeed`/`getBurrowSpeed`. Verified these utility functions (combatantCapabilities.ts:71-88) return the exact same value as the direct access they replaced (`pokemon.capabilities?.swim ?? 0` and `pokemon.capabilities?.burrow ?? 0`). No behavioral change.

6. **File sizes**: combatantCapabilities.ts (170), useGridRendering.ts (622), useGridMovement.ts (563), usePathfinding.ts (574). All well under the 800-line limit.

7. **Commit granularity**: 4 fix commits, each addressing exactly one issue from code-review-187. Clean and focused. A 5th commit (c69a877) is the original implementation commit for context; it was not modified.

## What Looks Good

1. **Precise surgical fixes**: Each commit addresses exactly one review issue with minimal, targeted changes. No unnecessary refactoring or scope creep.

2. **Comment quality**: The CRIT-2 fix includes an inline comment explaining why an array is used instead of a Set, with a concrete example. The MED-2 JSDoc is thorough and references the validation backstop in `isValidMove`.

3. **Pattern consistency**: The CRIT-1 fix in `drawExternalMovementPreview` exactly mirrors the already-correct `drawMovementRange` pattern, maintaining code consistency across the two rendering functions.

4. **Import hygiene**: The MED-1 fix properly added `getSwimSpeed` and `getBurrowSpeed` to the existing import statement on line 6 rather than adding new import lines.

## Verdict

**APPROVED** -- All 4 issues from code-review-187 are correctly resolved. No regressions introduced. Decree compliance verified. The fix cycle is clean, well-scoped, and ready to merge.
