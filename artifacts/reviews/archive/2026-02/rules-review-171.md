---
review_id: rules-review-171
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-086+087+088
domain: capture, pokemon-lifecycle, encounter-tables
commits_reviewed:
  - 569d030
  - 00b2f1f
  - 9f0ff20
  - 372b9b1
mechanics_verified:
  - capture-modifier-sign
  - tutor-point-generation
  - significance-tier-presets
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#capture-rate (p.214)
  - core/05-pokemon.md#tutor-points (p.204)
  - core/09-gear-and-items.md#poke-ball-chart (p.272)
  - core/11-running-the-game.md#significance-multiplier (p.457-458)
reviewed_at: 2026-02-27T09:30:00+00:00
follows_up: (none -- first review)
---

## Mechanics Verified

### 1. Capture Modifier Sign Convention (ptu-rule-086)

- **Rule (PTU Core p.214):**
  > "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features."

  The Poke Ball Chart (Core p.272) lists ball modifiers as:
  - Basic Ball: `+0`
  - Great Ball: `-10`
  - Ultra Ball: `-15`
  - Master Ball: `-100`

  The PTU text says "subtract...any modifiers." When the modifier is already negative (e.g., Great Ball = -10), subtracting a negative would cause a double-negative (`roll - (-10) = roll + 10`), which makes capture *harder* -- the opposite of the intent. The ball values are clearly designed so that better balls have more negative modifiers, meaning they should reduce the modified roll, making it easier to fall under the capture rate.

- **Decree check:** Per decree-013, the app uses the core 1d100 capture system (not errata d20). The fix operates within this system. No decree conflict.

- **Implementation (app/utils/captureRate.ts, line 201):**
  ```typescript
  // Modified roll = roll - trainer level + modifiers
  // PTU ball modifiers are negative (e.g., Great Ball = -10), so adding them
  // correctly reduces the roll, making capture easier.
  const modifiedRoll = roll - trainerLevel + modifiers
  ```

  **Before fix:** `roll - trainerLevel - modifiers` -- for Great Ball (-10): `roll - level - (-10) = roll - level + 10` (capture harder, WRONG)
  **After fix:** `roll - trainerLevel + modifiers` -- for Great Ball (-10): `roll - level + (-10) = roll - level - 10` (capture easier, CORRECT)

- **Verification with PTU examples:**
  The formula `roll - trainerLevel + modifiers` correctly handles:
  - Basic Ball (+0): `roll - level + 0 = roll - level` (no change, correct)
  - Great Ball (-10): `roll - level - 10` (roll reduced by 10, easier capture, correct)
  - Ultra Ball (-15): `roll - level - 15` (roll reduced by 15, easier capture, correct)
  - Master Ball (-100): `roll - level - 100` (virtually guaranteed, correct)

  The approach of "add the modifier as-is" works because PTU already encodes the direction into the sign of the modifier value. The word "subtract" in the PTU text is ambiguous, but the negative ball values make it clear that the modifiers are meant to be added algebraically (not subtracted), since subtracting a negative would invert the intended effect.

- **Status: CORRECT**

### 2. Tutor Point Generation (ptu-rule-087)

- **Rule (PTU Core p.204, "Tutor Points"):**
  > "Each Pokemon, upon hatching, starts with a single precious Tutor Point. Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."

  This means:
  - Level 1: 1 TP (base)
  - Level 5: 2 TP (base + 1 at level 5)
  - Level 10: 3 TP (base + 1 at level 5 + 1 at level 10)
  - Level 15: 4 TP
  - General formula: `1 + floor(level / 5)`

  Verification:
  | Level | floor(level/5) | Formula result | Expected (manual count) | Match? |
  |-------|----------------|---------------|-------------------------|--------|
  | 1     | 0              | 1             | 1                       | Yes    |
  | 4     | 0              | 1             | 1                       | Yes    |
  | 5     | 1              | 2             | 2                       | Yes    |
  | 9     | 1              | 2             | 2                       | Yes    |
  | 10    | 2              | 3             | 3                       | Yes    |
  | 25    | 5              | 6             | 6                       | Yes    |
  | 50    | 10             | 11            | 11                      | Yes    |
  | 100   | 20             | 21            | 21                      | Yes    |

- **Implementation (app/server/services/pokemon-generator.service.ts, line 166-167):**
  ```typescript
  // Tutor points: 1 base + 1 per 5 levels (PTU: "starts with a single Tutor Point" + more every 5 levels)
  const tutorPoints = 1 + Math.floor(input.level / 5)
  ```

  The diff (commit 00b2f1f) shows:
  1. Added `tutorPoints: number` to `GeneratedPokemonData` interface
  2. Calculated `tutorPoints = 1 + Math.floor(input.level / 5)` in `generatePokemonData()`
  3. Included `tutorPoints` in the return object
  4. Passed `tutorPoints: data.tutorPoints` in `createPokemonRecord()` to persist to DB
  5. Changed `createdPokemonToEntity()` from hardcoded `tutorPoints: 0` to `tutorPoints: data.tutorPoints`

  All five touchpoints are correct. The formula matches PTU exactly.

- **Note:** This formula gives the *maximum* tutor points a Pokemon could have at that level, assuming none have been spent. For generated (wild/template) Pokemon, this is correct -- they haven't spent any TPs yet. If a captured Pokemon later spends TPs, the tutorPoints field should be decremented accordingly (separate concern, not in scope).

- **Status: CORRECT**

### 3. Significance Tier Presets (ptu-rule-088)

- **Rule (PTU Core p.457-458, "Significance Multiplier"):**
  > "The Significance Multiplier should range from x1 to about x5, and there's many things to consider when picking this value."
  > - "Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5."
  > - "'Average' everyday encounters should be about x2 or x3."
  > - "More significant encounters may range anywhere from x4 to x5 depending on their significance; a match against an average gym leader might merit as high as x4. A decisive battle against a Rival or in the top tiers of a tournament might be worth x5 or even higher!"

  PTU explicitly defines three tiers:
  - Insignificant: x1 to x1.5
  - Everyday: x2 to x3
  - Significant: x4 to x5+

  The app extends with two additional tiers (Climactic and Legendary) for values beyond x5. PTU says "x5 or even higher!" so extending beyond x5 is consistent with the rules.

- **Implementation (app/utils/encounterBudget.ts, lines 72-108):**
  ```typescript
  SIGNIFICANCE_PRESETS = [
    { tier: 'insignificant', multiplierRange: { min: 1.0, max: 1.5 }, defaultMultiplier: 1.0 },
    { tier: 'everyday',      multiplierRange: { min: 2.0, max: 3.0 }, defaultMultiplier: 2.0 },
    { tier: 'significant',   multiplierRange: { min: 4.0, max: 5.0 }, defaultMultiplier: 4.0 },
    { tier: 'climactic',     multiplierRange: { min: 5.0, max: 7.0 }, defaultMultiplier: 6.0 },
    { tier: 'legendary',     multiplierRange: { min: 7.0, max: 10.0 }, defaultMultiplier: 8.0 }
  ]
  ```

  **Before fix (from diff):**
  - Significant: x3.0-x4.0 (WRONG -- PTU says x4-x5)
  - Climactic: x4.0-x5.0 (was occupying the Significant range)
  - Legendary: x5.0-x5.0 (capped at x5 despite PTU allowing higher)

  **After fix:**
  - Insignificant: x1.0-x1.5 -- matches PTU "x1 to x1.5" exactly
  - Everyday: x2.0-x3.0 -- matches PTU "about x2 or x3" exactly
  - Significant: x4.0-x5.0 -- matches PTU "x4 to x5" exactly
  - Climactic: x5.0-x7.0 -- reasonable extension beyond PTU's "x5 or even higher"
  - Legendary: x7.0-x10.0 -- reasonable extension for extreme cases

- **Status: CORRECT**

## Summary

All three fixes correctly implement PTU 1.05 rules:

1. **Capture modifier sign (569d030):** The formula change from `roll - trainerLevel - modifiers` to `roll - trainerLevel + modifiers` correctly handles PTU's negative ball modifiers (Great Ball = -10, Ultra Ball = -15). The old formula double-negated these values, making better balls worse for capture. The fix is mathematically sound and aligns with the ball chart values on p.272.

2. **Tutor point generation (00b2f1f):** The formula `1 + Math.floor(level / 5)` exactly matches PTU p.204: "starts with a single precious Tutor Point" + "every other level evenly divisible by 5." All five code touchpoints (interface, calculation, return, DB write, entity mapping) are correctly wired.

3. **Significance tier presets (9f0ff20):** The three PTU-defined tiers (Insignificant x1-x1.5, Everyday x2-x3, Significant x4-x5) now exactly match the rulebook (p.457-458). The two extended tiers (Climactic, Legendary) are reasonable GM-facing extensions consistent with PTU's allowance for "x5 or even higher."

## Rulings

- **Capture modifier sign convention:** PTU p.214 says "subtract...any modifiers from equipment or Features." The ball chart (p.272) provides values like -10 (Great Ball) and -15 (Ultra Ball). The algebraic addition approach (`roll + modifiers`) is the correct interpretation because the modifier values already encode their direction. Subtracting an already-negative value would invert the intended effect. This is not ambiguous -- it is the only interpretation consistent with the ball chart values.

- **Tutor point formula edge case:** A level 1 Pokemon gets 1 TP (the base). `1 + floor(1/5) = 1 + 0 = 1`. Correct. A freshly hatched (level 0, if applicable) Pokemon would get `1 + floor(0/5) = 1 + 0 = 1`. Also correct per PTU ("upon hatching, starts with a single...Tutor Point").

- **Extended significance tiers:** PTU only explicitly defines multipliers up to "x5 or even higher." The Climactic (x5-x7) and Legendary (x7-x10) tiers are app-specific extensions that do not contradict PTU rules. They provide useful GM presets for encounters beyond the standard x5 cap. No decree needed -- this is a reasonable extension, not an ambiguity.

## Medium Issues

1. **[MEDIUM] Overlapping tier boundaries:** The Significant tier maxes at x5.0 and the Climactic tier starts at x5.0. Similarly Climactic maxes at x7.0 and Legendary starts at x7.0. When the GM selects exactly x5.0 or x7.0, it falls into both adjacent tiers. This is a minor UI/UX concern -- the presets are used for defaults and the GM can override to any value. However, a gap or explicit boundary convention (e.g., Significant max x4.9, Climactic min x5.0) would be cleaner. This does not affect game correctness.

## Verdict

**APPROVED**

All three mechanics are correctly implemented per PTU 1.05 rules. The one medium issue (overlapping tier boundaries) is a UX polish concern that does not affect game logic correctness. No blockers.

## Required Changes

None. All fixes are correct.
