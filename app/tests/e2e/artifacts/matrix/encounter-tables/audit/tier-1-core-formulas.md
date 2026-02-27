## Tier 1: Core Formulas

### encounter-tables-R005: Experience Calculation from Encounter

- **Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience."
- **Expected behavior:** Formula: `(Sum of enemy levels, trainers count 2x) * significanceMultiplier / playerCount = XP per player`. Floor rounding. Fainted Pokemon CAN still gain XP.
- **Actual behavior:** `calculateEncounterXp()` at `utils/encounterBudget.ts:200-210`:
  1. Calls `calculateEffectiveEnemyLevels(enemies)` which sums `enemy.level * 2` for trainers, `enemy.level` for non-trainers (lines 152-162). This matches PTU's "treat their Level as doubled."
  2. `totalXp = Math.floor(baseXp * significanceMultiplier)` (line 207). Applies significance multiplier with floor rounding.
  3. `xpPerPlayer = Math.floor(totalXp / Math.max(1, playerCount))` (line 208). Divides by player count with floor rounding and zero-player protection.
  The composable `useEncounterBudget.ts:26` correctly uses `c.side === 'players' && c.type === 'human'` to count players (not Pokemon), matching PTU's "Divide by the number of Players -- not the number of Pokemon."
- **Classification:** Correct

### encounter-tables-R006: Encounter Level Budget Formula

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."
- **Expected behavior:** Formula: `averagePokemonLevel * 2 = baseline per player`. `baseline * playerCount = total level budget`.
- **Actual behavior:** `calculateEncounterBudget()` at `utils/encounterBudget.ts:130-146`:
  1. `baselinePerPlayer = avgLevel * 2` (line 133).
  2. `totalBudget = baselinePerPlayer * players` (line 134).
  3. Returns structured result with breakdown including all intermediate values.
  PTU example verification: 3 trainers with avg L20 Pokemon -> baseline 40 -> 120 total levels. Code: `20 * 2 = 40`, `40 * 3 = 120`. Matches exactly.
- **Classification:** Correct

### encounter-tables-R008: Significance Multiplier

- **Rule:** "The Significance Multiplier should range from x1 to about x5 [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance; a match against an average gym leader might merit as high as x4. A decisive battle against a Rival or in the top tiers of a tournament might be worth x5 or even higher!"
- **Expected behavior:** PTU significance scale with three named tiers: insignificant x1-x1.5, everyday x2-x3, significant x4-x5+. The difficulty adjustment (R009) is a separate modifier of x0.5-x1.5.
- **Actual behavior:** `SIGNIFICANCE_PRESETS` at `utils/encounterBudget.ts:72-108` defines 5 tiers:
  - `insignificant`: x1.0-x1.5, default x1.0
  - `everyday`: x2.0-x3.0, default x2.0
  - `significant`: x3.0-x4.0, default x3.5
  - `climactic`: x4.0-x5.0, default x4.5
  - `legendary`: x5.0-x5.0, default x5.0
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** PTU defines three tiers: insignificant (x1-x1.5), everyday (x2-x3), and significant (x4-x5+). The code splits the PTU "significant" tier into three sub-tiers ("significant" x3.0-x4.0, "climactic" x4.0-x5.0, "legendary" x5.0), which creates a naming mismatch. The app's "significant" tier starts at x3.0 and caps at x4.0, while PTU's "significant" starts at x4 and goes to x5+. This means a GM selecting "Significant" in the app gets a default of x3.5, but PTU says significant encounters "may range anywhere from x4 to x5." The app's "significant" preset under-values compared to PTU's definition.

  Additionally, the app's "significant" range (x3.0-x4.0) overlaps with PTU's "everyday" range at the x3.0 boundary, blurring tier boundaries.

  The overall x1-x5 range is covered, and the custom multiplier slider allows any value, so the raw calculation capability is correct. The issue is specifically that the preset labels and default values mislead GMs about PTU's intended scale.

  **Recommendation:** Either (a) align the three core presets with PTU (insignificant x1-x1.5, everyday x2-x3, significant x4-x5) and optionally add "climactic" and "legendary" as sub-tiers of significant, or (b) add PTU reference ranges in the preset descriptions so GMs understand the mapping.

### encounter-tables-R009: Difficulty Adjustment Modifier

- **Rule:** "Next, consider the challenge and threat being posed. [...] Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge."
- **Expected behavior:** An independent modifier of x0.5-x1.5 applied on top of the base significance tier, adjusting for encounter difficulty separate from narrative importance.
- **Actual behavior:** Two complementary systems implement this:
  1. `DIFFICULTY_THRESHOLDS` at `utils/encounterBudget.ts:114-120` defines thresholds for budget-ratio-based difficulty assessment (trivial <0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8). This gives the GM a visual indicator of encounter difficulty relative to their party's capability.
  2. `SignificancePanel.vue` (C046) provides a custom multiplier slider that allows the GM to freely adjust the significance multiplier, which serves as the difficulty adjustment mechanism.
  The two systems operate independently: significance for XP calculation, budget ratio for difficulty feedback. This separation matches PTU's intent that difficulty and narrative significance are separate considerations.
- **Classification:** Correct
- **Notes:** The difficulty threshold bands are app-specific (PTU does not define numeric thresholds), but they serve as reasonable reference points for GM decision-making. The custom multiplier slider fully supports the PTU range of +/- x0.5-x1.5 adjustment.

---
