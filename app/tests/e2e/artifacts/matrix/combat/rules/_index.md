---
domain: combat
type: rules
total_rules: 135
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
---

# Rules: combat

# PTU Rules: Combat

## Summary
- Total rules: 135
- Categories: formula(17), condition(21), workflow(24), constraint(23), enumeration(12), modifier(29), interaction(9)
- Scopes: core(75), situational(35), edge-case(15), cross-domain-ref(10)

## Dependency Graph
- Foundation: combat-R001, combat-R002, combat-R003, combat-R004, combat-R007, combat-R008, combat-R038, combat-R039, combat-R040
- Derived: combat-R005 (depends on combat-R001), combat-R006 (depends on combat-R001), combat-R009 (depends on combat-R005, combat-R006), combat-R010 (depends on combat-R009), combat-R011 (depends on combat-R009, combat-R010), combat-R012 (depends on combat-R011), combat-R013 (depends on combat-R011), combat-R014 (depends on combat-R012), combat-R015 (depends on combat-R011, combat-R012), combat-R016 (depends on combat-R012), combat-R017 (depends on combat-R001), combat-R018 (depends on combat-R001), combat-R019 (depends on combat-R017, combat-R018), combat-R020 (depends on combat-R019), combat-R021 (depends on combat-R002, combat-R003), combat-R022 (depends on combat-R021, combat-R019), combat-R023 (depends on combat-R022), combat-R024 (depends on combat-R019)
- Workflow: combat-R025 (depends on combat-R001, combat-R007), combat-R026 (depends on combat-R025), combat-R027 (depends on combat-R007), combat-R028 (depends on combat-R007, combat-R027), combat-R029 (depends on combat-R007), combat-R030 (depends on combat-R019, combat-R022), combat-R031 (depends on combat-R030), combat-R032 (depends on combat-R031), combat-R033 (depends on combat-R021, combat-R022), combat-R034 (depends on combat-R033), combat-R035 (depends on combat-R033, combat-R034), combat-R036 (depends on combat-R033, combat-R034)

---

## Rule Listing

| Rule ID | Name | Category | Scope |
|---------|------|----------|-------|
| combat-R001 | Basic Combat Stats | enumeration | core |
| combat-R002 | Pokemon HP Formula | formula | core |
| combat-R003 | Trainer HP Formula | formula | core |
| combat-R004 | Accuracy Stat Baseline | formula | core |
| combat-R005 | Physical Evasion Formula | formula | core |
| combat-R006 | Special Evasion Formula | formula | core |
| combat-R007 | Speed Evasion Formula | formula | core |
| combat-R008 | Combat Stage Range and Multipliers | formula | core |
| combat-R009 | Combat Stage Multiplier Table | enumeration | core |
| combat-R010 | Combat Stages Affect Evasion | modifier | core |
| combat-R011 | Accuracy Roll Mechanics | formula | core |
| combat-R012 | Accuracy Check Calculation | formula | core |
| combat-R013 | Evasion Application Rules | constraint | core |
| combat-R014 | Natural 1 Always Misses | condition | core |
| combat-R015 | Natural 20 Always Hits | condition | core |
| combat-R016 | Accuracy Modifiers vs Dice Results | constraint | situational |
| combat-R017 | Damage Base Table — Rolled Damage | enumeration | core |
| combat-R018 | Damage Base Table — Set Damage | enumeration | core |
| combat-R019 | Damage Formula — Full Process | workflow | core |
| combat-R020 | Physical vs Special Damage | condition | core |
| combat-R021 | STAB — Same Type Attack Bonus | modifier | core |
| combat-R022 | Critical Hit Trigger | condition | core |
| combat-R023 | Critical Hit Damage Calculation | formula | core |
| combat-R024 | Increased Critical Hit Range | modifier | situational |
| combat-R025 | Minimum Damage | constraint | core |
| combat-R026 | Type Effectiveness — Single Type | modifier | core |
| combat-R027 | Type Effectiveness — Dual Type | interaction | core |
| combat-R028 | Type Effectiveness — Status Moves Excluded | constraint | core |
| combat-R029 | Type Effectiveness — Immunity vs Non-Standard Damage | interaction | edge-case |
| combat-R030 | Trainers Have No Type | constraint | situational |
| combat-R031 | Hit Point Loss vs Dealing Damage | interaction | core |
| combat-R032 | Tick of Hit Points | formula | core |
| combat-R033 | Type Immunities to Status Conditions | enumeration | core |
| combat-R034 | Combat Types — League vs Full Contact | enumeration | core |
| combat-R035 | Round Structure — Two Turns Per Player | workflow | core |
| combat-R036 | Initiative — Speed Based | formula | core |
| combat-R037 | Initiative — League Battle Order | workflow | core |
| combat-R038 | Initiative — Full Contact Order | workflow | core |
| combat-R039 | Initiative — Tie Breaking | condition | core |
| combat-R040 | Initiative — Holding Action | constraint | situational |
| combat-R041 | One Full Round Duration | condition | situational |
| combat-R042 | Action Types — Standard Action | enumeration | core |
| combat-R043 | Action Economy Per Turn | workflow | core |
| combat-R044 | Standard-to-Shift/Swift Conversion | constraint | situational |
| combat-R045 | Full Action Definition | constraint | core |
| combat-R046 | Priority Action Rules | workflow | situational |
| combat-R047 | Priority Limited and Advanced Variants | constraint | situational |
| combat-R048 | Interrupt Actions | workflow | situational |
| combat-R049 | Pokemon Switching — Full Switch | workflow | core |
| combat-R050 | Pokemon Switching — League Restriction | constraint | situational |
| combat-R051 | Fainted Pokemon Switch — Shift Action | constraint | core |
| combat-R052 | Recall and Release as Separate Actions | workflow | situational |
| combat-R053 | Released Pokemon Can Act Immediately | condition | situational |
| combat-R054 | Combat Grid — Size Footprints | enumeration | core |
| combat-R055 | Movement — Shift Action | formula | core |
| combat-R056 | Movement — No Splitting | constraint | core |
| combat-R057 | Diagonal Movement Costs | formula | core |
| combat-R058 | Adjacency Definition | condition | core |
| combat-R059 | Stuck and Slowed Conditions on Movement | modifier | core |
| combat-R060 | Speed Combat Stages Affect Movement | modifier | core |
| combat-R061 | Terrain Types | enumeration | core |
| combat-R062 | Rough Terrain Accuracy Penalty | modifier | situational |
| combat-R063 | Flanking — Evasion Penalty | modifier | situational |
| combat-R064 | Flanking — Requirements by Size | condition | situational |
| combat-R065 | Flanking — Large Combatant Multiple Squares | modifier | edge-case |
| combat-R066 | Evasion Max from Stats | constraint | core |
| combat-R067 | Evasion Max Total Cap | constraint | core |
| combat-R068 | Evasion Bonus Clearing | interaction | situational |
| combat-R069 | Willing Target | condition | edge-case |
| combat-R070 | Combat Stages — Applicable Stats Only | constraint | core |
| combat-R071 | Combat Stages — Persistence | condition | core |
| combat-R072 | Massive Damage Injury | condition | core |
| combat-R073 | Hit Point Marker Injuries | condition | core |
| combat-R074 | Injury Effect on Max HP | formula | core |
| combat-R075 | Injury Max HP — Uses Real Maximum for Calculations | constraint | core |
| combat-R076 | Heavily Injured — 5+ Injuries | condition | core |
| combat-R077 | Fainted Condition | condition | core |
| combat-R078 | Fainted Recovery | constraint | core |
| combat-R079 | Fainted Clears All Status | interaction | core |
| combat-R080 | Death Conditions | condition | core |
| combat-R081 | Death — League Exemption | constraint | situational |
| combat-R082 | Struggle Attack | enumeration | core |
| combat-R083 | Struggle Attack — Expert Combat Upgrade | modifier | situational |
| combat-R084 | Coup de Grâce | workflow | edge-case |
| combat-R085 | Take a Breather | workflow | core |
| combat-R086 | Take a Breather — Assisted | workflow | situational |
| combat-R087 | Take a Breather — Curse Exception | interaction | edge-case |
| combat-R088 | Burned Status | modifier | core |
| combat-R089 | Frozen Status | modifier | core |
| combat-R090 | Paralysis Status | modifier | core |
| combat-R091 | Poisoned Status | modifier | core |
| combat-R092 | Persistent Status — Cured on Faint | interaction | core |
| combat-R093 | Sleep Status | modifier | core |
| combat-R094 | Confused Status | modifier | core |
| combat-R095 | Rage Status | modifier | situational |
| combat-R096 | Flinch Status | modifier | situational |
| combat-R097 | Infatuation Status | modifier | situational |
| combat-R098 | Volatile Status — Cured on Recall/Encounter End | interaction | core |
| combat-R099 | Suppressed Status | modifier | situational |
| combat-R100 | Cursed Status | modifier | situational |
| combat-R101 | Bad Sleep Status | modifier | edge-case |
| combat-R102 | Disabled Status | modifier | situational |
| combat-R103 | Temporary Hit Points | interaction | core |
| combat-R104 | Temporary HP — Does Not Count for Percentage | constraint | situational |
| combat-R105 | Blindness Condition | modifier | situational |
| combat-R106 | Total Blindness Condition | modifier | edge-case |
| combat-R107 | Tripped Condition | condition | core |
| combat-R108 | Vulnerable Condition | condition | core |
| combat-R109 | Trapped Condition | condition | situational |
| combat-R110 | Attack of Opportunity | workflow | core |
| combat-R111 | Disengage Maneuver | workflow | core |
| combat-R112 | Push Maneuver | workflow | situational |
| combat-R113 | Sprint Maneuver | workflow | core |
| combat-R114 | Trip Maneuver | workflow | situational |
| combat-R115 | Grapple Maneuver | workflow | situational |
| combat-R116 | Intercept Melee Maneuver | workflow | situational |
| combat-R117 | Intercept Ranged Maneuver | workflow | situational |
| combat-R118 | Intercept — Loyalty Requirement | constraint | situational |
| combat-R119 | Intercept — Additional Rules | constraint | edge-case |
| combat-R120 | Disarm Maneuver | workflow | situational |
| combat-R121 | Dirty Trick Maneuver | enumeration | situational |
| combat-R122 | Manipulate Maneuver — Trainers Only | enumeration | situational |
| combat-R123 | Suffocating | condition | edge-case |
| combat-R124 | Falling Damage Formula | formula | edge-case |
| combat-R125 | Falling Injuries | modifier | edge-case |
| combat-R126 | Resting — HP Recovery (cross-domain: healing) | workflow | cross-domain-ref |
| combat-R127 | Extended Rest — Status and AP Recovery (cross-domain: healing) | workflow | cross-domain-ref |
| combat-R128 | Natural Injury Healing (cross-domain: healing) | condition | cross-domain-ref |
| combat-R129 | Pokemon Center Healing (cross-domain: healing) | workflow | cross-domain-ref |
| combat-R130 | Action Points (cross-domain: character-lifecycle) | formula | cross-domain-ref |
| combat-R131 | AP Accuracy Bonus (cross-domain: character-lifecycle) | modifier | cross-domain-ref |
| combat-R132 | Rounding Rule (cross-domain: system) | constraint | cross-domain-ref |
| combat-R133 | Percentages Additive Rule (cross-domain: system) | constraint | cross-domain-ref |
| combat-R134 | Armor Damage Reduction (cross-domain: gear, errata-modified) | modifier | cross-domain-ref |
| combat-R135 | Shield Evasion Bonus (cross-domain: gear, errata-modified) | modifier | cross-domain-ref |
