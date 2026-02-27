## Tier 3: Core Constraints

### healing-R008: Rest Requires Continuous Half Hour

- **Rule:** "Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Expected behavior:** Each rest action = exactly 30 continuous minutes.
- **Actual behavior:** Both `rest.post.ts` endpoints add exactly 30 minutes per call.
- **Classification:** Correct

### healing-R009: Rest HP Recovery Daily Cap (8h)

- **Rule:** "For the first 8 hours of rest each day... Hit Points will not be regained."
- **Expected behavior:** 480 minutes max rest healing per day.
- **Actual behavior:** `calculateRestHealing()` at `utils/restHealing.ts:51-54`: `restMinutesToday >= 480` returns `canHeal: false`.
- **Classification:** Correct

### healing-R010: Heavily Injured Threshold (5+ Injuries)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured."
- **Expected behavior:** 5+ injuries = Heavily Injured.
- **Actual behavior:** `calculateRestHealing()` checks `injuries >= 5` for blocking rest heal. `getRestHealingInfo()` checks `injuries < 5` for `canRestHeal`.
- **Classification:** Correct

### healing-R011: Heavily Injured Blocks Rest HP Recovery

- **Rule:** "A Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries."
- **Expected behavior:** No HP recovery from rest at 5+ injuries.
- **Actual behavior:** `calculateRestHealing()` at line 47: `if (injuries >= 5) return { hpHealed: 0, canHeal: false }`.
- **Classification:** Correct

### healing-R017: Injury Does Not Affect HP Marker Thresholds

- **Rule:** "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."
- **Expected behavior:** Marker positions and massive damage threshold use real maxHp.
- **Actual behavior:** `calculateDamage()` receives raw `maxHp` parameter. Massive damage check (line 112) and `countMarkersCrossed()` (line 115-118) both use this raw value.
- **Classification:** Correct

### healing-R025: Daily Injury Healing Cap (3/Day)

- **Rule:** "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Expected behavior:** Shared pool of 3 injury heals per day across all sources.
- **Actual behavior:** `calculatePokemonCenterInjuryHealing()` uses `3 - injuriesHealedToday`. `heal-injury.post.ts` checks `injuriesHealedToday >= 3`. All paths increment the shared counter.
- **Classification:** Correct

### healing-R029: Pokemon Center -- Injury Removal Cap

- **Rule:** Same 3/day cap as R025.
- **Expected behavior:** Pokemon Center respects shared daily cap.
- **Actual behavior:** `pokemon-center.post.ts:49-52` calls `calculatePokemonCenterInjuryHealing()` which uses `injuriesHealedToday`.
- **Classification:** Correct

### healing-R019: Take a Breather -- Action Cost

- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action... They then become Tripped and are Vulnerable until the end of their next turn."
- **Expected behavior:** Full action consumed (standard + shift). Tripped + Vulnerable applied.
- **Actual behavior:** `breather.post.ts:110-115`: sets `standardActionUsed: true`, `shiftActionUsed: true`, `hasActed: true`. Lines 97-107: adds 'Tripped' and 'Vulnerable' to `combatant.tempConditions` (cleared at turn end).
- **Classification:** Correct
- **Notes:** Uses `tempConditions` for the "until end of their next turn" duration -- correct implementation.

---
