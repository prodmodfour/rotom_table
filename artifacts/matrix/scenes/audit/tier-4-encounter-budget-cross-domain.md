## Tier 4: Encounter Budget (Cross-Domain)

### R029 — Encounter Creation Baseline

- **Rule:** "Multiply average Pokemon Level by 2, multiply by number of Trainers. This is the level budget for the encounter."
- **Expected behavior:** `avgPokemonLevel * 2 * playerCount`.
- **Actual behavior:** The encounter tables domain implements `calculateEncounterBudget` with this formula. Accessible from GM encounter view. This is a cross-domain reference — the formula belongs to the encounter-tables domain and is correctly implemented there.
- **Classification:** Correct

### R030 — Significance Multiplier

- **Rule:** "x1 insignificant, x2-x3 average, x4-x5 significant."
- **Expected behavior:** Significance presets matching PTU scale.
- **Actual behavior:** The encounter-tables domain implements `SIGNIFICANCE_PRESETS` with a `SignificancePanel` component. The presets cover the x1 to x5 range per PTU. Cross-domain reference, correctly implemented.
- **Classification:** Correct

### R037 — Experience Calculation

- **Rule:** "Combined levels of enemies (trainers count double), multiply by significance, divide by player count."
- **Expected behavior:** XP calculation following PTU formula.
- **Actual behavior:** The encounter-tables domain implements `calculateEncounterXp` with this formula. Cross-domain, correctly implemented.
- **Classification:** Correct

---
