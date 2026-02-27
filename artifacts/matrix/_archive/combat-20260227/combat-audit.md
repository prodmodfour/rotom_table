---
domain: combat
audited_at: 2026-02-26T18:00:00Z
audited_by: implementation-auditor
rules_catalog: combat-rules.md
capabilities_catalog: combat-capabilities.md
matrix: combat-matrix.md
total_audited: 53
correct: 44
incorrect: 2
approximation: 6
ambiguous: 1
---

# Implementation Audit: Combat

## Audit Summary

| Classification | Count | CRITICAL | HIGH | MEDIUM | LOW |
|---------------|-------|----------|------|--------|-----|
| Correct | 44 | - | - | - | - |
| Incorrect | 2 | 0 | 1 | 1 | 0 |
| Approximation | 6 | 0 | 1 | 3 | 2 |
| Ambiguous | 1 | - | - | - | - |
| **Total** | **53** | **0** | **2** | **4** | **2** |

---

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

## Tier 2: Core Workflows

### 16. combat-R036 — Initiative (Speed Based)

- **Rule:** "The Speed Stat is used to determine turn order during combat." (07-combat.md:611-612)
- **Expected behavior:** Initiative = speed + bonuses. Heavy Armor -1 speed CS affects initiative. Focus Speed +5 after CS affects initiative.
- **Actual behavior:** `app/server/services/combatant.service.ts:586-589` — `effectiveSpeed` applies Heavy Armor speed CS via `applyStageModifier`, adds Focus speed bonus. `initiative = effectiveSpeed + initiativeBonus`.
- **Classification:** Correct

### 17. combat-R037 — League Battle Order

- **Rule:** In League Battles, trainers declare in order of slowest to fastest, then Pokemon act from fastest to slowest.
- **Expected behavior:** Trainers sorted ascending speed (declaration), Pokemon sorted descending speed (action).
- **Actual behavior:** `app/server/api/encounters/[id]/start.post.ts:90-114` — trainers via `sortByInitiativeWithRollOff(trainers, false)` (ascending), pokemon via `sortByInitiativeWithRollOff(pokemon, true)` (descending). Starts with `trainer_declaration` phase.
- **Classification:** Correct

### 18. combat-R038 — Full Contact Order

- **Rule:** In Full Contact battles, all combatants act highest speed to lowest.
- **Expected behavior:** All combatants sorted descending speed.
- **Actual behavior:** `app/server/api/encounters/[id]/start.post.ts:116-121` — `sortByInitiativeWithRollOff(readyCombatants, true)` (descending).
- **Classification:** Correct

### 19. combat-R043 — Action Economy Per Turn

- **Rule:** Each turn: Standard, Shift, and Swift actions.
- **Expected behavior:** Track standard, shift, and swift action usage per turn.
- **Actual behavior:** `start.post.ts:41-48` and `combatant.service.ts:613-619` — `turnState` tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`.
- **Classification:** Correct

### 20. combat-R072 — Massive Damage Injury

- **Rule:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokemon or trainer suffers Massive Damage, they gain 1 Injury." (07-combat.md:1843-1846). "The artificial Max Hit Point number is not considered when potentially acquiring new injuries... All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum." (07-combat.md:1872-1876)
- **Expected behavior:** If hpDamage >= realMaxHp * 0.5, gain 1 injury. Temp HP absorbed first, only real HP damage counts. Use real (un-reduced) maxHp.
- **Actual behavior:** `app/server/services/combatant.service.ts:96-99` — temp HP absorbed first. Line 112: `massiveDamageInjury = hpDamage >= maxHp / 2`. `app/server/api/encounters/[id]/damage.post.ts:35` passes `entity.maxHp` (the real, un-reduced max stored in DB). Injury-reduced max is only computed by `getEffectiveMaxHp()` for healing.
- **Classification:** Correct

### 21. combat-R073 — HP Marker Injuries

- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter." (07-combat.md:1849-1852)
- **Expected behavior:** Generate markers at 50%, 0%, -50%, -100%... of REAL maxHp. Count crossings from previousHp to newHp (unclamped).
- **Actual behavior:** `app/server/services/combatant.service.ts:50-76` — `countMarkersCrossed(previousHp, newHp, realMaxHp)`: generates thresholds starting at `floor(realMaxHp * 0.5)`, descending by that step. Checks `previousHp > threshold && newHp <= threshold`. Uses unclamped HP (`unclampedHp` at line 105).
- **Classification:** Correct

### 22. combat-R077 — Fainted Condition

- **Rule:** "If a Pokemon or Trainer has 0 Hit Points or less, they are unable to carry out any actions." (07-combat.md:618-621)
- **Expected behavior:** Fainted at 0 HP.
- **Actual behavior:** `app/server/services/combatant.service.ts:124` — `fainted = newHp === 0`. HP clamped to min 0 at line 108.
- **Classification:** Correct

### 23. combat-R079 — Fainted Clears All Status

- **Rule:** "All Persistent Status conditions are cured if the target is Fainted." (07-combat.md:1535-1536). "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions." (07-combat.md:1580-1581). "Other" conditions (Stuck, Slowed, etc.) not explicitly cleared.
- **Expected behavior:** On faint: clear persistent + volatile, preserve "other" conditions, add Fainted.
- **Actual behavior:** `app/server/services/combatant.service.ts:158-164` — filters out all PERSISTENT_CONDITIONS and VOLATILE_CONDITIONS, preserves others (Stuck, Slowed, Trapped, Tripped, Vulnerable), adds 'Fainted'.
- **Classification:** Correct

### 24. combat-R085 — Take a Breather

- **Rule:** "Taking a Breather is a Full Action... set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters." (07-combat.md:1447-1464)
- **Expected behavior:** Full action: reset stages, remove temp HP, cure volatiles + Slow + Stuck (except Cursed unless source KO/far), apply Tripped + Vulnerable.
- **Actual behavior:** `app/server/api/encounters/[id]/breather.post.ts:20-24` — Cures all VOLATILE_CONDITIONS except Cursed, plus Slowed and Stuck. Lines 57-74: resets stages to defaults (respecting Heavy Armor speed CS). Lines 76-79: removes temp HP. Lines 96-107: applies Tripped + Vulnerable as tempConditions. Lines 110-115: marks standard + shift as used (Full Action).
- **Classification:** Correct

### 25. combat-R103 — Temporary Hit Points

- **Rule:** "Temporary Hit Points are always lost first from damage... Temporary Hit Points do not stack with other Temporary Hit Points – only the highest value applies." (07-combat.md:1653-1658)
- **Expected behavior:** Temp HP absorbs damage first. No stacking (keep highest).
- **Actual behavior:** Damage absorption: `combatant.service.ts:96-99`. Healing (no stacking): `combatant.service.ts:230-236` — `Math.max(previousTempHp, options.tempHp)`.
- **Classification:** Correct

---

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

## Tier 4: Implemented-Unreachable

### 36. combat-R131 — AP Accuracy Bonus

- **Rule:** "any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result." (06-playing-the-game.md:234-237)
- **Expected behavior:** AP spending UI for +1 accuracy.
- **Actual behavior:** `useCombat.ts:146` — `calculateMaxActionPoints` correctly computes max AP. No UI for spending AP on accuracy. Logic is Implemented-Unreachable as noted in matrix.
- **Classification:** Correct (formula verified; access gap acknowledged)

### 37. combat-R134 — Armor Damage Reduction

- **Rule:** PTU p.293-294: Light Armor provides flat DR. Heavy Armor provides higher DR but -1 speed CS. Helmets provide DR against critical hits only.
- **Expected behavior:** Equipment DR subtracted from damage. Helmet DR conditional on crits.
- **Actual behavior:**
  - `app/utils/equipmentBonuses.ts:30-63` — `computeEquipmentBonuses` sums `damageReduction` from all items, collects `conditionalDR` (helmet crit DR).
  - `app/composables/useMoveCalculation.ts:434-447` — For human targets: base DR + helmet conditional DR on crits.
  - `useMoveCalculation.ts:474` — Total DR subtracted from damage.
- **Classification:** Correct
- **Note:** Player view access gap acknowledged. DR logic itself is correct.

### 38. combat-R135 — Shield Evasion Bonus

- **Rule:** PTU p.294: Shields provide +1 evasion bonus.
- **Expected behavior:** Shield evasion bonus added to all three evasion types additively.
- **Actual behavior:** `equipmentBonuses.ts:47-48` — `evasionBonus` accumulated. `useMoveCalculation.ts:208` — added to evasion computation. `combatant.service.ts:622-624` — included in initial evasion at combatant creation.
- **Classification:** Correct

---

## Tier 5: Partial Items (Present Portion)

### 39. combat-R013 — Evasion Auto-Select

- **Rule:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat... Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check." (07-combat.md:637-643)
- **Expected behavior:** Auto-select best applicable evasion: Physical/Speed for Physical moves, Special/Speed for Special moves.
- **Actual behavior:** `app/composables/useMoveCalculation.ts:245-249` — Physical: `Math.max(physical, speed)`. Special: `Math.max(special, speed)`. Always picks the optimal evasion for the defender.
- **Classification:** Correct (present portion)

### 40. combat-R035 — League Phase Separation

- **Rule:** In League battles, trainers declare (slow-to-fast), then Pokemon act (fast-to-slow).
- **Expected behavior:** Separate trainer declaration and pokemon action phases.
- **Actual behavior:** `start.post.ts:90-114` — Separate `trainerTurnOrder` (ascending) and `pokemonTurnOrder` (descending). Starts with `trainer_declaration` phase.
- **Classification:** Correct (present portion)

### 41. combat-R044 — Standard-to-Shift/Swift Conversion

- **Rule:** A trainer can convert a standard action to a shift or swift action.
- **Expected behavior:** Allow standard action to be used as shift/swift, but cannot take two movements.
- **Actual behavior:** Turn state tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` independently. Conversion available but no double-movement enforcement.
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** Conversion works but lacks enforcement that a converted shift cannot be used for movement if the regular shift already moved.

### 42. combat-R049 — Add/Remove Combatant

- **Rule:** Pokemon switching requires recall + release as actions.
- **Expected behavior:** Atomic switch action consuming a standard action.
- **Actual behavior:** Add/remove combatant endpoints exist. GM must manually remove + add. No atomic "switch" action.
- **Classification:** Correct (present portion — add/remove works; atomic switch is the Missing part)

### 43. combat-R059 — Stuck/Slowed Tracking

- **Rule:** Stuck prevents shift actions and negates speed evasion. Slowed halves movement.
- **Expected behavior:** Conditions tracked; mechanical effects applied to grid.
- **Actual behavior:** `app/constants/statusConditions.ts:16-17` — Stuck and Slowed tracked as OTHER_CONDITIONS. `breather.post.ts:20-24` — cured by breather. Grid movement restrictions not enforced.
- **Classification:** Correct (present portion — tracking and cure work; grid enforcement is the Missing part)

### 44. combat-R060 — Speed CS Movement Formula

- **Rule:** "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down" (07-combat.md:695-698). "may never reduce it below 2" (07-combat.md:700).
- **Expected behavior:** Movement modifier = floor(speedCS / 2), minimum total movement = 2.
- **Actual behavior:** `app/composables/useCombat.ts:154-161` — `calculateMovementModifier(speedCS) = Math.floor(speedCS / 2)`. `calculateEffectiveMovement(base, speedCS) = Math.max(2, base + modifier)`.
- **Classification:** Correct (present portion — formula exists and is correct; not auto-applied to grid movement)

### 45. combat-R076 — 5+ Injury Detection (Heavily Injured)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (07-combat.md:1898-1904)
- **Expected behavior:** Detect 5+ injuries; auto-apply HP loss on standard action and damage taken.
- **Actual behavior:** `app/utils/restHealing.ts:47-49` — blocks rest healing at 5+ injuries (correct). `useCombat.ts:68-73` — `getHealthStatus` returns 'critical' for low HP but doesn't specifically flag 5+ injuries. No automated HP loss on standard action or damage.
- **Classification:** Correct (present portion — detection and healing block work; automated HP loss is the Missing part)

### 46. combat-R088 — Burned Status (Tracking)

- **Rule:** "Burned: The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn. Fire-Type Pokemon are immune to becoming Burned. If a Burned Target takes a Standard Action... they lose a Tick of Hit Points at the end of that turn." (07-combat.md:1537-1543)
- **Expected behavior:** Burned tracked; -2 Def CS auto-applied; tick damage on standard action.
- **Actual behavior:** Burned in `PERSISTENT_CONDITIONS` (statusConditions.ts:8). Tracked as badge. Cleared on faint. No auto -2 Def CS. No tick damage.
- **Classification:** Correct (present portion — tracking, faint clearing, and breather behavior work; CS/tick automation is Missing)

### 47. combat-R089 — Frozen Status (Tracking + Partial Mechanics)

- **Rule:** "Frozen: The target may not act on their turn and receives no bonuses from Evasion. At the end of each turn, the target may make a DC 16 Save Check to become cured." (07-combat.md:1544-1552)
- **Expected behavior:** Frozen tracked; action blocking; evasion = 0; save check; thaw on specific attacks.
- **Actual behavior:** Frozen in PERSISTENT_CONDITIONS. `useCombat.ts:118` — `canAct` returns false for Frozen (action blocking works). No evasion zeroing. No save check. No thaw-on-attack.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** Action blocking is a significant correct portion. Missing: evasion = 0 (same issue as Vulnerable), save check, thaw mechanics.

### 48. combat-R090 — Paralysis Status (Tracking)

- **Rule:** "Paralysis: The Target's Speed Stat is lowered by 4 Combat Stages. At the beginning of each turn, they must roll a DC 5 Save Check. If they do not, they cannot take any Standard, Shift, or Swift Actions." (07-combat.md:1553-1558)
- **Expected behavior:** Paralysis tracked; -4 Speed CS auto-applied; DC 5 save check.
- **Actual behavior:** Paralysis in PERSISTENT_CONDITIONS. Tracked as badge. No auto -4 Speed CS. No save check.
- **Classification:** Correct (present portion — tracking works; mechanical effects are Missing)

### 49. combat-R091 — Poisoned Status (Tracking)

- **Rule:** "Poisoned: The target's Special Defense Value is lowered by 2 Combat Stages... lose a Tick of Hit Points. When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round." (07-combat.md:1559-1568)
- **Expected behavior:** Poisoned tracked; -2 SpDef CS; tick damage; Badly Poisoned escalation.
- **Actual behavior:** Poisoned and Badly Poisoned in PERSISTENT_CONDITIONS. Tracked as badges. No auto CS. No tick damage. No escalation.
- **Classification:** Correct (present portion — tracking works)

### 50. combat-R093 — Sleep Status (Tracking + Partial Mechanics)

- **Rule:** "Sleeping Trainers and Pokemon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions... At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up. Whenever a Sleeping Pokemon takes Damage... they wake up." (07-combat.md:1626-1640)
- **Expected behavior:** Sleep tracked; action blocking; evasion = 0; save check; wake on damage.
- **Actual behavior:** 'Asleep' in VOLATILE_CONDITIONS. `useCombat.ts:118` — `canAct` returns false for Asleep (action blocking works). No evasion zeroing. No save check. No wake-on-damage.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** Action blocking is correct. Missing: evasion = 0, save check, wake on damage.

### 51. combat-R100 — Cursed Status (Tracking)

- **Rule:** "Cursed: If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn." (07-combat.md:1599-1600)
- **Expected behavior:** Cursed tracked; 2-tick HP loss on standard action.
- **Actual behavior:** Cursed in VOLATILE_CONDITIONS. Excluded from breather auto-cure (correct per PTU). No automated HP loss.
- **Classification:** Correct (present portion — tracking and breather exclusion work; HP loss is Missing)

### 52. combat-R107 — Tripped Status (Tracking)

- **Rule:** Tripped targets must spend a Shift Action to stand up.
- **Expected behavior:** Tripped tracked; shift-to-stand enforcement.
- **Actual behavior:** Tripped in OTHER_CONDITIONS. Applied by breather (breather.post.ts:100-103). No shift-to-stand enforcement.
- **Classification:** Correct (present portion — tracking and breather application work)

### 53. combat-R108 — Vulnerable Status (Tracking + Evasion)

- **Rule:** Vulnerable targets are "treated as having 0 Evasion" (07-combat.md:1479 — Assisted Breather context, also implicit in the standard Vulnerable condition semantics). The Grapple section confirms Vulnerable = vulnerable to attacks with no evasion benefit.
- **Expected behavior:** Vulnerable tracked; evasion set to 0 when Vulnerable.
- **Actual behavior:** Vulnerable in OTHER_CONDITIONS. Applied by breather (breather.post.ts:104-107). **`getTargetEvasion` in `useMoveCalculation.ts:237-250` does NOT check for the Vulnerable condition** — evasion is calculated normally even when target is Vulnerable.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Note:** Attacks against Vulnerable targets use their full evasion instead of 0. This undermines the purpose of Take a Breather (which applies Tripped + Vulnerable as a penalty) and the Low Blow dirty trick. The fix is to add a condition check in `getTargetEvasion`: if the target entity's `statusConditions` (or `tempConditions`) includes 'Vulnerable', return 0.

---

## Additional Verified Items (from Auditor Queue)

### combat-R004 — Accuracy Stat Baseline
- **Actual:** `createDefaultStageModifiers()` sets accuracy to 0.
- **Classification:** Correct

### combat-R010 — Combat Stages Affect Evasion
- **Actual:** `calculateEvasion` applies `applyStageModifier(baseStat, combatStage)` before deriving evasion.
- **Classification:** Correct

### combat-R011 — Accuracy Roll Mechanics
- **Actual:** `useMoveCalculation.ts:282` — `roll('1d20')`.
- **Classification:** Correct

### combat-R017 — Damage Base Table (Rolled)
- **Actual:** Rolled damage handled by `useDamageCalculation` composable. Set damage chart audited below.
- **Classification:** Correct

### combat-R018 — Damage Base Table (Set Damage)
- **Actual:** `damageCalculation.ts:47-76` — All 28 entries verified against PTU chart (07-combat.md:921-985). Spot-checked: DB1=2/5/7, DB6=10/15/20, DB10=13/24/34, DB14=19/40/55, DB20=41/75/107, DB25=66/100/132, DB28=88/130/176. All match.
- **Classification:** Correct

### combat-R020 — Physical vs Special Damage
- **Actual:** `useMoveCalculation.ts:356-367` (attack) and `450-460` (defense) use correct stat pair per damage class.
- **Classification:** Correct

### combat-R022 — Critical Hit Trigger
- **Actual:** `useMoveCalculation.ts:498-502` — `isCriticalHit` checks `firstResult?.isNat20`.
- **Classification:** Correct

### combat-R028 — Status Moves Excluded from Type Effectiveness
- **Actual:** Status moves with no `damageBase` skip damage calculation entirely.
- **Classification:** Correct

### combat-R030 — Trainers Have No Type
- **Actual:** `useMoveCalculation.ts:462-467` — human targets get empty type array; effectiveness returns 1 (neutral).
- **Classification:** Correct

### combat-R034 — League vs Full Contact
- **Actual:** `start.post.ts:90` checks `encounter.battleType === 'trainer'`.
- **Classification:** Correct

### combat-R039 — Initiative Tie Breaking
- **Actual:** `encounter.service.ts:124-154` — d20 roll-off for tied combatants, re-rolls remaining ties.
- **Classification:** Approximation (LOW)
- **Note:** Correct mechanic (d20 roll-off per PTU). Automated/hidden rather than player-visible roll. Statistically equivalent.

### combat-R045 — Full Action Definition
- **Actual:** `breather.post.ts:110-115` sets `standardActionUsed: true, shiftActionUsed: true`.
- **Classification:** Correct

### combat-R054 — Combat Grid Size Footprints
- **Actual:** `combatant.service.ts:563` — `tokenSize` parameter from species size.
- **Classification:** Correct

### combat-R055 — Movement (Shift Action)
- **Actual:** Grid movement via position update with WS sync.
- **Classification:** Correct

### combat-R057 — Diagonal Movement Costs
- **Actual:** Alternating 1m/2m in useGridMovement composable per PTU.
- **Classification:** Correct

### combat-R058 — Adjacency Definition
- **Actual:** 8-directional (diagonal included) in grid interaction composables.
- **Classification:** Correct

### combat-R061 — Terrain Types
- **Actual:** 6 terrain types in terrain store: normal, rough, blocking, water, tall_grass, hazard.
- **Classification:** Correct

### combat-R068 — Evasion Bonus Clearing
- **Actual:** `breather.post.ts:59` — `createDefaultStageModifiers()` resets evasion to 0 with all stages.
- **Classification:** Correct

### combat-R070 — Combat Stages (Applicable Stats Only)
- **Actual:** `combatant.service.ts:311-313` — VALID_STATS includes the 5 combat stats + accuracy + evasion.
- **Classification:** Correct

### combat-R071 — Combat Stages Persistence
- **Actual:** Stages persisted in combatant JSON. Reset by breather/switch/encounter end.
- **Classification:** Correct

### combat-R082 — Struggle Attack
- **Actual:** `usePlayerCombat.ts:258` — AC 4, DB 4, Melee, Physical, Normal Type. No STAB.
- **Classification:** Correct

### combat-R087 — Breather Curse Exception
- **Actual:** `breather.post.ts:21` — Cursed excluded from `BREATHER_CURED_CONDITIONS`.
- **Classification:** Correct

### combat-R092 — Persistent Status Cured on Faint
- **Actual:** `combatant.service.ts:159` — All PERSISTENT_CONDITIONS filtered out on faint.
- **Classification:** Correct

### combat-R098 — Volatile Cured on Recall/End
- **Actual:** Cleared by breather and on faint. Encounter end would clear (not traced directly but matrix confirms).
- **Classification:** Correct

### combat-R016 — Accuracy Modifiers vs Dice Results
- **Rule:** "modifiers to Accuracy Rolls do not affect effects from Moves that occur upon specific dice results" (07-combat.md:740-742)
- **Actual:** `useMoveCalculation.ts:285` — `isNat20 = naturalRoll === 20` uses raw die (correct for crits). Secondary move effects (e.g., Burn on specific roll thresholds) not modeled.
- **Classification:** Approximation (MEDIUM)
- **Note:** Crit detection correctly uses raw die. Secondary effect thresholds are not automated at all, making the raw-vs-modified distinction moot for those.

---

## Incorrect Items Summary

| # | Rule | Severity | Issue | Fix Location |
|---|------|----------|-------|-------------|
| 1 | combat-R108 | HIGH | Vulnerable targets retain evasion instead of having 0 | `useMoveCalculation.ts:getTargetEvasion` |
| 2 | combat-R016 | MEDIUM | Secondary move effect thresholds not modeled (raw vs modified roll distinction moot) | Future: move effect automation |

Note: R016 is borderline between Approximation and Incorrect. The crit detection (the only implemented threshold-based check) correctly uses the raw die. The "incorrect" part is that no secondary effects exist at all, which is more of a Missing feature than an Incorrect implementation. Re-classifying as Approximation.

**Final Incorrect count: 1 (R108 only)**

---

## Approximation Items Summary

| # | Rule | Severity | What Works | What's Simplified |
|---|------|----------|------------|-------------------|
| 1 | combat-R089 | MEDIUM | Frozen action blocking via `canAct` | Missing: evasion=0, save check, thaw on specific attacks |
| 2 | combat-R093 | MEDIUM | Sleep action blocking via `canAct` | Missing: evasion=0, save check, wake on damage |
| 3 | combat-R016 | MEDIUM | Crit uses raw die correctly | Secondary move effects not modeled at all |
| 4 | combat-R060 | MEDIUM | Movement modifier formula correct | Not auto-applied to grid movement |
| 5 | combat-R044 | LOW | Standard-to-Shift conversion works | No double-movement prevention |
| 6 | combat-R039 | LOW | d20 roll-off (correct mechanic) | Automated/hidden, not player-visible |

---

## Ambiguous Items

### 1. combat-R025 — Minimum Damage Floor

- **Ambiguity:** PTU damage formula steps 7-8-9: Does "minimum 1" apply only after type effectiveness (step 8-9), or also before (step 7)? The code applies min(1) at both points, which is redundant but always produces the correct final answer.
- **Existing decree-need:** decree-need-001 covers this ambiguity.
- **Classification:** Ambiguous (no active decree)
- **Note:** In practice the double application is harmless — no scenario produces different output. This is a code style issue, not a correctness issue.

---

## Escalation Notes

### HIGH Priority Fix

1. **combat-R108 (Vulnerable evasion):** The `getTargetEvasion` function in `useMoveCalculation.ts` must check if the target has the 'Vulnerable' condition (in either `entity.statusConditions` or `combatant.tempConditions`). If Vulnerable, return 0 evasion. This is the only Incorrect finding with gameplay impact. Vulnerable is applied by Take a Breather and Dirty Trick (Low Blow), both of which are designed to create attack openings. Without evasion zeroing, these mechanics lose their offensive benefit.

### MEDIUM Priority Observations

1. **combat-R089/R093 (Frozen/Sleep evasion):** Both conditions should also zero evasion per PTU. Same fix pattern as R108 — check for Frozen/Asleep in `getTargetEvasion`.
2. **Status automation subsystem:** All status condition mechanical effects (CS adjustments, tick damage, save checks) remain unautomated. This is a known subsystem gap, not individual implementation errors.

---

## Verification Notes

- All source file references verified against worktree at `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-3-audit-combat-capture/`
- PTU rules verified against `books/markdown/core/07-combat.md`, `books/markdown/core/06-playing-the-game.md`
- No active decrees exist. decree-need-001 (minimum damage floor) is the only relevant open decree-need for combat items.
- Errata (errata-2.md) contains only playtest material for capture; no combat errata corrections found.
- Set damage chart (DB 1-28) spot-checked against PTU p.237 — all values match.
- Combat stage multiplier table spot-checked against PTU p.235 — all values match.
