---
domain: combat
type: coverage-matrix
total_rules: 135
total_capabilities: 102
analyzed_at: 2026-02-28T03:00:00Z
analyzed_by: coverage-analyzer
---

# Feature Completeness Matrix: Combat

## Coverage Score

| Metric | Count |
|--------|-------|
| Total Rules | 135 |
| Out of Scope | 0 |
| Effective Rules | 135 |
| Implemented | 82 |
| Implemented-Unreachable | 5 |
| Partial | 25 |
| Missing | 23 |
| Subsystem-Missing | 0 |

**Coverage Score**: `(82 + 0.5*25 + 0.5*5) / 135 * 100` = `(82 + 12.5 + 2.5) / 135 * 100` = **71.9%**

### Breakdown by Scope

| Scope | Total | Impl | Partial | Impl-Unreach | Missing | OoS |
|-------|-------|------|---------|--------------|---------|-----|
| core | 75 | 50 | 16 | 1 | 8 | 0 |
| situational | 35 | 17 | 7 | 4 | 7 | 0 |
| edge-case | 15 | 6 | 1 | 0 | 8 | 0 |
| cross-domain-ref | 10 | 9 | 1 | 0 | 0 | 0 |

---

## Full Matrix

### Foundation: Stats, HP, Evasions (R001-R010)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R001 | Basic Combat Stats | enumeration | core | system | **Implemented** | gm, group, player | C001, C055-C057, C090 | 6 basic stats + 4 derived tracked on all entities |
| combat-R002 | Pokemon HP Formula | formula | core | system | **Implemented** | gm, group, player | C090, C056 | `useCombat.calculateHp()` uses `level + (hp * 3) + 10` |
| combat-R003 | Trainer HP Formula | formula | core | system | **Implemented** | gm, group, player | C090, C057 | `useCombat.calculateTrainerHp()` uses `level*2 + (hp * 3) + 10` |
| combat-R004 | Accuracy Stat Baseline | formula | core | system | **Implemented** | gm | C062, C091 | Accuracy base 0, modified by CS. Tracked in stage modifiers |
| combat-R005 | Physical Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | `calculateEvasion()`: `floor(stat/5)` cap 6 |
| combat-R006 | Special Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | Same formula as R005, uses SpDef |
| combat-R007 | Speed Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | Same formula, uses Speed |
| combat-R008 | Combat Stage Range and Multipliers | formula | core | system | **Implemented** | gm, player | C063, C085 | -6/+6 range, +20%/-10% per stage, floor rounding |
| combat-R009 | Combat Stage Multiplier Table | enumeration | core | system | **Implemented** | gm, player | C085 | 0.4 to 2.2 lookup table |
| combat-R010 | Combat Stages Affect Evasion | modifier | core | system | **Implemented** | gm, player | C061, C063 | `calculateEvasion()` takes stage-modified stat |

### Accuracy & Hits (R011-R016)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R011 | Accuracy Roll Mechanics | formula | core | gm | **Implemented** | gm | C062, C091 | d20 roll in `useMoveCalculation` |
| combat-R012 | Accuracy Check Calculation | formula | core | system | **Implemented** | gm | C062 | `calculateAccuracyThreshold()`: moveAC + evasion - accStage |
| combat-R013 | Evasion Application Rules | constraint | core | system | **Partial** | gm | C061, C091 | **Present**: Auto-selects best evasion (phys/spec/speed). **Missing**: No enforcement that physical evasion only applies to Defense-targeting moves exclusively |
| combat-R014 | Natural 1 Always Misses | condition | core | system | **Implemented** | gm | C091 | `useMoveCalculation` checks nat 1 |
| combat-R015 | Natural 20 Always Hits | condition | core | system | **Implemented** | gm | C091 | `useMoveCalculation` checks nat 20 |
| combat-R016 | Accuracy Modifiers vs Dice Results | constraint | situational | system | **Implemented** | gm | C091 | Modifiers applied separately from raw d20 for crit/effect detection |

### Damage Formula (R017-R025)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R017 | Damage Base Table - Rolled | enumeration | core | system | **Partial** | gm | C084 | **Present**: Dice roller utility exists. **Missing**: Combat uses set damage mode only; rolled damage not in main combat flow |
| combat-R018 | Damage Base Table - Set Damage | enumeration | core | system | **Implemented** | gm | C084, C060 | DB 1-28 mapped to min/avg/max |
| combat-R019 | Damage Formula - Full Process | workflow | core | gm | **Implemented** | gm | C060, C028, C091 | Full 9-step process in `calculateDamage()`. decree-001 confirms dual min-1 floors |
| combat-R020 | Physical vs Special Damage | condition | core | system | **Implemented** | gm | C060 | Physical uses Atk/Def, Special uses SpA/SpD |
| combat-R021 | STAB | modifier | core | system | **Implemented** | gm | C060, C091 | +2 DB when move type matches Pokemon type |
| combat-R022 | Critical Hit Trigger | condition | core | gm | **Implemented** | gm | C091 | d20 == 20 triggers crit |
| combat-R023 | Critical Hit Damage Calculation | formula | core | system | **Implemented** | gm | C060 | Doubles dice/set damage portion, not stat |
| combat-R024 | Increased Critical Hit Range | modifier | situational | gm | **Partial** | gm | C091 | **Present**: MoveTargetModal supports manual crit toggle. **Missing**: No automatic crit range expansion based on move effects |
| combat-R025 | Minimum Damage | constraint | core | system | **Implemented** | gm | C060 | decree-001: dual floor at post-defense and post-effectiveness |

### Type Effectiveness (R026-R030)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R026 | Type Effectiveness - Single Type | modifier | core | system | **Implemented** | gm | C060, C091 | x0, x0.5, x1, x1.5 multipliers |
| combat-R027 | Type Effectiveness - Dual Type | interaction | core | system | **Implemented** | gm | C060, C091 | Multiplicative: x0, x0.25, x0.5, x1, x1.5, x2 |
| combat-R028 | Type Effectiveness - Status Excluded | constraint | core | system | **Partial** | gm | C060 | **Present**: Damage calc skips effectiveness for status moves. **Missing**: No explicit enforcement preventing GM from applying effectiveness to status moves via manual damage |
| combat-R029 | Type Effectiveness - Immunity vs Non-Standard | interaction | edge-case | system | **Missing** | - | - | No handling for non-standard damage moves (Sonic Boom, Counter) with immunity but not resistance. **P3** |
| combat-R030 | Trainers Have No Type | constraint | situational | system | **Implemented** | gm | C060, C057 | Human entities have no type; all attacks neutral |

### Damage Application & Injuries (R031-R032, R072-R081)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R031 | HP Loss vs Dealing Damage | interaction | core | system | **Partial** | gm | C020, C050 | **Present**: Damage endpoint applies defense and injuries. **Missing**: No separate "HP loss" endpoint that skips defense/massive-damage for moves like Pain Split |
| combat-R032 | Tick of Hit Points | formula | core | system | **Implemented** | gm | C050, C090 | 1/10 of max HP, used in burn/poison/curse calculations |
| combat-R072 | Massive Damage Injury | condition | core | system | **Implemented** | gm | C050 | 50%+ maxHP = injury. decree-004: uses real HP lost after temp HP |
| combat-R073 | Hit Point Marker Injuries | condition | core | system | **Implemented** | gm | C058 | `countMarkersCrossed()`: 50%, 0%, -50%, -100% markers |
| combat-R074 | Injury Effect on Max HP | formula | core | system | **Implemented** | gm | C050, C052 | Each injury reduces maxHP by 1/10 |
| combat-R075 | Injury Max HP - Real Maximum | constraint | core | system | **Implemented** | gm | C050, C058 | Real maxHP for marker/massive-damage checks |
| combat-R076 | Heavily Injured - 5+ Injuries | condition | core | system | **Partial** | gm | C090 | **Present**: `useCombat` detects 5+ injuries visually. **Missing**: No automation of HP loss on standard action / damage taken for heavily injured |
| combat-R077 | Fainted Condition | condition | core | system | **Implemented** | gm, group, player | C051, C082, C120-C122 | 0 HP -> Fainted, displayed in all views |
| combat-R078 | Fainted Recovery | constraint | core | gm | **Partial** | gm | C052 | **Present**: Heal removes Fainted if HP > 0. **Missing**: No enforcement of 10-minute faint timer for potion healing |
| combat-R079 | Fainted Clears All Status | interaction | core | system | **Implemented** | gm | C051 | `applyDamageToEntity` clears persistent+volatile on faint |
| combat-R080 | Death Conditions | condition | core | system | **Partial** | gm | C050, C090 | **Present**: Injury count and negative HP tracked. **Missing**: No automated death check at 10 injuries or -50/-200% HP |
| combat-R081 | Death - League Exemption | constraint | situational | gm | **Partial** | gm | C004 | **Present**: League battle mode tracked. **Missing**: No automated death suppression in League mode |

### Type Immunities to Status (R033)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R033 | Type Immunities to Status | enumeration | core | system | **Partial** | gm | C082, C024 | **Present**: Status conditions cataloged. **Missing**: No server-side type-immunity enforcement (decree-012 mandates this with override flag) |

### Combat Types & Initiative (R034-R041)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R034 | Combat Types - League vs Full Contact | enumeration | core | gm | **Implemented** | gm | C001, C004, C010 | `battleType` field: 'trainer' (league) / 'full_contact' |
| combat-R035 | Round Structure - Two Turns Per Player | workflow | core | system | **Partial** | gm | C004, C015, C017 | **Present**: League mode has trainer+pokemon phases. **Missing**: decree-021 mandates true two-phase trainer system (declare low-to-high, resolve high-to-low) not yet fully implemented |
| combat-R036 | Initiative - Speed Based | formula | core | system | **Implemented** | gm | C055, C015 | `buildCombatantFromEntity` calculates initiative from speed + bonus |
| combat-R037 | Initiative - League Battle Order | workflow | core | gm | **Partial** | gm | C004, C015, C017 | **Present**: Separate trainer/pokemon turn orders exist. **Missing**: decree-021 true two-phase not fully connected |
| combat-R038 | Initiative - Full Contact Order | workflow | core | gm | **Implemented** | gm | C015, C017 | High-to-low speed for all combatants |
| combat-R039 | Initiative - Tie Breaking | condition | core | system | **Partial** | gm | C015 | **Present**: Start endpoint sorts with roll-off for ties. **Missing**: decree-006 mandates dynamic re-sort on speed CS change (implementation ticket exists) |
| combat-R040 | Initiative - Holding Action | constraint | situational | both | **Missing** | - | - | No hold-action mechanism. **P2** |
| combat-R041 | One Full Round Duration | condition | situational | system | **Missing** | - | - | No automatic tracking of "until same initiative count next round" durations. **P2** |

### Action Economy (R042-R048)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R042 | Action Types - Standard Action | enumeration | core | both | **Implemented** | gm, player | C080, C082, C090, C092 | Standard actions tracked: moves, maneuvers, items |
| combat-R043 | Action Economy Per Turn | workflow | core | both | **Implemented** | gm, player | C017, C022, C026, C092 | Standard + Shift + Swift tracked per turn |
| combat-R044 | Standard-to-Shift/Swift Conversion | constraint | situational | both | **Partial** | gm | C117, C092 | **Present**: GM can manually adjust. **Missing**: No explicit standard-to-shift/swift conversion UI or enforcement |
| combat-R045 | Full Action Definition | constraint | core | system | **Implemented** | gm | C025, C026, C117 | Breather and sprint use standard+shift |
| combat-R046 | Priority Action Rules | workflow | situational | both | **Missing** | - | - | No Priority action mechanism. **P2** |
| combat-R047 | Priority Limited and Advanced Variants | constraint | situational | system | **Missing** | - | - | Depends on R046. **P2** |
| combat-R048 | Interrupt Actions | workflow | situational | both | **Missing** | - | - | No Interrupt action mechanism. **P2** |

### Pokemon Switching (R049-R053)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R049 | Pokemon Switching - Full Switch | workflow | core | both | **Partial** | gm | C018, C019, C130 | **Present**: GM can add/remove combatants. **Missing**: No formal switch workflow (recall+release as Standard Action, 8m range check) |
| combat-R050 | Pokemon Switching - League Restriction | constraint | situational | system | **Missing** | - | - | No enforcement of switched Pokemon being unable to act remainder of round. **P2** |
| combat-R051 | Fainted Pokemon Switch - Shift Action | constraint | core | both | **Partial** | gm | C018, C019 | **Present**: Can replace fainted combatant. **Missing**: No enforcement as Shift Action specifically |
| combat-R052 | Recall and Release as Separate Actions | workflow | situational | both | **Missing** | - | - | No separate recall/release actions. **P3** |
| combat-R053 | Released Pokemon Can Act Immediately | condition | situational | system | **Missing** | - | - | No immediate-act logic for newly released Pokemon. **P3** |

### Grid, Movement & Terrain (R054-R065)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R054 | Combat Grid - Size Footprints | enumeration | core | system | **Implemented** | gm, group | C039, C040 | Size -> footprint in VTT grid |
| combat-R055 | Movement - Shift Action | formula | core | both | **Implemented** | gm | C039, C090 | Movement by speed capability |
| combat-R056 | Movement - No Splitting | constraint | core | system | **Implemented** | gm | C039 | Movement is atomic in VTT |
| combat-R057 | Diagonal Movement Costs | formula | core | system | **Implemented** | gm | C039 | Alternating 1-2-1 PTU diagonal (decree-002) |
| combat-R058 | Adjacency Definition | condition | core | system | **Implemented** | gm | C039 | Diagonal = adjacent, cardinal adjacency separate |
| combat-R059 | Stuck and Slowed on Movement | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Conditions tracked and displayed. **Missing**: No automated movement restriction enforcement for Stuck/Slowed |
| combat-R060 | Speed CS Affect Movement | modifier | core | system | **Partial** | gm | C063, C090 | **Present**: Speed CS tracked and applied. **Missing**: No automated +/- to movement speeds from Speed CS in VTT pathfinding |
| combat-R061 | Terrain Types | enumeration | core | system | **Implemented** | gm | C043, C082 | 6 terrain types: normal, rough, blocking, water, tall_grass, hazard |
| combat-R062 | Rough Terrain Accuracy Penalty | modifier | situational | system | **Partial** | gm | C043 | **Present**: Rough terrain painted on grid. **Missing**: No auto -2 accuracy when targeting through rough terrain |
| combat-R063 | Flanking - Evasion Penalty | modifier | situational | system | **Missing** | - | - | No flanking detection or -2 evasion. **P2** |
| combat-R064 | Flanking - Requirements by Size | condition | situational | system | **Missing** | - | - | Depends on R063. **P2** |
| combat-R065 | Flanking - Large Combatant Multiple Squares | modifier | edge-case | system | **Missing** | - | - | Depends on R063. **P3** |
| combat-R066 | Evasion Max from Stats | constraint | core | system | **Implemented** | gm, player | C061 | Cap 6 from stats in `calculateEvasion()` |
| combat-R067 | Evasion Max Total Cap | constraint | core | system | **Implemented** | gm | C062 | `min(9, evasion)` in threshold calc |
| combat-R068 | Evasion Bonus Clearing | interaction | situational | system | **Partial** | gm | C025, C054 | **Present**: Take a Breather resets stages. **Missing**: No explicit evasion bonus tracking separate from CS |
| combat-R069 | Willing Target | condition | edge-case | both | **Implemented** | gm | C091 | GM manually applies; targets can choose to be hit |

### Combat Stages (R070-R071)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R070 | CS - Applicable Stats Only | constraint | core | system | **Implemented** | gm | C054, C023 | Atk, Def, SpA, SpD, Spe only; HP excluded |
| combat-R071 | CS - Persistence | condition | core | system | **Implemented** | gm | C054, C016 | Persist until switch-out or encounter end. End encounter clears |

### Struggle & Special Actions (R082-R087)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R082 | Struggle Attack | enumeration | core | both | **Implemented** | gm, player | C080, C092 | AC 4, DB 4, Melee, Physical, Normal in maneuvers |
| combat-R083 | Struggle - Expert Combat Upgrade | modifier | situational | system | **Missing** | - | - | No Expert Combat check for AC 3 / DB 5 upgrade. **P3** |
| combat-R084 | Coup de Grace | workflow | edge-case | gm | **Missing** | - | - | No Coup de Grace workflow. **P3** |
| combat-R085 | Take a Breather | workflow | core | both | **Implemented** | gm | C025, C117, C138 | Full Action: resets CS (Heavy Armor aware), clears volatiles+slow+stuck, applies Tripped+Vulnerable |
| combat-R086 | Take a Breather - Assisted | workflow | situational | gm | **Missing** | - | - | No assisted breather workflow with Command Check DC 12. **P3** |
| combat-R087 | Take a Breather - Curse Exception | interaction | edge-case | system | **Partial** | gm | C025 | **Present**: Breather notes Cursed exception. **Missing**: No automated 12m range check for Curse source |

### Persistent Status (R088-R092)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R088 | Burned Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Burn tracked as condition. **Missing**: No auto -2 Def CS (decree-005 mandates), no auto tick damage on standard action |
| combat-R089 | Frozen Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Frozen tracked. **Missing**: No auto turn skip, no evasion zero, no save check, no fire-move thaw |
| combat-R090 | Paralysis Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Paralysis tracked. **Missing**: No auto -4 Speed CS (decree-005), no save check, no turn skip |
| combat-R091 | Poisoned Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Poison tracked. **Missing**: No auto -2 SpDef CS (decree-005), no auto tick damage, no Badly Poisoned escalation |
| combat-R092 | Persistent Status - Cured on Faint | interaction | core | system | **Implemented** | gm | C051 | `applyDamageToEntity` clears persistent on faint |

### Volatile Status (R093-R102)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R093 | Sleep Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Sleep tracked. **Missing**: No auto turn skip, no evasion zero, no save check, no wake-on-damage |
| combat-R094 | Confused Status | modifier | core | system | **Partial** | gm | C024, C082 | **Present**: Confused tracked. **Missing**: No auto save check, no self-hit on fail |
| combat-R095 | Rage Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; GM enforces rage attack restriction manually |
| combat-R096 | Flinch Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; GM enforces no-action manually |
| combat-R097 | Infatuation Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; GM enforces targeting restriction manually |
| combat-R098 | Volatile Status - Cured on Recall/End | interaction | core | system | **Implemented** | gm | C051, C016 | Cleared on faint and encounter end |
| combat-R099 | Suppressed Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; frequency downgrade manual |
| combat-R100 | Cursed Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; tick damage manual |
| combat-R101 | Bad Sleep Status | modifier | edge-case | system | **Implemented** | gm | C024, C082 | Tracked; tick damage manual |
| combat-R102 | Disabled Status | modifier | situational | system | **Implemented** | gm | C024, C082 | Tracked; move restriction manual |

### Temporary HP & Conditions (R103-R109)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R103 | Temporary Hit Points | interaction | core | system | **Implemented** | gm | C021, C050, C051 | Temp HP tracked, absorbed first, no stacking (higher wins) |
| combat-R104 | Temp HP - No Percentage Count | constraint | situational | system | **Implemented** | gm | C050 | Percentage checks use real HP only |
| combat-R105 | Blindness Condition | modifier | situational | system | **Implemented-Unreachable** | gm | C024, C082 | Condition exists in STATUS_CONDITIONS but no -6 accuracy automation. **Intended actor**: player (also needs visibility). **Accessible from**: gm only via status endpoint |
| combat-R106 | Total Blindness Condition | modifier | edge-case | system | **Implemented** | gm | C024, C082 | Tracked as condition; -10 accuracy manual |
| combat-R107 | Tripped Condition | condition | core | both | **Implemented** | gm, group, player | C024, C082, C025 | Tripped tracked, displayed, applied by breather/trip |
| combat-R108 | Vulnerable Condition | condition | core | both | **Implemented** | gm, group, player | C024, C082, C025 | Vulnerable tracked, displayed, applied by breather/grapple |
| combat-R109 | Trapped Condition | condition | situational | system | **Implemented** | gm | C024, C082 | Tracked; recall restriction manual |

### Combat Maneuvers (R110-R122)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R110 | Attack of Opportunity | workflow | core | both | **Partial** | gm | C080 | **Present**: AoO in COMBAT_MANEUVERS constant. **Missing**: No automated trigger detection or interrupt flow |
| combat-R111 | Disengage Maneuver | workflow | core | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; 1m shift, no AoO |
| combat-R112 | Push Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; opposed check manual |
| combat-R113 | Sprint Maneuver | workflow | core | both | **Implemented** | gm, player | C026, C080, C125 | API endpoint + maneuver grid. +50% movement |
| combat-R114 | Trip Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; applies Tripped |
| combat-R115 | Grapple Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; opposed check manual |
| combat-R116 | Intercept Melee Maneuver | workflow | situational | both | **Implemented-Unreachable** | gm | C080, C125 | In COMBAT_MANEUVERS but no interrupt mechanism for mid-turn use. **Intended actor**: player (Pokemon intercepts for trainer). **Accessible from**: gm only |
| combat-R117 | Intercept Ranged Maneuver | workflow | situational | both | **Implemented-Unreachable** | gm | C080, C125 | Same as R116 — maneuver defined but no interrupt flow. **Intended actor**: player. **Accessible from**: gm only |
| combat-R118 | Intercept - Loyalty Requirement | constraint | situational | system | **Missing** | - | - | No loyalty check for intercept. **P3** |
| combat-R119 | Intercept - Additional Rules | constraint | edge-case | system | **Missing** | - | - | No speed comparison for Priority/Interrupt intercepts. **P3** |
| combat-R120 | Disarm Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; opposed check manual |
| combat-R121 | Dirty Trick Maneuver | enumeration | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid (Hinder, Blind, Low Blow) |
| combat-R122 | Manipulate Maneuver - Trainers Only | enumeration | situational | both | **Implemented-Unreachable** | gm | C080 | **Present**: Defined in COMBAT_MANEUVERS. **Missing**: No trainer-only restriction enforcement, no Bon Mot/Flirt/Terrorize specific effects. **Intended actor**: player trainers. **Accessible from**: gm only |

### Miscellaneous (R123-R125)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R123 | Suffocating | condition | edge-case | system | **Missing** | - | - | No suffocation tracking. **P3** |
| combat-R124 | Falling Damage Formula | formula | edge-case | gm | **Missing** | - | - | No falling damage calculator. **P3** |
| combat-R125 | Falling Injuries | modifier | edge-case | system | **Missing** | - | - | No falling injury calculation. **P3** |

### Cross-Domain References (R126-R135)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R126 | Resting - HP Recovery | workflow | cross-domain-ref | gm | **Implemented** | gm | healing domain | Covered by healing domain `useRestHealing` composable |
| combat-R127 | Extended Rest - Status & AP Recovery | workflow | cross-domain-ref | gm | **Implemented** | gm | healing domain | Covered by healing domain extended rest |
| combat-R128 | Natural Injury Healing | condition | cross-domain-ref | system | **Implemented** | gm | healing domain | Covered by healing domain 24hr timer |
| combat-R129 | Pokemon Center Healing | workflow | cross-domain-ref | gm | **Implemented** | gm | healing domain | Covered by healing domain Pokemon Center |
| combat-R130 | Action Points | formula | cross-domain-ref | system | **Implemented** | gm | char-lifecycle | AP tracked on HumanCharacter |
| combat-R131 | AP Accuracy Bonus | modifier | cross-domain-ref | both | **Implemented-Unreachable** | gm | C090 | **Present**: AP tracked. **Missing**: No +1 accuracy spend UI for players. **Intended actor**: player. **Accessible from**: gm only |
| combat-R132 | Rounding Rule | constraint | cross-domain-ref | system | **Implemented** | gm | C060, C063 | `Math.floor()` throughout |
| combat-R133 | Percentages Additive Rule | constraint | cross-domain-ref | system | **Implemented** | gm | C060 | Additive percentages in damage calc |
| combat-R134 | Armor Damage Reduction | modifier | cross-domain-ref | system | **Partial** | gm | C060, C065, C081 | **Present**: DR from Light/Heavy/Special armor computed. **Missing**: Helmet conditional DR (crit only) computed but may not be auto-applied in all damage paths |
| combat-R135 | Shield Evasion Bonus | modifier | cross-domain-ref | both | **Implemented** | gm, player | C065, C081, C061 | Shield +1 evasion bonus computed in `computeEquipmentBonuses`, applied in evasion calc |

---

## Actor Accessibility Summary

| Actor | Implemented (accessible) | Implemented-Unreachable | Notes |
|-------|-------------------------|------------------------|-------|
| **player** | 15 rules with player access via C092, C122, C125, C145-C147 | 5 (R105, R116, R117, R122, R131) | Player view has combat actions but limited compared to GM |
| **gm** | 82 (all implemented rules accessible from GM) | 0 | GM has full access to all implemented features |
| **group** | 10 rules visible via GroupCombatantCard (C121) | 0 | Read-only display |
| **system** | All formula/condition rules execute server-side | 0 | Backend enforcement |

### Player-Specific Access Issues

1. **R116/R117 (Intercept)**: Player Pokemon should be able to intercept for their trainer but no interrupt mechanism exists in player view
2. **R122 (Manipulate)**: Trainers perform this maneuver but player view has limited maneuver access
3. **R131 (AP Accuracy Bonus)**: Players should be able to spend AP for +1 accuracy but no player-facing UI exists
4. **R105 (Blindness)**: -6 accuracy penalty should affect players' displayed accuracy info
5. **R024 (Crit Range)**: Players cannot see/manage expanded crit ranges

---

## Subsystem Gaps

### Gap 1: Status Condition Automation Engine

**Missing Subsystem**: Automated status condition mechanical effects

**Affected Rules**: R033, R088, R089, R090, R091, R093, R094 (7 rules)

**Description**: Status conditions are tracked as labels but their mechanical effects are not automated. Burn's -2 Def CS, Paralysis's -4 Speed CS, Poison's -2 SpDef CS, tick damage, save checks, turn restrictions, and type immunities are all manually applied by the GM.

**Decrees**: decree-005 (auto-apply CS from status), decree-012 (enforce type immunities server-side)

**Suggested Tickets**:
- `feat: auto-apply combat stage changes from status conditions (decree-005)` - P1
- `feat: enforce type-based status immunities server-side (decree-012)` - P1
- `feat: automate status tick damage (burn/poison/curse) at turn end` - P1
- `feat: automate status save checks (frozen/paralysis/sleep/confusion)` - P2

### Gap 2: Priority/Interrupt Action System

**Missing Subsystem**: Out-of-turn action mechanism

**Affected Rules**: R046, R047, R048, R110, R116, R117 (6 rules)

**Description**: No mechanism for Priority actions (act before initiative), Interrupt actions (act during another's turn), or Attack of Opportunity triggers. These are core PTU combat mechanics that enable reactive gameplay.

**Suggested Tickets**:
- `feat: Priority action system (jump ahead in initiative)` - P2
- `feat: Interrupt action system (act during another's turn)` - P2
- `feat: Attack of Opportunity trigger detection` - P2

### Gap 3: Pokemon Switching Workflow

**Missing Subsystem**: Formal Pokemon switch mechanics

**Affected Rules**: R049, R050, R051, R052, R053 (5 rules)

**Description**: The app can add/remove combatants but lacks a formal switch workflow: range check (8m), action type enforcement (Standard vs Shift for fainted), League restriction (switched Pokemon can't act), and release-immediate-act logic.

**Suggested Tickets**:
- `feat: formal Pokemon switch workflow with range check` - P1
- `feat: League Battle switch restrictions` - P2
- `feat: recall/release as separate shift actions` - P3

### Gap 4: Flanking Detection

**Missing Subsystem**: Positional flanking analysis

**Affected Rules**: R063, R064, R065 (3 rules)

**Description**: No flanking detection based on VTT grid positions. The -2 evasion penalty for flanked combatants requires spatial analysis of adjacent enemy positions by size class.

**Suggested Tickets**:
- `feat: flanking detection with evasion penalty` - P2

### Gap 5: Dynamic Initiative Reordering

**Missing Subsystem**: Speed-change initiative recalculation

**Affected Rules**: R039 (partial), R006 (decree-006)

**Description**: decree-006 mandates dynamically reordering initiative when Speed CS changes. Current initiative is static after encounter start. Implementation ticket ptu-rule-099 exists.

**Suggested Tickets**:
- `feat: dynamic initiative reorder on speed CS change (decree-006)` - P1

### Gap 6: League Battle Two-Phase Trainer System

**Missing Subsystem**: True declaration/resolution phases

**Affected Rules**: R035, R037 (both partial)

**Description**: decree-021 mandates a true two-phase trainer system: declare in low-to-high speed order, then resolve in high-to-low. Current implementation has phase tracking infrastructure but the two-phase flow is not fully connected. Implementation ticket ptu-rule-107 exists.

**Suggested Tickets**:
- `feat: true two-phase trainer system for League Battles (decree-021)` - P1

---

## Gap Priorities

### P0 - Blocks Basic Session Usage
(None identified - basic combat flow works)

### P1 - Important Mechanic, Commonly Used

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R033 | Type Immunities to Status | Partial | No server-side type-immunity enforcement (decree-012) |
| combat-R035 | Round Structure - Two Turns Per Player | Partial | decree-021 two-phase trainer not fully implemented |
| combat-R037 | Initiative - League Battle Order | Partial | decree-021 two-phase not connected |
| combat-R039 | Initiative - Tie Breaking | Partial | decree-006 dynamic reorder missing |
| combat-R049 | Pokemon Switching | Partial | No formal switch workflow |
| combat-R076 | Heavily Injured - 5+ Injuries | Partial | No auto HP loss on standard action |
| combat-R080 | Death Conditions | Partial | No auto death check |
| combat-R088 | Burned Status | Partial | No auto CS / tick damage (decree-005) |
| combat-R089 | Frozen Status | Partial | No auto effects |
| combat-R090 | Paralysis Status | Partial | No auto CS / save check (decree-005) |
| combat-R091 | Poisoned Status | Partial | No auto CS / tick damage (decree-005) |
| combat-R093 | Sleep Status | Partial | No auto effects |
| combat-R094 | Confused Status | Partial | No auto save / self-hit |

### P2 - Situational, Workaround Exists

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R024 | Increased Crit Range | Partial | No auto crit range expansion |
| combat-R040 | Initiative - Holding Action | Missing | No hold mechanism |
| combat-R041 | One Full Round Duration | Missing | No duration tracking |
| combat-R044 | Standard-to-Shift/Swift | Partial | No explicit conversion UI |
| combat-R046 | Priority Action Rules | Missing | No Priority system |
| combat-R047 | Priority Variants | Missing | No Priority system |
| combat-R048 | Interrupt Actions | Missing | No Interrupt system |
| combat-R050 | League Switch Restriction | Missing | No enforcement |
| combat-R059 | Stuck/Slowed Movement | Partial | No auto movement restriction |
| combat-R060 | Speed CS Affect Movement | Partial | No auto movement modifier |
| combat-R062 | Rough Terrain Accuracy | Partial | No auto -2 accuracy |
| combat-R063 | Flanking - Evasion Penalty | Missing | No flanking detection |
| combat-R064 | Flanking - Requirements by Size | Missing | No flanking detection |
| combat-R068 | Evasion Bonus Clearing | Partial | No separate evasion bonus tracking |
| combat-R078 | Fainted Recovery | Partial | No 10-min faint timer |
| combat-R081 | Death - League Exemption | Partial | No auto death suppression |
| combat-R105 | Blindness Condition | Impl-Unreach | No -6 accuracy automation for players |
| combat-R110 | Attack of Opportunity | Partial | No auto trigger detection |
| combat-R116 | Intercept Melee | Impl-Unreach | No interrupt mechanism for player |
| combat-R117 | Intercept Ranged | Impl-Unreach | No interrupt mechanism for player |
| combat-R122 | Manipulate - Trainers Only | Impl-Unreach | No trainer-only enforcement |
| combat-R131 | AP Accuracy Bonus | Impl-Unreach | No player-facing +1 spend |

### P3 - Edge Case, Minimal Gameplay Impact

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R013 | Evasion Application Rules | Partial | No strict phys/spec evasion enforcement |
| combat-R029 | Immunity vs Non-Standard | Missing | No Sonic Boom/Counter handling |
| combat-R031 | HP Loss vs Dealing Damage | Partial | No separate HP loss path |
| combat-R051 | Fainted Switch - Shift Action | Partial | No Shift Action enforcement |
| combat-R052 | Recall/Release Separate | Missing | No separate actions |
| combat-R053 | Released Pokemon Act Immediately | Missing | No immediate-act logic |
| combat-R065 | Flanking - Large Multiple Squares | Missing | No large-flanking calc |
| combat-R083 | Struggle Expert Upgrade | Missing | No Expert Combat check |
| combat-R084 | Coup de Grace | Missing | No Coup de Grace workflow |
| combat-R086 | Breather - Assisted | Missing | No assisted breather |
| combat-R087 | Breather - Curse Exception | Partial | No 12m range check |
| combat-R118 | Intercept - Loyalty | Missing | No loyalty check |
| combat-R119 | Intercept - Additional Rules | Missing | No speed/status checks |
| combat-R123 | Suffocating | Missing | No suffocation tracking |
| combat-R124 | Falling Damage Formula | Missing | No falling calculator |
| combat-R125 | Falling Injuries | Missing | No falling injuries |
| combat-R134 | Armor DR | Partial | Helmet crit DR edge case |

---

## Auditor Queue

Prioritized list of rules for the Implementation Auditor to verify, ordered by gap priority then decree relevance.

### Priority 1: Decree-Mandated (verify current state, confirm gaps)

1. **combat-R033** (decree-012) - Type immunity enforcement — verify status.post.ts lacks type checking
2. **combat-R088** (decree-005) - Burn CS auto-apply — verify no source-tracked CS exists
3. **combat-R090** (decree-005) - Paralysis CS auto-apply — verify same
4. **combat-R091** (decree-005) - Poison CS auto-apply — verify same
5. **combat-R035/R037** (decree-021) - League two-phase — verify trainer_declaration/resolution phase infrastructure
6. **combat-R039** (decree-006) - Dynamic initiative — verify static after start

### Priority 2: Core Mechanic Gaps

7. **combat-R019** + **combat-R025** (decree-001) - Damage formula dual min-1 — verify both floors exist
8. **combat-R072** (decree-004) - Massive damage temp HP — verify real HP used
9. **combat-R049** - Pokemon switching — verify no formal workflow exists
10. **combat-R076** - Heavily injured — verify no auto HP loss
11. **combat-R080** - Death conditions — verify no auto death check
12. **combat-R093/R094** - Sleep/Confusion — verify no automation
13. **combat-R089** - Frozen — verify no automation

### Priority 3: Accuracy & Evasion Chain

14. **combat-R012** - Accuracy threshold — verify formula correctness
15. **combat-R013** - Evasion application — verify auto-best-selection logic
16. **combat-R061/R062** - Evasion calc + cap — verify cap 6 from stats, cap 9 total
17. **combat-R135** - Shield evasion — verify +1 applied in evasion chain

### Priority 4: Action Economy & Grid

18. **combat-R043** - Action economy — verify standard+shift+swift tracking
19. **combat-R057** - Diagonal movement — verify alternating 1-2-1
20. **combat-R085** - Take a Breather — verify full implementation (Heavy Armor aware, volatiles, Tripped+Vulnerable)

### Priority 5: Status Condition Tracking

21. **combat-R092** - Persistent cured on faint — verify applyDamageToEntity clears
22. **combat-R098** - Volatile cured on recall/end — verify end encounter clears
23. **combat-R103/R104** - Temp HP — verify no stacking, percentage exclusion

### Priority 6: Equipment Chain

24. **combat-R134** - Armor DR — verify Light/Heavy/Special DR computation
25. **combat-C065** - `computeEquipmentBonuses` — verify Focus single-item limit, Helmet conditional DR

---

## Decree Compliance Summary

| Decree | Rule(s) | Status | Notes |
|--------|---------|--------|-------|
| decree-001 | R025 (min damage) | **Compliant** | Dual min-1 floor confirmed in implementation |
| decree-002 | R057 (diagonal movement) | **Compliant** | Alternating 1-2-1 used for movement |
| decree-003 | R061 (terrain) | **Needs Audit** | Token passability + rough terrain accuracy TBD |
| decree-004 | R072 (massive damage) | **Compliant** | Real HP after temp HP absorption |
| decree-005 | R088, R090, R091 | **Non-Compliant** | No auto CS from status conditions. Implementation ticket ptu-rule-098 exists |
| decree-006 | R039 | **Non-Compliant** | Initiative static after start. Implementation ticket ptu-rule-099 exists |
| decree-012 | R033 | **Non-Compliant** | No server-side type-immunity enforcement. Implementation ticket ptu-rule-104 exists |
| decree-021 | R035, R037 | **Non-Compliant** | Two-phase trainer not fully implemented. Implementation ticket ptu-rule-107 exists |
