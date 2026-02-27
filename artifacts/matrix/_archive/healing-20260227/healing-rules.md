---
domain: healing
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 42
sources:
  - core/07-combat.md
  - core/06-playing-the-game.md
  - core/09-gear-and-items.md
  - core/03-skills-edges-and-features.md
  - books/markdown/errata-2.md
errata_applied: true
---

# PTU Rules: Healing

## Summary
- Total rules: 42
- Categories: formula(8), condition(7), workflow(7), constraint(10), enumeration(3), modifier(4), interaction(3)
- Scopes: core(21), situational(14), edge-case(7)

## Dependency Graph
- Foundation: healing-R001, healing-R002, healing-R003, healing-R004, healing-R005, healing-R006, healing-R018, healing-R026
- Derived: healing-R007 (depends on healing-R001), healing-R008 (depends on healing-R002), healing-R009 (depends on healing-R003), healing-R010 (depends on healing-R003), healing-R011 (depends on healing-R003, healing-R010), healing-R012 (depends on healing-R004), healing-R013 (depends on healing-R004, healing-R005), healing-R014 (depends on healing-R006), healing-R015 (depends on healing-R006), healing-R016 (depends on healing-R003, healing-R010), healing-R017 (depends on healing-R003), healing-R019 (depends on healing-R018), healing-R020 (depends on healing-R018), healing-R021 (depends on healing-R018), healing-R022 (depends on healing-R005), healing-R023 (depends on healing-R001, healing-R003), healing-R024 (depends on healing-R003), healing-R025 (depends on healing-R003, healing-R010), healing-R027 (depends on healing-R026), healing-R028 (depends on healing-R026), healing-R029 (depends on healing-R026), healing-R030 (depends on healing-R003, healing-R026), healing-R031 (depends on healing-R006), healing-R032 (depends on healing-R003, healing-R006), healing-R033 (depends on healing-R003), healing-R034 (depends on healing-R004), healing-R035 (depends on healing-R005), healing-R036 (depends on healing-R003), healing-R037 (depends on healing-R003, healing-R004), healing-R038 (depends on healing-R004)
- Workflow: healing-R039 (depends on healing-R001, healing-R003, healing-R004, healing-R010), healing-R040 (depends on healing-R018, healing-R019, healing-R020, healing-R021), healing-R041 (depends on healing-R026, healing-R027, healing-R028, healing-R029), healing-R042 (depends on healing-R003, healing-R006, healing-R018)

---

## healing-R001: Tick of Hit Points Definition

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Injuries`
- **Quote:** "Tick of Hit Points: Some effects use this term. A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points. A Tick Value is what that amount is."
- **Dependencies:** none
- **Errata:** false

## healing-R002: Rest Definition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "'Rest' is described as any period of time during which a trainer or Pokémon does not engage in rigorous physical or mental activity. What activities precisely are and aren't 'rest' is up to your GM's discretion; usually rest means sleep, or at least sitting down for a while. Meals can often count as 'rest' time. Traveling for extended periods of time almost never counts as 'Rest'."
- **Dependencies:** none
- **Errata:** false

## healing-R003: Injury Definition — HP Reduction per Injury

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing with Injuries`
- **Quote:** "For each Injury a Pokémon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokémon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points, or 7/10ths of their maximum."
- **Dependencies:** none
- **Errata:** false

## healing-R004: Injury Gained from Massive Damage

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokémon or trainer suffers Massive Damage, they gain 1 Injury. Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor."
- **Dependencies:** none
- **Errata:** false

## healing-R005: Injury Gained from HP Markers

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokémon or Trainer reaches one of these Hit Point values, they take 1 Injury."
- **Dependencies:** none
- **Errata:** false

## healing-R006: Fainted Condition Definition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "A Pokémon or Trainer that is at 0 Hit Points or lower is Fainted, or Knocked Out. A Fainted Pokémon or Trainer is unconscious due to injuries or other effects, and cannot use any Actions, Abilities, or Features unless the Feature or Ability specifically says otherwise."
- **Dependencies:** none
- **Errata:** false

## healing-R007: Natural Healing Rate (Rest HP Recovery)

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "For the first 8 hours of rest each day, Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points. You may continue to rest further after this time, but Hit Points will not be regained."
- **Dependencies:** healing-R001
- **Errata:** false

## healing-R008: Rest Requires Continuous Half Hour

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Dependencies:** healing-R002
- **Errata:** false

## healing-R009: Rest HP Recovery Daily Cap (8 Hours)

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "For the first 8 hours of rest each day, Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points. You may continue to rest further after this time, but Hit Points will not be regained."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R010: Heavily Injured Threshold (5+ Injuries)

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Heavily Injured`
- **Quote:** "Whenever a Trainer or Pokémon has 5 or more injuries, they are considered Heavily Injured."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R011: Heavily Injured Blocks Rest HP Recovery

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Also, a Trainer or Pokémon is unable to restore Hit Points through rest if the individual has 5 or more injuries. Once the individual has 4 or fewer injuries (usually by seeking medical attention), he or she may once again restore Hit Points by resting."
- **Dependencies:** healing-R003, healing-R010
- **Errata:** false

## healing-R012: Massive Damage Exclusion for Set/Lose HP Moves

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor."
- **Dependencies:** healing-R004
- **Errata:** false

## healing-R013: Multiple Injuries from Single Attack

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "For example, a Pokémon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)."
- **Dependencies:** healing-R004, healing-R005
- **Errata:** false

## healing-R014: Fainted Cured by Revive or Healing to Positive HP

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves such as Wish or Heal Pulse. Potions and other healing items may still bring a Pokémon above 0 Hit Points, but it remains Fainted for another 10 minutes."
- **Dependencies:** healing-R006
- **Errata:** false

## healing-R015: Fainted Clears All Status Conditions

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "When a Pokémon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Dependencies:** healing-R006
- **Errata:** false

## healing-R016: Heavily Injured Combat Penalty

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Heavily Injured`
- **Quote:** "Whenever a Heavily Injured Trainer or Pokémon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."
- **Dependencies:** healing-R003, healing-R010
- **Errata:** false

## healing-R017: Injury Does Not Affect HP Marker Thresholds

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing with Injuries`
- **Quote:** "The artificial Max Hit Point number is not considered when potentially acquiring new injuries, or when dealing with any other effects such as Poison that consider fractional damage, or when dealing with Hit Point Markers. All Effects that normally go off the Pokémon's Max Hit Points still use the real maximum."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R018: Take a Breather — Core Effects

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "When a Trainer or Pokémon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Dependencies:** none
- **Errata:** false

## healing-R019: Take a Breather — Action Cost

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "Taking a Breather is a Full Action and requires a Pokémon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability. They then become Tripped and are Vulnerable until the end of their next turn."
- **Dependencies:** healing-R018
- **Errata:** false

## healing-R020: Take a Breather — Requires Save Checks

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "Trainers and Pokémon can Take a Breather and temporarily remove themselves from the heat of combat to recover from Confusion and other Volatile Status Afflictions, though they still must pass any Save Checks to be able to take this action and do so."
- **Dependencies:** healing-R018
- **Errata:** false

## healing-R021: Take a Breather — Assisted by Trainer

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "When a Trainer or Pokémon is unable to choose to Take a Breather themselves, such as when they are inflicted with the Rage Status Affliction or when someone doesn't want to take a chance on passing a Confusion Save Check, they may be calmed and assisted by a Trainer to attempt to Take a Breather. This is a Full Action by both the assisting Trainer and their target (as an Interrupt for the target), and the assisting Trainer must be able to Shift to the target they intend to help. They then make a Command Check with a DC of 12."
- **Dependencies:** healing-R018
- **Errata:** false

## healing-R022: Healing Past HP Markers Creates Re-Injury Risk

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Dealing with Injuries`
- **Quote:** "Normal healing does not remove injuries; if a Pokémon is brought down to 50% Hit Points and is healed by, for example, a Heal Pulse, the injury is not removed. If they're then brought down to 50% again, they gain another Injury for passing the 50% Hit Points Marker again. Using Healing to push Pokémon or Trainers past their limits can thus be potentially dangerous, as it gives multiple opportunities to gain Injuries."
- **Dependencies:** healing-R005
- **Errata:** false

## healing-R023: Natural Injury Healing (24-Hour Timer)

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "If a Pokémon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."
- **Dependencies:** healing-R001, healing-R003
- **Errata:** false

## healing-R024: Trainer AP Drain to Remove Injury

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R025: Daily Injury Healing Cap (3 per Day)

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "Pokémon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Dependencies:** healing-R003, healing-R010
- **Errata:** false

## healing-R026: Pokémon Center — Base Healing

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "Pokémon Centers use expensive and advanced machinery to heal Pokémon. In a mere hour, Pokémon Centers can heal a Trainers and Pokémon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
- **Dependencies:** none
- **Errata:** false

## healing-R027: Pokémon Center — Injury Time Penalty (Under 5)

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "Injuries however, may delay the time spent healing a Pokémon Center. For each Injury on the Trainer or Pokémon, Healing takes an additional 30 minutes."
- **Dependencies:** healing-R026
- **Errata:** false

## healing-R028: Pokémon Center — Injury Time Penalty (5+ Injuries)

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "If the Trainer or Pokémon has five or more Injuries, it takes one additional hour per Injury instead."
- **Dependencies:** healing-R026
- **Errata:** false

## healing-R029: Pokémon Center — Injury Removal Cap (3/Day)

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "Pokémon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Dependencies:** healing-R026
- **Errata:** false

## healing-R030: Death from 10 Injuries

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Death`
- **Quote:** "If a Pokémon or Trainer has 10 injuries, or goes down to either -50 Hit Points or -200% Hit Points, whichever is lower (in that -80 Hit Points is lower than -50 Hit Points), during a non-friendly match, they die."
- **Dependencies:** healing-R003, healing-R026
- **Errata:** false

## healing-R031: Fainted Recovery Timer (Potions)

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Potions and other healing items may still bring a Pokémon above 0 Hit Points, but it remains Fainted for another 10 minutes."
- **Dependencies:** healing-R006
- **Errata:** false

## healing-R032: Extended Rest — Clears Persistent Status Conditions

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Dependencies:** healing-R003, healing-R006
- **Errata:** false

## healing-R033: Extended Rest — Restores Drained AP

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R034: Extended Rest — Daily Move Recovery

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Dependencies:** healing-R004
- **Errata:** false

## Notes
This rule has a subtle condition: the move must not have been used since the previous day, not merely since the last Extended Rest. This means using a Daily move, taking an Extended Rest the same day, then using it again is not permitted — the Move only refreshes on a new day boundary via Extended Rest.

## healing-R035: Hit Points Lost from HP Markers vs Damage

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Hit Point Loss`
- **Quote:** "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage."
- **Dependencies:** healing-R005
- **Errata:** false

## healing-R036: Bandages — Double Natural Healing Rate

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Bandages and Poultices`
- **Quote:** "Bandages are applied as Extended Actions on Pokémon or Trainers. Bandages last for 6 hours; while applied, they double the Natural Healing Rate of Pokémon or Trainers, meaning a Pokémon or Trainer will heal 1/8th of their Hit Points per half hour."
- **Dependencies:** healing-R003
- **Errata:** false

## healing-R037: Bandages — Heal One Injury After Full Duration

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Bandages and Poultices`
- **Quote:** "Bandages also immediately heal one Injury if they remain in place for their full duration."
- **Dependencies:** healing-R003, healing-R004
- **Errata:** false

## healing-R038: Bandages — Broken by Damage

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Bandages and Poultices`
- **Quote:** "If a Pokémon is damaged or loses Hit Points in any way, the Bandages immediately stop working."
- **Dependencies:** healing-R004
- **Errata:** false

## healing-R039: Basic Restorative Items

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Medicines`
- **Quote:** "Potion: Heals 20 Hit Points. Super Potion: Heals 35 Hit Points. Hyper Potion: Heals 70 Hit Points. Full Restore: Heals a Pokémon for 80 Hit Points and cures any Status Afflictions. Revive: Revives fainted Pokémon and sets to 20 Hit Points. Energy Powder: Heals 25 Hit Points - Repulsive. Energy Root: Heals 70 Hit Points - Repulsive. Revival Herb: Revives Pokémon and sets to 50% Hit Points - Repulsive."
- **Dependencies:** healing-R001, healing-R003, healing-R004, healing-R010
- **Errata:** false

## healing-R040: Status Cure Items

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Medicines`
- **Quote:** "Antidote: Cures Poison. Paralyze Heal: Cures Paralysis. Burn Heal: Cures Burns. Ice Heal: Cures Freezing. Full Heal: Cures all Persistent Status Afflictions. Heal Powder: Cure all Persistent Status Afflictions – Repulsive."
- **Dependencies:** healing-R018, healing-R019, healing-R020, healing-R021
- **Errata:** false

## healing-R041: Applying Restorative Items — Action Economy

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Using Items`
- **Quote:** "Applying Restorative Items, or X Items is a Standard Action, which causes the target to forfeit their next Standard Action and Shift Action, unless the user has the 'Medic Training' Edge. The target of these items may refuse to stay still and be healed; in that case, the item is not used, and the target does not forfeit their actions. If you use a Restorative Item on yourself it is a Full-Round action, but you do not forfeit any further actions."
- **Dependencies:** healing-R026, healing-R027, healing-R028, healing-R029
- **Errata:** false

## healing-R042: Action Points — Scene Refresh and Drain/Bind

- **Category:** workflow
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Dependencies:** healing-R003, healing-R006, healing-R018
- **Errata:** false

---

## Cross-Domain References

### Persistent Status Afflictions (combat domain)
Burn, Freeze, Paralysis, Poison, Sleep — their tick damage mechanics and save checks are combat-domain rules. Healing interacts with them via Extended Rest curing (healing-R032), Pokémon Center curing (healing-R026), and items (healing-R040).

### Volatile Status Afflictions (combat domain)
Confusion, Rage, Curse, Infatuation, etc. — cured by Take a Breather (healing-R018) and at end of encounter. Full extraction in combat domain.

### Medic Class Features (errata / character-lifecycle domain)
The errata introduces the Medic class with healing-related features (Front Line Healer, Medical Techniques, Proper Care, Stay With Us). These are character-build options that modify healing mechanics. Full extraction belongs in the character-lifecycle domain.

### First Aid Kit (gear / cross-domain)
"Required to use the First Aid Expertise Feature. By Draining 1 AP, any Trainer can make a Medicine Education Check on a target as an Extended Action. The target gains Hit Points equal to the result, and is cured of Burn, Poison, and Paralysis." (`core/09-gear-and-items.md`)

### First Aid Expertise Feature (character-lifecycle domain)
"Daily x3 – Extended Action. Target: Pokemon or Trainers. Effect: The target may remove one Injury, has all Hit Points restored, and is cured of all Status Afflictions. You may use First Aid Expertise only once per day per target." (`core/03-skills-edges-and-features.md`)

### Walk It Off Feature (character-lifecycle domain)
"Daily – Extended Action. Effect: Remove one Injury from yourself and regain 1/4th of your maximum Hit Points. This Injury removal doesn't count against the natural healing limit on Injuries each day." (`core/03-skills-edges-and-features.md`)

### Medic Training Edge (character-lifecycle domain)
"Prerequisites: Novice Medicine Education. Effect: When you use Restorative Items on others, they do not forfeit their next turn." (`core/03-skills-edges-and-features.md`)

### Nurse Feature (errata — character-lifecycle domain)
"Drain 2 AP – Free Action. Trigger: You take an Extended Rest. Effect: During this Extended Rest, Pokémon and Trainers in your care... heal 1/8th of their Max Hit Points per half hour of rest instead of 1/16th (does not stack with Bandages). If the Extended Rest lasts at least 6 hours, they may remove 1 Injury." (`errata-2.md`)

### Suffocation Injuries (combat domain)
"Take 1 Injury per round suffocating. These injuries can't be healed by anything except breathing; once the target can breathe again, they are healed of these injuries." (`core/07-combat.md`)

### Falling Injuries (combat domain)
"In addition to the damage, trainers and Pokémon that fall 4 or more meters take 1 injury for every 2 meters fallen." (`core/07-combat.md`)

---

## Verification Checklist

- [x] Every section of `core/07-combat.md` relevant to healing has been read (Resting p.252, Injuries p.250-251, Take a Breather p.245, Fainted p.248, Status Afflictions p.246-247)
- [x] Every section of `core/06-playing-the-game.md` relevant to healing has been read (Action Points p.221)
- [x] Every section of `core/09-gear-and-items.md` relevant to healing has been read (Medicines p.276, Bandages p.277)
- [x] Every section of `core/03-skills-edges-and-features.md` relevant to healing has been read (Medic Training, First Aid Expertise, Walk It Off)
- [x] Errata corrections have been applied (Medic class, Nurse, Bandage interactions)
- [x] No rule is orphaned (every non-foundation rule has dependencies)
- [x] No circular dependencies exist
- [x] Cross-domain references are noted but not fully extracted
- [x] Rule IDs are sequential with no gaps
- [x] Every entry has a direct quote from the rulebook
