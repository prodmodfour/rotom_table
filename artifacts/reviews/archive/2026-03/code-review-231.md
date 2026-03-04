---
review_id: code-review-231
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - d6fe48a
  - e8247d0
  - 8b82360
  - 663454a
  - c2d050f
  - 9e3f125
files_reviewed:
  - app/server/services/evolution.service.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/components/encounter/XpDistributionResults.vue
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/pages/gm/pokemon/[id].vue
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/components/pokemon/PokemonLevelUpPanel.vue
  - app/components/encounter/LevelUpNotification.vue
  - app/utils/evolutionCheck.ts
  - app/utils/baseRelations.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-01T00:15:00Z
follows_up: code-review-226
---

## Review Scope

Re-review of feature-006 P0 (Pokemon Evolution System) after fix cycle. The previous review (code-review-226) identified 7 issues: 1 CRITICAL (C1: spriteUrl not updated), 3 HIGH (H1: pokemon-evolved event unwired, H2: branching evolutions hardcode first option, H3: no encounter-active guard), and 3 MEDIUM (M1: app-surface.md, M2: PokemonLevelUpPanel text, M3: validateBaseRelations location). Six fix commits were made by slave-1 in session 68. M3 was resolved by feature-007's extraction of `baseRelations.ts`.

This review verifies each fix against the original issue description.

## Fix Verification

### C1: spriteUrl not updated on evolution -- FIXED

**Commit:** `d6fe48a` (fix: reset spriteUrl to null on evolution so client recomputes from new species)
**File:** `app/server/services/evolution.service.ts:294`

The `performEvolution` Prisma update now includes `spriteUrl: null`. Setting it to null forces client-side rendering to fall back to `usePokemonSprite()`, which computes the sprite URL from `pokemon.species`. This is the correct approach -- all UI components (GM View, Group View, Pokemon sheet, combatant cards) already use the `getSpriteUrl(species, shiny)` composable for rendering, so a null DB value produces the correct behavior.

Verified: the fix is a single line addition in the correct location (inside the `prisma.pokemon.update` data object), does not introduce any regressions, and the app-surface.md description for `evolution.service.ts` already mentions "spriteUrl" in its summary.

**Status:** RESOLVED

### H1: pokemon-evolved event not wired in XpDistributionModal -- FIXED

**Commit:** `e8247d0` (fix: wire pokemon-evolved event handler in XpDistributionModal)
**File:** `app/components/encounter/XpDistributionModal.vue:204, 268, 514-521`

Three changes made:
1. Template: Added `@pokemon-evolved="handlePokemonEvolved"` to the `XpDistributionResults` component usage (line 204)
2. Emits: Added `'pokemon-evolved': [result: Record<string, unknown>]` to the component's `defineEmits` (line 268)
3. Handler: Added `handlePokemonEvolved` async function that refreshes encounter data via `encounterStore.fetchEncounter()` and emits the event upward (lines 514-521)

The handler correctly refreshes encounter state before emitting upward, ensuring the parent page (GM encounter view) receives fresh data. The event chain is now complete: `LevelUpNotification` -> `XpDistributionResults` -> `XpDistributionModal` -> parent page.

**Status:** RESOLVED

### H2: Branching evolutions silently use first option -- FIXED

**Commit:** `8b82360` (fix: add branching evolution selection UI for Pokemon with multiple paths)
**Files:** `app/pages/gm/pokemon/[id].vue` (lines 145-187, 313-342), `app/components/encounter/XpDistributionResults.vue` (lines 36-75, 136-182)

Both locations now implement a branching evolution selection UI:
- Single evolution path: goes directly to `EvolutionConfirmModal` (no change from before)
- Multiple evolution paths: shows an intermediate selection modal with species sprite, name, type badges, and required item for each option

The selection modal is implemented identically in both locations (`gm/pokemon/[id].vue` and `XpDistributionResults.vue`). The `openEvolutionModal()` / `openEvolutionConfirmModal()` helper functions validate that `targetBaseStats` is present before proceeding. The `selectEvolution()` / `selectEvolutionOption()` handlers close the selection modal and open the confirmation modal with the chosen species.

The implementation is thorough -- sprites, type badges, and item requirements are all displayed. The GM gets full agency over which evolution path to choose.

**Status:** RESOLVED

### H3: No encounter-active guard on evolve endpoint -- FIXED

**Commit:** `663454a` (fix: add encounter-active guard to evolve endpoint)
**File:** `app/server/api/pokemon/[id]/evolve.post.ts` (lines 80-95)

The guard queries all active encounters, parses their `combatants` JSON, and checks if any combatant's `entityId` matches the Pokemon being evolved. If found, throws a 409 Conflict with a clear message: "Cannot evolve a Pokemon that is in an active encounter. End the encounter first."

This is consistent with the existing `bulk-action.post.ts` precedent. The guard is placed inside the `try` block, after input validation but before `performEvolution()`, which is the correct position.

One implementation detail: the guard queries ALL active encounters and iterates through their combatant arrays. For the expected scale of this application (small number of simultaneous encounters), this is fine. The `isActive: true` filter limits the query, and encounters have a small number of combatants.

**Status:** RESOLVED

### M1: app-surface.md not updated -- FIXED

**Commit:** `c2d050f` (docs: add evolution system entries to app-surface.md)
**File:** `.claude/skills/references/app-surface.md`

Added:
- Two new API endpoints in the Pokemon section: `POST /api/pokemon/:id/evolution-check` and `POST /api/pokemon/:id/evolve`
- `EvolutionConfirmModal.vue` to the key encounter components list
- `Evolution utilities` paragraph covering `evolutionCheck.ts` and `types/species.ts`
- `evolution.service.ts` to the service layer table

All new surface area is documented.

**Status:** RESOLVED

### M2: PokemonLevelUpPanel hardcoded text -- FIXED

**Commit:** `9e3f125` (fix: replace stale evolution reminder text in PokemonLevelUpPanel)
**File:** `app/components/pokemon/PokemonLevelUpPanel.vue:34`

Changed from "Check the Pokedex entry for possible evolution at this level." to "Use the **Evolve** button in the header to check evolution eligibility." with a `<strong>` tag highlighting "Evolve".

This correctly references the new Evolve button that exists in the Pokemon sheet header (gm/pokemon/[id].vue line 9). The user now gets actionable guidance.

**Status:** RESOLVED

### M3: validateBaseRelations SRP violation -- RESOLVED BY FEATURE-007

The `baseRelations.ts` shared utility was extracted as part of the feature-007 (Stat Allocation) work:
- `app/utils/baseRelations.ts` (203 lines): Contains `buildStatTiers`, `validateBaseRelations`, `getValidAllocationTargets`, `extractStatPoints`, `formatStatName` -- all pure functions with no DB access
- `app/utils/evolutionCheck.ts` (lines 119-135): Re-exports `validateBaseRelations` via a wrapper that adapts `EvolutionStats` to `Stats` type for backward compatibility

This is a clean extraction. The wrapper in `evolutionCheck.ts` preserves backward compatibility for existing callers (both the service and the EvolutionConfirmModal still import from `evolutionCheck`), while new code (e.g., the stat allocation panel) imports directly from `baseRelations.ts`.

**Status:** RESOLVED (by separate feature work)

## Issues

### MEDIUM

#### M1: Duplicated type-badge SCSS across 3 evolution components

**Files:**
- `app/components/pokemon/EvolutionConfirmModal.vue` (lines 354-381)
- `app/components/encounter/XpDistributionResults.vue` (lines 376-402)
- `app/pages/gm/pokemon/[id].vue` (lines 566-592)

All three files contain identical `.type-badge` scoped SCSS with 18 type-color rules. The project already has a shared `app/assets/scss/components/_type-badges.scss` partial that provides both a `.type-badge` class and `@mixin type-badge-colors`. The three components should use the shared mixin or the global class instead of duplicating the definitions.

This was introduced in the original implementation commits and the H2 fix added a third copy.

**Required action:** File a ticket to refactor the type-badge duplication. The three components should use `@include type-badge-colors` or rely on the global `.type-badge` class.

#### M2: Duplicated evolution selection modal template and logic

**Files:**
- `app/pages/gm/pokemon/[id].vue` (lines 145-187 template, 313-342 script)
- `app/components/encounter/XpDistributionResults.vue` (lines 36-75 template, 136-182 script)

The evolution selection modal (branching evolutions UI) is duplicated verbatim between the Pokemon sheet page and the XpDistributionResults component. Both include the same template structure (Teleport, modal-overlay, options list with sprite/name/types/item), the same data types (`EvolutionOption` / `EvolutionOptionData`), the same state management (`evolutionSelection.visible` / `evolutionSelectionVisible`), and the same handler pattern (`selectEvolution` / `selectEvolutionOption`).

This should be extracted to a shared component (e.g., `EvolutionSelectionModal.vue`) that both locations import. The duplication is ~90 lines of template + ~50 lines of script in each location.

**Required action:** File a ticket to extract `EvolutionSelectionModal.vue` as a shared component.

## What Looks Good

1. **All 7 original issues are properly resolved.** Each fix is targeted, minimal, and does not introduce regressions. The fix commits are well-scoped (one fix per commit) with clear commit messages explaining the rationale.

2. **C1 fix is elegant.** Setting `spriteUrl: null` rather than computing a new URL avoids duplicating sprite URL logic in the service layer and leverages the existing client-side composable. The comment "P1 handles: abilities, moves, capabilities, skills" on the next line provides context that more fields will change in P1.

3. **H1 fix includes encounter data refresh.** The `handlePokemonEvolved` handler in XpDistributionModal does not just blindly forward the event -- it first calls `encounterStore.fetchEncounter()` to ensure the parent receives fresh data. This prevents stale combatant state.

4. **H2 fix is comprehensive.** Rather than a minimal "show a confirm dialog with species names," the implementation provides a full modal with sprites, type badges, and item requirements. This is a significantly better UX than what was requested.

5. **H3 fix follows established patterns.** The encounter-active guard in `evolve.post.ts` mirrors the pattern from `bulk-action.post.ts`, maintaining consistency across the API surface.

6. **M3 resolution is well-structured.** The `baseRelations.ts` extraction provides a clean shared utility that both evolution and stat allocation systems can use, with a backward-compatible wrapper in `evolutionCheck.ts`.

7. **Decree compliance maintained.** The fix cycle does not alter any PTU mechanics. The `validateBaseRelations` delegation still uses nature-adjusted base stats per decree-035. No decree-036 relevance at P0.

## Verdict

**APPROVED**

All 7 issues from code-review-226 are verified as resolved. The fix implementations are correct, minimal, and well-targeted. Two new MEDIUM issues were identified (type-badge SCSS duplication, evolution selection modal duplication), but these are structural duplication concerns that should be addressed via follow-up tickets, not blocking fixes. They do not affect correctness, security, or user-facing behavior.

The feature-006 P0 evolution system is approved for merge.

## Required Changes

None. APPROVED for merge.

**Follow-up tickets to file:**
1. Refactor type-badge SCSS duplication in evolution components (use shared `_type-badges.scss` mixin)
2. Extract `EvolutionSelectionModal.vue` from duplicated code in `gm/pokemon/[id].vue` and `XpDistributionResults.vue`
