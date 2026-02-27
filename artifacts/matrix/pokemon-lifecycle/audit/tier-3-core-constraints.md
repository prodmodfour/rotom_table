## Tier 3: Core Constraints

### R002: Pokemon Maximum Level

- **Rule:** "Pokemon have a maximum Level of 100."
- **Expected behavior:** Level capped at 100.
- **Actual behavior:** `MAX_LEVEL = 100` at `experienceCalculation.ts:52`. `getLevelForXp()` returns max 100. `MAX_EXPERIENCE = 20555` (XP for level 100). `calculateLevelUps()` caps experience at `MAX_EXPERIENCE`. No Pokemon can level past 100 through the XP system. Manual level edits via PUT have no enforcement, but this is consistent with the GM-tool design.
- **Classification:** Correct

### R010: Base Relations Rule

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."
- **Expected behavior:** After stat distribution, higher base stats must have >= stat points added compared to lower base stats. Equal base stats may differ.
- **Actual behavior:** `enforceBaseRelations()` at `pokemon-generator.service.ts:406-461`:
  1. Groups stats by base value into tiers (line 412-419).
  2. Sorts all added-point values descending (line 422).
  3. Assigns largest added values to highest base tier, smallest to lowest (lines 432-458).
  4. Within a tier (equal base stats), shuffles randomly (lines 445-450).
- **Classification:** Correct
- **Notes:** This was Approximation (HIGH) in the previous audit. The `enforceBaseRelations()` function has been added to guarantee the ordering constraint. The weighted random distribution still creates the initial allocation, but the enforcement step corrects any violations.

### R007: Neutral Natures

- **Rule:** "These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."
- **Expected behavior:** When raise === lower, no stat modification.
- **Actual behavior:** `applyNatureToBaseStats()` at `constants/natures.ts:97-98`: `if (nature.raise === nature.lower) return { ...baseStats }`. The 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) all have raise === lower and return unmodified stats.
- **Classification:** Correct

---
