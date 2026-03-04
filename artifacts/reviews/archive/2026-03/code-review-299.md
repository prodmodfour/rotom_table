---
review_id: code-review-299
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-017
domain: capture
commits_reviewed:
  - f411fa76
  - 0200b213
  - ae9cc9d0
  - 1b71b439
  - 7728f183
  - e2db3c03
  - 06e7cd95
  - 3a3cdf93
files_reviewed:
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/CombatantCaptureSection.vue
  - app/components/encounter/CaptureRateDisplay.vue
  - app/components/capture/CapturePanel.vue
  - app/components/capture/BallSelector.vue
  - app/components/capture/BallConditionPreview.vue
  - app/components/capture/CaptureContextToggles.vue
  - app/composables/useCapture.ts
  - app/composables/useWebSocket.ts
  - app/types/api.ts
  - app/utils/pokeBallFormatters.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T13:45:00Z
follows_up: code-review-295
---

## Review Scope

Re-review of the fix cycle for feature-017 Poke Ball Type System P2, addressing all 8 issues raised in code-review-295 (1C+3H+4M). 8 fix commits reviewed against the original issue descriptions. rules-review-268 previously APPROVED.

Decree compliance rechecked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy system). All still respected. decree-042 remains correctly deferred to ptu-rule-131 with explicit TODO comments in `rollAccuracyCheck()`.

## Issue Verification

### C1: CombatantCard.vue file size (RESOLVED)

**Original issue:** CombatantCard.vue was 999 lines, exceeding the 800-line limit.

**Fix:** Extracted `CombatantCaptureSection.vue` (140 lines) containing the trainer selector, species data fetch for evolution stage info, `pokemonData` assembly, and CapturePanel integration. CombatantCard.vue is now 918 lines.

**Verification:** The extraction is clean. CombatantCard retains only a simple conditional rendering (`v-if="isGm && isWildPokemon"`) with a `CombatantCaptureSection` element and a `@captured` handler. All capture-related computed properties (`availableTrainers`, `selectedTrainerId`, `capturePokemonData`, species lookup) were moved to the new component. Props are well-defined (`pokemonId`, `pokemonSpecies`, `pokemonEntity`, `encounterId`) and the emit interface is a single `captured` event.

CombatantCard remains above 800 lines (918), but the commit message correctly notes this: the pre-existing overage predates P2 and is tracked elsewhere. The P2 capture code has been fully extracted, so P2 no longer contributes to the overage. Accepted.

### H1: capture_attempt WebSocket consumer (RESOLVED)

**Original issue:** Server broadcast `capture_attempt` but no client handled it.

**Fix:** Added `capture_attempt` handler in `useWebSocket.ts` (lines 239-255) with a `lastCaptureAttempt` ref (lines 41-50) exposed as `readonly`. The handler stores the event data with a timestamp, and reloads the encounter on successful capture to reflect ownership changes. The `WebSocketEvent` type union in `api.ts` was updated with the `capture_attempt` event shape (line 57).

**Verification:** The handler correctly destructures the broadcast data, adds a client-side timestamp, and triggers an encounter reload on capture success. The `lastCaptureAttempt` ref is properly typed and exposed via `readonly()`. The type in `api.ts` includes all broadcast fields (`pokemonId`, `trainerId`, `trainerName`, `pokemonSpecies`, `ballType`, `captured`, `roll`, `modifiedRoll`, `captureRate`, `ballModifier`, `postCaptureEffect`).

Note: No Group View or Player View component currently reads `lastCaptureAttempt` to display it in the UI. However, the code-review-295 requirement was "add a handler for `capture_attempt`... or document this as a future integration and remove the broadcast." The handler now exists and stores the data, making it available for future Group/Player View consumption. The broadcast is no longer dead code. The UI rendering of capture events in Group View is a separate feature concern, not a bug in this fix cycle.

### H2: CapturePanel warning display (RESOLVED)

**Original issue:** `useCapture()` exposed a `warning` ref but CapturePanel did not display it.

**Fix:** CapturePanel now destructures `warning: captureWarning` from `useCapture()` (line 147) and displays it in a styled `capture-panel__warning` div (lines 108-110) with yellow tinting via SCSS (lines 373-381: `color: $color-warning`, `background: rgba($color-warning, 0.1)`, `border: 1px solid rgba($color-warning, 0.3)`).

**Verification:** The warning appears below the error display, consistent with the error display pattern. The SCSS styling is appropriate -- yellow-tinted, distinct from the red error state. The warning text from `useCapture()` ("Capture succeeded but standard action was not consumed -- please adjust action economy manually") will now be visible to the GM.

### H3: Hardcoded z-index in CaptureRateDisplay (RESOLVED)

**Original issue:** `z-index: 100` hardcoded instead of using `$z-index-dropdown`.

**Fix:** Line 180 of CaptureRateDisplay.vue now uses `z-index: $z-index-dropdown`.

**Verification:** Confirmed. The SCSS variable `$z-index-dropdown` is defined as `100` in `_variables.scss` (line 150), so the visual behavior is identical. BallSelector.vue already uses `$z-index-dropdown` at line 274 for its dropdown, so the two dropdown-style overlays now share the same z-index source of truth.

### M1: formatModifier duplication (RESOLVED)

**Original issue:** `formatModifier()` duplicated across BallSelector, BallConditionPreview, and CaptureRateDisplay.

**Fix:** Extracted to `app/utils/pokeBallFormatters.ts` (23 lines) with two exported functions: `formatModifier()` and `modifierClass()`. All three components now import from this shared utility.

**Verification:** Confirmed all three import paths:
- `BallSelector.vue` line 143: `import { formatModifier, modifierClass } from '~/utils/pokeBallFormatters'`
- `BallConditionPreview.vue` line 19: `import { formatModifier } from '~/utils/pokeBallFormatters'`
- `CaptureRateDisplay.vue` line 97: `import { formatModifier } from '~/utils/pokeBallFormatters'`

The local function definitions were removed from all three components. The shared utility includes both `formatModifier` and `modifierClass`, with correct PTU convention comments (negative modifier = easier capture = good). CaptureRateDisplay retains its own `ballModClass()` which uses different CSS class names (`positive`/`negative` vs `mod--positive`/`mod--negative`) -- this is correct since CaptureRateDisplay's breakdown tooltip has its own scoped CSS class convention.

### M2: Missing evolutionStage/maxEvolutionStage (RESOLVED)

**Original issue:** `capturePokemonData` in CombatantCard omitted evolution stage data, causing inaccurate capture rate previews.

**Fix:** `CombatantCaptureSection.vue` fetches species data via `$fetch('/api/species/${species}')` (line 73) using a watcher on `pokemonSpecies`. The `speciesEvolution` ref stores `{ evolutionStage, maxEvolutionStage }`, and the `pokemonData` computed (lines 89-101) includes `speciesEvolution.value?.evolutionStage` and `speciesEvolution.value?.maxEvolutionStage` as optional properties.

**Verification:** The species API endpoint (`/api/species/[name].get.ts`) returns both `evolutionStage` and `maxEvolutionStage` from the SpeciesData model (lines 45-46). The watcher fires immediately (`{ immediate: true }`) and handles errors gracefully (sets `speciesEvolution` to null, falls back to `useCapture`'s defaults of `evolutionStage: 1, maxEvolutionStage: 3`). CapturePanel's `pokemonData` prop accepts these as optional fields (lines 128-129: `evolutionStage?: number`, `maxEvolutionStage?: number`), and `calculateCaptureRateLocal` passes them through (lines 179-180). The data path is complete and correct.

### M3: Missing encounterRound in CapturePanel (RESOLVED)

**Original issue:** Timer Ball and Quick Ball previews always showed round-1 values because `encounterRound` was missing from `fullConditionContext`.

**Fix:** CapturePanel now imports the encounter store (line 164: `const encounterStore = useEncounterStore()`) and includes `encounterRound` in `fullConditionContext` (line 169: `encounterRound: encounterStore.currentRound || 1`).

**Verification:** The encounter store's `currentRound` getter (line 30 of encounter store) returns `state.encounter?.currentRound ?? 0`. The `|| 1` fallback in CapturePanel ensures round is at least 1 when no encounter is loaded, which is consistent with the Timer Ball evaluator expecting round >= 1. The condition context now correctly flows through to `calculateBallModifier` for live preview updates as rounds progress.

### M4: BallSelector click-outside handler (RESOLVED)

**Original issue:** BallSelector dropdown had no click-outside handler.

**Fix:** Added a template ref `selectorRef` (line 2: `ref="selectorRef"`, line 162: `const selectorRef = ref<HTMLElement | null>(null)`), a `handleClickOutside` function (lines 165-168) that checks `contains()`, a watcher on `isOpen` (lines 171-177) that adds/removes the document click listener, and an `onUnmounted` cleanup (lines 179-181).

**Verification:** The implementation is correct:
- Uses `capture: true` on the event listener (`document.addEventListener('click', handleClickOutside, true)`) to catch clicks before they reach the toggle button, preventing the toggle from immediately reopening the dropdown.
- Properly removes the listener both when `isOpen` becomes false and on unmount.
- The `contains()` check correctly excludes clicks within the component itself (toggle button + dropdown).
- No memory leak risk -- `onUnmounted` ensures cleanup even if the component is destroyed while the dropdown is open.

## What Looks Good

1. **Clean extraction of CombatantCaptureSection.** The component boundary is well-drawn: it owns the trainer selector and species lookup (which are capture-specific concerns) and delegates to CapturePanel. The parent CombatantCard only needs to know `isWildPokemon` and `pokemonSpecies`. Props are minimal and the emit interface is a single event.

2. **Defensive species fetch pattern.** The species API call in CombatantCaptureSection uses a try/catch with a comment explaining the fallback ("Non-critical: capture rate preview will use defaults"). This is the correct approach -- a failed species lookup should not block the capture UI.

3. **WebSocket capture_attempt handler includes encounter reload.** On successful capture, the handler calls `store.loadEncounter(store.encounter.id)`. This ensures Group View and Player View see the ownership change reflected immediately rather than waiting for the next encounter_update broadcast.

4. **Shared utility file is appropriately scoped.** `pokeBallFormatters.ts` contains exactly two functions specific to Poke Ball modifier display. It does not over-generalize or become a dumping ground. The file name clearly communicates its domain.

5. **All 8 commits have correct granularity.** Each commit addresses exactly one issue from code-review-295, with descriptive messages citing the CR-295 issue number. The commit order is logical (extract utility first, then apply it; extract component last since it depends on M2's species lookup).

6. **Decree compliance maintained.** Per decree-013, the 1d100 capture system is used exclusively. Per decree-014, Stuck/Slow bonuses remain separate. Per decree-015, real max HP is used in capture rate calculations. Per decree-042, the full accuracy system is acknowledged with explicit TODO tracking to ptu-rule-131.

## Verdict

**APPROVED**

All 8 issues from code-review-295 have been resolved correctly. The fixes are clean, well-scoped, and introduce no regressions. Decree compliance is maintained. The P2 implementation of feature-017 Poke Ball Type System is ready to proceed.

## Required Changes

None.
