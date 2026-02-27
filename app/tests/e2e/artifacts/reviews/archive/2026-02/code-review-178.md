---
review_id: code-review-178
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-068+ux-001+refactoring-061+refactoring-059+refactoring-077
domain: character, encounter-tables, vtt-grid
commits_reviewed:
  - bf93c9b
  - 94fc930
  - 1fedc34
  - f40ff30
  - e833494
  - b6e496e
  - 8da5d06
  - 499fbc2
  - ceacdd5
  - a52b4f5
  - 03b0055
  - 3d8ea23
  - 5c0c9cb
files_reviewed:
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/assets/scss/components/_create-form-shared.scss
  - app/nuxt.config.ts
  - app/components/create/ClassFeatureSection.vue
  - app/components/create/EdgeSelectionSection.vue
  - app/components/create/SkillBackgroundSection.vue
  - app/components/create/StatAllocationSection.vue
  - app/server/api/encounter-tables/[id].get.ts
  - app/server/api/encounter-tables/[id].put.ts
  - app/server/api/encounter-tables/index.get.ts
  - app/server/api/encounter-tables/[id]/modifications/[modId].get.ts
  - app/server/api/encounter-tables/[id]/modifications/[modId].put.ts
  - app/server/api/encounter-tables/[id]/modifications/index.post.ts
  - app/types/vtt.ts
  - app/types/index.ts
  - app/composables/useRangeParser.ts
  - app/composables/usePathfinding.ts
  - app/composables/useGridMovement.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-26T08:15:00Z
follows_up: (none -- first review)
---

## Review Scope

Batch review of 4 P4 refactoring tickets implemented across 13 commits:

1. **refactoring-068 + ux-001** (EXT-FRAGILE, P4): Replaced DOM manipulation with reactive refs in HumanEquipmentTab.vue; kept equipment catalog modal open after equip with success toast.
2. **refactoring-061** (EXT-DUPLICATE, P4): Extracted duplicated CSS blocks from 4 character creation components into a shared SCSS partial.
3. **refactoring-059** (EXT-DEAD-CODE, P4): Removed dead `densityMultiplier` from 6 encounter-tables API files.
4. **refactoring-077** (EXT-COSMETIC, P4): Moved VTT pathfinding type aliases to shared `types/vtt.ts` to break circular dependency.

**Decrees checked:** No active decrees directory exists. No decree-need situations discovered during this review.

## Issues

### MEDIUM

**M1: Ticket statuses left as `in-progress` instead of `resolved`** (refactoring-068, ux-001, refactoring-059, refactoring-077)

All four ticket markdown files still show `status: in-progress` in their frontmatter despite having resolution logs with commit hashes. The ticket status update commits (1fedc34, 5c0c9cb) only updated the resolution log sections but did not change the `status:` field to `resolved`. This creates ambiguity for the pipeline about whether these tickets are actually done.

**Files:** `app/tests/e2e/artifacts/refactoring/refactoring-068.md`, `app/tests/e2e/artifacts/tickets/ux/ux-001.md`, `app/tests/e2e/artifacts/refactoring/refactoring-059.md`, `app/tests/e2e/artifacts/refactoring/refactoring-077.md`, `app/tests/e2e/artifacts/refactoring/refactoring-061.md`

**Fix:** Update `status: in-progress` to `status: resolved` in each ticket's frontmatter.

---

**M2: Global CSS class names in `_create-form-shared.scss` could collide outside character creation context**

The shared partial defines global (unscoped) classes: `.warning-item`, `.counter`, `.selected-tags`, `.tag`. These are generic names registered via `nuxt.config.ts` css array (line 18), meaning they apply globally to every page. Currently no collision exists (verified by searching all SCSS files), but these names are generic enough that future components could inadvertently pick up these styles.

This is an inherited pattern -- the file was extracted from existing duplicated code that was already using these class names (previously scoped, now global). The trade-off was intentional per the resolution log (global registration required for SCSS variable access). The comment header in the file documents the intended consumers.

**Risk:** Low. Current codebase has no conflicts. The classes are specific enough in combination (`.warning-item--warning`, `.counter--full`, `.tag__remove`) that accidental hits are unlikely. If a collision arises in the future, the fix is straightforward: namespace the classes (e.g., `.create-form-warning-item`).

**Action:** Accept as-is but keep awareness for future development. No code change required now.

## What Looks Good

### refactoring-068 + ux-001 (Equipment Tab Reactivity + Catalog UX)

1. **Correct immutability pattern.** The `slotSelections` ref is reset via spread: `slotSelections.value = { ...slotSelections.value, [slot]: '' }` (line 237). This creates a new object rather than mutating in place. Applied consistently across both `equipItem()` success path and `onSelectItem()` custom branch.

2. **Robust error handling.** The dropdown retains its selected value on failure (line 243-245), enabling retry without re-selecting. The `saving` ref correctly gates concurrent operations via `disabled` bindings and is reset in `finally` blocks.

3. **Clean v-model binding.** Line 30: `v-model="slotSelections[slotDef.key]"` replaces the fragile `(event.target as HTMLSelectElement).value` pattern. The `@change` handler no longer receives the event -- it reads from the reactive ref instead (line 272).

4. **Toast implementation is solid.** `EquipmentCatalogBrowser.vue` adds `successMessage` ref with auto-dismiss timer (2.5s), `clearTimeout` guard in `showSuccess()` to handle rapid equips, and `onUnmounted` cleanup (line 199-201). Vue `<Transition>` provides enter/leave animation. The toast is positioned absolute within the modal, scoped correctly.

5. **Timer is not reactive (correct).** `successTimer` is a plain `let` (line 125), not a `ref`. Timers should not be reactive since they are side-effect handles, not UI state.

6. **Modal stays open after equip.** `onCatalogEquipped()` in `HumanEquipmentTab.vue` (line 310-315) no longer sets `showCatalog.value = false`. The modal closes only via X button or overlay click, matching the ux-001 ticket requirement.

7. **File sizes within limits.** HumanEquipmentTab.vue: 554 lines, EquipmentCatalogBrowser.vue: 459 lines. Both well under the 800-line limit.

### refactoring-061 (SCSS Partial Extraction)

1. **Clean extraction.** The shared partial (`_create-form-shared.scss`, 89 lines) contains only the base styles that were identical across 2-4 components. Component-specific variants (`.tag--class`, `.tag--edge`, `.counter` margin overrides) remain in scoped component styles. This follows the Open/Closed Principle.

2. **Correct registration strategy.** The partial is registered in `nuxt.config.ts` css array (line 18), not in `additionalData`. This avoids the build break documented in refactoring-083 and ensures SCSS variables are available since the partial loads after `main.scss`.

3. **Clear documentation.** Each component's scoped style section has comments noting which classes come from the shared partial (e.g., ClassFeatureSection.vue line 334, 464, 480; EdgeSelectionSection.vue line 203, 311, 326).

4. **Net reduction confirmed.** 89 lines added (partial), ~151 lines removed across 4 components. Net reduction of 53 lines with improved maintainability.

5. **Commit granularity is good.** 7 commits for 7 logical steps: create partial, register config, then one commit per component migration. Each commit produces a working state.

### refactoring-059 (Dead Code Removal)

1. **Complete coverage.** All 6 affected API files cleaned: `index.get.ts`, `[id].get.ts`, `[id].put.ts`, `modifications/[modId].get.ts`, `modifications/[modId].put.ts`, `modifications/index.post.ts`. The developer found 2 additional files (`[id].put.ts`, `[modId].get.ts`) not in the original ticket via duplicate code path checking -- good diligence.

2. **DB column preserved.** Per the ticket and design-density-significance-001 spec, the `densityMultiplier` column remains in the Prisma schema (`schema.prisma:368`) for backward compatibility. Only API serialization and request parsing were removed.

3. **No remaining `densityMultiplier` references in API layer.** Confirmed via grep -- the field only appears in the Prisma schema (DB column), the habitat.ts type comment explaining removal, artifact files, and this review.

4. **Single commit for the change.** Since all 6 files were part of the same logical removal, a single commit is appropriate here despite touching 6 files -- they all change for the same reason.

### refactoring-077 (Type Alias Extraction)

1. **Circular dependency eliminated.** Previously: `usePathfinding.ts` imported `TerrainCostGetter` from `useRangeParser.ts`, while `useRangeParser.ts` imported `usePathfinding` from `usePathfinding.ts`. Now both import types from `~/types/vtt.ts`, breaking the cycle.

2. **Backwards-compatible re-exports.** `useRangeParser.ts` line 5 re-exports the types from `~/types`: `export type { TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'`. Any external consumers importing from `useRangeParser` continue to work.

3. **Barrel file updated.** `app/types/index.ts` line 41 adds `export * from './vtt'`, making the types available via the standard `~/types` import path. All consumer files (`usePathfinding.ts`, `useGridMovement.ts`) now import from `~/types`.

4. **Type definitions are well-documented.** `app/types/vtt.ts` includes JSDoc-style comments explaining each type alias (terrain cost multiplier semantics, Infinity for impassable, elevation transition cost, flying Pokemon zero-cost case).

5. **Verified all consumers updated.** `useGridMovement.ts` line 1 imports all three types from `~/types`. `usePathfinding.ts` line 1 imports from `~/types`. No remaining direct imports from composables for these types (except the backwards-compat re-export in useRangeParser).

## Verdict

**APPROVED**

All four refactoring tickets are implemented correctly. The code follows project patterns (immutability, file size limits, SCSS conventions, type organization), error handling is robust, and commit granularity is appropriate. No correctness bugs, no immutability violations, no security issues.

## Required Changes

**M1 (ticket statuses):** Update the `status:` frontmatter field from `in-progress` to `resolved` in all 5 ticket files. This is a documentation-only fix and can be done in a single commit during the slave-collector merge phase.

**M2 (global CSS names):** Accepted as-is. No code change required. The risk is documented and the existing pattern is consistent with other global SCSS partials in the project (`_create-form.scss`, `_player-view.scss`).
