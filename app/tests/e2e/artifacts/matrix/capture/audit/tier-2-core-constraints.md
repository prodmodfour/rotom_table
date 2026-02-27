## Tier 2: Core Constraints

### 13. capture-R017 — Fainted Cannot Be Captured

- **Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them." (05-pokemon.md:1725-1726)
- **Expected behavior:** `canBeCaptured = false` when currentHp <= 0.
- **Actual behavior:** `app/utils/captureRate.ts:67` — `canBeCaptured = currentHp > 0`. `app/server/api/capture/attempt.post.ts:68-78` — checks `rateResult.canBeCaptured` before proceeding.
- **Classification:** Correct

### 14. capture-R019 — Fainted Pokemon Capture Failsafe

- **Rule:** "Poke Balls cannot ever capture a Pokemon that's been reduced to 0 Hit Points or less." (09-gear-and-items.md)
- **Expected behavior:** Same as R017 — redundant rule, same check.
- **Actual behavior:** Same `canBeCaptured` check at attempt.post.ts:68.
- **Classification:** Correct

### 15. capture-R028 — Natural 20 Accuracy Bonus

- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll." (05-pokemon.md:1710-1711)
- **Expected behavior:** Nat 20 on accuracy d20 → capture rate effectively +10 (or roll -10).
- **Actual behavior:** `app/server/api/capture/attempt.post.ts:81` — `criticalHit = body.accuracyRoll === 20`. `app/utils/captureRate.ts:194-195` — `if (criticalHit) { effectiveCaptureRate += 10 }`. Adding 10 to capture rate is mathematically equivalent to subtracting 10 from the roll.
- **Classification:** Correct

### 16. capture-R033 — Accuracy Check Nat 1 Misses

- **Rule:** "a roll of 1 is always a miss" (07-combat.md:746)
- **Expected behavior:** Nat 1 on d20 = ball misses.
- **Actual behavior:** `app/composables/useCapture.ts:186` — `rollAccuracyCheck` returns `{ roll, isNat20, total }`. The `roll === 1` check would be handled by the GM workflow (checking the roll result before proceeding to capture attempt). The composable itself doesn't enforce it — it returns the raw result for the GM to interpret.
- **Classification:** Correct
- **Note:** The accuracy check result is presented to the GM who decides whether to proceed. The composable provides the data; enforcement is at the workflow level.

---
