## Tier 1: Core Formulas

### 1. combat-R002 — Pokemon HP Formula

- **Rule:** "Pokemon Hit Points = Pokemon's Level + (HP stat x3) + 10" (07-combat.md:622)
- **Expected behavior:** `level + (hpStat * 3) + 10`
- **Actual behavior:** `app/composables/useCombat.ts:40` — `return level + (hpStat * 3) + 10`
- **Classification:** Correct

### 2. combat-R003 — Trainer HP Formula

- **Rule:** "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10" (07-combat.md:623)
- **Expected behavior:** `(level * 2) + (hpStat * 3) + 10`
- **Actual behavior:** `app/composables/useCombat.ts:44` — `return (level * 2) + (hpStat * 3) + 10`
- **Classification:** Correct

### 3. combat-R008 — Combat Stage Range and Multipliers

- **Rule:** "For every Combat Stage above 0, a Stat is raised by 20%, rounded down. For every Combat Stage below 0, a Stat is lowered by 10%, rounded down." (07-combat.md:672-675)
- **Expected behavior:** -6 to +6 clamped, multipliers per table (0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2)
- **Actual behavior:** `app/utils/damageCalculation.ts:27-41` — `STAGE_MULTIPLIERS` matches the PTU table exactly. `applyStageModifier` clamps to [-6, +6] and uses `Math.floor`.
- **Classification:** Correct

### 4. combat-R009 — Combat Stage Multiplier Table

- **Rule:** PTU table (07-combat.md:701-728): -6=0.4, -5=0.5, -4=0.6, -3=0.7, -2=0.8, -1=0.9, 0=1.0, +1=1.2, +2=1.4, +3=1.6, +4=1.8, +5=2.0, +6=2.2
- **Expected behavior:** Exact multiplier values
- **Actual behavior:** `app/utils/damageCalculation.ts:27-41` — All 13 entries match PTU exactly.
- **Classification:** Correct

### 5. combat-R005 — Physical Evasion Formula

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (07-combat.md:598-600). "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score. However, you can never gain more than +6 Evasion from Stats." (07-combat.md:644-647)
- **Expected behavior:** `min(6, floor(stageModified(defense) / 5))` plus additive evasion bonus from moves/effects
- **Actual behavior:** `app/utils/damageCalculation.ts:102-108` — `calculateEvasion(baseStat, combatStage, evasionBonus, statBonus)` computes `min(6, floor((applyStageModifier(baseStat, combatStage) + statBonus) / 5))`, then adds evasion bonus, clamped to min 0.
- **Classification:** Correct

### 6. combat-R006 — Special Evasion Formula

- **Rule:** Same formula as Physical Evasion but using Special Defense (07-combat.md:608-610)
- **Expected behavior:** `min(6, floor(stageModified(spDef) / 5))`
- **Actual behavior:** `app/composables/useCombat.ts:54` delegates to `calculateEvasion(spDef, spDefStages, evasionBonus, statBonus)`
- **Classification:** Correct

### 7. combat-R007 — Speed Evasion Formula

- **Rule:** Same formula using Speed (07-combat.md:613-615)
- **Expected behavior:** `min(6, floor(stageModified(speed) / 5))`
- **Actual behavior:** `app/composables/useCombat.ts:58` delegates to `calculateEvasion(speed, speedStages, evasionBonus, statBonus)`
- **Classification:** Correct

### 8. combat-R012 — Accuracy Check Calculation

- **Rule:** "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion." (07-combat.md:749-751). "Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2" (07-combat.md:627-628).
- **Expected behavior:** threshold = moveAC + evasion - accuracyStage (factoring accuracy into threshold instead of roll). Roll >= threshold to hit.
- **Actual behavior:** `app/utils/damageCalculation.ts:118-125` — `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion)` returns `max(1, moveAC + min(9, evasion) - accuracyStage)`. `app/composables/useMoveCalculation.ts:275` mirrors this. Roll compared: `naturalRoll >= threshold`.
- **Classification:** Correct
- **Note:** Factoring accuracy stage into the threshold rather than adding it to the roll is mathematically equivalent.

### 9. combat-R023 — Critical Hit Damage Calculation

- **Rule:** "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat, or 30+Stat going by set damage." (07-combat.md:801-804)
- **Expected behavior:** For set damage: double the set damage (avg + avg). PTU example: DB6 crit set = 15+15 = 30.
- **Actual behavior:** `app/utils/damageCalculation.ts:269-272` — `critDamageBonus = getSetDamage(effectiveDB)`. `baseDamage = setDamage + critDamageBonus` = avg + avg.
- **Classification:** Correct

### 10. combat-R019 — Damage Formula (9-step)

- **Rule:** PTU 9-step process (07-combat.md:834-847): 1) Find DB, 2) Apply multi-strike, 3) Add DB modifiers (STAB), 4) Modify for crit, 5) Roll/set damage, 6) Add attack stat, 7) Subtract defense + DR, 8) Apply type effectiveness, 9) Check injuries/KO.
- **Expected behavior:** The full formula chain in order.
- **Actual behavior:** `app/utils/damageCalculation.ts:262-323` — `calculateDamage()` implements: Steps 1-3 (DB + STAB = effectiveDB), Steps 4-5 (set damage + crit bonus), Step 6 (add effective attack with post-stage Focus bonus), Step 7 (subtract effective defense with Focus bonus + DR, min 1), Step 8 (multiply by type effectiveness, floor), Step 9 (min 1 unless immune). Step 2 (multi-strike) not applicable to current scope.
- **Classification:** Correct

### 11. combat-R021 — STAB (Same Type Attack Bonus)

- **Rule:** "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2." (07-combat.md:791-792)
- **Expected behavior:** +2 to DB if attacker type matches move type. Only Pokemon get STAB, not trainers.
- **Actual behavior:** `app/utils/damageCalculation.ts:238-240` — `hasSTAB` checks `attackerTypes.includes(moveType)`. `app/composables/useMoveCalculation.ts:166-176` — `actorTypes` returns types only for pokemon actors (empty array for humans). STAB adds +2 to effectiveDB.
- **Classification:** Correct

### 12. combat-R026 — Type Effectiveness (Single Type)

- **Rule:** "A Super-Effective hit will deal x1.5 damage. A Resisted Hit deals 1/2 damage." (07-combat.md:781-787)
- **Expected behavior:** SE = 1.5x, resist = 0.5x, immune = 0x. (NOT video-game 2x values.)
- **Actual behavior:** `app/utils/typeChart.ts:15-34` — TYPE_CHART uses 1.5 for SE, 0.5 for resist, 0 for immune. `NET_EFFECTIVENESS`: +1=1.5, +2=2.0, +3=3.0, -1=0.5, -2=0.25, -3=0.125.
- **Classification:** Correct

### 13. combat-R027 — Type Effectiveness (Dual Type)

- **Rule:** PTU dual-type rules (07-combat.md:1007-1022): Both weak = x2. Both resist = x0.25. One weak + one resist = neutral. Either immune = 0.
- **Expected behavior:** Count SE and resist per type, net them, look up multiplier.
- **Actual behavior:** `app/utils/typeChart.ts:59-76` — `getTypeEffectiveness` counts SE and resist per defender type, nets them, clamps to [-3, +3], looks up multiplier. Immunity returns 0 immediately.
- **Classification:** Correct

### 14. combat-R032 — Tick of Hit Points

- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points." (07-combat.md:831-832)
- **Expected behavior:** tick = maxHp / 10
- **Actual behavior:** The tick concept is correct wherever used (e.g., `getEffectiveMaxHp` in `app/utils/restHealing.ts:20-24` divides by 10 for injury reduction). Tick damage from status conditions is not yet automated — captured by R088-R091 as Partial.
- **Classification:** Correct

### 15. combat-R074 — Injury Effect on Max HP

- **Rule:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." (07-combat.md:1867-1871)
- **Expected behavior:** `effectiveMaxHp = floor(maxHp * (10 - injuries) / 10)`
- **Actual behavior:** `app/utils/restHealing.ts:20-24` — `getEffectiveMaxHp(maxHp, injuries)`: clamps injuries to max 10, returns `floor(maxHp * (10 - effectiveInjuries) / 10)`.
- **Classification:** Correct

---
