---
review_id: rules-review-256
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture
commits_reviewed:
  - b7dccd45
  - 90367c35
  - f8974ca8
  - ee08addf
mechanics_verified:
  - capture-target-filtering
  - capture-rate-preview
  - capture-action-economy
  - capture-accuracy-check
  - capture-button-visibility
  - capture-rate-formula-delegation
  - turn-cleanup
  - decree-compliance
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Capturing-Pokemon
  - core/07-combat.md#Standard-Actions
  - errata-2.md#Page-8
decrees_checked:
  - decree-013
  - decree-014
  - decree-015
reviewed_at: 2026-03-02T15:10:00Z
follows_up: rules-review-251
---

## Mechanics Verified

### 1. Capture Target Filtering (Section F)

- **Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them." (`core/05-pokemon.md#Capturing-Pokemon`, p.214)
- **Implementation:** `captureTargets` computed in `usePlayerCombat.ts:437-446` filters to `c.type === 'pokemon'`, `c.side === 'Enemies'`, and `pokemon.currentHp > 0`.
- **Status:** INCORRECT

**CRITICAL BUG:** The `CombatSide` type is defined as `'players' | 'allies' | 'enemies'` (all lowercase) in `app/types/combat.ts:20`. The `captureTargets` computed checks `c.side !== 'Enemies'` (capital E) at `usePlayerCombat.ts:442`. Since `c.side` is always lowercase `'enemies'`, the comparison `'enemies' !== 'Enemies'` evaluates to `true`, causing the filter to return `false` for every combatant. **The `captureTargets` array will always be empty**, making the entire capture feature non-functional.

Every other usage of the enemies side across the codebase uses lowercase `'enemies'`:
- `encounter.ts` store: `c.side === 'enemies'` (line 80)
- `CombatantCard.vue`: `props.combatant.side !== 'enemies'` (line 378)
- `MoveTargetModal.vue`: `target.side === 'enemies'` (line 58)
- `TargetSelector.vue`: `target.side === 'enemies'` (line 12)
- Server-side: `combatant.side === 'enemies'` consistently

**Note:** This bug originates from the design spec (`spec-p1.md` Section F, line 128) which uses `'Enemies'` with a capital E. The developer faithfully implemented the spec. The spec itself contains the error.

### 2. Capture Rate Preview (Section G)

- **Rule:** "A Pokemon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity." (`core/05-pokemon.md#Calculating-Capture-Rates`, p.214)
- **Implementation:** `usePlayerCapture.ts` wraps `useCapture` with two paths: `fetchCaptureRate()` calls the server endpoint (full SpeciesData for accurate evolution/legendary info), and `estimateCaptureRate()` falls back to local calculation with defaults.
- **Status:** CORRECT

The `fetchCaptureRate` path delegates to `getCaptureRate(pokemon.id)` which calls `/api/capture/rate` -- this endpoint has full access to SpeciesData for evolution stage, weight class, types, and auto-detects legendary status. Per decree-013, the 1d100 system is used exclusively, and the rate endpoint uses `calculateCaptureRate()` from `captureRate.ts` which implements the core 1d100 formula.

The `estimateCaptureRate` fallback correctly omits `evolutionStage`/`maxEvolutionStage`/`isLegendary` fields (not present on the client-side `Pokemon` interface), letting `calculateCaptureRateLocal` use safe defaults (`evolutionStage: 1`, `maxEvolutionStage: 3`). This produces a slightly optimistic estimate, which is acceptable for a preview that the server will recalculate at capture time.

Per decree-015, real max HP is used for capture rate HP percentage calculations. The `estimateCaptureRate` passes `pokemon.maxHp` (real max HP from the Pokemon model), not any injury-reduced effective max. The server endpoint also uses the Pokemon record's `maxHp` field. Compliant.

Per decree-014, Stuck/Slow capture bonuses are separate from volatile. The `estimateCaptureRate` passes raw `statusConditions`, and the underlying `calculateCaptureRate` function handles Stuck (+10) and Slow (+5) as separate modifiers (lines 135-140 of `captureRate.ts`). Compliant.

### 3. Capture Action Economy (Standard Action)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#Capturing-Pokemon`, p.214)
- **Implementation:** The capture button in `PlayerCombatActions.vue:201` is `:disabled="!canUseStandardAction || !canBeCommanded || captureTargets.length === 0"`. The `canUseStandardAction` computed checks `!turnState.value.standardActionUsed`. The GM-side handler in `usePlayerRequestHandlers.ts:60-185` consumes the Standard Action via the `/api/encounters/{id}/action` endpoint after both miss and hit scenarios.
- **Status:** CORRECT

Standard Action consumption is correctly gated. The action-cost reminder in the `PlayerCapturePanel` ("Standard Action (AC 6 accuracy check)") accurately informs the player.

### 4. Capture Accuracy Check (AC 6)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#Capturing-Pokemon`, p.214); "If you roll a Natural 20 on this Accuracy Check, subtract 10 from the Poke Ball Capture Roll."
- **Implementation:** The accuracy check is delegated to the GM side via `usePlayerRequestHandlers.ts:81` which calls `rollAccuracyCheck()` from `useCapture.ts:234-255`. This function rolls 1d20, checks natural 1 (always miss) and natural 20 (always hit), and otherwise requires `roll >= 6` to hit (AC 6). On miss, Standard Action is still consumed (lines 86-96 of `usePlayerRequestHandlers.ts`).
- **Status:** CORRECT

The player side correctly does NOT roll accuracy -- it only requests the capture. The GM side handles the full mechanical flow (accuracy roll, then capture attempt if hit). This is consistent with the GM-approval architecture.

### 5. Capture Button Visibility

- **Rule:** "Poke Balls can be thrown as a Standard Action" (`core/05-pokemon.md`, p.214) -- only Trainers throw Poke Balls. In League Battles, trainer actions occur during the trainer phase (`core/07-combat.md#League-Battles`, p.227).
- **Implementation:** `canShowCapture` computed in `PlayerCombatActions.vue:405-409` returns `false` if `isActivePokemon` (Pokemon can't throw balls) or if it's a League Battle not in the trainer phase.
- **Status:** CORRECT

Pokemon combatants cannot see or use the capture button. During League Battles, the button is hidden during the Pokemon phase. This correctly models PTU rules: only trainers can throw Poke Balls, and in League Battles, trainers act during the trainer phase.

### 6. Capture Rate Formula Delegation

- **Rule:** Full capture rate formula (`core/05-pokemon.md`, p.214): base 100, subtract level x 2, HP modifier, evolution modifier, rarity modifier, status/injury modifiers.
- **Implementation:** P1 does not reimplement the formula. `usePlayerCapture.ts` delegates entirely to `useCapture.ts` which calls `calculateCaptureRate()` from `captureRate.ts` (verified correct in rules-review-251 during P0 review).
- **Status:** CORRECT

No formula duplication. The player capture flow is a thin wrapper over the existing P0 capture infrastructure.

### 7. Turn-End Cleanup

- **Rule:** PTU turn progression -- when a turn ends, action UI state should reset.
- **Implementation:** `PlayerCombatActions.vue:596-605` watches `isMyTurn` and resets all panel states including `showCapturePanel` when the turn ends. `PlayerCapturePanel` also has `requestPending` state that prevents double-submission.
- **Status:** CORRECT

### 8. Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-013 | COMPLIANT | 1d100 capture system used exclusively. Capture rate preview uses `calculateCaptureRate()` which is the core 1d100 formula. No d20 playtest system anywhere. |
| decree-014 | COMPLIANT | Stuck/Slow handled as separate modifiers in `captureRate.ts:135-140`. Not treated as volatile. |
| decree-015 | COMPLIANT | `pokemon.maxHp` (real max HP) used in both `estimateCaptureRate` and server endpoint. No injury-reduced effective max HP substitution. |
| decree-032 | NOT APPLICABLE | Cursed tick mechanic is unrelated to capture flow. |

## Issues

### CRITICAL-1: `captureTargets` case mismatch makes capture non-functional

**File:** `app/composables/usePlayerCombat.ts:442`
**Rule:** Capture requires targeting enemy Pokemon (`core/05-pokemon.md`, p.214)
**Expected:** `c.side !== 'enemies'` (lowercase, matching `CombatSide` type)
**Actual:** `c.side !== 'Enemies'` (capitalized, never matches any combatant)
**Impact:** The `captureTargets` computed always returns an empty array. The capture button is permanently disabled (`:disabled="... || captureTargets.length === 0"`). Players cannot initiate capture at all. This renders the entire P1 capture feature inoperative.

**Fix:** Change line 442 from `if (c.side !== 'Enemies') return false` to `if (c.side !== 'enemies') return false`.

**Root cause:** The design spec `spec-p1.md` Section F (line 128) uses `'Enemies'` with capital E. The developer faithfully implemented the spec. Recommend also fixing the spec to prevent recurrence.

## Summary

The P1 implementation correctly models PTU capture mechanics in all respects except one: a case-sensitivity bug in the `captureTargets` filter that makes the entire capture feature non-functional. The two-step flow (target select -> rate preview -> confirm), the GM-approval architecture, the Standard Action gating, the accuracy check delegation, the capture rate preview with server/local fallback, the trainer-only visibility, the League Battle phase awareness, and the turn-end cleanup are all correctly implemented per PTU 1.05 rules.

The capture rate calculation chain is sound: `usePlayerCapture` -> `useCapture` -> `calculateCaptureRate()` (core 1d100 formula, verified in P0). No formula duplication or deviation. All three capture-related decrees (013, 014, 015) are compliant.

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue must be fixed: the `'Enemies'` vs `'enemies'` case mismatch in `captureTargets`. This is a single-character fix but it completely blocks the feature.

## Required Changes

1. **CRITICAL-1:** In `app/composables/usePlayerCombat.ts:442`, change `'Enemies'` to `'enemies'` to match the `CombatSide` type definition. This single fix will make the capture target filtering operational.
