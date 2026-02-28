# Verified Correct Items: Combat Domain

Audited 2026-02-28. 40 items verified correct across 6 audit tiers.

| # | Rule ID | Name | Audit Tier | Evidence |
|---|---------|------|-----------|----------|
| 1 | combat-R002 | Pokemon HP Formula | T1 | `useCombat.ts:40`: `level + (hpStat * 3) + 10` |
| 2 | combat-R003 | Trainer HP Formula | T1 | `useCombat.ts:44`: `(level * 2) + (hpStat * 3) + 10` |
| 3 | combat-R005 | Physical Evasion Formula | T1 | `damageCalculation.ts:105`: `min(6, floor((stageMod(def) + bonus) / 5))` |
| 4 | combat-R006 | Special Evasion Formula | T1 | `useCombat.ts:54`: delegates to `calculateEvasion(spDef, ...)` |
| 5 | combat-R007 | Speed Evasion Formula | T1 | `useCombat.ts:58`: delegates to `calculateEvasion(speed, ...)` |
| 6 | combat-R008 | CS Range and Multipliers | T1 | `damageCalculation.ts:27-41`: -6 to +6, +20%/-10% per stage |
| 7 | combat-R009 | CS Multiplier Table | T1 | `damageCalculation.ts:27-41`: All 13 values match PTU exactly |
| 8 | combat-R010 | CS Affect Evasion | T1 | `damageCalculation.ts:105`: stage-modified stat used for evasion |
| 9 | combat-R011 | Accuracy Roll Mechanics | T3 | `useMoveCalculation.ts:403-404`: d20 roll, natural roll extracted |
| 10 | combat-R012 | Accuracy Check Calculation | T3 | `damageCalculation.ts:118-125`: `max(1, AC + min(9, evasion) - accStage)` |
| 11 | combat-R013 | Evasion Application Rules | T3 | `useMoveCalculation.ts:363-367`: max(classEvasion, speedEvasion) |
| 12 | combat-R014 | Natural 1 Always Misses | T3 | `useMoveCalculation.ts:414-415`: `if (isNat1) { hit = false }` |
| 13 | combat-R015 | Natural 20 Always Hits | T3 | `useMoveCalculation.ts:416-417`: `if (isNat20) { hit = true }` |
| 14 | combat-R016 | Accuracy Modifiers vs Dice Results | T3 | `useMoveCalculation.ts:404-406`: natural roll preserved separately from threshold for crit detection |
| 15 | combat-R018 | Set Damage Table | T1 | `damageCalculation.ts:47-76`: All 28 entries match PTU chart exactly |
| 16 | combat-R019 | Damage Formula (9-step) | T2 | `damageCalculation.ts:262-323`: Full pipeline correct per decree-001 |
| 17 | combat-R020 | Physical vs Special Damage | T1 | `useMoveCalculation.ts:477-488`: Physical=Atk/Def, Special=SpA/SpD |
| 18 | combat-R021 | STAB | T1 | `damageCalculation.ts:238-240,266`: +2 DB when type matches |
| 19 | combat-R022 | Critical Hit Trigger | T1 | `useMoveCalculation.ts:610-614`: d20 == 20 triggers crit |
| 20 | combat-R023 | Critical Hit Damage | T1 | `damageCalculation.ts:271`: doubles set damage, not stat |
| 21 | combat-R025 | Minimum Damage | T2 | `damageCalculation.ts:283,294`: dual min-1 per decree-001 |
| 22 | combat-R026 | Type Effectiveness (Single) | T1 | `typeChart.ts:15-34`: 1.5/0.5/0 (not video game 2x) |
| 23 | combat-R027 | Type Effectiveness (Dual) | T1 | `typeChart.ts:59-76`: net classification system, clamped +-3 |
| 24 | combat-R030 | Trainers Have No Type | T1 | `useMoveCalculation.ts:574-578`: human targets get empty types array |
| 25 | combat-R032 | Tick of Hit Points | T2 | `restHealing.ts:20-24`: maxHp/10 for injury reduction |
| 26 | combat-R033 | Type Immunities to Status | T1 | `status.post.ts:51-71`: decree-012 server enforcement with override |
| 27 | combat-R034 | League vs Full Contact | T1 | `start.post.ts:90`: `battleType` field determines combat type |
| 28 | combat-R036 | Initiative - Speed Based | T1 | `combatant.service.ts:710-714`: `effectiveSpeed + initiativeBonus` |
| 29 | combat-R038 | Initiative - Full Contact | T1 | `start.post.ts:117-119`: all combatants high->low |
| 30 | combat-R039 | Initiative - Tie Breaking + Dynamic Reorder | T1 | `encounter.service.ts:128-182,320-440`: decree-006 compliant |
| 31 | combat-R043 | Action Economy Per Turn | T4 | `start.post.ts:41-48`: standard+shift+swift tracked |
| 32 | combat-R057 | Diagonal Movement Costs | T4 | Alternating 1-2-1 PTU diagonal implemented |
| 33 | combat-R066 | Evasion Max from Stats | T3 | `damageCalculation.ts:105`: `Math.min(6, ...)` |
| 34 | combat-R067 | Evasion Max Total Cap | T3 | `damageCalculation.ts:123`: `Math.min(9, evasion)` |
| 35 | combat-R070 | CS - Applicable Stats Only | T1 | `combatant.service.ts:435-436`: VALID_STATS excludes HP |
| 36 | combat-R071 | CS - Persistence | T5 | Stages persist in combatant data until encounter end or switch |
| 37 | combat-R072 | Massive Damage Injury | T2 | `combatant.service.ts:112`: decree-004 compliant (hpDamage only) |
| 38 | combat-R073 | HP Marker Injuries | T2 | `combatant.service.ts:50-76`: 50%/0%/-50%/-100% etc. |
| 39 | combat-R074 | Injury Effect on Max HP | T1 | `restHealing.ts:20-24`: `floor(maxHp * (10 - injuries) / 10)` |
| 40 | combat-R075 | Injury Max HP - Real Max | T2 | `combatant.service.ts:112,115`: real maxHp used for checks |
| 41 | combat-R077 | Fainted Condition | T5 | `combatant.service.ts:124,158-173`: 0 HP -> Fainted |
| 42 | combat-R079 | Fainted Clears All Status | T5 | `combatant.service.ts:158-173`: persistent+volatile cleared |
| 43 | combat-R085 | Take a Breather | T4 | `breather.post.ts`: Full implementation including assisted variant |
| 44 | combat-R088 | Burned Status CS | T1 | decree-005 auto-apply: `statusConditions.ts:48` + combatant.service.ts |
| 45 | combat-R090 | Paralysis CS | T1 | decree-005 auto-apply + decree-006 initiative reorder |
| 46 | combat-R091 | Poisoned CS | T1 | decree-005 auto-apply: `statusConditions.ts:50-51` |
| 47 | combat-R092 | Persistent Cured on Faint | T5 | `combatant.service.ts:158-173`: cleared with CS reversal |
| 48 | combat-R098 | Volatile Cured on End | T5 | Fresh combatant build on re-entry cleans all |
| 49 | combat-R103 | Temporary Hit Points | T5 | `combatant.service.ts:96-99,239-244`: absorb first, higher wins |
| 50 | combat-R104 | Temp HP - No Percentage Count | T5 | `combatant.service.ts:112,115`: real HP only in thresholds |
| 51 | combat-R107 | Tripped Condition | T4 | `breather.post.ts:159-162`: applied via tempConditions |
| 52 | combat-R108 | Vulnerable Condition | T4 | `breather.post.ts:163-166` + ZeroEvasion path in evasionCalculation.ts |
| 53 | combat-R132 | Rounding Rule | T1 | `Math.floor()` used throughout all calculations |
| 54 | combat-R135 | Shield Evasion Bonus | T6 | `equipmentBonuses.ts:63-65` + evasionCalculation.ts integration |
