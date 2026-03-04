---
review_id: rules-review-258
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture
commits_reviewed:
  - c4dfcfa4
  - 8f14b739
  - 9b6027d3
  - f1ecce36
  - 3503e4b5
mechanics_verified:
  - capture-target-filtering
  - capture-rate-preview
  - capture-action-economy
  - capture-accuracy-check
  - capture-button-visibility
  - capture-rate-formula-delegation
  - decree-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Calculating-Capture-Rates
  - core/05-pokemon.md#Capturing-Pokemon
  - core/07-combat.md#Standard-Actions
decrees_checked:
  - decree-013
  - decree-014
  - decree-015
  - decree-042
reviewed_at: 2026-03-02T23:45:00Z
follows_up: rules-review-256
---

## Re-Review Context

This is a re-review after the fix cycle for feature-023 P1 (Player Capture UI). The previous rules-review-256 issued CHANGES_REQUIRED with one CRITICAL issue (captureTargets case mismatch). The companion code-review-280 issued CHANGES_REQUIRED with one HIGH (app-surface.md not updated) and two MEDIUM issues (hardcoded gap, missing comment on omitted params).

Five fix commits were produced by slave-1 (plan-20260302-224448). Each fix was verified by reading the source files and diffs directly.

## Fix Verification

### Fix 1: captureTargets case mismatch (rules-review-256 CRIT-1)

**Commit:** c4dfcfa4
**Previous state:** `c.side !== 'Enemies'` (capital E) at `usePlayerCombat.ts:442`
**Fixed state:** `c.side !== 'enemies'` (lowercase) at `usePlayerCombat.ts:442`
**Verification:** Read `usePlayerCombat.ts` line 442 -- now reads `if (c.side !== 'enemies') return false`. The `CombatSide` type at `types/combat.ts:20` is `'players' | 'allies' | 'enemies'` (all lowercase). The comparison now correctly matches. The JSDoc comment on line 431 was also updated from `'Enemies'` to `'enemies'`.
**Status:** RESOLVED

### Fix 2: Hardcoded gap: 4px (code-review-280 M1)

**Commit:** 8f14b739
**Previous state:** `gap: 4px` in `PlayerCapturePanel.vue` `.capture-panel__targets`
**Fixed state:** `gap: $spacing-xs` at `PlayerCapturePanel.vue:168`
**Verification:** Read `PlayerCapturePanel.vue` line 168 -- now reads `gap: $spacing-xs;`. Consistent with the project SCSS variable convention.
**Status:** RESOLVED (code quality -- not a rules issue, but verified as part of fix cycle)

### Fix 3: Missing inline comment on omitted params (code-review-280 M2)

**Commit:** 9b6027d3
**Previous state:** `estimateCaptureRate` in `usePlayerCapture.ts` omitted `evolutionStage`, `maxEvolutionStage`, `isLegendary` without explanation.
**Fixed state:** Lines 37-42 of `usePlayerCapture.ts` now contain a clear comment: "Omits evolutionStage, maxEvolutionStage, and isLegendary because the client-side Pokemon type does not carry SpeciesData fields. This makes the local estimate less accurate: evolution stage modifiers (up to -10 per stage beyond first) and legendary penalty (-30) are excluded. The server path (fetchCaptureRate) is the primary path and includes these fields via SpeciesData lookup."
**Verification:** Read `usePlayerCapture.ts` lines 37-42 -- comment is present and accurately describes the limitation.
**Status:** RESOLVED (documentation -- not a rules issue, but verified as part of fix cycle)

### Fix 4: app-surface.md not updated (code-review-280 H1)

**Commit:** f1ecce36
**Previous state:** Feature-023 entry in `app-surface.md` only documented P0 components.
**Fixed state:** The feature-023 entry at `.claude/skills/references/app-surface.md` line 164 now includes: `captureTargets` computed, `PlayerCapturePanel.vue` (two-step capture flow), `usePlayerCapture.ts` (fetchCaptureRate server wrapper + estimateCaptureRate local fallback).
**Verification:** Read `app-surface.md` line 164 -- all three P1 additions are documented in the feature-023 entry.
**Status:** RESOLVED (documentation -- not a rules issue, but verified as part of fix cycle)

### Fix 5: Resolution log update (code-review-280 / rules-review-256 tracking)

**Commit:** 3503e4b5
**Status:** Administrative commit tracking the fix cycle. No game logic changes.

## Mechanics Verified

### 1. Capture Target Filtering

- **Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them." (`core/05-pokemon.md#Capturing-Pokemon`, p.214)
- **Implementation:** `captureTargets` computed in `usePlayerCombat.ts:437-446` filters to `c.type === 'pokemon'`, `c.side !== 'enemies'` returns false (correctly excludes non-enemy), and `pokemon.currentHp > 0`. After the c4dfcfa4 fix, the filter correctly identifies enemy Pokemon on the `'enemies'` side.
- **Status:** CORRECT -- The CRIT-1 case mismatch is fully resolved. The filter now matches the `CombatSide` type definition exactly.

### 2. Capture Rate Preview

- **Rule:** "A Pokemon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity." (`core/05-pokemon.md#Calculating-Capture-Rates`, p.214)
- **Implementation:** `usePlayerCapture.ts` provides two paths: `fetchCaptureRate()` calls the server endpoint with full SpeciesData access (evolution stages, legendary status), and `estimateCaptureRate()` is a local fallback using `calculateCaptureRateLocal` with safe defaults.
- **Status:** CORRECT -- The server path produces accurate capture rates. The local fallback is explicitly documented as an estimate (fix 9b6027d3 added the explanatory comment). Per decree-013, the 1d100 system is used exclusively via the existing `calculateCaptureRate()` from `captureRate.ts`.

### 3. Capture Action Economy (Standard Action)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#Capturing-Pokemon`, p.214)
- **Implementation:** The capture button in `PlayerCombatActions.vue:201` is `:disabled="!canUseStandardAction || !canBeCommanded || captureTargets.length === 0"`. The action-cost reminder in `PlayerCapturePanel.vue:59-62` displays "Standard Action (AC 6 accuracy check)".
- **Status:** CORRECT -- Standard Action gating is properly enforced. The UI accurately informs the player of the action cost.

### 4. Capture Accuracy Check (AC 6)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md`, p.214)
- **Implementation:** The player side sends a capture request via WebSocket. The GM side handles the accuracy roll via `rollAccuracyCheck()` in `useCapture.ts:239-261`. This function rolls 1d20: natural 1 always misses, natural 20 always hits, otherwise `roll >= 6` (AC 6).
- **Status:** CORRECT with known limitation -- The AC 6 check is correctly implemented. Per decree-042, the full accuracy system (thrower accuracy stages, target Speed Evasion, flanking, rough terrain) should eventually apply to Poke Ball throws. The code at `useCapture.ts:235-237` documents this gap with a NOTE citing decree-042 and tracking it as ptu-rule-131. This is an accepted deferral, not a rules violation in P1 scope.

### 5. Capture Button Visibility

- **Rule:** Only trainers can throw Poke Balls. In League Battles, trainer actions occur during the trainer phase. (`core/05-pokemon.md`, p.214; `core/07-combat.md#League-Battles`, p.227)
- **Implementation:** `canShowCapture` computed in `PlayerCombatActions.vue:405-409` returns `false` if `isActivePokemon` (Pokemon combatants) or if it is a League Battle not in the trainer phase.
- **Status:** CORRECT -- Pokemon combatants cannot see or access the capture button. League Battle phase restrictions are properly enforced.

### 6. Capture Rate Formula Delegation

- **Rule:** Full capture rate formula (`core/05-pokemon.md`, p.214): base 100, subtract level x 2, HP modifier (-30/+0/-15/+15/+30), evolution modifier (+10/0/-10), rarity modifiers (-10 shiny, -30 legendary), status modifiers (+10 persistent, +5 volatile, +10 stuck, +5 slow, +5 injury).
- **Implementation:** P1 does not reimplement the capture rate formula. `usePlayerCapture.ts` delegates entirely to `useCapture.ts` which calls `calculateCaptureRate()` from `captureRate.ts`. This formula was verified correct in rules-review-251 during P0 review.
- **Status:** CORRECT -- No formula duplication or deviation. The capture rate calculation chain is intact.

### 7. Decree Compliance

| Decree | Status | Verification |
|--------|--------|-------------|
| decree-013 | COMPLIANT | 1d100 capture system used exclusively. `calculateCaptureRate()` implements the core formula from PTU p.214. No d20 playtest system referenced anywhere in P1 code. |
| decree-014 | COMPLIANT | Stuck (+10) and Slow (+5) handled as separate modifiers in `captureRate.ts`. Not stacked with volatile +5 bonus. The `estimateCaptureRate` passes raw `statusConditions` which are correctly categorized by the underlying utility. |
| decree-015 | COMPLIANT | `pokemon.maxHp` (real max HP from the Pokemon model) is used in both `estimateCaptureRate` (line 46) and the server endpoint. No injury-reduced effective max HP substitution. |
| decree-042 | ACKNOWLEDGED | Per decree-042, Poke Ball throws should use the full accuracy system. The current `rollAccuracyCheck()` is a flat d20 vs AC 6 without accuracy/evasion modifiers. This is documented in `useCapture.ts:235-237` with a NOTE citing decree-042, and tracked as ptu-rule-131 for future implementation. The P1 scope only adds the player-side capture UI; the accuracy system integration is a separate ticket. No decree violation -- the gap is acknowledged and tracked. |

## No New Issues Introduced

Verified that the five fix commits introduce no new rules-relevant problems:

1. **c4dfcfa4** -- Single-line change from `'Enemies'` to `'enemies'` plus JSDoc update. No new logic introduced.
2. **8f14b739** -- CSS variable replacement only. No game logic affected.
3. **9b6027d3** -- Comment-only addition. No logic changes.
4. **f1ecce36** -- Documentation file update. No code changes.
5. **3503e4b5** -- Resolution log update. No code changes.

The entire capture flow was re-verified: target filtering, rate preview (server + local fallback), action economy gating, accuracy check delegation, button visibility, formula delegation, and decree compliance. All mechanics remain correct after the fix cycle.

## Summary

All four issues from the previous review cycle are fully resolved:

- **rules-review-256 CRIT-1** (captureTargets case mismatch): Fixed in c4dfcfa4. The `'enemies'` comparison now matches the `CombatSide` type, making capture target filtering functional.
- **code-review-280 H1** (app-surface.md): Fixed in f1ecce36. P1 components documented.
- **code-review-280 M1** (hardcoded gap): Fixed in 8f14b739. Uses `$spacing-xs` now.
- **code-review-280 M2** (omitted params comment): Fixed in 9b6027d3. Clear explanatory comment added.

No new issues were introduced. All PTU capture mechanics verified correct. All four capture-related decrees (013, 014, 015, 042) are compliant.

## Verdict

**APPROVED**

The P1 Player Capture UI correctly implements PTU 1.05 capture mechanics. The critical case-mismatch bug that rendered the feature non-functional has been fixed. The capture flow -- target selection, rate preview, Standard Action gating, accuracy check delegation, trainer-only visibility, League Battle phase awareness -- is fully operational and rules-compliant.
