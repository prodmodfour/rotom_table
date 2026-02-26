---
domain: combat
analyzed_at: 2026-02-26T16:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: combat-rules.md
capabilities_catalog: combat-capabilities.md (re-mapped 2026-02-26)
total_rules: 135
---

# Feature Completeness Matrix: Combat

## Coverage Score

```
Implemented:              88
Implemented-Unreachable:   4
Partial:                  16
Missing:                  10
Subsystem-Missing:         0
Out of Scope:             17
Coverage = (88 + 0.5*16 + 0.5*4) / (135 - 17) * 100 = (88 + 8 + 2) / 118 * 100 = 83.1%
```

| Classification | Count | % of Total |
|---------------|-------|------------|
| Implemented | 88 | 65.2% |
| Implemented-Unreachable | 4 | 3.0% |
| Partial | 16 | 11.9% |
| Missing | 10 | 7.4% |
| Subsystem-Missing | 0 | 0.0% |
| Out of Scope | 17 | 12.6% |
| **Total** | **135** | **100%** |

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Capability Match | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-----------------|-------------|-------|
| combat-R001 | Basic Combat Stats | enumeration | core | system | Implemented | gm, group, player | C001, C055, C090 | - | Stats stored in combatant entity, computed via composable |
| combat-R002 | Pokemon HP Formula | formula | core | system | Implemented | gm, group, player | C090, pokemon-gen C029 | - | `level + (HP*3) + 10` in useCombat and pokemon-generator |
| combat-R003 | Trainer HP Formula | formula | core | system | Implemented | gm, group, player | C090 | - | `level*2 + (HP*3) + 10` in useCombat |
| combat-R004 | Accuracy Stat Baseline | formula | core | system | Implemented | gm | C054, C062 | - | Accuracy stage tracked in combatant stageModifiers |
| combat-R005 | Physical Evasion Formula | formula | core | system | Implemented | gm, player | C061, C090 | - | `floor(stat/5)`, cap 6, in calculateEvasion |
| combat-R006 | Special Evasion Formula | formula | core | system | Implemented | gm, player | C061, C090 | - | Same formula for SpDef |
| combat-R007 | Speed Evasion Formula | formula | core | system | Implemented | gm, player | C061, C090 | - | Same formula for Speed |
| combat-R008 | Combat Stage Range and Multipliers | formula | core | system | Implemented | gm, player | C063, C085, C054 | - | -6 to +6 clamped, multiplier table exact match |
| combat-R009 | Combat Stage Multiplier Table | enumeration | core | system | Implemented | gm, player | C085 | - | Exact table in STAGE_MULTIPLIERS constant |
| combat-R010 | Combat Stages Affect Evasion | modifier | core | system | Implemented | gm, player | C061, C055 | - | Evasion uses stage-modified stat in calculateEvasion |
| combat-R011 | Accuracy Roll Mechanics | formula | core | gm | Implemented | gm | C091, C062 | - | d20 roll in useMoveCalculation |
| combat-R012 | Accuracy Check Calculation | formula | core | system | Implemented | gm | C062 | - | threshold = moveAC + evasion - accuracyStage |
| combat-R013 | Evasion Application Rules | constraint | core | system | Partial | gm | C061, C091 | P2 | **Present:** Best evasion auto-selected by useMoveCalculation based on move damage class. **Missing:** No explicit constraint preventing manual override to wrong evasion type; auto-selection handles it but no validation error on override. |
| combat-R014 | Natural 1 Always Misses | condition | core | system | Implemented | gm, player | C091, C092 | - | Checked in useMoveCalculation and usePlayerCombat |
| combat-R015 | Natural 20 Always Hits | condition | core | system | Implemented | gm, player | C091, C092 | - | Checked in useMoveCalculation and usePlayerCombat |
| combat-R016 | Accuracy Modifiers vs Dice Results | constraint | situational | system | Partial | gm | C091 | P2 | **Present:** Crit check uses raw die result not modified. **Missing:** Secondary move effects (e.g., Burn on Flamethrower) with trigger thresholds not modeled; no distinction between raw vs modified roll for effect triggers. |
| combat-R017 | Damage Base Table — Rolled Damage | enumeration | core | system | Implemented | gm | C084 | - | DAMAGE_BASE_CHART in damageCalculation.ts |
| combat-R018 | Damage Base Table — Set Damage | enumeration | core | system | Implemented | gm | C084 | - | Set damage (min/avg/max) in DAMAGE_BASE_CHART |
| combat-R019 | Damage Formula — Full Process | workflow | core | gm | Implemented | gm | C060, C028 | - | Full 9-step in calculateDamage utility |
| combat-R020 | Physical vs Special Damage | condition | core | system | Implemented | gm | C060 | - | damageClass determines which stat pair (atk/def or spA/spD) |
| combat-R021 | STAB — Same Type Attack Bonus | modifier | core | system | Implemented | gm | C060, C091 | - | +2 DB if attacker type matches move type |
| combat-R022 | Critical Hit Trigger | condition | core | system | Implemented | gm, player | C091, C092 | - | Natural 20 on d20 = crit |
| combat-R023 | Critical Hit Damage Calculation | formula | core | system | Implemented | gm | C060 | - | Dice rolled twice (set damage uses max column for crit) |
| combat-R024 | Increased Critical Hit Range | modifier | situational | system | Missing | - | - | P2 | No capability for moves/effects that expand crit range below 20. MoveTargetModal only checks nat 20. |
| combat-R025 | Minimum Damage | constraint | core | system | Implemented | gm | C060 | - | min 1 damage (0 if immune) in calculateDamage |
| combat-R026 | Type Effectiveness — Single Type | modifier | core | system | Implemented | gm | C060 | - | 1.5x, 2x, 3x, 0.5x, 0.25x, 0.125x, 0x multipliers |
| combat-R027 | Type Effectiveness — Dual Type | interaction | core | system | Implemented | gm | C060 | - | Multiplicative across both target types |
| combat-R028 | Type Effectiveness — Status Moves Excluded | constraint | core | system | Implemented | gm | C060 | - | Only physical/special moves apply type effectiveness |
| combat-R029 | Type Effectiveness — Immunity vs Non-Standard | interaction | edge-case | system | Out of Scope | - | - | - | Sonic Boom, Counter not modeled as moves |
| combat-R030 | Trainers Have No Type | constraint | situational | system | Implemented | gm | C060 | - | Trainers treated as typeless — neutral effectiveness |
| combat-R031 | Hit Point Loss vs Dealing Damage | interaction | core | system | Partial | gm | C050 | P2 | **Present:** Standard damage application. **Missing:** No "set HP" or "lose HP" action that bypasses defense stats and massive damage check. GM must manually adjust HP via heal. |
| combat-R032 | Tick of Hit Points | formula | core | system | Implemented | gm | C090 | - | 1/10th maxHP in useCombat |
| combat-R033 | Type Immunities to Status Conditions | enumeration | core | system | Missing | - | - | P1 | No automated check preventing Burn on Fire-type, Paralysis on Electric-type, etc. All types can receive any status. |
| combat-R034 | Combat Types — League vs Full Contact | enumeration | core | gm | Implemented | gm | C001, C004, C010 | - | battleType field: 'trainer' or 'full_contact' |
| combat-R035 | Round Structure — Two Turns Per Player | workflow | core | system | Partial | gm | C004, C017 | P1 | **Present:** League mode has trainer/pokemon phase separation. **Missing:** Full contact mode does not enforce two-turns-per-player; each combatant gets one turn in overall order. |
| combat-R036 | Initiative — Speed Based | formula | core | system | Implemented | gm | C055, C015 | - | Initiative = speed + bonus (Focus Speed +5, Heavy Armor -1 CS) |
| combat-R037 | Initiative — League Battle Order | workflow | core | system | Implemented | gm | C004, C015 | - | Trainers declare low-to-high, pokemon act high-to-low |
| combat-R038 | Initiative — Full Contact Order | workflow | core | system | Implemented | gm | C015 | - | All combatants ordered high-to-low speed |
| combat-R039 | Initiative — Tie Breaking | condition | core | system | Partial | gm | C015 | P3 | **Present:** Tie breaking exists in start endpoint. **Missing:** Uses random fallback, not explicit d20 roll-off as PTU specifies. Same statistical result, different UX. |
| combat-R040 | Initiative — Holding Action | constraint | situational | both | Missing | - | - | P2 | No UI or API for holding action to a lower initiative count. |
| combat-R041 | One Full Round Duration | condition | situational | system | Out of Scope | - | - | - | Effect duration tracking not automated; GM manages manually |
| combat-R042 | Action Types — Standard Action | enumeration | core | system | Implemented | gm, player | C022, C090, C092 | - | Standard actions tracked in combatant turn state |
| combat-R043 | Action Economy Per Turn | workflow | core | system | Implemented | gm, player | C017, C090, C092 | - | Standard, Shift, Swift tracked per turn |
| combat-R044 | Standard-to-Shift/Swift Conversion | constraint | situational | both | Partial | gm | C103-C108 | P2 | **Present:** useAction allows consuming standard for shift/swift. **Missing:** No enforcement that converted shift can't be used for movement if regular shift already moved. |
| combat-R045 | Full Action Definition | constraint | core | system | Implemented | gm | C025, C117 | - | Breather and other full actions consume standard+shift |
| combat-R046 | Priority Action Rules | workflow | situational | both | Out of Scope | - | - | - | Priority keyword moves not modeled in turn system |
| combat-R047 | Priority Limited and Advanced Variants | constraint | situational | both | Out of Scope | - | - | - | Priority variants not modeled |
| combat-R048 | Interrupt Actions | workflow | situational | both | Out of Scope | - | - | - | Interrupt moves not modeled in turn system |
| combat-R049 | Pokemon Switching — Full Switch | workflow | core | both | Partial | gm | C018, C019 | P1 | **Present:** Add/remove combatant endpoints exist. **Missing:** No atomic "switch" action consuming a standard action and swapping one Pokemon for another. |
| combat-R050 | Pokemon Switching — League Restriction | constraint | situational | system | Missing | - | - | P2 | No enforcement that switched Pokemon can't act until next round in League mode. |
| combat-R051 | Fainted Pokemon Switch — Shift Action | constraint | core | both | Partial | gm | C019 | P2 | **Present:** Remove combatant available. **Missing:** No enforcement that replacing a fainted Pokemon costs only a shift action. |
| combat-R052 | Recall and Release as Separate Actions | workflow | situational | both | Missing | - | - | P3 | No separate recall/release actions; only add/remove combatant. |
| combat-R053 | Released Pokemon Can Act Immediately | condition | situational | system | Out of Scope | - | - | - | Complex initiative insertion not modeled |
| combat-R054 | Combat Grid — Size Footprints | enumeration | core | system | Implemented | gm, group | C039, C055 | - | Token size from species size (1x1 to 4x4) |
| combat-R055 | Movement — Shift Action | formula | core | both | Implemented | gm, player | C039, C090, C158, C159 | - | Grid movement via position update, WS preview |
| combat-R056 | Movement — No Splitting | constraint | core | system | Out of Scope | - | - | - | Grid movement is atomic position update; splitting impossible by design |
| combat-R057 | Diagonal Movement Costs | formula | core | system | Implemented | gm, group | VTT composables | - | Alternating 1m/2m diagonal in useGridMovement |
| combat-R058 | Adjacency Definition | condition | core | system | Implemented | gm | VTT composables | - | Diagonal adjacency in grid interaction |
| combat-R059 | Stuck and Slowed Conditions on Movement | modifier | core | system | Partial | gm | C082, C025 | P2 | **Present:** Conditions tracked. Cured by Breather. **Missing:** No automated halving for Slowed or shift blocking for Stuck on grid. |
| combat-R060 | Speed Combat Stages Affect Movement | modifier | core | system | Partial | gm | C090 | P2 | **Present:** Speed CS tracked. Movement modifier formula exists. **Missing:** Not auto-applied to grid movement cost. |
| combat-R061 | Terrain Types | enumeration | core | system | Implemented | gm | C043, terrain store | - | 6 types: normal, rough, blocking, water, tall_grass, hazard |
| combat-R062 | Rough Terrain Accuracy Penalty | modifier | situational | system | Missing | - | - | P2 | Terrain painted but -2 accuracy not auto-applied. |
| combat-R063 | Flanking — Evasion Penalty | modifier | situational | system | Missing | - | - | P2 | No flanking detection or -2 evasion penalty. |
| combat-R064 | Flanking — Requirements by Size | condition | situational | system | Missing | - | - | P2 | No flanking detection. |
| combat-R065 | Flanking — Large Combatant Squares | modifier | edge-case | system | Missing | - | - | P3 | No flanking detection. |
| combat-R066 | Evasion Max from Stats | constraint | core | system | Implemented | gm, player | C061 | - | Cap 6 in calculateEvasion |
| combat-R067 | Evasion Max Total Cap | constraint | core | system | Implemented | gm | C062 | - | min(9, evasion) in calculateAccuracyThreshold |
| combat-R068 | Evasion Bonus Clearing | interaction | situational | system | Implemented | gm | C025 | - | Breather clears stages and evasion bonuses |
| combat-R069 | Willing Target | condition | edge-case | both | Out of Scope | - | - | - | GM skips accuracy check manually |
| combat-R070 | Combat Stages — Applicable Stats Only | constraint | core | system | Implemented | gm | C023, C054 | - | Only Atk, Def, SpA, SpD, Spe, Accuracy, Evasion tracked |
| combat-R071 | Combat Stages — Persistence | condition | core | system | Implemented | gm | C054 | - | Stages persist until encounter end or breather/switch |
| combat-R072 | Massive Damage Injury | condition | core | system | Implemented | gm | C050, C058 | - | 50%+ maxHP = 1 injury in calculateDamage |
| combat-R073 | Hit Point Marker Injuries | condition | core | system | Implemented | gm | C050, C058 | - | countMarkersCrossed at 50%, 0%, -50%, -100% |
| combat-R074 | Injury Effect on Max HP | formula | core | system | Implemented | gm | C090, healing-C052 | - | getEffectiveMaxHp: each injury reduces by 1/10 |
| combat-R075 | Injury Max HP Uses Real Maximum | constraint | core | system | Implemented | gm | C050 | - | Massive damage and marker checks use real maxHP |
| combat-R076 | Heavily Injured — 5+ Injuries | condition | core | system | Partial | gm | C090 | P1 | **Present:** 5+ injury detection in healthStatus. Blocks rest healing. **Missing:** No automated HP loss on standard actions or when taking damage while heavily injured. |
| combat-R077 | Fainted Condition | condition | core | system | Implemented | gm | C050, C051 | - | Fainted at 0 HP, applied by damage system |
| combat-R078 | Fainted Recovery | constraint | core | system | Implemented | gm | C052, healing-C030 | - | Heal removes Fainted; potion 10-min timer not modeled |
| combat-R079 | Fainted Clears All Status | interaction | core | system | Implemented | gm | C051 | - | applyDamageToEntity clears persistent+volatile on faint |
| combat-R080 | Death Conditions | condition | core | system | Missing | - | - | P2 | No detection of 10 injuries or -50HP/-200% death threshold. |
| combat-R081 | Death — League Exemption | constraint | situational | system | Out of Scope | - | - | - | Death not tracked; exemption moot |
| combat-R082 | Struggle Attack | enumeration | core | both | Implemented | gm, player | C080, C092, C124 | - | Struggle in COMBAT_MANEUVERS and PlayerCombatActions |
| combat-R083 | Struggle — Expert Combat Upgrade | modifier | situational | system | Missing | - | - | P3 | No skill rank check for DB5/AC3 upgrade. |
| combat-R084 | Coup de Grace | workflow | edge-case | both | Out of Scope | - | - | - | Not modeled as a specific action type |
| combat-R085 | Take a Breather | workflow | core | both | Implemented | gm | C025, C117 | - | Full: stages reset, temp HP removed, volatile cured, Tripped+Vulnerable |
| combat-R086 | Take a Breather — Assisted | workflow | situational | both | Out of Scope | - | - | - | Assisted Breather with Command Check not modeled |
| combat-R087 | Take a Breather — Curse Exception | interaction | edge-case | system | Implemented | gm | C025 | - | Cursed excluded from breather cures |
| combat-R088 | Burned Status | modifier | core | system | Partial | gm | C082, C024 | P1 | **Present:** Burned tracked as status badge. **Missing:** -2 Defense CS not auto-applied; tick damage on standard action not automated. |
| combat-R089 | Frozen Status | modifier | core | system | Partial | gm | C082, C024 | P1 | **Present:** Frozen tracked. **Missing:** No action blocking, no save check, no thaw on specific attack types. |
| combat-R090 | Paralysis Status | modifier | core | system | Partial | gm | C082, C024 | P1 | **Present:** Paralysis tracked. **Missing:** -4 Speed CS not auto-applied; no DC 5 save check. |
| combat-R091 | Poisoned Status | modifier | core | system | Partial | gm | C082, C024 | P1 | **Present:** Poisoned/Badly Poisoned tracked. **Missing:** -2 SpDef CS not auto-applied; tick damage not automated; Badly Poisoned escalation not tracked. |
| combat-R092 | Persistent Status — Cured on Faint | interaction | core | system | Implemented | gm | C051 | - | Damage service clears persistent on faint |
| combat-R093 | Sleep Status | modifier | core | system | Partial | gm | C082, C024 | P1 | **Present:** Sleep tracked. **Missing:** No action blocking, no evasion removal, no DC 16 save, no wake on damage. |
| combat-R094 | Confused Status | modifier | core | system | Out of Scope | - | - | - | Confusion save/self-hit mechanic not automated |
| combat-R095 | Rage Status | modifier | situational | system | Out of Scope | - | - | - | Rage move restriction not automated |
| combat-R096 | Flinch Status | modifier | situational | system | Out of Scope | - | - | - | Flinch action blocking not automated |
| combat-R097 | Infatuation Status | modifier | situational | system | Out of Scope | - | - | - | Infatuation targeting restriction not automated |
| combat-R098 | Volatile — Cured on Recall/End | interaction | core | system | Implemented | gm | C025, C051 | - | Volatiles cured by Breather and on faint |
| combat-R099 | Suppressed Status | modifier | situational | system | Out of Scope | - | - | - | Frequency lowering not automated |
| combat-R100 | Cursed Status | modifier | situational | system | Partial | gm | C082 | P2 | **Present:** Cursed tracked as condition. **Missing:** 2-tick HP loss on standard action not automated. |
| combat-R101 | Bad Sleep Status | modifier | edge-case | system | Out of Scope | - | - | - | Bad Sleep tick on save not automated |
| combat-R102 | Disabled Status | modifier | situational | system | Out of Scope | - | - | - | Move blocking not automated |
| combat-R103 | Temporary Hit Points | interaction | core | system | Implemented | gm | C050, C052 | - | Temp HP absorbs first, no stacking (higher wins) |
| combat-R104 | Temp HP — No Percentage Count | constraint | situational | system | Implemented | gm | C050 | - | Massive damage uses real HP |
| combat-R105 | Blindness Condition | modifier | situational | system | Out of Scope | - | - | - | Blindness effects not automated |
| combat-R106 | Total Blindness Condition | modifier | edge-case | system | Out of Scope | - | - | - | Total Blindness not automated |
| combat-R107 | Tripped Condition | condition | core | system | Partial | gm | C082, C025 | P2 | **Present:** Tripped tracked, applied by Breather. **Missing:** No shift-to-stand enforcement. |
| combat-R108 | Vulnerable Condition | condition | core | system | Partial | gm | C082, C025 | P2 | **Present:** Vulnerable tracked, applied by Breather. **Missing:** No evasion removal for Vulnerable targets in accuracy calc. |
| combat-R109 | Trapped Condition | condition | situational | system | Partial | gm | C082 | P3 | **Present:** Tracked as badge. **Missing:** No recall prevention enforcement. |
| combat-R110 | Attack of Opportunity | workflow | core | both | Missing | - | - | P2 | No AoO trigger system or interrupt mechanic. |
| combat-R111 | Disengage Maneuver | workflow | core | both | Missing | - | - | P2 | Not in COMBAT_MANEUVERS constant. No safe 1m shift. |
| combat-R112 | Push Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Push in COMBAT_MANEUVERS and ManeuverGrid |
| combat-R113 | Sprint Maneuver | workflow | core | both | Implemented | gm | C026, C117 | - | Sprint endpoint with +50% movement |
| combat-R114 | Trip Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Trip in COMBAT_MANEUVERS and ManeuverGrid |
| combat-R115 | Grapple Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Grapple in COMBAT_MANEUVERS and ManeuverGrid |
| combat-R116 | Intercept Melee Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Intercept Melee in COMBAT_MANEUVERS |
| combat-R117 | Intercept Ranged Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Intercept Ranged in COMBAT_MANEUVERS |
| combat-R118 | Intercept — Loyalty Requirement | constraint | situational | system | Out of Scope | - | - | - | Loyalty check not automated |
| combat-R119 | Intercept — Additional Rules | constraint | edge-case | system | Out of Scope | - | - | - | Complex intercept restrictions not automated |
| combat-R120 | Disarm Maneuver | workflow | situational | both | Implemented | gm, player | C080, C125 | - | Disarm in COMBAT_MANEUVERS |
| combat-R121 | Dirty Trick Maneuver | enumeration | situational | both | Implemented | gm, player | C080, C125 | - | Dirty Trick in COMBAT_MANEUVERS |
| combat-R122 | Manipulate Maneuver | enumeration | situational | both | Missing | - | - | P3 | Manipulate (Bon Mot, Flirt, Terrorize) not in COMBAT_MANEUVERS. Trainer-only. |
| combat-R123 | Suffocating | condition | edge-case | system | Out of Scope | - | - | - | Environmental hazard not automated |
| combat-R124 | Falling Damage Formula | formula | edge-case | system | Out of Scope | - | - | - | Environmental hazard not automated |
| combat-R125 | Falling Injuries | modifier | edge-case | system | Out of Scope | - | - | - | Environmental hazard not automated |
| combat-R126 | Resting — HP Recovery | workflow | cross-domain-ref | gm | Implemented | gm | healing-C001, healing-C006 | - | Cross-domain: see healing matrix |
| combat-R127 | Extended Rest — Status/AP Recovery | workflow | cross-domain-ref | gm | Implemented | gm | healing-C002, healing-C007 | - | Cross-domain: see healing matrix |
| combat-R128 | Natural Injury Healing | condition | cross-domain-ref | gm | Implemented | gm | healing-C004, healing-C009 | - | Cross-domain: see healing matrix |
| combat-R129 | Pokemon Center Healing | workflow | cross-domain-ref | gm | Implemented | gm | healing-C003, healing-C008 | - | Cross-domain: see healing matrix |
| combat-R130 | Action Points | formula | cross-domain-ref | system | Implemented | gm | healing-C054, C090 | - | calculateMaxAp: 5 + floor(level/5) |
| combat-R131 | AP Accuracy Bonus | modifier | cross-domain-ref | both | Implemented-Unreachable | gm only | C090 | P2 | maxAp computed in useCombat but no player-facing UI to spend AP for +1 accuracy. Intended actor: player (during their turn). |
| combat-R132 | Rounding Rule | constraint | cross-domain-ref | system | Implemented | gm | C060, C063 | - | Math.floor used throughout |
| combat-R133 | Percentages Additive Rule | constraint | cross-domain-ref | system | Implemented | gm | C060 | - | Percentages added, not multiplied |
| combat-R134 | Armor Damage Reduction | modifier | cross-domain-ref | both | Implemented-Unreachable | gm only | C065, C060, C081, C136 | P1 | Equipment DR fully computed (Light/Heavy Armor, Helmet crit DR). **Intended actor: both.** Player view has no equipment visibility. |
| combat-R135 | Shield Evasion Bonus | modifier | cross-domain-ref | both | Implemented-Unreachable | gm only | C065, C061, C136 | P1 | Shield +1 evasion in computeEquipmentBonuses. **Intended actor: both.** Player view has no equipment visibility. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 91 | 60 | 0 | 13 | 5 | 13 |
| gm | 4 | 4 | 0 | 0 | 0 | 0 |
| both | 27 | 14 | 4 | 3 | 5 | 1 |
| player | 0 | 0 | 0 | 0 | 0 | 0 |
| cross-domain | 13 | 10 | 0 | 0 | 0 | 3 |

### Key Findings
- **4 rules for actor `both` are Implemented-Unreachable from player view:** AP Accuracy (R131), Armor DR (R134), Shield Evasion (R135), and full combat-side equipment bonuses. Logic works for GM but player has no UI path.
- **Player combat actions exist** via usePlayerCombat (moves, shift, struggle, pass, requests) but many mechanics (status effects, damage calc, maneuvers) remain GM-only.
- **No Subsystem-Missing gaps:** Player view has basic combat participation.

---

## Subsystem Gaps

### 1. No Automated Status Condition Mechanical Effects
- **Rules affected:** R088 (Burned), R089 (Frozen), R090 (Paralysis), R091 (Poisoned), R093 (Sleep), R100 (Cursed) — 6 rules
- **Impact:** Status conditions tracked as labels. No CS adjustments, tick damage, save checks, or action blocking automated.
- **Suggested ticket:** "feat: automate persistent/volatile status condition mechanical effects" (P1)

### 2. No Flanking or Positional Accuracy Modifiers
- **Rules affected:** R062 (Rough Terrain), R063 (Flanking evasion), R064 (Flanking by size), R065 (Large flanking) — 4 rules
- **Impact:** VTT grid has terrain painting but no accuracy/evasion automation from positioning.
- **Suggested ticket:** "feat: add flanking detection and rough terrain accuracy penalty" (P2)

### 3. No Player Equipment Visibility
- **Rules affected:** R134 (Armor DR), R135 (Shield Evasion) — 2 rules (+ 5 equipment items in Missing Subsystems of capabilities)
- **Impact:** Equipment fully implemented for GM but invisible to players.
- **Suggested ticket:** "feat: add read-only equipment display to player view" (P1)

### 4. No Pokemon Switching Workflow
- **Rules affected:** R049 (Full Switch), R050 (League restriction), R051 (Fainted switch), R052 (Recall/Release) — 4 rules
- **Impact:** No atomic switch action. GM must remove + add combatants manually.
- **Suggested ticket:** "feat: implement Pokemon switching as a combat action" (P1)

### 5. No Type Immunity to Status Conditions
- **Rules affected:** R033 — 1 rule
- **Impact:** Fire-type can receive Burn, Electric-type can receive Paralysis, etc.
- **Suggested ticket:** "fix: enforce type immunities when applying status conditions" (P1)

---

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 11 | R033, R035, R049, R076, R088, R089, R090, R091, R093, R134, R135 |
| P2 | 14 | R013, R016, R024, R031, R040, R044, R050, R051, R059, R060, R062, R063, R064, R080, R100, R107, R108, R110, R111, R122, R131 |
| P3 | 5 | R039, R052, R065, R083, R109 |

---

## Auditor Queue

### Tier 1: Core Formulas (Verify Correctness)
1. combat-R002 — Pokemon HP Formula → C090
2. combat-R003 — Trainer HP Formula → C090
3. combat-R008 — Combat Stage Multipliers → C063, C085
4. combat-R009 — Multiplier Table → C085
5. combat-R005 — Physical Evasion → C061
6. combat-R006 — Special Evasion → C061
7. combat-R007 — Speed Evasion → C061
8. combat-R012 — Accuracy Check → C062
9. combat-R023 — Critical Hit Damage → C060
10. combat-R019 — Damage Formula (9-step) → C060
11. combat-R021 — STAB → C060
12. combat-R026 — Type Effectiveness Single → C060
13. combat-R027 — Type Effectiveness Dual → C060
14. combat-R032 — Tick of HP → C090
15. combat-R074 — Injury Max HP Reduction → healing-C052

### Tier 2: Core Workflows (Verify Correctness)
16. combat-R036 — Initiative Speed → C055
17. combat-R037 — League Battle Order → C004, C015
18. combat-R038 — Full Contact Order → C015
19. combat-R043 — Action Economy → C017, C090
20. combat-R072 — Massive Damage Injury → C050
21. combat-R073 — HP Marker Injuries → C050, C058
22. combat-R077 — Fainted Condition → C050, C051
23. combat-R079 — Fainted Clears Status → C051
24. combat-R085 — Take a Breather → C025
25. combat-R103 — Temporary HP → C050

### Tier 3: Constraints (Verify Correctness)
26. combat-R014 — Natural 1 Miss → C091
27. combat-R015 — Natural 20 Hit → C091
28. combat-R025 — Minimum Damage → C060
29. combat-R066 — Evasion Cap from Stats → C061
30. combat-R067 — Evasion Total Cap → C062
31. combat-R075 — Injury Uses Real Max → C050
32. combat-R104 — Temp HP Percentage → C050
33. combat-R130 — Action Points → healing-C054
34. combat-R132 — Rounding Rule → all calculations
35. combat-R133 — Percentages Additive → C060

### Tier 4: Implemented-Unreachable (Verify Logic, Flag Access)
36. combat-R131 — AP Accuracy Bonus → C090 (verify maxAp calc)
37. combat-R134 — Armor DR → C065, C060 (verify DR calc including Helmet crit DR)
38. combat-R135 — Shield Evasion → C065, C061 (verify evasion bonus)

### Tier 5: Partial Items — Present Portion (Verify)
39. combat-R013 — Evasion auto-select (C091)
40. combat-R035 — League phase separation (C004, C015)
41. combat-R044 — Standard-to-Shift (C103)
42. combat-R049 — Add/Remove combatant (C018, C019)
43. combat-R059 — Stuck/Slowed tracking (C082)
44. combat-R060 — Speed CS movement formula (C090)
45. combat-R076 — 5+ injury detection (C090)
46. combat-R088 — Burned tracking (C082)
47. combat-R089 — Frozen tracking (C082)
48. combat-R090 — Paralysis tracking (C082)
49. combat-R091 — Poisoned tracking (C082)
50. combat-R093 — Sleep tracking (C082)
51. combat-R100 — Cursed tracking (C082)
52. combat-R107 — Tripped tracking (C082)
53. combat-R108 — Vulnerable tracking (C082)
