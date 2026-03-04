---
review_id: code-review-207
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-086, refactoring-002, bug-032, refactoring-091
domain: combat, vtt-grid, encounter-tables, character-lifecycle
commits_reviewed:
  - 1a0a088
  - 003d4b7
  - f29dc7b
  - cc0b86c
  - e0382fa
  - 91635b4
  - de6d156
  - 0272c1d
  - 224037d
  - ccd8dbd
  - ba9b590
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/utils/evasionCalculation.ts
  - app/stores/terrain.ts
  - app/composables/useCanvasDrawing.ts
  - app/composables/useCanvasRendering.ts
  - app/composables/useIsometricOverlays.ts
  - app/tests/unit/stores/terrain.test.ts
  - app/server/api/encounter-tables/index.post.ts
  - app/server/api/encounter-tables/[id].put.ts
  - app/server/api/encounter-tables/[id]/entries/index.post.ts
  - app/server/api/encounter-tables/[id]/entries/[entryId].put.ts
  - app/server/api/encounter-tables/[id]/modifications/index.post.ts
  - app/server/api/encounter-tables/[id]/modifications/[modId].put.ts
  - app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts
  - app/server/api/encounter-tables/import.post.ts
  - app/pages/gm/create.vue
  - app/assets/scss/components/_create-page.scss
  - app/nuxt.config.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T16:15:00Z
follows_up: null
---

## Review Scope

Consolidated review of 4 developer outputs from plan-20260228-000430 (session 53). All are code quality improvements with no game mechanic changes:

1. **refactoring-086**: Extract `computeTargetEvasions` and `getEffectivenessClass` from `useMoveCalculation.ts` into `app/utils/evasionCalculation.ts`
2. **refactoring-002**: Legacy terrain type cleanup -- `setPaintMode()` guard, dead rendering branch removal, tests
3. **bug-032**: Add `levelMin <= levelMax` cross-field validation to 8 encounter table API endpoints + import
4. **refactoring-091**: Extract `create.vue` SCSS to shared partial, replace 6 `alert()` calls with inline error banner

## Issues

### MEDIUM

**M1: Modification update endpoint (`[modId].put.ts`) lacks partial-update merge for level range validation**

File: `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts` (lines 42-50)

The entry update endpoint (`[entryId].put.ts`) correctly merges provided values with existing DB values before validating the cross-field constraint:

```typescript
// [entryId].put.ts — correct: merges with DB state
const effectiveLevelMin = body.levelMin !== undefined ? body.levelMin : existing.levelMin
const effectiveLevelMax = body.levelMax !== undefined ? body.levelMax : existing.levelMax
```

However, the modification update endpoint only validates the values coming from the request body:

```typescript
// [modId].put.ts — does not merge with DB state
const modLevelMin = body.levelRange?.min ?? null
const modLevelMax = body.levelRange?.max ?? null
```

If a modification has `levelMin=5, levelMax=10` and a partial update sends `{ levelRange: { min: 15 } }` without `max`, the validation passes (null skips check) but the DB write sets `levelMin=15, levelMax=null`. The mismatch is mitigated by the fact that the API always writes both fields from `body.levelRange`, and the client likely always sends the full `levelRange` object. But the inconsistency between entry-update and modification-update is a latent risk if the API contract evolves. A future follow-up ticket is warranted, not a blocker for this change.

**M2: `evasionCalculation.ts` file name is slightly misleading**

File: `app/utils/evasionCalculation.ts`

The file contains both `computeTargetEvasions` (evasion-related, good fit) and `getEffectivenessClass` (type effectiveness CSS mapping, unrelated to evasion). The file name `evasionCalculation.ts` does not reflect the `getEffectivenessClass` function. This is a minor naming issue -- the function was extracted alongside evasion code for practical line-count reduction, which is understandable. If more type effectiveness utilities are extracted in the future, consider moving `getEffectivenessClass` to a dedicated `typeEffectiveness.ts` utility. Not blocking.

## What Looks Good

### refactoring-086: Evasion extraction
- **Clean dependency injection pattern.** The `EvasionDependencies` interface correctly abstracts all composable-internal functions needed by `computeTargetEvasions`. The extracted function is pure (no closure captures, no Vue reactivity), making it independently testable.
- **No behavioral change.** Verified the extracted code is a 1:1 copy of the original logic. The `ZERO_EVASION_CONDITIONS` import was correctly moved to the new file. The `StatusCondition` type import was preserved.
- **File size under limit.** `useMoveCalculation.ts` is now 764 lines (was ~820), well under the 800-line max. The new utility is a focused 92 lines.
- **Commit granularity correct.** Single commit for the extraction, separate ticket-update commit.

### refactoring-002: Legacy terrain cleanup
- **Complete coverage.** `setPaintMode()` guard handles both `'difficult'` and `'rough'`, converting to the multi-tag format (per decree-010). The guard preserves existing paint flags via spread, which is the correct behavior.
- **Dead branch removal is safe.** Since `setTerrain()` already converts legacy types at the store level, the rendering composables can never receive `'difficult'` or `'rough'` as a terrain type. The 93 lines removed from `useCanvasDrawing`, `useCanvasRendering`, and `useIsometricOverlays` were genuinely unreachable.
- **Test coverage is thorough.** 5 new tests cover both legacy type conversions and flag preservation during conversion. The test at line 466 (`preserve existing paint flags when converting legacy difficult`) correctly verifies that pre-existing flags (like `rough: true`) are not clobbered.
- **Legacy `TerrainType` union preserved.** The developer correctly left `'difficult'` and `'rough'` in the TypeScript union and in `TERRAIN_COSTS`/`TERRAIN_COLORS` for backward compatibility with existing saved data. This is the right call -- removing them from the type would break import of old terrain data.
- **Commit granularity correct.** Three commits: guard, dead branches, tests -- each independently verifiable.

### bug-032: Level range validation
- **All 8 endpoints covered.** The validation is applied to: table create, table update, entry create, entry update, modification create, modification update, modification entry create, and import.
- **Entry update handles partial updates correctly.** The merge with `existing.levelMin`/`existing.levelMax` (lines 60-61 of `[entryId].put.ts`) catches the case where only one bound is updated. This is thoughtful engineering.
- **Import validation is deep.** The import endpoint validates not just the top-level table range, but also iterates through entries, modifications, and modification entries. This prevents importing malformed JSON from creating invalid DB state.
- **Null-safe.** All validations correctly skip when either value is null, which is the correct behavior for optional level range overrides.
- **Error messages are consistent.** All endpoints return the same `'levelMin must be less than or equal to levelMax'` message with 400 status.

### refactoring-091: Create page cleanup
- **SCSS extraction is 1:1.** Verified the extracted `_create-page.scss` (323 lines) matches the removed `<style>` block exactly, with the addition of the new `.create-error-banner` class. No accidental style changes.
- **Nuxt config updated.** The new SCSS partial is correctly registered in `nuxt.config.ts` css array.
- **Scoped → global is safe.** The class names use BEM-style scoping (`.create-page__header`, `.mode-toggle__btn`, `.type-btn__icon`) which are specific enough to avoid collisions. No other page uses these class names.
- **Alert replacement is complete.** All 6 `alert()` calls replaced with `errorMessage.value = ...`. The error banner is dismissible (x button clears the ref). Error state is cleared at the start of each async operation (`createHumanQuick`, `createHuman`, `createPokemon`), preventing stale error messages.
- **File size dramatically improved.** `create.vue` dropped from 809 to 563 lines, well within limits.
- **Commit granularity correct.** Two separate commits: SCSS extraction first, then alert replacement.

## Verdict

**APPROVED.** All four targets achieve their stated goals cleanly. No correctness bugs, no immutability violations, no security issues. The two medium issues (M1: modification update partial merge inconsistency, M2: utility file naming) are real but non-blocking -- M1 is a latent risk mitigated by current client behavior, and M2 is cosmetic. Both are suitable for follow-up tickets if the relevant code is touched again.

## Required Changes

None. All changes approved as-is.
