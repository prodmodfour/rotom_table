---
review_id: rules-review-113
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-058
domain: experience-and-significance
commits_reviewed:
  - ee1a0bd
  - 353f342
  - de4339e
  - 478b91e
  - ece9de3
  - 0dcafb3
  - 7c51539
  - 645e8e4
  - 9c1ddad
  - 391eeb4
  - 34299b1
mechanics_verified:
  - significance-multiplier-ranges
  - xp-calculation-formula
  - significance-presets
  - difficulty-adjustment
  - boss-encounter-xp
  - xp-distribution-modal-defaults
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/11-running-the-game.md#Page-460-Significance-Multiplier
  - core/11-running-the-game.md#Page-460-Calculating-Pokemon-Experience
  - core/11-running-the-game.md#Page-473-Basic-Encounter-Creation-Guidelines
  - core/11-running-the-game.md#Page-489-Boss-Experience-and-Rewards
reviewed_at: 2026-02-21T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Significance Multiplier Ranges

- **Rule:** "The Significance Multiplier should range from x1 to about x5" (`core/11-running-the-game.md#Page-460`)
  - "Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5."
  - "'Average' everyday encounters should be about x2 or x3."
  - "More significant encounters may range anywhere from x4 to x5 depending on their significance"
- **Implementation:** `SIGNIFICANCE_PRESETS` in `app/utils/experienceCalculation.ts:59-66`:
  ```typescript
  export const SIGNIFICANCE_PRESETS = {
    insignificant: 1,     // PTU: x1 to x1.5
    below_average: 1.5,   // PTU: upper end of insignificant
    average: 2,           // PTU: x2 or x3
    above_average: 3,     // PTU: upper end of average
    significant: 4,       // PTU: x4 to x5
    major: 5,             // PTU: x5 or even higher
  } as const
  ```
  UI labels in `SignificancePanel.vue:27-33`:
  - Insignificant - x1.0
  - Minor - x1.5
  - Everyday - x2.0
  - Notable - x3.0
  - Significant - x4.0
  - Climactic - x5.0
  - Custom (freeform)
- **Status:** CORRECT

  The preset values align well with the PTU text. The six-tier breakdown is a reasonable discretization of the continuous x1-x5 range described in the rulebook. The "Custom" option allows GMs to set any value (0.5 to 10), which accommodates the rulebook's note that "a decisive battle against a Rival or in the top tiers of a tournament might be worth x5 or **even higher**!" The upper bound of 10 provides generous headroom.

### 2. XP Calculation Formula

- **Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience." (`core/11-running-the-game.md#Page-460`)
- **Implementation:** `calculateEncounterXp()` in `app/utils/experienceCalculation.ts:239-280`:
  ```typescript
  // Step 1: Total enemy levels (trainers counted as 2x)
  const enemies = defeatedEnemies.map(enemy => ({
    ...
    xpContribution: enemy.isTrainer ? enemy.level * 2 : enemy.level
  }))
  const enemyLevelsTotal = enemies.reduce(
    (sum, enemy) => sum + enemy.xpContribution, 0
  )
  // Step 2: Apply significance multiplier
  const multipliedXp = Math.floor(enemyLevelsTotal * significanceMultiplier)
  // Step 3: Divide by players (unless boss encounter)
  const perPlayerXp = isBossEncounter
    ? multipliedXp
    : Math.floor(multipliedXp / Math.max(1, playerCount))
  ```
- **Status:** CORRECT

  The three-step formula exactly matches PTU Core p.460. Trainers count as 2x level. The significance multiplier is applied as a direct multiplier on the base. Division by player count uses `Math.floor` which matches the standard PTU convention of rounding down. The `Math.max(1, playerCount)` guard prevents division by zero.

  **Verification with the rulebook example:** "if your players fought a Level 10 Trainer with a level 20 Pokemon, Base Experience Value for this encounter is 40." Code: Trainer contribution = 10 * 2 = 20, Pokemon contribution = 20, total = 40. MATCHES.

  **Verification with p.473 example:** "six Level 20 Pokemon" with 3 players and 2x significance. Code: enemyLevelsTotal = 120, multipliedXp = floor(120 * 2) = 240, perPlayerXp = floor(240 / 3) = 80. Book says "each player gets 80 Experience." MATCHES.

### 3. Difficulty Adjustment Slider

- **Rule:** "Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge." (`core/11-running-the-game.md#Page-460`)
- **Implementation:** `SignificancePanel.vue:49-69` provides a range slider from -1.5 to +1.5 in 0.5 increments, additive to the base significance preset. Final significance is `baseSignificance + difficultyAdjustment`, clamped to minimum 0.5.
- **Status:** CORRECT

  The rulebook says "Lower or raise the significance a little, by x0.5 to x1.5." The implementation allows -1.5 to +1.5, which captures both lowering and raising. The range perfectly matches the PTU guideline. The additive approach (not multiplicative) is correct per the rulebook's intent — the text says to "lower or raise" the significance value by that amount.

### 4. Boss Encounter XP

- **Rule:** "When awarding Experience for a Boss encounter, do not divide the Experience from the Boss Enemy itself by the number of players." (`core/11-running-the-game.md#Page-489`)
- **Implementation:** The `isBossEncounter` boolean toggle in both `SignificancePanel.vue:97-106` and `XpDistributionModal.vue:82-89` skips the division step when enabled. In `calculateEncounterXp()`: `isBossEncounter ? multipliedXp : Math.floor(multipliedXp / Math.max(1, playerCount))`.
- **Status:** CORRECT

  The implementation correctly skips player division for boss encounters, matching PTU Core p.489. The UI label "Boss Encounter (XP not divided by players)" accurately describes the mechanic.

### 5. XP Distribution Modal Default Significance

- **Rule:** No specific PTU rule — this is a UX concern. The modal should default to the encounter's persisted significance so the GM doesn't have to re-enter it.
- **Implementation:** `XpDistributionModal.vue:327`:
  ```typescript
  const persistedSignificance = props.encounter.significanceMultiplier ?? 2
  const selectedPreset = ref<SignificancePreset | 'custom'>(
    resolvePresetFromMultiplier(persistedSignificance)
  )
  ```
  When no significance has been persisted, defaults to 2 (the "average/everyday" tier per PTU).
- **Status:** CORRECT

  The fallback of 2.0 is a sensible default matching the "everyday" tier from PTU p.460 ("'Average' everyday encounters should be about x2 or x3").

### 6. Significance Persistence and Serialization

- **Rule:** No specific PTU rule — this is infrastructure supporting the XP mechanic.
- **Implementation:**
  - Prisma schema: `significanceMultiplier Float @default(1.0)` — DB default of 1.0 (insignificant)
  - Encounter service serialization (`encounter.service.ts:224`): `significanceMultiplier: record.significanceMultiplier ?? 1.0`
  - List endpoint (`index.get.ts:38`): `significanceMultiplier: e.significanceMultiplier ?? 1.0`
  - PUT undo/redo path (`[id].put.ts:43`): `significanceMultiplier: body.significanceMultiplier ?? 1.0`
  - WebSocket sync: significance is included in the full encounter serialization via `encounter.service.ts`
  - Type interface (`encounter.ts:139`): `significanceMultiplier: number`
- **Status:** CORRECT

  All serialization paths include significanceMultiplier with consistent fallback to 1.0. The undo/redo path correctly preserves the significance value during encounter snapshot restoration.

### 7. Server-Side Validation

- **Rule:** PTU says "x1 to about x5" with "x5 or even higher" for extreme cases. The difficulty adjustment can add up to +1.5.
- **Implementation:** `significance.put.ts:21-31` and `xp-calculate.post.ts:27-31` both validate `0.5 <= significanceMultiplier <= 10`.
- **Status:** CORRECT

  The validation range of 0.5-10 is appropriate. The minimum of 0.5 accommodates the case where an insignificant encounter (x1) gets the maximum difficulty reduction (-1.5), clamped by the client to 0.5. The maximum of 10 provides generous headroom beyond the PTU-suggested x5 cap for extreme campaign scenarios. The client also clamps at 0.5 minimum (`Math.max(0.5, ...)` in `SignificancePanel.vue:229`).

## Summary

The ptu-rule-058 P1 implementation is a faithful representation of the PTU 1.05 experience and significance mechanics from Core p.460, p.473, and p.489. All critical formulas are correct:

1. **Base XP = sum of enemy levels (trainers 2x)** -- correctly implemented
2. **Multiplied XP = Base XP * significance multiplier** -- correctly implemented with floor rounding
3. **Per-player XP = Multiplied XP / player count** -- correctly implemented with floor rounding
4. **Boss encounters skip the division step** -- correctly implemented per p.489
5. **Significance presets (x1-x5)** -- faithful discretization of the continuous range in the rulebook
6. **Difficulty adjustment (+/- 0.5 to 1.5)** -- matches the rulebook's guidance exactly
7. **XP Distribution Modal defaults to persisted significance** -- correct UX behavior

The implementation uses the proven `captureRate.ts` pattern: typed inputs, typed results with full breakdown, pure functions, zero side effects. The experience chart values have been verified against the PTU Core p.497 chart.

## Rulings

**RULING 1 (Informational): Preset label "Climactic" for x5.0**
The rulebook uses "significant" as the label for x4-x5 range encounters, not "Climactic." The implementation uses "Significant" for x4.0 and "Climactic" for x5.0. This is a reasonable UX differentiation — the rulebook's single "significant" label would be confusing as both a tier name and a generic adjective. "Climactic" as a label for x5 is fine; it evokes the "decisive battle against a Rival" example from the text.

**RULING 2 (Informational): Floor rounding on multiplied XP**
The code applies `Math.floor()` after multiplying by the significance multiplier (line 260) AND after dividing by player count (line 265). PTU does not specify rounding behavior for fractional XP. Flooring at both steps is the conservative (player-slightly-unfavorable) choice. This is standard TTRPG convention and acceptable. The alternative (only flooring once, at the end) would give marginally more XP in some edge cases but the difference is at most 1 XP.

## Medium Issues

### M1: SignificancePanel default significance differs from XpDistributionModal default

**SignificancePanel.vue:200** defaults to `props.encounter.significanceMultiplier ?? 1.0` (insignificant), while **XpDistributionModal.vue:327** defaults to `props.encounter.significanceMultiplier ?? 2` (everyday). Both use the encounter's persisted value when available, but the fallback differs. This inconsistency only matters for encounters that were created before the significanceMultiplier column existed (legacy encounters) or encounters where it was never explicitly set. This is unlikely to cause real issues since the Prisma schema defaults to 1.0, so legacy encounters will typically have 1.0 persisted. But the inconsistency is worth noting for code hygiene.

**Recommendation:** Align both fallbacks to the same value. The DB schema defaults to 1.0, so both should use `?? 1.0` for consistency.

### M2: UI preset labels diverge between SignificancePanel and XpDistributionModal

**SignificancePanel.vue** uses hardcoded `<option>` elements with friendly labels ("Insignificant", "Minor", "Everyday", "Notable", "Significant", "Climactic"), while **XpDistributionModal.vue** uses `formatPresetLabel()` which auto-generates labels from the key names ("Insignificant", "Below Average", "Average", "Above Average", "Significant", "Major"). A GM switching between the two views would see different names for the same presets, which could be confusing. This is a UX concern rather than a rules correctness issue.

**Recommendation:** Extract preset labels into the `experienceCalculation.ts` utility alongside the preset values, and use them in both components.

## Verdict

**APPROVED** -- No critical or high PTU rules issues found. The significance multiplier ranges, XP calculation formula, boss encounter behavior, and difficulty adjustment all correctly implement PTU Core p.460/p.473/p.489. Two medium-severity consistency issues noted for code hygiene but do not affect PTU rule correctness.

## Required Changes

None required for PTU correctness. The two MEDIUM issues are code hygiene recommendations that can be addressed in a future cleanup pass.
