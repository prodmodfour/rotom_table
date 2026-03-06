# Coverage Matrix: player-view

Domain: **player-view**
Generated: 2026-03-05
Rules catalog: `artifacts/matrix/player-view-rules.md` (207 rules)
Capabilities catalog: `artifacts/matrix/player-view/capabilities/_index.md` (89 capabilities)

---

## Coverage Score

```
Coverage = (Implemented + 0.5 * Partial + 0.5 * Implemented-Unreachable) / (Total - OutOfScope) * 100
```

| Classification | Count | Notes |
|---------------|-------|-------|
| **Total Rules** | 207 | |
| **Implemented** | 96 | App covers these rules, accessible to correct actor |
| **Implemented-Unreachable** | 8 | Code exists but intended actor (player) cannot reach it |
| **Partial** | 38 | App covers part of the rule |
| **Missing** | 24 | No capability for this rule |
| **Subsystem-Missing** | 18 | Entire product surface absent |
| **Out of Scope** | 23 | Outside app's purpose |

```
= (96 + 0.5 * 38 + 0.5 * 8) / (207 - 23) * 100
= (96 + 19 + 4) / 184 * 100
= 119 / 184 * 100
= 64.7%
```

**Coverage Score: 64.7%**

---

## Matrix Table

### Foundation Rules (Player Identity & Character Sheet) — R001-R025

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R001 | Trainer Combat Stats | enumeration | player | Implemented | player | C017, C011 | — | Character sheet displays all 6 stats (HP, Atk, Def, SpAtk, SpDef, Spd) in stats grid |
| R002 | Trainer Derived Stats | formula | system | Implemented | player | C017, C018, C011 | — | Server computes trainer HP from formula; displayed in character sheet HP bar |
| R003 | Pokemon Hit Points Formula | formula | system | Implemented | player | C025, C011 | — | Server computes Pokemon HP; displayed in Pokemon card HP bar |
| R004 | Evasion from Defense Stats | formula | system | Implemented | player | C019 | — | calculateEvasion() computes physical evasion from defense stat |
| R005 | Evasion from Special Defense | formula | system | Implemented | player | C019 | — | calculateEvasion() computes special evasion from SpDef |
| R006 | Evasion from Speed | formula | system | Implemented | player | C019 | — | calculateEvasion() computes speed evasion from Speed stat |
| R007 | Evasion Application to Accuracy Check | formula | system | Partial | player | C019 | P2 | **Present:** Evasion values computed and displayed. **Missing:** Evasion application to accuracy rolls happens server-side; player view doesn't show which evasion applies to a given attack |
| R008 | Evasion Cap | constraint | system | Partial | player | C019 | P2 | **Present:** Evasion values are capped at +6 per stat. **Missing:** The +9 total cap across all sources is not visually surfaced in the player view |
| R009 | Trainer Starting Stats | constraint | player | Out of Scope | — | — | — | Character creation is not part of the session helper; characters arrive pre-made |
| R010 | Action Points Pool | formula | player | Partial | player | C017 | P1 | **Present:** AP displayed in character sheet combat info. **Missing:** AP pool formula (5 + level/5) is not computed client-side; relies on server value |
| R011 | Action Points Scene Recovery | workflow | system | Missing | — | — | P2 | No scene transition handling that resets AP. Scene system exists but AP recovery on scene end is not implemented in player view |
| R012 | AP Bound and Drain | condition | system | Partial | player | C017 | P2 | **Present:** AP value displayed. **Missing:** No visual distinction between available/bound/drained AP |
| R013 | AP Accuracy Boost | modifier | player | Missing | — | — | P1 | No mechanism for player to spend AP for +1 accuracy. Would need integration with combat action flow |
| R014 | Maximum Pokemon in Party | constraint | player | Implemented | player | C024, C010 | — | Team tab shows up to 6 Pokemon; identity picker shows 6 sprites per character |
| R015 | Maximum Moves Per Pokemon | constraint | player | Implemented | player | C025, C026 | — | Move list displays up to 6 moves per Pokemon |
| R016 | TM/Tutor Move Limit | constraint | player | Out of Scope | — | — | — | Move teaching is GM-managed; not a player view concern |
| R017 | Pokemon Stat Points Allocation | workflow | player | Implemented-Unreachable | gm | — | P2 | Stat allocation exists server-side but only accessible from GM view. Player assigns stats per PTU rules but has no UI for it |
| R018 | Base Relations Rule | constraint | player | Implemented-Unreachable | gm | — | P2 | Validation exists server-side but player cannot interact with stat allocation |
| R019 | Pokemon Nature Application | modifier | system | Implemented | player | C025, C011 | — | Nature applied server-side; displayed in Pokemon card |
| R020 | Pokemon Ability Progression | workflow | player | Partial | player | C025 | P2 | **Present:** Abilities displayed in Pokemon cards. **Missing:** No indication of ability tier (Basic/Advanced/High) or next ability unlock level |
| R021 | Pokemon Leveling Up Workflow | workflow | player | Implemented-Unreachable | gm | — | P2 | Level-up workflow exists but only in GM view. Player sees updated data via WebSocket sync |
| R022 | Tutor Points Progression | formula | player | Missing | — | — | P2 | Tutor points not displayed in player view |
| R023 | Loyalty Is GM Secret | constraint | gm | Implemented | player | C029 | — | Loyalty is not exposed in player view data — correctly hidden |
| R024 | Loyalty Ranks and Effects | enumeration | system | Out of Scope | — | — | — | GM-managed system, correctly hidden from player |
| R025 | Loyalty Command Checks | condition | player | Missing | — | — | P2 | No mechanism for player to make Command checks. Dice rolling subsystem missing |

### Skill Checks & Capabilities — R026-R038

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R026 | Skill Check Resolution | workflow | player | Subsystem-Missing | — | — | P1 | **Missing subsystem: Dice Rolling / Skill Checks.** Player view displays skill ranks (C017) but provides no way to roll dice or resolve skill checks |
| R027 | Opposed Check Resolution | workflow | player | Subsystem-Missing | — | — | P1 | Part of missing Dice Rolling subsystem |
| R028 | Team Skill Check | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Dice Rolling subsystem |
| R029 | Assisted Skill Check | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Dice Rolling subsystem |
| R030 | Rounding Rule | formula | system | Implemented | player | C019 | — | Server-side calculations use floor rounding; evasion calculation on client also rounds down |
| R031 | Percentages Are Additive | formula | system | Implemented | player | — | — | Server-side damage calculations follow additive percentage rule |
| R032 | Specific Rules Trump General | constraint | system | Out of Scope | — | — | — | Meta-rule for rule interpretation; not implementable as a feature |
| R033 | Throwing Range | formula | player | Missing | — | — | P2 | Throwing range (4 + Athletics) not displayed in character sheet capabilities section |
| R034 | Overland Movement Capability | enumeration | player | Partial | player | C025 | P2 | **Present:** Pokemon overland capability shown in Pokemon cards. **Missing:** Trainer overland capability not explicitly displayed |
| R035 | Sprint Action | workflow | player | Missing | — | — | P2 | Sprint action not available in combat action panel |
| R036 | Scene Definition | enumeration | gm | Implemented | player | C065, C066 | — | Scene system exists; player receives scene data from GM |
| R037 | Pokemon Skill Checks Outside Combat | workflow | player | Subsystem-Missing | — | — | P1 | Part of missing Dice Rolling subsystem |
| R038 | Player Does Not Control Pokemon Out of Combat | constraint | gm | Implemented | player | — | — | Player view shows Pokemon data but has no out-of-combat control interface (correctly) |

### Combat: Initiative & Turn Structure — R039-R046

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R039 | Initiative Equals Speed Stat | formula | system | Implemented | player | C027 | — | Encounter view shows combatants in initiative order; server computes from Speed |
| R040 | League Battle Initiative Order | workflow | system | Implemented | player | C045 | — | usePlayerCombat detects league battle mode with separate trainer/Pokemon phases |
| R041 | Full Contact Initiative Order | workflow | system | Implemented | player | C027 | — | Default encounter view shows all combatants in speed order |
| R042 | Initiative Tie Resolution | workflow | system | Implemented | player | — | — | Server resolves ties; player sees final order |
| R043 | Hold Action | workflow | player | Missing | — | — | P2 | No hold action button in combat action panel |
| R044 | Two Turns Per Round | workflow | player | Implemented | player | C032, C027 | — | Turn detection works for both trainer and Pokemon entities |
| R045 | Round Duration | enumeration | system | Out of Scope | — | — | — | Narrative timing; not mechanically relevant to the app |
| R046 | One Full Round Duration | enumeration | system | Out of Scope | — | — | — | Effect duration tracking is server-side |

### Combat: Action Types — R047-R057

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R047 | Actions Per Turn | workflow | player | Implemented | player | C030, C031 | — | Turn state banner shows STD/SHF/SWF action pips; tracks usage |
| R048 | Standard Action Options (Trainer) | enumeration | player | Partial | player | C030, C034-C040 | P1 | **Present:** Use Move, Struggle, Use Item (request), Switch Pokemon (request), Maneuver (request), Pass Turn. **Missing:** Draw Weapon, Pokedex identification, give up Standard for extra Shift/Swift |
| R049 | Standard Action to Extra Shift Limitation | constraint | player | Missing | — | — | P2 | No option to trade Standard Action for extra Shift; limitation not enforced client-side |
| R050 | Shift Action for Movement | workflow | player | Implemented | player | C035, C068 | — | Shift action available in combat panel; grid supports movement requests |
| R051 | Shift Action Item Passing | workflow | player | Out of Scope | — | — | — | Situational trainer-to-trainer action; handled narratively |
| R052 | Swift Action Limitation | constraint | player | Partial | player | C030 | P2 | **Present:** Swift action tracked in turn state. **Missing:** No enforcement of "only on your turn" for Swift (server-side concern); no explicit Swift action button |
| R053 | Full Action | workflow | player | Partial | player | C030, C040 | P2 | **Present:** Maneuver requests can represent Full Actions. **Missing:** No explicit Full Action indicator consuming both Standard + Shift |
| R054 | Priority Action | workflow | player | Missing | — | — | P2 | No Priority action declaration mechanism |
| R055 | Priority (Limited) Action | workflow | player | Missing | — | — | P2 | No Priority (Limited) declaration mechanism |
| R056 | Interrupt Action | workflow | player | Missing | — | — | P2 | No Interrupt action mechanism (would need out-of-turn UI) |
| R057 | No Action Tax at Combat Start | constraint | system | Implemented | player | C027 | — | Encounter start shows Pokemon already deployed; no action cost |

### Combat: Pokemon Commanding & Switching — R058-R066

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R058 | Player Commands Pokemon in Combat | workflow | player | Implemented | player | C030, C031, C034 | — | Player selects moves for their Pokemon during Pokemon's turn |
| R059 | Pokemon Standard Action Options | enumeration | player | Partial | player | C030, C034, C036, C040 | P1 | **Present:** Use Move, Struggle, Maneuver (request), Switch (recall). **Missing:** Activate Ability/Capability, make Skill Check, pick up Held Item |
| R060 | Pokemon Switch - Standard Action | workflow | player | Implemented | player | C039 | — | requestSwitchPokemon sends switch request to GM |
| R061 | Poke Ball Recall Range | constraint | player | Missing | — | — | P3 | No range check for recall (8m); player can request switch regardless of distance |
| R062 | Fainted Pokemon Switch - Shift Action | workflow | player | Partial | player | C039, C042 | P2 | **Present:** switchablePokemon filters fainted. **Missing:** No distinction between standard-action switch and shift-action switch for fainted Pokemon |
| R063 | League Battle Switch Penalty | constraint | system | Implemented | player | C044 | — | canBeCommanded computed enforces league battle switch restriction |
| R064 | Recall and Release as Shift Actions | workflow | player | Missing | — | — | P2 | No separate Recall/Release shift actions; only full Switch request exists |
| R065 | Recall/Release Two Pokemon at Once | workflow | player | Missing | — | — | P3 | No multi-Pokemon recall/release action |
| R066 | Released Pokemon Can Act Immediately | workflow | player | Implemented | player | C031 | — | Server handles initiative insertion; player sees the newly released Pokemon in turn order |

### Combat: Making Attacks — R067-R072

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R067 | Accuracy Roll | formula | player | Implemented | player | C034 | — | Move execution sends to server which performs accuracy roll |
| R068 | Accuracy Check Calculation | formula | system | Implemented | player | C034 | — | Server calculates AC + Evasion |
| R069 | Natural 1 Always Misses | condition | system | Implemented | player | — | — | Server-side enforcement |
| R070 | Natural 20 Always Hits | condition | system | Implemented | player | — | — | Server-side enforcement |
| R071 | Willingly Be Hit | condition | player | Missing | — | — | P3 | No option for player to declare "willingly be hit" |
| R072 | Accuracy Modifiers Don't Affect Effect Triggers | constraint | system | Implemented | player | — | — | Server-side enforcement |

### Combat: Damage Calculation — R073-R087

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R073 | Damage Formula Workflow | workflow | system | Implemented | player | — | — | Full 9-step damage workflow implemented server-side (damageCalculation.ts) |
| R074 | Damage Base to Actual Damage | formula | system | Implemented | player | C026, C047 | — | Damage Base displayed on moves; server maps DB to dice/set damage |
| R075 | STAB | modifier | system | Implemented | player | — | — | Server applies STAB; move card shows type matching for reference |
| R076 | Physical vs Special Damage | formula | system | Implemented | player | C026 | — | Damage class (Physical/Special) shown on move cards |
| R077 | Minimum Damage of 1 | constraint | system | Implemented | player | — | — | Server-side enforcement |
| R078 | Critical Hit on Natural 20 | condition | system | Implemented | player | — | — | Server-side enforcement |
| R079 | Increased Critical Hit Range | modifier | system | Implemented | player | — | — | Server-side enforcement |
| R080 | Type Effectiveness - Super Effective | modifier | system | Implemented | player | — | — | Server applies type effectiveness multipliers |
| R081 | Type Effectiveness - Resisted | modifier | system | Implemented | player | — | — | Server applies resistance multipliers |
| R082 | Type Immunity | condition | system | Implemented | player | — | — | Server applies immunity (0 damage) |
| R083 | Dual-Type Effectiveness | interaction | system | Implemented | player | — | — | Server handles dual-type interactions |
| R084 | Status Moves Ignore Type Effectiveness | constraint | system | Implemented | player | — | — | Server-side enforcement |
| R085 | Trainers Have No Type | constraint | system | Implemented | player | — | — | Server treats trainers as typeless |
| R086 | Hit Point Loss vs Damage | constraint | system | Implemented | player | — | — | Server distinguishes HP loss from damage |
| R087 | Tick of Hit Points | formula | system | Implemented | player | — | — | Server computes tick = maxHP / 10 |

### Combat: Combat Stages — R088-R093

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R088 | Combat Stage Stats | enumeration | system | Implemented | player | C025, C017 | — | Stage modifiers displayed for all 5 stats in both trainer and Pokemon views |
| R089 | Combat Stage Limits | constraint | system | Implemented | player | — | — | Server enforces -6 to +6 limits |
| R090 | Combat Stage Multipliers | formula | system | Implemented | player | C025, C017 | — | Stage modifiers shown; actual multiplied values computed server-side |
| R091 | Combat Stages Persist Until Switch/End | condition | system | Implemented | player | — | — | Server manages stage persistence; player sees current values via sync |
| R092 | Speed CS Affects Movement | modifier | system | Partial | player | — | P2 | **Present:** Server applies speed CS to movement. **Missing:** Player view doesn't display adjusted movement speed from combat stages |
| R093 | Accuracy Combat Stages | modifier | system | Implemented | player | — | — | Server applies accuracy CS to rolls |

### Combat: Movement & Positioning — R094-R102

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R094 | Grid-Based Movement | workflow | player | Implemented | player | C068 | — | PlayerGridView renders square combat grid |
| R095 | Size Footprint on Grid | enumeration | system | Implemented | player | C070 | — | visibleTokens includes size for token rendering |
| R096 | Shift Movement in Combat | workflow | player | Implemented | player | C068, C071 | — | Player can select token and request movement to destination cell |
| R097 | No Split Shift Action | constraint | player | Partial | player | C071 | P3 | **Present:** Movement is a single request (from -> to). **Missing:** No explicit enforcement that prevents a player from making two move requests in one turn (server-side concern) |
| R098 | Diagonal Movement Cost | formula | system | Implemented | player | C069 | — | usePlayerGridView calculates PTU diagonal distance (1-2-1-2 pattern) |
| R099 | Adjacency Definition | enumeration | system | Implemented | player | — | — | Server uses adjacency for target validation |
| R100 | Flanking | modifier | system | Missing | — | — | P2 | Flanking status not shown in player view; no visual indicator of flanking on grid |
| R101 | Flanking Size Scaling | modifier | system | Missing | — | — | P3 | Depends on R100 flanking display |
| R102 | Mixed Movement Capability Averaging | formula | system | Out of Scope | — | — | — | Edge case handled narratively by GM |

### Combat: Terrain — R103-R106

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R103 | Regular Terrain | enumeration | system | Partial | player | C068, C070 | P2 | **Present:** Grid renders cells. **Missing:** Terrain type not visually indicated on player grid (GM-only data per C067 — PlayerSceneData excludes terrains) |
| R104 | Slow Terrain | modifier | system | Partial | player | — | P2 | **Present:** Server applies slow terrain cost. **Missing:** Not visible to player on grid |
| R105 | Rough Terrain Accuracy Penalty | modifier | system | Partial | player | — | P2 | **Present:** Server applies -2 accuracy. **Missing:** Not visible to player on grid |
| R106 | Blocking Terrain | constraint | system | Partial | player | — | P2 | **Present:** Server blocks movement/targeting. **Missing:** Not visible to player on grid |

### Combat: Struggle Attacks — R107-R109

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R107 | Struggle Attack Stats | formula | player | Implemented | player | C036 | — | useStruggle executes struggle with AC 4, DB 4, Normal, Physical, Melee |
| R108 | Expert Struggle Attack Upgrade | modifier | system | Partial | player | — | P3 | **Present:** Server may check combat skill rank. **Missing:** Player view doesn't indicate if struggle is upgraded |
| R109 | Struggle Attacks Are Not Moves | constraint | system | Implemented | player | C089 | — | PlayerActionType distinguishes 'struggle' from 'use_move' |

### Combat: Combat Maneuvers — R110-R122

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R110 | Attack of Opportunity | workflow | player | Missing | — | — | P2 | No AoO trigger mechanism; would need out-of-turn interrupt UI |
| R111 | Attack of Opportunity Triggers | enumeration | system | Missing | — | — | P2 | Depends on R110 |
| R112 | Disengage Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Disengage. **Missing:** No specific Disengage option; bundled into generic maneuver request |
| R113 | Disarm Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Disarm. **Missing:** No specific opposed check UI |
| R114 | Dirty Trick - Hinder | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Dirty Trick. **Missing:** No specific sub-type selection |
| R115 | Dirty Trick - Blind | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Dirty Trick. **Missing:** No specific sub-type selection |
| R116 | Dirty Trick - Low Blow | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Dirty Trick. **Missing:** No specific sub-type selection |
| R117 | Manipulate Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Manipulate. **Missing:** No specific target/range UI |
| R118 | Push Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Push. **Missing:** No specific direction/target UI |
| R119 | Trip Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Trip. **Missing:** No specific target/check UI |
| R120 | Grapple Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Grapple. **Missing:** No grapple state tracking |
| R121 | Intercept Melee Maneuver | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request Intercept. **Missing:** No interrupt trigger UI, no skill check integration |
| R122 | Intercept Loyalty Requirement | constraint | system | Out of Scope | — | — | — | Loyalty is GM-managed; server-side validation |

### Combat: Take a Breather — R123-R125

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R123 | Take a Breather Action | workflow | player | Partial | player | C040 | P2 | **Present:** requestManeuver can request "Take a Breather." **Missing:** No specific Take a Breather flow (full action indication, trip+vulnerable warning) |
| R124 | Take a Breather Effects | workflow | system | Implemented | player | — | — | Server applies breather effects (reset CS, cure volatile, etc.) |
| R125 | Assisted Take a Breather | workflow | player | Missing | — | — | P3 | No assisted breather flow with Command check |

### Combat: Status Afflictions — R126-R139

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R126 | Persistent Afflictions Enumeration | enumeration | system | Implemented | player | C025, C028 | — | Status conditions displayed on Pokemon cards and combatant info |
| R127 | Burned Effects | condition | system | Implemented | player | C028 | — | Burn displayed; server applies CS penalty and tick damage |
| R128 | Frozen Effects | condition | system | Implemented | player | C028 | — | Frozen displayed; server handles save checks |
| R129 | Paralysis Effects | condition | system | Implemented | player | C028 | — | Paralysis displayed; server applies speed CS and save checks |
| R130 | Poisoned Effects | condition | system | Implemented | player | C028 | — | Poison displayed; server applies SpDef CS and tick damage |
| R131 | Sleep Effects | condition | system | Implemented | player | C028 | — | Sleep displayed; server handles save checks and wake-on-damage |
| R132 | Volatile Afflictions Enumeration | enumeration | system | Implemented | player | C028 | — | Volatile conditions displayed on combatant info |
| R133 | Volatile Afflictions Cured on Recall | condition | system | Implemented | player | — | — | Server cures volatile on recall |
| R134 | Confused Save Check | condition | system | Implemented | player | — | — | Server handles confusion save and self-hit |
| R135 | Rage Effects | condition | system | Implemented | player | — | — | Server enforces rage restrictions |
| R136 | Flinch Effects | condition | system | Implemented | player | — | — | Server prevents actions on flinch |
| R137 | Infatuation Save Check | condition | system | Implemented | player | — | — | Server handles infatuation save |
| R138 | Persistent Afflictions Cured on Faint | condition | system | Implemented | player | — | — | Server cures persistent on faint |
| R139 | Type-Based Status Immunities | enumeration | system | Implemented | player | — | — | Server enforces type immunities |

### Combat: Temporary HP & Other Conditions — R140-R149

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R140 | Temporary Hit Points | modifier | system | Implemented | player | C017, C025 | — | Temp HP displayed in character sheet and Pokemon cards |
| R141 | Temporary HP Does Not Count for Percentage | constraint | system | Implemented | player | C018 | — | HP percentage calculation excludes temp HP |
| R142 | Fainted Condition | condition | system | Implemented | player | C025, C028 | — | Fainted Pokemon dimmed in team view and combatant info |
| R143 | Fainted Recovery | workflow | player | Implemented-Unreachable | gm | — | P1 | Revive/healing items exist but only usable from GM view. Player cannot use Revive from their item list |
| R144 | Blindness Effects | condition | system | Implemented | player | C028 | — | Blinded status displayed; server applies accuracy penalty |
| R145 | Slowed Condition | condition | system | Implemented | player | C028 | — | Slowed displayed; server halves movement |
| R146 | Stuck Condition | condition | system | Implemented | player | C028 | — | Stuck displayed; server prevents shift movement |
| R147 | Trapped Condition | condition | system | Implemented | player | C028 | — | Trapped displayed; server prevents recall |
| R148 | Tripped Condition | condition | system | Implemented | player | C028 | — | Tripped displayed; server requires shift to stand |
| R149 | Vulnerable Condition | condition | system | Implemented | player | C028 | — | Vulnerable displayed; server removes evasion |

### Combat: Injuries & Death — R150-R155

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R150 | Injury from Massive Damage | condition | system | Implemented | player | C028 | — | Injuries displayed; server applies on massive damage |
| R151 | Injury from Hit Point Markers | condition | system | Implemented | player | — | — | Server tracks HP markers and applies injuries |
| R152 | Injury Reduces Max HP | modifier | system | Implemented | player | C017, C025 | — | Max HP adjusted for injuries; player sees reduced max |
| R153 | Heavily Injured Threshold | condition | system | Partial | player | C028 | P2 | **Present:** Injury count displayed. **Missing:** No "Heavily Injured" label when injuries >= 5; no HP loss warning |
| R154 | Death Conditions | condition | system | Out of Scope | — | — | — | Death handling is a narrative/GM concern |
| R155 | League Matches Exempt from Death by HP | constraint | system | Out of Scope | — | — | — | GM-determined match type setting |

### Capture — R156-R166

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R156 | Poke Ball Throw Action | workflow | player | Partial | player | — | P1 | Player can initiate capture via PlayerCapturePanel (target selection, request to GM); execution/resolution is GM-side |
| R157 | Natural 20 Capture Bonus | modifier | system | Implemented-Unreachable | gm | — | P1 | Server implements; not reachable from player view |
| R158 | Capture Roll (Core) | formula | player | Implemented-Unreachable | gm | — | P1 | Capture roll formula implemented server-side; player can't initiate |
| R159 | Capture Rate Calculation (Core) | formula | system | Partial | player | — | P1 | Capture rate preview visible to player via CaptureRateDisplay (usePlayerCapture fetches from server or estimates locally); actual capture determination is GM-side |
| R160 | Capture Rate - HP Modifiers | modifier | system | Partial | player | — | P1 | HP modifiers visible in capture rate breakdown shown to player via CaptureRateDisplay; calculation is server-side |
| R161 | Capture Rate - Evolution Stage Modifiers | modifier | system | Out of Scope | — | — | — | Server-side formula detail |
| R162 | Capture Rate - Status/Injury Modifiers | modifier | system | Out of Scope | — | — | — | Server-side formula detail |
| R163 | KO'd Pokemon Cannot Be Captured | constraint | system | Implemented | player | — | — | Server validates; no bypass possible |
| R164 | Capture Rate (Errata - d20) | formula | player | Implemented-Unreachable | gm | — | P1 | Errata capture system implemented server-side; player can't initiate |
| R165 | Capture Rate Calculation (Errata) | formula | system | Out of Scope | — | — | — | Server-side formula detail |
| R166 | Poke Ball Modifier Conversion (Errata) | modifier | system | Out of Scope | — | — | — | Server-side formula detail |

### Healing & Resting — R167-R173

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R167 | Rest Healing Rate | formula | player | Subsystem-Missing | — | — | P2 | **Missing subsystem: Rest / Healing (Player-Initiated).** useRestHealing composable exists but only accessible from GM view |
| R168 | Rest Blocked by Heavy Injuries | constraint | system | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |
| R169 | Natural Injury Healing | workflow | system | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |
| R170 | Trainer AP Drain to Remove Injury | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |
| R171 | Extended Rest Definition | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |
| R172 | Pokemon Center Healing | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |
| R173 | Pokemon Center Injury Limit | constraint | system | Subsystem-Missing | — | — | P2 | Part of missing Rest subsystem |

### Combat: Using Items — R174-R175

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R174 | Use Item as Standard Action | workflow | player | Implemented | player | C038, C043 | — | requestUseItem sends item usage request to GM with item details from inventory |
| R175 | Pokedex Identification | workflow | player | Missing | — | — | P2 | No Pokedex identification action in combat panel |

### Pokemon Evolution & Training — R176-R180

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R176 | Evolution Workflow | workflow | player | Subsystem-Missing | — | — | P2 | **Missing subsystem: Pokemon Evolution (Player-Managed).** No player-side evolution trigger or re-stat interface |
| R177 | Player May Refuse Evolution | constraint | player | Subsystem-Missing | — | — | P2 | Part of missing Evolution subsystem |
| R178 | Training Session Duration | workflow | player | Subsystem-Missing | — | — | P2 | **Missing subsystem: Pokemon Training.** No training interface in player view |
| R179 | Experience Training | formula | player | Subsystem-Missing | — | — | P2 | Part of missing Training subsystem |
| R180 | Mega Evolution Trigger | workflow | player | Missing | — | — | P2 | No Mega Evolution swift action in combat panel |

### Miscellaneous: Falling & Environmental — R181-R184

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R181 | Falling Damage Formula | formula | system | Out of Scope | — | — | — | GM-adjudicated environmental effect |
| R182 | Falling Injuries | condition | system | Out of Scope | — | — | — | GM-adjudicated environmental effect |
| R183 | Suffocation Rules | condition | system | Out of Scope | — | — | — | GM-adjudicated environmental effect |
| R184 | Precision Skill Checks in Combat | modifier | player | Subsystem-Missing | — | — | P2 | Part of missing Dice Rolling subsystem |

### Errata-Specific Rules — R185-R189

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R185 | Tutor Move Level Restrictions (Errata) | constraint | player | Out of Scope | — | — | — | Move teaching is GM-managed |
| R186 | Mixed Power Poke Edge (Errata) | modifier | player | Out of Scope | — | — | — | Poke Edge management is GM-managed |
| R187 | Basic Ranged Attacks No Level Prerequisite (Errata) | modifier | player | Out of Scope | — | — | — | Feature prerequisite is GM-managed |
| R188 | Shield Evasion Bonus Reduced (Errata) | modifier | system | Implemented | player | C019 | — | Equipment bonus calculation uses updated shield values |
| R189 | Armor Damage Reduction Split (Errata) | modifier | system | Implemented | player | C017 | — | Equipment DR displayed; server applies correct armor split |

### Player Information Visibility Rules — R190-R197

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R190 | Player Sees Own Trainer Stats | enumeration | player | Implemented | player | C017, C011 | — | Full character sheet with all stats, skills, features, equipment |
| R191 | Player Assigns Pokemon Stats | workflow | player | Implemented-Unreachable | gm | — | P2 | Stat assignment exists but only in GM view |
| R192 | GM Determines Wild Pokemon Abilities and Nature | constraint | gm | Implemented | player | — | — | Player receives Pokemon with GM-set abilities/nature; no override possible |
| R193 | Player Knows Own Pokemon's Moves and Abilities | enumeration | player | Implemented | player | C025, C026 | — | Full move list and ability details in Pokemon cards |
| R194 | Loyalty Hidden from Player | constraint | gm | Implemented | player | C029 | — | Loyalty not included in player-view API response |
| R195 | Player Sees Type Effectiveness Chart | enumeration | player | Missing | — | — | P3 | No type effectiveness chart/reference in player view |
| R196 | Player Sees Damage Charts | enumeration | player | Missing | — | — | P3 | No damage base-to-dice chart in player view |
| R197 | Player Sees Combat Stage Multiplier Table | enumeration | player | Partial | player | C017, C025 | P3 | **Present:** Combat stage values displayed. **Missing:** No multiplier reference table showing what each stage means |

### Pokemon Disposition — R198-R199

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R198 | Pokemon Disposition Scale | enumeration | gm | Out of Scope | — | — | — | GM-only wild encounter management |
| R199 | Charm Check to Improve Disposition | workflow | player | Subsystem-Missing | — | — | P2 | Part of missing Dice Rolling subsystem; also requires wild encounter interaction |

### Cross-Domain References — R200-R207

| Rule ID | Rule Name | Category | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|----------------|----------------|-----------------------|-------------|-------|
| R200 | Weather Effects on Combat | modifier | gm | Partial | player | C065 | P2 | **Present:** Weather badge shown in scene view. **Missing:** No weather effect reference or impact display in encounter view |
| R201 | Encounter XP Rewards | formula | gm | Out of Scope | — | — | — | GM distributes XP; not a player-initiated action |
| R202 | Poke Ball Types and Modifiers | enumeration | player | Partial | player | C043 | P2 | **Present:** Poke Balls appear in inventory. **Missing:** No capture modifier reference; balls not usable from player view |
| R203 | Healing Items List | enumeration | player | Partial | player | C043, C038 | P2 | **Present:** Healing items appear in inventory and can be requested in combat. **Missing:** No item effect reference; no out-of-combat usage |
| R204 | Held Items | enumeration | player | Implemented | player | C025 | — | Held item displayed on Pokemon cards |
| R205 | Move Data Format | enumeration | player | Implemented | player | C026, C047 | — | Moves display Name, Type, Frequency, AC, Class, Range, Effect |
| R206 | Ability Data Format | enumeration | player | Implemented | player | C025 | — | Abilities display Name and Effect text |
| R207 | Trainer Class Features | enumeration | player | Partial | player | C017 | P2 | **Present:** Feature names displayed as tags. **Missing:** No feature effect text or activation mechanism |

---

## Actor Accessibility Summary

| Rule Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Subsys-Missing | Out of Scope |
|-----------|-------------|-------------|-------------------|---------|---------|----------------|-------------|
| **player** | 92 | 19 | 8 | 24 | 20 | 15 | 6 |
| **system** | 107 | 72 | 3 | 10 | 4 | 3 | 15 |
| **gm** | 8 | 5 | 0 | 1 | 0 | 0 | 2 |

### Reachability Analysis

**Player-actor rules (92 total, 86 in scope):**
- 19 fully reachable from player view (22.1%)
- 8 implemented but unreachable from player view (9.3%) — code exists but only in GM view
- 24 partially implemented (27.9%)
- 20 missing entirely (23.3%)
- 15 part of missing subsystems (17.4%)
- 6 out of scope

**Player-actor reachability rate:** 22.1% of in-scope player rules are fully reachable; 36.0% including partial credit

**System-actor rules (107 total, 92 in scope):**
- 72 implemented by server (78.3% of in-scope)
- 3 implemented but unreachable (capture system formulas)
- 10 partially implemented
- 4 missing
- 3 part of missing subsystems
- 15 out of scope

**System-actor coverage:** 83.7% of in-scope system rules are fully or partially covered

**Key insight:** The player view's biggest gap is in **player-actor** rules, not system-actor rules. The server handles most system-level mechanics correctly; the gap is in exposing those mechanics to the player for direct interaction. 42 player-actor rules are either Missing (20), Subsystem-Missing (15), or Implemented-Unreachable (8) — that is 48.8% of in-scope player rules where the player lacks agency.

---

## Subsystem Gaps

### Gap 1: Dice Rolling / Skill Checks (SUBSYSTEM-MISSING)

**Missing subsystem:** No player-facing interface for rolling dice or making skill checks.

**Affected rules:** R026, R027, R028, R029, R037, R184, R199 (7 rules)

**Impact:** Players cannot make skill checks (Athletics, Acrobatics, Perception, etc.) from their view. All dice rolling must be done by the GM or via external tools. This affects both in-combat and out-of-combat gameplay.

**Suggested feature ticket:**
- **Title:** Player View: Dice roller and skill check interface
- **Priority:** P1
- **Scope:** Add a dice rolling panel accessible from the Character tab. Support skill checks (roll Xd6 based on rank + modifiers), opposed checks, and team checks. Optionally integrate with combat for AP accuracy boost (R013).

---

### Gap 2: Pokemon Capture (Player-Initiated) (PARTIALLY IMPLEMENTED)

**Subsystem status:** Player can initiate capture requests via PlayerCapturePanel.vue and usePlayerCombat.requestCapture(). Capture rate preview is shown via CaptureRateDisplay (usePlayerCapture fetches from server or estimates locally). Actual capture resolution (accuracy roll, 1d100 capture roll) remains GM-side.

**Affected rules:** R157, R158, R164 (3 rules still Implemented-Unreachable); R156, R159, R160 reclassified to Partial

**Impact:** Players can select a wild target, view capture rate preview with HP/status breakdown, and send a capture request to the GM. The GM still must approve and execute the capture roll. Remaining gap is that R157 (nat 20 bonus) and R158 (capture roll execution) are server-only, and R164 (errata d20 system) is inactive per decree-013.

**Remaining work:**
- **Ball type selection** — PlayerCapturePanel defaults to Poke Ball; no ball picker from inventory yet
- **Capture result display** — Player does not see the capture roll result in their view
- **Priority:** P2 (core request flow exists; polish items remain)

---

### Gap 3: Rest / Healing (Player-Initiated) (SUBSYSTEM-MISSING)

**Missing subsystem:** No player-facing interface for resting or healing outside combat.

**Affected rules:** R167, R168, R169, R170, R171, R172, R173 (7 rules)

**Impact:** All rest and healing is GM-only. Players cannot initiate rests, use healing items outside combat, or track injury healing. useRestHealing composable exists but is not exposed to the player view.

**Suggested feature ticket:**
- **Title:** Player View: Rest and healing interface
- **Priority:** P2
- **Scope:** Add rest controls (30-min rest, extended rest) to the Character tab. Show healing progress, injury healing tracker, and AP drain for injury removal. Integrate with the existing useRestHealing composable.

---

### Gap 4: Pokemon Evolution (Player-Managed) (SUBSYSTEM-MISSING)

**Missing subsystem:** No player-facing interface for evolution management.

**Affected rules:** R176, R177 (2 rules)

**Impact:** Players cannot trigger evolution or refuse it from their view. Evolution is entirely GM-managed.

**Suggested feature ticket:**
- **Title:** Player View: Pokemon evolution interface
- **Priority:** P2
- **Scope:** When a Pokemon reaches evolution level, show an evolution prompt in the Team tab. Player can accept (triggers re-stat workflow) or decline.

---

### Gap 5: Pokemon Training (SUBSYSTEM-MISSING)

**Missing subsystem:** No player-facing interface for training sessions or XP training.

**Affected rules:** R178, R179 (2 rules)

**Impact:** Players cannot initiate training sessions, apply experience training, or manage tutor points.

**Suggested feature ticket:**
- **Title:** Player View: Training session interface
- **Priority:** P2
- **Scope:** Add training workflow to Team tab. Allow XP training based on Command rank, tutor point spending, and training session tracking.

---

### Gap 6: Item Usage (Out-of-Combat) (SUBSYSTEM-MISSING)

**Missing subsystem:** Items only usable during combat via GM-approval requests.

**Affected rules:** R174 (combat usage exists), but out-of-combat usage of potions, TMs, evolution stones is absent.

**Impact:** Players cannot use items between encounters. Must ask GM to apply items for them.

**Suggested feature ticket:**
- **Title:** Player View: Out-of-combat item usage
- **Priority:** P2
- **Scope:** Add item usage interface to Character or Team tab. Support healing items (Potion, Super Potion), status items (Antidote, Awakening), and utility items.

---

### Gap 7: Stat Allocation (Player-Initiated) (IMPLEMENTED-UNREACHABLE)

**Missing subsystem:** Stat point allocation UI exists only in GM view.

**Affected rules:** R017, R018, R021, R191 (4 rules)

**Impact:** Players cannot allocate stat points for their Pokemon or adjust stats during level-up. All stat management is GM-side only.

**Suggested feature ticket:**
- **Title:** Player View: Pokemon stat allocation on level-up
- **Priority:** P2
- **Scope:** When a Pokemon levels up, show a stat allocation panel in the Team tab with Base Relations Rule enforcement.

---

## Gap Priorities Summary

### P0 (Blocks basic session usage)
None identified. Basic session flow (view character, view team, participate in encounters via GM) is functional.

### P1 (Important mechanic, commonly used)

| Rule ID(s) | Gap | Classification |
|------------|-----|---------------|
| R026, R027, R037 | Dice rolling / skill checks | Subsystem-Missing |
| R010 | AP pool formula display | Partial |
| R013 | AP accuracy boost | Missing |
| R048 | Standard action options incomplete | Partial |
| R059 | Pokemon standard action options incomplete | Partial |
| R143 | Fainted recovery (player item usage) | Implemented-Unreachable |
| R157, R158, R164 | Capture roll execution (server-side) | Implemented-Unreachable |

### P2 (Situational, workaround exists)

| Rule ID(s) | Gap | Classification |
|------------|-----|---------------|
| R007, R008 | Evasion application details | Partial |
| R011 | AP scene recovery | Missing |
| R012 | AP bound/drain visual | Partial |
| R017, R018, R021 | Stat allocation | Implemented-Unreachable |
| R020 | Ability tier display | Partial |
| R022 | Tutor points display | Missing |
| R025 | Command checks | Missing |
| R028, R029, R184, R199 | Non-core skill checks | Subsystem-Missing |
| R033 | Throwing range display | Missing |
| R034 | Trainer overland capability | Partial |
| R035 | Sprint action | Missing |
| R043 | Hold action | Missing |
| R049 | Standard-to-Shift trade | Missing |
| R052, R053 | Swift/Full action specifics | Partial |
| R054, R055, R056 | Priority/Interrupt actions | Missing |
| R062, R064, R065 | Switch/Recall specifics | Missing/Partial |
| R092 | Speed CS movement display | Partial |
| R100 | Flanking display | Missing |
| R103-R106 | Terrain visibility on grid | Partial |
| R108 | Expert struggle indicator | Partial |
| R110-R121 | Maneuver specifics | Missing/Partial |
| R123 | Take a Breather specifics | Partial |
| R125 | Assisted Take a Breather | Missing |
| R153 | Heavily Injured label | Partial |
| R167-R173 | Rest/Healing subsystem | Subsystem-Missing |
| R175 | Pokedex identification | Missing |
| R176-R180 | Evolution/Training/Mega | Subsystem-Missing |
| R191 | Player stat assignment | Implemented-Unreachable |
| R195, R196, R197 | Reference charts | Missing/Partial |
| R200 | Weather effects display | Partial |
| R202, R203 | Item references | Partial |
| R207 | Feature effect text | Partial |

### P3 (Edge case, minimal gameplay impact)

| Rule ID(s) | Gap | Classification |
|------------|-----|---------------|
| R061 | Recall range check | Missing |
| R065 | Multi-Pokemon recall | Missing |
| R071 | Willingly be hit | Missing |
| R097 | Split shift enforcement | Partial |
| R101 | Flanking size scaling | Missing |
| R195, R196 | Type/damage charts | Missing |

---

## Auditor Queue

Prioritized list of items requiring Implementation Auditor verification. Ordered by: core scope first, formulas/conditions first, foundation before derived.

### Tier 1: Core Formulas & Calculations (Verify Correctness)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 1 | R002 | Trainer Derived Stats | C017, C011 | HP formula: Level*2 + HP*3 + 10 |
| 2 | R003 | Pokemon Hit Points Formula | C025, C011 | HP formula: Level + HP*3 + 10 |
| 3 | R004 | Evasion from Defense | C019 | Floor(Def/5), cap at +6 |
| 4 | R005 | Evasion from SpDef | C019 | Floor(SpDef/5), cap at +6 |
| 5 | R006 | Evasion from Speed | C019 | Floor(Spd/5), cap at +6 |
| 6 | R030 | Rounding Rule | C019 | All decimals floor (not round) |
| 7 | R087 | Tick of Hit Points | — | tick = floor(maxHP / 10) |
| 8 | R090 | Combat Stage Multipliers | C025 | +20% per positive CS, -10% per negative CS |
| 9 | R098 | Diagonal Movement Cost | C069 | 1-2-1-2 pattern for diagonals |
| 10 | R152 | Injury Reduces Max HP | C017, C025 | maxHP reduced by 1/10 per injury |

### Tier 2: Core Conditions & Constraints (Verify Correctness)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 11 | R014 | Max 6 Pokemon in Party | C024, C010 | Team display capped at 6 |
| 12 | R015 | Max 6 Moves per Pokemon | C025, C026 | Move list capped at 6 |
| 13 | R023 | Loyalty Is GM Secret | C029 | Loyalty NOT in player-view response |
| 14 | R089 | CS Limits (-6 to +6) | — | Stage values clamped |
| 15 | R107 | Struggle Attack Stats | C036 | AC 4, DB 4, Normal, Physical, Melee, no STAB |
| 16 | R109 | Struggles Are Not Moves | C089 | 'struggle' distinct from 'use_move' |
| 17 | R141 | Temp HP Excluded from % | C018 | hpPercent uses real HP only |
| 18 | R142 | Fainted Condition | C025, C028 | Fainted at 0 HP or below; visual dimming |
| 19 | R163 | KO'd Cannot Be Captured | — | Server rejects capture of fainted Pokemon |
| 20 | R194 | Loyalty Hidden from Player | C029 | Loyalty field absent from player API |

### Tier 3: Combat Workflows (Verify Correctness)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 21 | R039 | Initiative = Speed | C027 | Combatant order matches speed |
| 22 | R040 | League Battle Phases | C045 | isLeagueBattle, isTrainerPhase, isPokemonPhase |
| 23 | R044 | Two Turns Per Round | C032 | isMyTurn detects both trainer and Pokemon |
| 24 | R047 | Actions Per Turn | C030 | STD/SHF/SWF pips track usage |
| 25 | R057 | No Action Tax at Start | C027 | Pokemon deployed without action cost |
| 26 | R058 | Player Commands Pokemon | C030, C034 | Move selection on Pokemon's turn |
| 27 | R060 | Pokemon Switch | C039 | requestSwitchPokemon sends correct payload |
| 28 | R063 | League Battle Switch Penalty | C044 | canBeCommanded returns false for newly switched |
| 29 | R066 | Released Pokemon Acts Immediately | C031 | New Pokemon appears in initiative |
| 30 | R174 | Use Item as Standard Action | C038, C043 | requestUseItem sends correct item data |

### Tier 4: Information Asymmetry (Verify Correctness)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 31 | R190 | Player Sees Own Stats | C017 | Full stats displayed for own character |
| 32 | R193 | Player Knows Own Pokemon | C025, C026 | Full moves/abilities for own Pokemon |
| 33 | — | Enemy visibility restriction | C028, C029 | Enemy shows percentage HP only |
| 34 | — | Allied visibility restriction | C028, C029 | Allies show exact HP + injuries |

### Tier 5: WebSocket & State Sync (Verify Correctness)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 35 | — | Character update sync | C054 | refreshCharacterData on character_update event |
| 36 | — | Turn notification | C051, C059 | Haptic feedback + tab switch on turn |
| 37 | — | Action acknowledgment | C050, C058 | Promise resolves on GM ack |
| 38 | — | Scene sync | C055, C066 | Scene data arrives on activation |
| 39 | — | Reconnection recovery | C074 | Full state resync on reconnect |
| 40 | — | Fog of war filtering | C070 | Own tokens visible through fog; others hidden |

### Tier 6: Implemented-Unreachable (Verify Logic, Flag Gap)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 41 | R017 | Stat Allocation | GM-only | Logic correctness in GM view |
| 42 | R018 | Base Relations Rule | GM-only | Validation correctness |
| 43 | R021 | Level-Up Workflow | GM-only | Level-up produces correct stat changes |
| 44 | R143 | Fainted Recovery | GM-only | Revive/healing logic correctness |
| 45 | R157, R158 | Capture Roll Execution | GM-only | Accuracy roll + 1d100 capture roll server-side |
| 46 | R164 | Errata Capture System | GM-only | d20 capture system (inactive per decree-013) |
| 47 | R191 | Player Assigns Stats | GM-only | Stat allocation UI in GM view |

### Tier 7: Partial Items (Verify Present Portion)

| Priority | Rule ID | Rule Name | Capability | Verify |
|----------|---------|-----------|-----------|--------|
| 48 | R010 | AP Display | C017 | AP value shown in combat info |
| 49 | R020 | Ability Display | C025 | Ability name + effect shown |
| 50 | R034 | Overland Capability | C025 | Pokemon overland shown in capabilities |
| 51 | R048 | Standard Actions | C030 | Available actions in combat panel |
| 52 | R059 | Pokemon Actions | C030 | Pokemon action options |
| 53 | R112-R121 | Maneuver Requests | C040 | requestManeuver sends correctly |
| 54 | R200 | Weather Display | C065 | Weather badge in scene view |
| 55 | R203 | Healing Items | C043, C038 | Items in inventory + combat request |
| 56 | R207 | Feature Tags | C017 | Feature names shown as tags |
| 57 | R156 | Poke Ball Throw Action | — | PlayerCapturePanel target selection + request to GM |
| 58 | R159 | Capture Rate Calculation | — | CaptureRateDisplay shows rate preview via usePlayerCapture |
| 59 | R160 | Capture Rate HP Modifiers | — | HP modifier visible in capture rate breakdown |

---

## Classification Verification Counts

Counts verified from the Precise Per-Rule Classification table below.

---

## Precise Per-Rule Classification

| # | Rule ID | Classification |
|---|---------|---------------|
| 1 | R001 | Implemented |
| 2 | R002 | Implemented |
| 3 | R003 | Implemented |
| 4 | R004 | Implemented |
| 5 | R005 | Implemented |
| 6 | R006 | Implemented |
| 7 | R007 | Partial |
| 8 | R008 | Partial |
| 9 | R009 | Out of Scope |
| 10 | R010 | Partial |
| 11 | R011 | Missing |
| 12 | R012 | Partial |
| 13 | R013 | Missing |
| 14 | R014 | Implemented |
| 15 | R015 | Implemented |
| 16 | R016 | Out of Scope |
| 17 | R017 | Implemented-Unreachable |
| 18 | R018 | Implemented-Unreachable |
| 19 | R019 | Implemented |
| 20 | R020 | Partial |
| 21 | R021 | Implemented-Unreachable |
| 22 | R022 | Missing |
| 23 | R023 | Implemented |
| 24 | R024 | Out of Scope |
| 25 | R025 | Missing |
| 26 | R026 | Subsystem-Missing |
| 27 | R027 | Subsystem-Missing |
| 28 | R028 | Subsystem-Missing |
| 29 | R029 | Subsystem-Missing |
| 30 | R030 | Implemented |
| 31 | R031 | Implemented |
| 32 | R032 | Out of Scope |
| 33 | R033 | Missing |
| 34 | R034 | Partial |
| 35 | R035 | Missing |
| 36 | R036 | Implemented |
| 37 | R037 | Subsystem-Missing |
| 38 | R038 | Implemented |
| 39 | R039 | Implemented |
| 40 | R040 | Implemented |
| 41 | R041 | Implemented |
| 42 | R042 | Implemented |
| 43 | R043 | Missing |
| 44 | R044 | Implemented |
| 45 | R045 | Out of Scope |
| 46 | R046 | Out of Scope |
| 47 | R047 | Implemented |
| 48 | R048 | Partial |
| 49 | R049 | Missing |
| 50 | R050 | Implemented |
| 51 | R051 | Out of Scope |
| 52 | R052 | Partial |
| 53 | R053 | Partial |
| 54 | R054 | Missing |
| 55 | R055 | Missing |
| 56 | R056 | Missing |
| 57 | R057 | Implemented |
| 58 | R058 | Implemented |
| 59 | R059 | Partial |
| 60 | R060 | Implemented |
| 61 | R061 | Missing |
| 62 | R062 | Partial |
| 63 | R063 | Implemented |
| 64 | R064 | Missing |
| 65 | R065 | Missing |
| 66 | R066 | Implemented |
| 67 | R067 | Implemented |
| 68 | R068 | Implemented |
| 69 | R069 | Implemented |
| 70 | R070 | Implemented |
| 71 | R071 | Missing |
| 72 | R072 | Implemented |
| 73 | R073 | Implemented |
| 74 | R074 | Implemented |
| 75 | R075 | Implemented |
| 76 | R076 | Implemented |
| 77 | R077 | Implemented |
| 78 | R078 | Implemented |
| 79 | R079 | Implemented |
| 80 | R080 | Implemented |
| 81 | R081 | Implemented |
| 82 | R082 | Implemented |
| 83 | R083 | Implemented |
| 84 | R084 | Implemented |
| 85 | R085 | Implemented |
| 86 | R086 | Implemented |
| 87 | R087 | Implemented |
| 88 | R088 | Implemented |
| 89 | R089 | Implemented |
| 90 | R090 | Implemented |
| 91 | R091 | Implemented |
| 92 | R092 | Partial |
| 93 | R093 | Implemented |
| 94 | R094 | Implemented |
| 95 | R095 | Implemented |
| 96 | R096 | Implemented |
| 97 | R097 | Partial |
| 98 | R098 | Implemented |
| 99 | R099 | Implemented |
| 100 | R100 | Missing |
| 101 | R101 | Missing |
| 102 | R102 | Out of Scope |
| 103 | R103 | Partial |
| 104 | R104 | Partial |
| 105 | R105 | Partial |
| 106 | R106 | Partial |
| 107 | R107 | Implemented |
| 108 | R108 | Partial |
| 109 | R109 | Implemented |
| 110 | R110 | Missing |
| 111 | R111 | Missing |
| 112 | R112 | Partial |
| 113 | R113 | Partial |
| 114 | R114 | Partial |
| 115 | R115 | Partial |
| 116 | R116 | Partial |
| 117 | R117 | Partial |
| 118 | R118 | Partial |
| 119 | R119 | Partial |
| 120 | R120 | Partial |
| 121 | R121 | Partial |
| 122 | R122 | Out of Scope |
| 123 | R123 | Partial |
| 124 | R124 | Implemented |
| 125 | R125 | Missing |
| 126 | R126 | Implemented |
| 127 | R127 | Implemented |
| 128 | R128 | Implemented |
| 129 | R129 | Implemented |
| 130 | R130 | Implemented |
| 131 | R131 | Implemented |
| 132 | R132 | Implemented |
| 133 | R133 | Implemented |
| 134 | R134 | Implemented |
| 135 | R135 | Implemented |
| 136 | R136 | Implemented |
| 137 | R137 | Implemented |
| 138 | R138 | Implemented |
| 139 | R139 | Implemented |
| 140 | R140 | Implemented |
| 141 | R141 | Implemented |
| 142 | R142 | Implemented |
| 143 | R143 | Implemented-Unreachable |
| 144 | R144 | Implemented |
| 145 | R145 | Implemented |
| 146 | R146 | Implemented |
| 147 | R147 | Implemented |
| 148 | R148 | Implemented |
| 149 | R149 | Implemented |
| 150 | R150 | Implemented |
| 151 | R151 | Implemented |
| 152 | R152 | Implemented |
| 153 | R153 | Partial |
| 154 | R154 | Out of Scope |
| 155 | R155 | Out of Scope |
| 156 | R156 | Partial |
| 157 | R157 | Implemented-Unreachable |
| 158 | R158 | Implemented-Unreachable |
| 159 | R159 | Partial |
| 160 | R160 | Partial |
| 161 | R161 | Out of Scope |
| 162 | R162 | Out of Scope |
| 163 | R163 | Implemented |
| 164 | R164 | Implemented-Unreachable |
| 165 | R165 | Out of Scope |
| 166 | R166 | Out of Scope |
| 167 | R167 | Subsystem-Missing |
| 168 | R168 | Subsystem-Missing |
| 169 | R169 | Subsystem-Missing |
| 170 | R170 | Subsystem-Missing |
| 171 | R171 | Subsystem-Missing |
| 172 | R172 | Subsystem-Missing |
| 173 | R173 | Subsystem-Missing |
| 174 | R174 | Implemented |
| 175 | R175 | Missing |
| 176 | R176 | Subsystem-Missing |
| 177 | R177 | Subsystem-Missing |
| 178 | R178 | Subsystem-Missing |
| 179 | R179 | Subsystem-Missing |
| 180 | R180 | Missing |
| 181 | R181 | Out of Scope |
| 182 | R182 | Out of Scope |
| 183 | R183 | Out of Scope |
| 184 | R184 | Subsystem-Missing |
| 185 | R185 | Out of Scope |
| 186 | R186 | Out of Scope |
| 187 | R187 | Out of Scope |
| 188 | R188 | Implemented |
| 189 | R189 | Implemented |
| 190 | R190 | Implemented |
| 191 | R191 | Implemented-Unreachable |
| 192 | R192 | Implemented |
| 193 | R193 | Implemented |
| 194 | R194 | Implemented |
| 195 | R195 | Missing |
| 196 | R196 | Missing |
| 197 | R197 | Partial |
| 198 | R198 | Out of Scope |
| 199 | R199 | Subsystem-Missing |
| 200 | R200 | Partial |
| 201 | R201 | Out of Scope |
| 202 | R202 | Partial |
| 203 | R203 | Partial |
| 204 | R204 | Implemented |
| 205 | R205 | Implemented |
| 206 | R206 | Implemented |
| 207 | R207 | Partial |

---

## Final Verified Counts

| Classification | Count |
|---------------|-------|
| **Implemented** | 96 |
| **Implemented-Unreachable** | 11 |
| **Partial** | 35 |
| **Missing** | 24 |
| **Subsystem-Missing** | 18 |
| **Out of Scope** | 23 |
| **Total** | **207** |

## Final Coverage Score

```
Coverage = (Implemented + 0.5 * Partial + 0.5 * Implemented-Unreachable) / (Total - OutOfScope) * 100
         = (96 + 0.5 * 35 + 0.5 * 11) / (207 - 23) * 100
         = (96 + 17.5 + 5.5) / 184 * 100
         = 119 / 184 * 100
         = 64.7%
```

**Coverage Score: 64.7%**

| Metric | Value |
|--------|-------|
| Total rules | 207 |
| In scope | 184 |
| Implemented | 96 (52.2%) |
| Implemented-Unreachable | 11 (6.0%) |
| Partial | 35 (19.0%) |
| Missing | 24 (13.0%) |
| Subsystem-Missing | 18 (9.8%) |
| Out of Scope | 23 |
| **Coverage Score** | **64.7%** |
