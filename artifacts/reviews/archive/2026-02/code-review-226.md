---
review_id: code-review-226
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - a705745
  - fd169cd
  - b3fbbdd
  - 82cb606
  - 739fbb7
  - 766585e
  - 35ddd2c
  - 9d62911
  - 944e059
  - 0b7a100
  - 722f519
  - 91e14d5
files_reviewed:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/types/species.ts
  - app/utils/evolutionCheck.ts
  - app/server/services/evolution.service.ts
  - app/server/api/pokemon/[id]/evolution-check.post.ts
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/components/encounter/LevelUpNotification.vue
  - app/components/encounter/XpDistributionResults.vue
  - app/components/pokemon/PokemonLevelUpPanel.vue
  - app/pages/gm/pokemon/[id].vue
  - app/assets/scss/components/_level-up-notification.scss
  - app/constants/natures.ts
  - app/utils/experienceCalculation.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-02-28T23:15:00Z
follows_up: null
---

## Review Scope

First review of feature-006 P0 implementation (Pokemon Evolution System). 12 commits on master covering: schema migration (evolutionTriggers column on SpeciesData), seed parser enhancement to extract evolution triggers from pokedex files, evolution eligibility check utility, evolution service with stat recalculation, two new API endpoints (evolution-check, evolve), EvolutionConfirmModal with stat redistribution UI, LevelUpNotification evolution integration (clickable entries), manual Evolve button on Pokemon sheet page, XpDistributionResults child component with evolution flow, shared validateBaseRelations refactor, and level-up calculation enhancement with evolution levels.

Design spec: `artifacts/designs/design-pokemon-evolution-001/spec-p0.md`
Shared spec: `artifacts/designs/design-pokemon-evolution-001/shared-specs.md`
Active decrees checked: decree-035 (nature-adjusted base stats for Base Relations), decree-036 (stone evolutions learn new-form moves at or below current level).

## Issues

### CRITICAL

#### C1: Evolution does not update `spriteUrl` on the Pokemon record

**File:** `app/server/services/evolution.service.ts` (lines 275-296)

The `performEvolution` function updates species, types, base stats, calculated stats, maxHp, and currentHp -- but does NOT update `spriteUrl`. After evolution, the Pokemon record still points to the old species' sprite. The GM View, Group View, and any combatant cards will display the pre-evolution sprite until someone manually changes it.

The shared spec (section "Sprite System") explicitly calls this out: "The sprite URL must change on evolution." The `spriteUrl` field on the Pokemon model needs to be set to the new species' sprite.

The `usePokemonSprite` composable (client-side) generates URLs from species name, but the stored `spriteUrl` in the DB is what the server serializes and sends to other clients. If the Group View renders sprites from the serialized `spriteUrl` field, it will show the wrong sprite.

**Fix:** In `performEvolution`, either:
1. Clear `spriteUrl` to `null` so the client falls back to computing it from species name, OR
2. Compute and set the new sprite URL using the same logic as the pokemon-generator service.

Option 1 is simpler and sufficient if the client-side sprite composable handles null/undefined `spriteUrl` gracefully. Verify that `getSpriteUrl` is always used instead of the raw `spriteUrl` field.

### HIGH

#### H1: `pokemon-evolved` event not handled by XpDistributionModal parent

**File:** `app/components/encounter/XpDistributionResults.vue` (line 68), `app/components/encounter/XpDistributionModal.vue` (lines 201-204)

`XpDistributionResults` emits `pokemon-evolved` when an evolution completes from the XP distribution flow. However, the parent `XpDistributionModal` does NOT listen for this event:

```vue
<XpDistributionResults
  :results="distributionResults"
  :total-xp-distributed="totalDistributed"
/>
```

No `@pokemon-evolved` handler is bound. This means:
- After evolving during XP distribution, the parent modal has stale data.
- The encounter view does not know the Pokemon's species changed.
- The combatant card (if in encounter) will display the old species.

**Fix:** Add `@pokemon-evolved="handlePokemonEvolved"` to the `XpDistributionResults` usage in `XpDistributionModal.vue`, where the handler emits upward or refreshes encounter data.

#### H2: Branching evolutions silently use the first option with no user choice

**Files:** `app/pages/gm/pokemon/[id].vue` (line 309), `app/components/encounter/XpDistributionResults.vue` (line 144)

Both the Pokemon sheet "Evolve" button and the XP distribution flow use `response.data.available[0]` -- hardcoded first element -- when multiple evolutions are available. For Eevee (8 evolution paths), Poliwag line (2 paths), Clamperl (2 paths), etc., the GM gets no choice.

The code includes comments like "P1 can add a selection UI," but P0 should at minimum present a basic selection when `available.length > 1`. Without this, the feature is misleading -- the GM thinks they're evolving and only one option appears, with no indication that others exist.

**Fix:** When `available.length > 1`, either:
1. Show a simple `window.confirm` / `window.prompt` listing options (minimal P0 approach), OR
2. Add a species selection step before opening the confirmation modal.

At bare minimum, show the count: "Evolving into Vaporeon (1 of 8 options). For other evolution paths, check back in P1."

#### H3: No encounter-active guard on the evolve endpoint

**File:** `app/server/api/pokemon/[id]/evolve.post.ts`

The evolve endpoint performs a Prisma update on the Pokemon record without checking whether it's currently in an active encounter. If a Pokemon is a combatant in a live encounter, the evolution updates the DB record but the combatant snapshot in the encounter JSON becomes stale -- species name, stats, types, HP all mismatch. The `bulk-action.post.ts` endpoint already guards against this pattern (checks active encounters before modifying).

**Fix:** Before calling `performEvolution`, query active encounters for combatants containing this Pokemon's ID. If found, either:
1. Reject with a 409 Conflict error ("Cannot evolve while in active encounter"), OR
2. Also update the combatant snapshot in the encounter record.

Option 1 is simpler and consistent with the bulk-action precedent.

### MEDIUM

#### M1: `app-surface.md` not updated with new endpoints, components, and utilities

**Files affected:** `.claude/skills/references/app-surface.md`

Two new API endpoints (`POST /api/pokemon/:id/evolution-check`, `POST /api/pokemon/:id/evolve`), one new component (`EvolutionConfirmModal.vue`), one new utility (`evolutionCheck.ts`), one new service (`evolution.service.ts`), and one new type file (`types/species.ts`) were added but `app-surface.md` was not updated. Per the review checklist, new endpoints/components/routes/stores require an `app-surface.md` update.

**Fix:** Add the new files to the appropriate sections of `app-surface.md`.

#### M2: `PokemonLevelUpPanel` still shows hardcoded "Check the Pokedex entry" reminder instead of actionable evolution info

**File:** `app/components/pokemon/PokemonLevelUpPanel.vue` (line 26)

The level-up panel (shown when editing a Pokemon's level on the sheet page) still displays a static text reminder: "Check the Pokedex entry for possible evolution at this level." This is the pre-P0 placeholder. Since P0 now has actual evolution check capabilities, this panel should either:
1. Call the evolution-check endpoint and show actual available evolutions, OR
2. At minimum reference the Evolve button that now exists on the same page.

The `LevelUpNotification` component (encounter XP flow) was correctly updated to be actionable, but this panel was not. Inconsistent UX.

**Fix:** Either integrate the evolution check into this panel (like `LevelUpNotification`), or change the text to "Use the Evolve button above to check evolution eligibility" to reference the new functionality.

#### M3: `evolutionCheck.ts` filename does not match the spec naming

**File:** `app/utils/evolutionCheck.ts`

The P0 spec (section 2.1) specifies the file as `app/utils/evolutionCheck.ts` -- which matches. However, the spec also names the function `checkEvolutionEligibility` in a file called "evolutionCheck.ts". The file now also contains `validateBaseRelations` and `EvolutionStats` types, making it a multi-concern file. Per SRP, `validateBaseRelations` is a Base Relations concern that applies beyond evolution (it applies to normal level-up stat allocation too).

The commit `722f519` is titled "refactor: move validateBaseRelations to shared utils" but moves it INTO `evolutionCheck.ts`, which is still evolution-specific by name. If this function is shared across features, consider renaming the file or extracting `validateBaseRelations` to its own file (e.g., `app/utils/baseRelations.ts`).

**Fix:** Either:
1. Move `validateBaseRelations` and `EvolutionStats` to `app/utils/baseRelations.ts` and re-export from `evolutionCheck.ts` for backward compatibility, OR
2. Rename `evolutionCheck.ts` to something broader (less preferable since the other functions are evolution-specific).

## Decree Compliance

- **decree-035 (nature-adjusted base stats for Base Relations):** COMPLIANT. `validateBaseRelations` in `evolutionCheck.ts` (line 128) accepts nature-adjusted base stats and uses them for ordering. The `recalculateStats` function in `evolution.service.ts` (line 120) applies nature first via `applyNatureToBaseStats`, then passes the result to `validateBaseRelations`. The `EvolutionConfirmModal` (line 219-221) computes nature-adjusted base stats via `applyNatureToBaseStats` and passes them to `validateBaseRelations` (line 250). Per decree-035, this approach is correct.

- **decree-036 (stone evolutions learn new-form moves at or below current level):** NOT APPLICABLE TO P0. Move learning is explicitly deferred to P1 (spec-p0.md line 359: "P1 handles: abilities, moves, capabilities, skills"). The decree applies to P1 implementation. No violation.

## What Looks Good

1. **Clean architecture.** The implementation follows the project's layered architecture well: pure utility (`evolutionCheck.ts`) -> service layer (`evolution.service.ts`) -> thin API controllers (`evolve.post.ts`, `evolution-check.post.ts`) -> UI components. SRP is well-applied.

2. **Stat recalculation is PTU-correct.** The stat recalculation pipeline (new species base stats -> apply nature -> validate stat point total = level + 10 -> validate Base Relations -> calculate final stats -> HP formula) matches PTU Core p.202 exactly. The HP proportional preservation (`hpRatio * newMaxHp`) is a sensible UX choice.

3. **Seed parser trigger extraction is thorough.** The `parseEvoLineSpeciesAndTrigger` and `parseEvolutionTriggerText` functions handle all documented trigger patterns: level-only, stone-only, stone+level, held-item+level, and gender qualifiers. The regex for known trigger keywords matches the actual pokedex file format (verified against `books/markdown/pokedexes/`).

4. **EvolutionConfirmModal UI is well-designed.** The stat redistribution grid with real-time Base Relations validation, HP preview, violation display with GM override checkbox, and type badge display is comprehensive for P0. The stat point initialization distributes evenly which is a good default.

5. **Level-up integration is correct.** The `getEvolutionLevels` helper correctly filters for level-only triggers and feeds them into `calculateLevelUps`. Both `xp-distribute.post.ts` and `add-experience.post.ts` now fetch evolution triggers from SpeciesData and pass them through. The `LevelUpNotification` evolution entries are now clickable buttons with proper emit plumbing.

6. **Immutability patterns respected.** `applyNatureToBaseStats` returns a new object. `recalculateStats` and `extractStatPoints` return new objects. No mutation of input parameters. The Vue `reactive()` usage in the modal is the correct Vue 3 pattern for local mutable state.

7. **Input validation on the evolve endpoint is thorough.** Validates `targetSpecies` is a string, each stat point is a non-negative integer, and stat point total is checked server-side. Double-validation: both in the endpoint controller and in `recalculateStats`.

8. **Error handling follows project patterns.** Both endpoints properly distinguish between `createError` (re-thrown) and unexpected errors (wrapped in 500/400). The service layer throws plain `Error` objects that the controller catches and wraps.

9. **Commit granularity is appropriate.** 12 commits, each focused on a single logical change, following the prescribed implementation order from the spec. The refactor commit (`722f519`) correctly separates the shared utils concern from the feature commits.

10. **Evolution check endpoint enriches response with target species data.** The evolution-check endpoint pre-fetches target species base stats and types, avoiding an extra round-trip when the UI needs to display the stat comparison modal. Good API design.

## Verdict

**CHANGES_REQUIRED**

The implementation is architecturally sound and the core PTU mechanics are correctly implemented. However, one critical issue (sprite URL not updated) and three high-severity issues (lost evolution event in XP distribution flow, no branching evolution selection, no encounter-active guard) need to be addressed before this can be approved.

## Required Changes

1. **[C1] Update spriteUrl during evolution** -- either clear to null or compute the new sprite URL. Verify client-side rendering handles the null case.

2. **[H1] Wire `pokemon-evolved` event** through `XpDistributionModal` -- add the missing event handler binding so evolution completions propagate correctly.

3. **[H2] Handle branching evolutions** -- at minimum show an informational message when multiple evolution paths exist, or add a simple selection step before the confirmation modal.

4. **[H3] Add encounter-active guard** to `evolve.post.ts` -- reject evolution for Pokemon in active encounters, consistent with bulk-action precedent.

5. **[M1] Update `app-surface.md`** with new endpoints, components, and utilities.

6. **[M2] Update `PokemonLevelUpPanel`** to reference or integrate the new evolution functionality instead of the hardcoded reminder.

7. **[M3] Consider relocating `validateBaseRelations`** to its own file since it's a shared concern beyond evolution.
