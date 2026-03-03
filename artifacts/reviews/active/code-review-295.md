---
review_id: code-review-295
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - ddbb1879
  - b4e7df79
  - 77e4d5b7
  - 5515e0d6
  - 026663f5
  - 944bd999
  - 28bfcf12
files_reviewed:
  - app/components/capture/BallSelector.vue
  - app/components/capture/BallConditionPreview.vue
  - app/components/capture/CaptureContextToggles.vue
  - app/components/capture/CapturePanel.vue
  - app/components/encounter/CaptureRateDisplay.vue
  - app/components/encounter/CombatantCard.vue
  - app/composables/useCapture.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/capture/rate.post.ts
  - app/constants/pokeBalls.ts
  - app/utils/pokeBallConditions.ts
  - app/server/services/ball-condition.service.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 4
reviewed_at: 2026-03-03T04:30:00Z
follows_up: code-review-286
---

## Review Scope

P2 implementation of feature-017 (Poke Ball Type System), covering:
- **Section I**: Ball Type Selection UI (BallSelector, BallConditionPreview, CaptureContextToggles, CaptureRateDisplay, CapturePanel)
- **Section J**: Post-Capture Effects (Heal Ball heal-to-max, Friend Ball +1 Loyalty, Luxury Ball raised happiness)
- **Section K**: Capture Result Display (CapturePanel integrated into CombatantCard, WebSocket broadcast)

7 commits reviewed. P0 and P1 previously APPROVED (code-review-286, rules-review-262).

Decree compliance checked: decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy system). All respected. decree-042 is correctly deferred to ptu-rule-131 with an explicit TODO and comment in `rollAccuracyCheck()`.

## Issues

### CRITICAL

**C1: CombatantCard.vue is 999 lines -- exceeds 800-line file size limit.**

`app/components/encounter/CombatantCard.vue` was 891 lines before P2 and is now 999 lines. The P2 changes added ~108 lines (trainer selector, CapturePanel integration, capture-related computed properties, SCSS for trainer selector). The file was already over the 800-line limit before this PR, but P2 made it worse.

The capture section (trainer selector, `availableTrainers`, `selectedTrainerId`, `capturePokemonData`, `handleCaptured`, and associated SCSS) is a self-contained concern that should be extracted. Recommended fix: extract a `CombatantCaptureSection.vue` wrapper component that receives the entity, encounter store reference, and wild Pokemon status, and owns the trainer selector + CapturePanel internally. This would remove ~60 lines from CombatantCard (template + script + SCSS) and bring it closer to the limit.

Note: getting CombatantCard under 800 lines requires a broader refactoring (the pre-existing overage is not this PR's fault), but P2 should not add further to the problem. Extract the capture section now.

### HIGH

**H1: `capture_attempt` WebSocket broadcast has no client-side consumer.**

`attempt.post.ts` broadcasts a `capture_attempt` event (commit 28bfcf12), but no client-side composable or component handles this event. The design spec (Section K) states: "The Group View displays capture attempts in the encounter panel, showing the ball type and whether it was successful." Without a handler, the broadcast is dead code and the Group View shows nothing for capture events.

Required fix: Either add a handler for `capture_attempt` in the Group View WebSocket composable (e.g., `useGroupViewWebSocket`) to display capture events, or document this as a future integration and remove the broadcast to avoid dead code. Since the spec explicitly calls for Group View display, a handler is needed.

**H2: CapturePanel does not display the `warning` from `useCapture()`.**

`useCapture()` exposes a `warning` ref (line 278, `readonly(warning)`) that is set when the standard action consumption fails after a successful capture (line 217: "Capture succeeded but standard action was not consumed -- please adjust action economy manually"). CapturePanel destructures `loading` and `error` but not `warning`. If the action economy update fails silently, the GM receives no feedback.

Required fix: Destructure `warning` from `useCapture()` in CapturePanel and display it (e.g., a yellow-tinted message similar to the error display, below the capture result).

**H3: CaptureRateDisplay uses hardcoded `z-index: 100` instead of SCSS variable.**

`app/components/encounter/CaptureRateDisplay.vue` line 184 uses `z-index: 100` directly. The project has `$z-index-dropdown` defined in SCSS variables, and BallSelector.vue correctly uses it for its dropdown. The CaptureRateDisplay breakdown tooltip is a dropdown-style overlay and should use the same z-index variable for consistency and maintainability.

Required fix: Replace `z-index: 100` with `z-index: $z-index-dropdown` in CaptureRateDisplay.vue.

### MEDIUM

**M1: `formatModifier()` is duplicated across three components.**

The same `formatModifier(mod: number): string` function appears identically in:
- `BallSelector.vue` (line 183)
- `BallConditionPreview.vue` (line 35)
- `CaptureRateDisplay.vue` (line 108)

This should be a shared utility. It could be added to `pokeBalls.ts` as a named export, or to a small `utils/formatters.ts` file, and imported in all three components.

Required fix: Extract `formatModifier()` to a shared location and import it.

**M2: `capturePokemonData` in CombatantCard omits `evolutionStage` and `maxEvolutionStage`.**

`CombatantCard.vue` line 440-449 builds `capturePokemonData` for the CapturePanel prop but does not include `evolutionStage` or `maxEvolutionStage`. CapturePanel passes these to `calculateCaptureRateLocal` (line 167-178), which falls back to defaults (`evolutionStage: 1, maxEvolutionStage: 3`). These defaults assume a base-form Pokemon in a 3-stage line, which is wrong for fully-evolved or 2-stage Pokemon. The capture rate preview displayed in the CapturePanel will be inaccurate.

The entity data should include the species' evolution stage info. Since this requires a speciesData lookup (not available on the Pokemon entity directly), the simplest fix is to add these fields to the CapturePanel `pokemonData` prop type as optional and pass them through from speciesData if available, or accept the server-calculated rate via `getCaptureRate()` instead of the local calculation for the preview.

Required fix: Either pass `evolutionStage`/`maxEvolutionStage` through (requires species lookup) or switch the CapturePanel preview to use the server API endpoint which already resolves species data.

**M3: `CaptureContextToggles` only covers 3 of 13 conditional balls' context flags.**

The GM context toggles component only has checkboxes for `targetWasBaited`, `isDarkOrLowLight`, and `isUnderwaterOrUnderground`. These are the three GM-observable context flags. The remaining conditional ball contexts (encounter round, target level, active Pokemon level, target types, target gender, weight class, movement speed, stone evolution, species ownership, evo lines) are auto-populated by `ball-condition.service.ts`. However, the `fullConditionContext` computed in CapturePanel (line 160-163) only passes `targetLevel` and the three toggle flags -- it does NOT pass `encounterRound`. This means the client-side preview for Timer Ball and Quick Ball will always show their round-1 values regardless of the actual round.

Required fix: Include `encounterRound` from the encounter store in `fullConditionContext` so Timer Ball and Quick Ball previews reflect the actual round number. The encounter store has access to `encounter.currentRound`.

**M4: BallSelector dropdown does not close when clicking outside.**

The BallSelector dropdown (line 25: `v-if="isOpen"`) opens and closes only via the toggle button click. There is no click-outside handler to dismiss the dropdown. In a densely packed GM interface, an open dropdown that doesn't close on outside click is a usability issue -- the GM must click the toggle again to close it before interacting with other elements.

Required fix: Add a click-outside handler (either a `v-click-outside` directive if available, or a manual `document.addEventListener('click', ...)` with cleanup) to close the dropdown when clicking outside the component.

## What Looks Good

1. **Clean component decomposition.** BallSelector, BallConditionPreview, CaptureContextToggles, and CapturePanel are well-separated with clear props/emits interfaces. CapturePanel acts as a proper orchestrator. This follows the SRP guidance from the App CLAUDE.md.

2. **Correct decree compliance.** Heal Ball uses `pokemon.maxHp` (real max HP, per decree-015). The 1d100 capture system is correctly used (decree-013). Stuck/Slow are correctly separate from volatile (decree-014). decree-042 (full accuracy system) is explicitly tracked as deferred to ptu-rule-131 with clear TODO comments rather than silently omitted.

3. **Ball modifier sign convention is correct and consistent.** Negative modifier = easier capture. This is correctly applied in `formatModifier()`, `modifierClass()`, and `ballModClass()`. The inverted CSS class naming (`mod--positive` for negative numbers) is documented with comments explaining the PTU convention.

4. **Post-capture effects are well-structured.** The Heal Ball DB update is correctly placed after the ownership update, uses real max HP, and the response correctly returns the healed HP value. Friend Ball and Luxury Ball correctly defer mechanical effects with clear descriptions and no-op behavior.

5. **Server-side validation is thorough.** accuracy roll validation (integer 1-20), ball type validation against POKE_BALL_CATALOG, owned Pokemon rejection, and fainted Pokemon rejection are all present.

6. **WebSocket broadcast includes comprehensive data** for capture events (ball type, modifiers, result, trainer name, species). The data structure is well-shaped for future Group View consumption.

7. **Commit granularity is appropriate.** 7 commits for 8 files changed, each commit covering a single logical unit of work. The implementation order follows the spec's recommended sequence.

8. **BallSelector UI uses Phosphor Icons** as required by project guidelines, with appropriate category icons (PhCircle, PhFlower, PhStar, PhTree) and condition state icons (PhCheckCircle, PhMinusCircle).

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue (CombatantCard file size), three HIGH issues (dead WebSocket broadcast, hidden warnings, hardcoded z-index), and four MEDIUM issues that should all be fixed in this cycle.

## Required Changes

1. **C1**: Extract capture section from CombatantCard.vue into a `CombatantCaptureSection.vue` component (trainer selector + CapturePanel). This reduces CombatantCard's line count and contains the capture concern.
2. **H1**: Add a `capture_attempt` handler in the Group View WebSocket composable, or remove the broadcast and file a follow-up ticket for Group View capture display.
3. **H2**: Display `warning` from `useCapture()` in CapturePanel below the capture result.
4. **H3**: Replace `z-index: 100` with `$z-index-dropdown` in CaptureRateDisplay.vue.
5. **M1**: Extract `formatModifier()` to a shared utility and import in all three components.
6. **M2**: Pass `evolutionStage`/`maxEvolutionStage` through `capturePokemonData`, or switch the preview to use the server endpoint.
7. **M3**: Include `encounterRound` from the encounter store in `CapturePanel.fullConditionContext`.
8. **M4**: Add click-outside handler to BallSelector dropdown.
