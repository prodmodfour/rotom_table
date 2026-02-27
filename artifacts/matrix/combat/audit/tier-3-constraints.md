## Tier 3: Constraints

### 26. combat-R014 — Natural 1 Always Misses

- **Rule:** "a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit." (07-combat.md:746-747)
- **Expected behavior:** Natural d20 result of 1 = miss regardless of modifiers.
- **Actual behavior:** `app/composables/useMoveCalculation.ts:293-294` — `if (isNat1) { hit = false }`. Uses `naturalRoll` (raw d20).
- **Classification:** Correct

### 27. combat-R015 — Natural 20 Always Hits

- **Rule:** "a roll of 20 is always a hit." (07-combat.md:747-748)
- **Expected behavior:** Natural d20 result of 20 = hit regardless of evasion.
- **Actual behavior:** `app/composables/useMoveCalculation.ts:295-296` — `if (isNat20) { hit = true }`.
- **Classification:** Correct

### 28. combat-R025 — Minimum Damage

- **Rule:** "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0." (07-combat.md:778-779) with immunity exception.
- **Expected behavior:** Min 1 damage after defense + effectiveness, unless type immune (0 damage).
- **Actual behavior:** `app/utils/damageCalculation.ts:283` — `afterDefense = Math.max(1, ...)` (min 1 before effectiveness). Lines 292-297: if immune = 0, else if < 1 = 1 (min 1 after effectiveness). Double application is redundant but produces identical results to single min-1 after effectiveness in all cases.
- **Classification:** Correct
- **Note:** The double min-1 (before and after effectiveness) never produces incorrect output. Any negative after-defense value floored to 1 before 0.5x effectiveness = floor(0.5) = 0 -> min(1) = 1. Without first min(1): negative * 0.5 = still negative -> floor = negative -> min(1) = 1. Same result in all cases.

### 29. combat-R066 — Evasion Max from Stats

- **Rule:** "you can never gain more than +6 Evasion from Stats." (07-combat.md:647)
- **Expected behavior:** Stat-derived evasion capped at 6.
- **Actual behavior:** `app/utils/damageCalculation.ts:105` — `Math.min(6, Math.floor(...))`
- **Classification:** Correct

### 30. combat-R067 — Evasion Max Total Cap

- **Rule:** "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9." (07-combat.md:656-657)
- **Expected behavior:** Total evasion applied to accuracy check capped at 9.
- **Actual behavior:** `app/utils/damageCalculation.ts:123` — `effectiveEvasion = Math.min(9, defenderEvasion)`. Also `useMoveCalculation.ts:274`.
- **Classification:** Correct

### 31. combat-R075 — Injury Uses Real Max HP

- **Rule:** "The artificial Max Hit Point number is not considered when potentially acquiring new injuries... All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum." (07-combat.md:1872-1876)
- **Expected behavior:** Massive damage and marker checks use real maxHp, not injury-reduced.
- **Actual behavior:** `damage.post.ts:35` passes `entity.maxHp` (real max stored in DB). `combatant.service.ts:112` uses this for massive damage. `combatant.service.ts:115-119` passes as `realMaxHp` to `countMarkersCrossed`.
- **Classification:** Correct

### 32. combat-R104 — Temp HP Does Not Count for Percentages

- **Rule:** "Temporary Hit Points also do not stack with 'Real' Hit Points for the purposes of determining percentages of Hit Points." (07-combat.md:1664-1668)
- **Expected behavior:** HP percentage uses real HP only.
- **Actual behavior:** `combatant.service.ts:112` — massive damage uses `hpDamage` (after temp HP absorbed) vs `maxHp`. `useCombat.ts:63-65` — `getHealthPercentage(current, max)` uses real HP values.
- **Classification:** Correct

### 33. combat-R130 — Action Points

- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points." (06-playing-the-game.md:220-223)
- **Expected behavior:** `maxAP = 5 + floor(level / 5)`
- **Actual behavior:** `app/composables/useCombat.ts:146` — `return 5 + Math.floor(trainerLevel / 5)`
- **Classification:** Correct

### 34. combat-R132 — Rounding Rule

- **Rule:** PTU uses floor rounding throughout (07-combat.md:675 "rounded down").
- **Expected behavior:** `Math.floor` for all stat/damage calculations.
- **Actual behavior:** `Math.floor` used consistently in `applyStageModifier` (damageCalculation.ts:219), `calculateEvasion` (damageCalculation.ts:105), `calculateDamage` (damageCalculation.ts:288), `getEffectiveMaxHp` (restHealing.ts:23).
- **Classification:** Correct

### 35. combat-R133 — Percentages Additive Rule

- **Rule:** PTU percentages are additive, not multiplicative.
- **Expected behavior:** Multiple percentage modifiers add together before applying.
- **Actual behavior:** Type effectiveness uses the net-count approach (typeChart.ts:59-76) which is the PTU method. No multiplicative percentage stacking found anywhere in codebase.
- **Classification:** Correct

---
