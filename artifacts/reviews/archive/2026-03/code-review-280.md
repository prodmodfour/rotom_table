---
review_id: code-review-280
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture
commits_reviewed:
  - b7dccd45
  - 90367c35
  - f8974ca8
  - ee08addf
files_reviewed:
  - app/composables/usePlayerCapture.ts
  - app/composables/usePlayerCombat.ts
  - app/components/player/PlayerCapturePanel.vue
  - app/components/player/PlayerCombatActions.vue
  - app/assets/scss/components/_player-combat-actions.scss
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-02T15:10:00Z
follows_up: code-review-275
---

## Review Scope

Feature-023 P1: Player Capture UI. Four commits implementing Sections E/F/G/H of `design-player-capture-healing-001/spec-p1.md`. Adds the "Throw Poke Ball" button and two-step capture flow (target select, rate preview, confirm request) to the player combat interface.

**Decrees checked:** decree-013 (1d100 capture system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-032 (Cursed tick -- not directly applicable to capture UI). All applicable decrees are respected: the capture rate preview uses the existing `getCaptureRate` server endpoint and `calculateCaptureRateLocal` utility, both of which implement the 1d100 system with real max HP and separate Stuck/Slow modifiers. No decree violations.

**Prior review:** code-review-275 APPROVED P0 with 0 issues.

## Issues

### HIGH

#### H1. `app-surface.md` not updated with P1 components

**File:** `.claude/skills/references/app-surface.md` line 164

The feature-023 entry in `app-surface.md` only documents P0 components (PlayerRequestPanel, usePlayerRequestHandlers, useSwitchModalState). The P1 additions are missing:

- `components/player/PlayerCapturePanel.vue` (target selector + capture rate preview + request confirm)
- `composables/usePlayerCapture.ts` (player-side capture rate preview wrapper)
- `usePlayerCombat.ts` now exports `captureTargets` computed

The review checklist explicitly requires: "If new endpoints/components/routes/stores: was `app-surface.md` updated?" This was not done. The feature-023 entry on line 164 must be updated to include the new P1 player-side components alongside the existing P0 GM-side components.

**Fix:** Append to the feature-023 entry in `app-surface.md`: mention `PlayerCapturePanel.vue` (two-step capture flow -- target select, rate preview, request confirm), `usePlayerCapture.ts` (fetchCaptureRate server wrapper + estimateCaptureRate local fallback), and `captureTargets` computed in `usePlayerCombat.ts`.

---

### MEDIUM

#### M1. Hardcoded `gap: 4px` instead of SCSS variable

**File:** `app/components/player/PlayerCapturePanel.vue` line 168

```scss
&__targets {
    display: flex;
    flex-direction: column;
    gap: 4px;  // Should be $spacing-xs
}
```

The project's SCSS variables define `$spacing-xs: 0.25rem` (equivalent to 4px at default root). All other gap/padding values in the same component correctly use SCSS variables (`$spacing-xs`, `$spacing-sm`, etc.). This one instance uses a hardcoded pixel value, violating the project's "no hardcoded values" coding style rule.

**Fix:** Change `gap: 4px` to `gap: $spacing-xs`.

---

#### M2. `estimateCaptureRate` omits `evolutionStage`, `maxEvolutionStage`, and `isLegendary` -- deviation from design spec

**File:** `app/composables/usePlayerCapture.ts` lines 37-44

The design spec (Section G) calls for:
```typescript
return calculateCaptureRateLocal({
    // ...
    evolutionStage: pokemon.evolutionStage,
    maxEvolutionStage: pokemon.maxEvolutionStage,
    // ...
    isLegendary: pokemon.isLegendary ?? false
})
```

The implementation omits these three parameters entirely, relying on `calculateCaptureRateLocal` defaults (`evolutionStage: 1`, `maxEvolutionStage: 3`, `isLegendary: false`). This is understandable because the client-side `Pokemon` interface (`types/character.ts`) does not have these fields -- they exist only on `SpeciesData`. The developer correctly recognized this limitation.

However, this means the local fallback estimate will always apply the maximum evolution penalty (-10 for stage 1 of 3) and will never apply the legendary penalty (-30). For a fully evolved Pokemon (stage 3/3, modifier: 0) the local estimate could be off by -10. For legendaries, it could be off by -30.

This is not a correctness bug per se -- the server-side `fetchCaptureRate` is the primary path and has full data. The local fallback is explicitly documented as an estimate. But the code should include a comment explaining WHY these fields are omitted and what the accuracy implications are, so future developers don't treat the local estimate as authoritative.

**Fix:** Add a brief inline comment above the `calculateCaptureRateLocal` call explaining the omitted fields:
```typescript
// evolutionStage, maxEvolutionStage, and isLegendary are not available
// on the client-side Pokemon type (only in SpeciesData). Defaults are used:
// evolutionStage=1, maxEvolutionStage=3, isLegendary=false.
// This can undercount the capture rate by up to -10 (evolution) or -30 (legendary).
// The server-side fetchCaptureRate (primary path) has accurate values.
```

---

## What Looks Good

1. **Correct filter logic (Section F).** `captureTargets` properly filters to `type === 'pokemon'`, `side === 'Enemies'`, and `currentHp > 0`. This is the exact PTU restriction -- only wild Pokemon on the enemy side can be captured.

2. **Two-step flow is clean (Section E).** The `PlayerCapturePanel` correctly implements target select -> rate preview -> confirm. The `v-if="!selectedTarget"` / `v-else` template split is clear and maintainable. The loading state while fetching the rate is properly shown.

3. **Server-first with local fallback (Section G).** `usePlayerCapture` tries `fetchCaptureRate` (server, accurate) first, then falls back to `estimateCaptureRate` (local, approximate). The fallback handles the case where the server is unreachable, and the null-check on `serverRate` properly triggers the fallback.

4. **Guard correctness.** The capture button is properly disabled when `!canUseStandardAction || !canBeCommanded || captureTargets.length === 0`. The `canShowCapture` computed correctly hides the button for Pokemon combatants and during the Pokemon phase of League Battles. `confirmCapture` has null guards for both `selectedTarget` and `myActiveCombatant`.

5. **Turn-end cleanup.** The `watch(isMyTurn)` handler now includes `showCapturePanel.value = false`, matching the existing pattern for Item/Switch/Maneuver panels. Component destruction on panel close resets all local refs (`selectedTarget`, `captureRateData`, `requestPending`).

6. **WebSocket integration matches P0 infrastructure.** The `requestCapture` call in `usePlayerCombat.ts` correctly builds a `PlayerActionRequest` with `action: 'capture'` and all required fields (`targetPokemonId`, `targetPokemonName`, `ballType` defaulting to `DEFAULT_BALL_TYPE`, `captureRatePreview`, `trainerCombatantId`). This matches the `PlayerActionRequest` interface in `player-sync.ts`.

7. **Immutability patterns followed.** No reactive object mutations detected. All state updates use `.value =` assignment.

8. **Commit granularity.** Four focused commits, each mapping to one design section (F, G, E, H). Clean separation of concerns.

9. **Decree compliance.** Per decree-013, the 1d100 capture system is used (via existing `calculateCaptureRate` utility). Per decree-015, real max HP is used (the `maxHp` field on `Pokemon` is the real maximum, not injury-adjusted). Per decree-014, Stuck/Slow bonuses are handled by the existing `captureRate.ts` which treats them separately from volatile conditions.

10. **File sizes within limits.** `PlayerCapturePanel.vue` (225 lines), `usePlayerCapture.ts` (53 lines), `usePlayerCombat.ts` (512 lines), `PlayerCombatActions.vue` (614 lines) -- all under the 800-line maximum.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue (app-surface.md not updated) and two MEDIUM issues (hardcoded CSS value, missing documentation comment on local estimate limitations). The HIGH issue is required by the review checklist for any new components/composables and must be addressed. The MEDIUM issues should be fixed in the same pass.

## Required Changes

1. **[H1]** Update `app-surface.md` line 164 feature-023 entry to include `PlayerCapturePanel.vue`, `usePlayerCapture.ts`, and `captureTargets` in `usePlayerCombat.ts`.
2. **[M1]** Replace `gap: 4px` with `gap: $spacing-xs` in `PlayerCapturePanel.vue` line 168.
3. **[M2]** Add inline comment in `usePlayerCapture.ts` above the `calculateCaptureRateLocal` call explaining the omitted evolution/legendary fields and their accuracy impact.
