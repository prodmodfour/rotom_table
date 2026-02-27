## Tier 4: Partial Items (Present Portion)

### 20. capture-R020 — Modifiers Parameter (Poke Ball Types)

- **Rule:** Different Poke Ball types have different roll modifiers (09-gear-and-items.md Poke Ball Chart): Basic +0, Great -10, Ultra -15, Master -100, etc.
- **Expected behavior:** Ball type selection with automatic modifier calculation.
- **Actual behavior:** `app/server/api/capture/attempt.post.ts:9` — `modifiers?: number` field accepts a raw numeric value. GM manually calculates ball-specific modifier and passes it. No ball type catalog or dropdown UI.
- **Classification:** Correct (present portion — numeric pass-through works)
- **Note:** See R005 sign convention issue. The GM must understand that positive `modifiers` values are subtracted from the roll (making capture easier), which is the inverse of PTU's convention.

### 21. capture-R029 — Natural 100 Auto-Capture

- **Rule:** "A natural roll of 100 always captures the target without fail." (05-pokemon.md:1716-1717)
- **Expected behavior:** Raw d100 result of 100 = auto-capture regardless of capture rate or modifiers.
- **Actual behavior:** `app/utils/captureRate.ts:190` — `naturalHundred = roll === 100`. Line 202: `success = naturalHundred || modifiedRoll <= effectiveCaptureRate`. The `roll` variable is the raw 1d100 result (line 187).
- **Classification:** Correct
- **Note:** The matrix noted concern about `modifiedRoll === 100` vs raw roll, but the code correctly checks `roll === 100` (the raw d100 result), not the modified roll. The `naturalHundred` flag uses the unmodified roll.

---

## Incorrect Items Detail

### 1. capture-R005 — Capture Roll Modifier Sign Convention (MEDIUM)

- **Rule:** PTU Poke Ball chart: "Great Ball: -10", "Ultra Ball: -15". These are modifiers to the Capture Roll — negative values lower the roll, making it easier to be under the capture rate.
- **Code:** `app/utils/captureRate.ts:199` — `modifiedRoll = roll - trainerLevel - modifiers`
- **Impact:** If the GM enters the PTU-as-written ball modifier (-10 for Great Ball), the formula computes `roll - trainerLevel - (-10) = roll - trainerLevel + 10`, which INCREASES the modified roll, making capture HARDER. This is backwards. The GM must enter +10 (positive) for a Great Ball to get the correct behavior.
- **Expected formula:** `modifiedRoll = roll - trainerLevel + ballModifier` (where Great Ball = -10, lowering the roll).
- **Fix:** Change line 199 to `modifiedRoll = roll - trainerLevel + modifiers` and update the API documentation to clarify that modifiers use PTU's sign convention (negative = easier capture). OR keep current formula but document clearly that positive = helps capture.

### 2. capture-R001 via attempt.post.ts — Legendary Detection Hard-Coded to False

- **Rule:** "Legendary Pokemon subtract 30 from the Pokemon's Capture Rate." (05-pokemon.md:1730-1731)
- **Code:** `app/server/api/capture/rate.post.ts:99` — `isLegendary: false // Could add legendary detection later`. `app/server/api/capture/attempt.post.ts:64` — `isLegendary: false`.
- **Impact:** Legendary Pokemon are never detected as legendary by the server endpoints. Their capture rate is 30 points too high (easier to capture than PTU intends). The `calculateCaptureRate` utility function supports `isLegendary` correctly, but the API endpoints never set it to true.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Note:** The pure function is correct. The integration layer (API endpoints) hard-codes `isLegendary: false`. There is no field on the Pokemon or SpeciesData Prisma models to track legendary status, so detection requires either a new DB field or a lookup table.

---

## Approximation Items Detail

### 1. capture-R005 sign convention — See Incorrect #1 above

Reclassified as Incorrect rather than Approximation.

### 2. capture-R012 — Evolution Stage (One Remaining = 0)

- **Rule:** "If the Pokemon has one evolution remaining, don't change the Capture Rate." (05-pokemon.md:1728)
- **Expected behavior:** `evolutionsRemaining === 1` → 0
- **Actual behavior:** `app/utils/captureRate.ts:98-99` — `else if (evolutionsRemaining === 1) { evolutionModifier = 0 }`
- **Classification:** Correct (verified; originally not in the auditor queue but confirmed during trace)

### 3. capture-R029 — Natural 100 Implementation

Originally flagged as Partial in matrix. After code review, the `naturalHundred` check uses the RAW roll (line 190: `roll === 100`), which is correct. The matrix concern about `modifiedRoll === 100` was unfounded.

- **Classification:** Correct (upgraded from Approximation based on code verification)

---

## Ambiguous Items

### 1. capture-R005 / capture-XREF-005 — Capture System Version

- **Ambiguity:** The errata (errata-2.md) proposes an alternative d20-based capture system. The app implements the base 1.05 d100 system. The errata is labeled as "playtest material" and "subject to change." If a GM opts into the errata system, the app cannot support it.
- **Existing decree-need:** decree-need-013 covers capture system version selection.
- **Classification:** Ambiguous (no active decree)
- **Note:** The app correctly implements the base 1.05 d100 system. The errata d20 system is an optional alternative that would require a separate implementation path.

---

## Verification Cross-Checks

### PTU Example 1 (05-pokemon.md:1735-1736)

> "A level 10 Pikachu that is at 70% Hit Points and Confused would have a Capture Rate of 70."
> Math: Level (+80), Health (-15), One Evolution (+0), Confused (+5)

Code trace: `calculateCaptureRate({ level: 10, currentHp: 35, maxHp: 50, evolutionStage: 1, maxEvolutionStage: 2, statusConditions: ['Confused'], injuries: 0, isShiny: false })`:
- base = 100
- levelModifier = -(10*2) = -20 → running total: 80
- hpPercentage = 70% → hpModifier = -15 → running total: 65
- evolutionsRemaining = 2 - 1 = 1 → evolutionModifier = 0 → running total: 65
- Confused is in VOLATILE_CONDITIONS → statusModifier = +5 → running total: 70
- **Result: 70** — matches PTU example.

### PTU Example 2 (05-pokemon.md:1737-1738)

> "A Shiny level 30 Caterpie that is at 40% Hit Points and has one injury would have a Capture Rate of 45."
> Math: Level (+40), Health (+0), Two Evolutions (+10), Shiny (-10), Injury (+5).

Code trace: `calculateCaptureRate({ level: 30, currentHp: 20, maxHp: 50, evolutionStage: 1, maxEvolutionStage: 3, statusConditions: [], injuries: 1, isShiny: true })`:
- base = 100
- levelModifier = -(30*2) = -60 → running total: 40
- hpPercentage = 40% → hpModifier = 0 → running total: 40
- evolutionsRemaining = 3 - 1 = 2 → evolutionModifier = +10 → running total: 50
- shinyModifier = -10 → running total: 40
- injuryModifier = 1 * 5 = +5 → running total: 45
- **Result: 45** — matches PTU example.

### PTU Example 3 (05-pokemon.md:1739-1741)

> "A level 80 Hydreigon that is at exactly 1 Hit Point, and is Burned, Poisoned, and has one Injury would have a Capture Rate of -15."
> Math: Level (-60), Health (+30), No Evolutions (-10), Burned (+10), Poisoned (+10), Injury (+5).

Code trace: `calculateCaptureRate({ level: 80, currentHp: 1, maxHp: 200, evolutionStage: 3, maxEvolutionStage: 3, statusConditions: ['Burned', 'Poisoned'], injuries: 1, isShiny: false })`:
- base = 100
- levelModifier = -(80*2) = -160 → running total: -60
- currentHp === 1 → hpModifier = +30 → running total: -30
- evolutionsRemaining = 3 - 3 = 0 → evolutionModifier = -10 → running total: -40
- Burned: persistent → statusModifier += 10 → running total: -30
- Poisoned: persistent → statusModifier += 10 → running total: -20
- injuryModifier = 1 * 5 = +5 → running total: -15
- **Result: -15** — matches PTU example.

All three PTU verification examples produce correct results.

---

## Incorrect Items Summary

| # | Rule | Severity | Issue | Fix Location |
|---|------|----------|-------|-------------|
| 1 | capture-R005 | MEDIUM | Sign convention for `modifiers` inverted from PTU | `app/utils/captureRate.ts:199` |
| 2 | capture-R016 (via R001) | HIGH | Legendary detection hard-coded false in API endpoints | `app/server/api/capture/rate.post.ts:99`, `attempt.post.ts:64` |

---

## Escalation Notes

### HIGH Priority Fix

1. **Legendary Detection (capture-R016 via API):** The `calculateCaptureRate` utility correctly supports `isLegendary`, but both API endpoints hard-code it to `false`. Options:
   - Add a `legendary` boolean field to the SpeciesData Prisma model and populate it from seed data
   - Add a legendary species lookup table (constant)
   - Accept `isLegendary` as an API parameter from the GM
   The most robust solution is a DB field on SpeciesData, populated during seeding from PTU pokedex data.

### MEDIUM Priority Fix

1. **Modifier Sign Convention (capture-R005):** Either:
   - Change formula to `modifiedRoll = roll - trainerLevel + modifiers` (PTU convention: negative modifiers help capture)
   - OR document clearly in UI/API that positive modifiers = easier capture (current convention)
   The first option aligns with PTU's sign convention and prevents GM confusion.

---

## Verification Notes

- All source file references verified against worktree at `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-3-audit-combat-capture/`
- PTU rules verified against `books/markdown/core/05-pokemon.md` (capture rate formula and examples) and `books/markdown/core/09-gear-and-items.md` (Poke Ball chart, via capture-rules.md)
- Three PTU-provided examples verified with exact code trace — all produce correct results
- Errata (errata-2.md) proposes alternative d20 capture system — app correctly uses base 1.05 d100 system; decree-need-013 tracks this ambiguity
- No active decrees exist. decree-need-013 (capture system version) and decree-need-014 (stuck/slow capture bonus) are relevant open decree-needs.
