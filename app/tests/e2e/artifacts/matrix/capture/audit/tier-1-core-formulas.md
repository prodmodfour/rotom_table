## Tier 1: Core Formulas

### 1. capture-R001 — Capture Rate Base Formula

- **Rule:** "First, begin with 100. Then subtract the Pokemon's Level x2." (05-pokemon.md:1719-1720)
- **Expected behavior:** `captureRate = 100 - (level * 2) + modifiers`
- **Actual behavior:** `app/utils/captureRate.ts:73-76` — `base = 100; levelModifier = -(level * 2)`. Final sum includes base + levelModifier + all other modifiers.
- **Classification:** Correct

### 2. capture-R006 — HP Modifier (Above 75%)

- **Rule:** "If the Pokemon is above 75% Hit Points, subtract 30 from the Pokemon's Capture Rate." (05-pokemon.md:1721)
- **Expected behavior:** hpPercentage > 75 → -30
- **Actual behavior:** `app/utils/captureRate.ts:88-89` — `else { hpModifier = -30 }` (the final else branch, reached when percentage > 75 and currentHp !== 1 and percentage is not <= 25 or <= 50 or <= 75).
- **Classification:** Correct

### 3. capture-R007 — HP Modifier (51-75%)

- **Rule:** "If the Pokemon is at 75% Hit Points or lower, subtract 15 from the Pokemon's Capture Rate." (05-pokemon.md:1722)
- **Expected behavior:** 50 < hpPercentage <= 75 → -15
- **Actual behavior:** `app/utils/captureRate.ts:86-87` — `else if (hpPercentage <= 75) { hpModifier = -15 }`
- **Classification:** Correct

### 4. capture-R008 — HP Modifier (26-50%)

- **Rule:** "If the Pokemon is at 50% or lower, the Capture Rate is unmodified." (05-pokemon.md:1723)
- **Expected behavior:** 25 < hpPercentage <= 50 → 0
- **Actual behavior:** `app/utils/captureRate.ts:84-85` — `else if (hpPercentage <= 50) { hpModifier = 0 }`
- **Classification:** Correct

### 5. capture-R009 — HP Modifier (1-25%)

- **Rule:** "If the Pokemon is at 25% Hit Points or lower, add a total of +15 to the Pokemon's Capture Rate." (05-pokemon.md:1723-1724)
- **Expected behavior:** 1 < hpPercentage <= 25 → +15 (but not exactly 1 HP)
- **Actual behavior:** `app/utils/captureRate.ts:82-83` — `else if (hpPercentage <= 25) { hpModifier = 15 }`. This is reached after the `currentHp === 1` check, so 1 HP goes to the +30 branch, and 2+ HP at <=25% goes here.
- **Classification:** Correct

### 6. capture-R010 — HP Modifier (Exactly 1 HP)

- **Rule:** "And if the Pokemon is at exactly 1 Hit Point, add a total of +30 to the Pokemon's Capture Rate." (05-pokemon.md:1724-1725)
- **Expected behavior:** currentHp === 1 → +30
- **Actual behavior:** `app/utils/captureRate.ts:80-81` — `if (currentHp === 1) { hpModifier = 30 }`
- **Classification:** Correct

### 7. capture-R005 — Capture Roll Mechanic

- **Rule:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured!" (05-pokemon.md:1712-1716)
- **Expected behavior:** Roll 1d100. `modifiedRoll = roll - trainerLevel - modifiers`. Success if `modifiedRoll <= captureRate`.
- **Actual behavior:** `app/utils/captureRate.ts:187-202` — `roll = Math.floor(Math.random() * 100) + 1` (1-100). `modifiedRoll = roll - trainerLevel - modifiers`. `success = naturalHundred || modifiedRoll <= effectiveCaptureRate`.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Issue:** The PTU rule says "subtract the Trainer's Level, and any modifiers from equipment or Features" from the ROLL. The roll is then compared to the capture rate. The code subtracts `trainerLevel` and `modifiers` from the roll (line 199: `modifiedRoll = roll - trainerLevel - modifiers`), which is correct for the roll modification. HOWEVER, on the Poke Ball chart (capture-rules.md R020 notes), Ball modifiers are listed as adjustments to the "Capture Roll" — they lower the roll, making capture easier. The code's `modifiers` parameter is passed as a positive number that gets SUBTRACTED from the roll. But the Poke Ball chart lists modifiers as: "Great Ball: -10", "Ultra Ball: -15", etc. These negative numbers mean the ball makes the roll lower (easier to capture). If the GM passes `-10` as the modifier for a Great Ball, the code computes `roll - trainerLevel - (-10) = roll - trainerLevel + 10`, which INCREASES the roll (harder to capture). This is backwards.

  Wait — let me re-read the code. The `modifiers` parameter semantics: in `attempt.post.ts:87` it passes `body.modifiers || 0`. The GM enters a raw number. If the GM enters -10 (Great Ball), the formula becomes `roll - trainerLevel - (-10) = roll - trainerLevel + 10`. This increases the modified roll, making it harder to be <= captureRate. That's incorrect — a Great Ball should make capture easier, not harder.

  HOWEVER, looking at the capability documentation (capture-C002): "Rolls 1d100, applies trainer level subtraction and additional modifiers." The `modifiers` field is described as pre-calculated by the GM. The GM could pass +10 (representing the Great Ball's -10 modifier to the roll as a +10 bonus), or the GM could interpret it differently. The issue is semantic ambiguity in the modifier sign convention.

  Let me re-examine: PTU says ball modifiers adjust the Capture Roll. "Great Ball: -10" means the capture roll result is 10 lower. Lower roll = easier to capture (roll under capture rate). So if the GM enters the ball modifier as the PTU lists it (-10), the code computes: `roll - trainerLevel - (-10) = roll - trainerLevel + 10`. The modified roll is HIGHER. Higher roll vs capture rate = HARDER to capture. This is the opposite of what the Great Ball should do.

  The correct formula should be: `modifiedRoll = roll - trainerLevel + ballModifier` (where Great Ball ballModifier = -10, making roll lower). The code uses `roll - trainerLevel - modifiers`. For this to work correctly with PTU ball modifiers, the GM must pass `+10` for a Great Ball (counter-intuitive, since PTU lists it as -10).

  This IS an incorrect sign convention. The code subtracts the modifier when it should add it (since PTU ball modifiers are already negative for capture-assisting balls).

  Actually, let me reconsider. The `modifiers` field in the API is documented as "Equipment/feature/ball modifiers (pre-calculated by GM)". If the convention is that positive modifiers help capture (lower the roll), then: `modifiedRoll = roll - trainerLevel - modifiers`. With modifiers = 10 (Great Ball helps by 10), modifiedRoll is lower, easier to capture. This works IF the convention is "positive = helps capture". The PTU book's sign convention (-10 for Great Ball) is "added to the roll" making it lower.

  The two conventions are inverses. The code's convention is: "positive modifier = bonus to capture (subtracted from roll)." PTU's convention is: "ball modifier added to roll (negative = roll lower = easier)."

  This is a sign convention mismatch that could lead to GM error if they enter PTU-as-written values. Let me re-classify this.

- **Revised Classification:** Incorrect
- **Severity:** MEDIUM
- **Issue:** Sign convention for `modifiers` parameter is inverted from PTU's convention. PTU ball modifiers (e.g., Great Ball: -10) are meant to be added to the roll, lowering it. The code subtracts `modifiers` from the roll. If the GM enters the PTU-listed value (-10), the code makes the roll HIGHER (harder), which is backwards. The GM must mentally negate the value. This is a UX/correctness issue — the formula works only if the GM knows to invert the sign.

### 8. capture-R011 — Evolution Stage (+10 for 2 Remaining)

- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Pokemon's Capture Rate." (05-pokemon.md:1727)
- **Expected behavior:** `maxEvolutionStage - evolutionStage >= 2` → +10
- **Actual behavior:** `app/utils/captureRate.ts:93-97` — `evolutionsRemaining = maxEvolutionStage - evolutionStage; if (evolutionsRemaining >= 2) { evolutionModifier = 10 }`
- **Classification:** Correct

### 9. capture-R013 — Evolution Stage (-10 for No Remaining)

- **Rule:** "If the Pokemon has no evolutions remaining, subtract 10 from the Pokemon's Capture Rate." (05-pokemon.md:1728-1729)
- **Expected behavior:** `evolutionsRemaining === 0` → -10
- **Actual behavior:** `app/utils/captureRate.ts:100-101` — `else { evolutionModifier = -10 }` (final else after checking >= 2 and === 1).
- **Classification:** Correct

### 10. capture-R014 — Persistent Status (+10 Each)

- **Rule:** "Persistent Conditions add +10 to the Pokemon's Capture Rate" (05-pokemon.md:1732)
- **Expected behavior:** +10 per persistent condition.
- **Actual behavior:** `app/utils/captureRate.ts:116-128` — Loops through statusConditions. For PERSISTENT_CONDITIONS: +10 each. Special handling: Poisoned/Badly Poisoned count as one (+10 once, not twice).
- **Classification:** Correct
- **Note:** The Poisoned/Badly Poisoned de-duplication is a sensible interpretation. PTU p.246 describes them as variants of the same affliction. Counting both as +20 would be incorrect.

### 11. capture-R015 — Volatile/Injury Modifiers

- **Rule:** "Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5." (05-pokemon.md:1733)
- **Expected behavior:** +5 per volatile condition, +5 per injury, +10 for Stuck, +5 for Slowed. Stuck and Slow bonuses stack with other modifiers.
- **Actual behavior:** `app/utils/captureRate.ts:126-140` — Volatile conditions: +5 each. Stuck: +10 (lines 131-133). Slowed: +5 (lines 134-136). Injuries: +5 per injury (line 140). All additive.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Issue:** Stuck and Slowed are in the `OTHER_CONDITIONS` list (statusConditions.ts:16-17), not in VOLATILE_CONDITIONS. The capture rate code checks for Stuck/Slowed as separate conditions AFTER checking PERSISTENT and VOLATILE. This means if 'Stuck' is in the statusConditions array, it gets: (1) NOT counted as volatile (correct, it's in OTHER_CONDITIONS not VOLATILE_CONDITIONS), then (2) checked against STUCK_CONDITIONS for +10 (lines 131-133). This is correct behavior.

  Wait — let me re-trace more carefully. The loop at line 116: `for (const condition of statusConditions)`. For each condition:
  1. Check if PERSISTENT_CONDITIONS includes it → +10
  2. Else if VOLATILE_CONDITIONS includes it → +5
  3. Then separately: if STUCK_CONDITIONS includes it → +10
  4. Then separately: if SLOW_CONDITIONS includes it → +5

  So for 'Stuck': step 1 = false (not persistent), step 2 = false (not volatile), step 3 = +10, step 4 = false. Result: +10 for Stuck. Correct.
  For 'Slowed': step 1 = false, step 2 = false, step 3 = false, step 4 = +5. Result: +5 for Slowed. Correct.

  Now what about a volatile condition that is also Stuck? E.g., ['Confused', 'Stuck']. Confused: +5 (volatile). Stuck: +10 (stuck check). Total: +15. That's correct per PTU — they stack.

  Actually, this is all correct. Let me re-check my initial concern. The issue I was worried about doesn't exist. The code handles all cases correctly.

- **Revised Classification:** Correct

### 12. capture-R016 — Rarity Modifier (Shiny/Legendary)

- **Rule:** "Shiny Pokemon subtract 10 from the Pokemon's Capture Rate. Legendary Pokemon subtract 30 from the Pokemon's Capture Rate." (05-pokemon.md:1730-1731)
- **Expected behavior:** Shiny: -10. Legendary: -30. Both can stack.
- **Actual behavior:** `app/utils/captureRate.ts:104-106` — `shinyModifier = isShiny ? -10 : 0; legendaryModifier = isLegendary ? -30 : 0`. Both added to final sum.
- **Classification:** Correct

---
