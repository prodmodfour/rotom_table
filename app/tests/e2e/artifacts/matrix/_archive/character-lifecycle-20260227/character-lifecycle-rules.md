---
domain: character-lifecycle
extracted_at: 2026-02-19T12:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 68
sources:
  - core/02-character-creation.md
  - core/03-skills-edges-and-features.md
  - core/06-playing-the-game.md
  - core/11-running-the-game.md
  - errata-2.md
errata_applied: true
---

# PTU Rules: Character Lifecycle

## Summary
- Total rules: 68
- Categories: formula(14), condition(5), workflow(10), constraint(18), enumeration(8), modifier(8), interaction(5)
- Scopes: core(38), situational(22), edge-case(8)

## Dependency Graph
- Foundation: R001, R002, R003, R004, R005, R006, R007, R015, R016, R022, R055
- Derived: R008 (R001), R009 (R001), R010 (R001), R011 (R001), R012 (R001, R003), R013 (R001, R003), R014 (R001, R003), R017 (R016), R018 (R016), R019 (R016), R020 (R016), R023 (R022), R024 (R022), R025 (R022, R023), R026 (R022), R027 (R004), R028 (R004), R029 (R004, R005), R030 (R001), R031 (R030), R032 (R030), R033 (R030), R034 (R030), R035 (R030), R036 (R001, R030), R037 (R036), R038 (R036), R039 (R036), R040 (R036), R041 (R006), R042 (R006), R043 (R006), R044 (R001, R022, R030), R045 (R044), R046 (R044), R047 (R044), R048 (R044), R049 (R044), R050 (R044), R056 (R055), R057 (R055), R058 (R055, R056)
- Workflow: R051 (R001-R007), R052 (R044), R053 (R044, R030, R022), R054 (R044), R059 (R055, R056, R057), R060 (R055), R061 (R055, R016), R062 (R055, R022, R030, R044), R063 (R041, R042), R064 (R016, R003), R065 (R001, R016, R003), R066 (R016, R001), R067 (R055, R056, R001), R068 (R055, R030, R022, R044)

---

## character-lifecycle-R001: Trainer Combat Stats Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 5: Assign Combat Stats`
- **Quote:** "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R002: Starting Stat Baseline

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 5: Assign Combat Stats`
- **Quote:** "Level 1 Trainers begin with 10 HP and 5 in each of their other Stats. You then assign 10 points as you wish among the Stats, putting no more than 5 points in any single Stat."
- **Dependencies:** R001
- **Errata:** false

## character-lifecycle-R003: Skill Categories

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skills`
- **Quote:** "The Body Skills are Acrobatics, Athletics, Combat, Intimidate, Stealth, and Survival. The Mind Skills are General Education, Medicine Education, Occult Education, Pokémon Education, Technology Education, Guile, and Perception. The Spirit Skills are Charm, Command, Focus, and Intuition."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R004: Skill Ranks and Dice

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skills`
- **Quote:** "There are 6 Ranks of Skills. Each Rank causes you to roll a different number of dice when using Skills." Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6.
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R005: Skill Rank Level Prerequisites

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skills`
- **Quote:** "There are Level prerequisites for progressing Skill Ranks beyond Novice. Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12."
- **Dependencies:** R004
- **Errata:** false

## character-lifecycle-R006: Skills Default Rank

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skills`
- **Quote:** "Skills begin at Untrained unless modified by a Background."
- **Dependencies:** R004
- **Errata:** false

## character-lifecycle-R007: Background Skill Modification

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 2: Create Background`
- **Quote:** "Simply choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic. These Pathetic Skills cannot be raised above Pathetic during character creation."
- **Dependencies:** R004, R006
- **Errata:** false

## character-lifecycle-R008: Trainer HP Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Dependencies:** R001
- **Errata:** false

## character-lifecycle-R009: Physical Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 5: Assign Combat Stats`
- **Quote:** "for every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense."
- **Dependencies:** R001
- **Errata:** false

## character-lifecycle-R010: Special Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 5: Assign Combat Stats`
- **Quote:** "for every 5 points a Pokémon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense."
- **Dependencies:** R001
- **Errata:** false

## character-lifecycle-R011: Speed Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 5: Assign Combat Stats`
- **Quote:** "for every 5 points a Pokémon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed."
- **Dependencies:** R001
- **Errata:** false

## character-lifecycle-R012: Evasion General Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "To calculate these Evasion values, divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone."
- **Dependencies:** R001, R003
- **Errata:** false

## character-lifecycle-R013: Power Capability

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "A Trainer's Power starts at 4 but is changed by several factors. If your Athletics Skills is at Novice Rank or higher, increase Power by +1. If your Combat Skill is at Adept Rank or higher, increase Power by +1"
- **Dependencies:** R001, R003
- **Errata:** false

## character-lifecycle-R014: High Jump Capability

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "A Trainer's High Jump starts at 0, but is raised by several factors. If your Acrobatics is Adept, raise High Jump by +1. If your Acrobatics is Master, raise High Jump by an additional +1. If you have a running start when jumping, raise High Jump by +1."
- **Dependencies:** R001, R003
- **Errata:** false

## character-lifecycle-R015: Long Jump Capability

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Long Jump is how much horizontal distance a Trainer or Pokémon can jump in meters. This value for Trainers is equal to half of their Acrobatics Rank."
- **Dependencies:** R003
- **Errata:** false

## character-lifecycle-R016: Overland Movement Speed

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Overland Movement Speed is how quickly a Trainer or Pokémon can move over flat land. For Trainers, this value is equal to three plus half the sum of their Athletics and Acrobatics Ranks. By default, this value is 5. Overland = 3 + [(Athl + Acro)/2]"
- **Dependencies:** R003
- **Errata:** false

## character-lifecycle-R017: Swimming Speed

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Swimming Speed for a Trainer is equal to half of their Overland Speed."
- **Dependencies:** R016
- **Errata:** false

## character-lifecycle-R018: Throwing Range

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Throwing Range is how far a Trainer can throw Poké Balls and other items. It's equal to 4 plus Athletics Rank."
- **Dependencies:** R003
- **Errata:** false

## character-lifecycle-R019: Trainer Size

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "Size is how big you are. Trainers are Medium by default."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R020: Weight Class

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R021: Rounding Rule

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#System Fundamentals`
- **Quote:** "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher. 3.9999 would still round down to 3."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R022: Starting Edges

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 3: Choose Edges`
- **Quote:** "Starting Trainers begin with four Edges to distribute as they see fit."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R023: Starting Skill Cap

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 3: Choose Edges`
- **Quote:** "Keep in mind you cannot raise Skills above Novice at your starting level!"
- **Dependencies:** R022
- **Errata:** false

## character-lifecycle-R024: Pathetic Skills Cannot Be Raised At Creation

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 3: Choose Edges`
- **Quote:** "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **Dependencies:** R022, R007
- **Errata:** false

## character-lifecycle-R025: Skill Edge Definitions

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skill Edges`
- **Quote:** "Basic Skills: You Rank Up a Skill from Pathetic to Untrained, or Untrained to Novice. Adept Skills [Level 2]: You Rank Up a Skill from Novice to Adept. Expert Skills [Level 6]: You Rank Up a Skill from Adept to Expert. Master Skills [Level 12]: You Rank Up a Skill from Expert to Master."
- **Dependencies:** R022, R005
- **Errata:** false

## character-lifecycle-R026: Edges Per Level

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Edges`
- **Quote:** "You gain 4 Edges during character creation, another at every even Level, and additional Edges with restricted uses at every Level at which your maximum Skill Rank increases."
- **Dependencies:** R022
- **Errata:** false

## character-lifecycle-R027: Skill Check Mechanic

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Taking Action`
- **Quote:** "Making a Skill Check is easy. Simply roll a number of d6s equal to your Rank in the appropriate Skill and then add your modifiers from equipment and other bonuses. If you meet or exceed the GM's set Difficulty Check, or DC, for the task, then you succeed."
- **Dependencies:** R004
- **Errata:** false

## character-lifecycle-R028: Opposed Check Mechanic

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Opposed Checks`
- **Quote:** "both you and your opponent make Skill Rolls and compare the results... Whoever rolls higher wins the Opposed Check. On a tie, the defender wins."
- **Dependencies:** R004
- **Errata:** false

## character-lifecycle-R029: Extended Skill Check

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Extended Skill Checks`
- **Quote:** "The DC for the task is set as usual and then given a multiplier from 2 to 5 based on how long and complex the task is... they must reach the Extended DC within a number of Skill Checks equal to half their Rank in the Skill being tested."
- **Dependencies:** R004, R005
- **Errata:** false

## character-lifecycle-R030: Starting Features

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 4: Choose Features`
- **Quote:** "Starting Trainers begin with four Features to distribute as they see fit. They also choose one Training Feature to gain, regardless of prerequisites."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R031: Free Training Feature

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Step 4: Choose Features`
- **Quote:** "You gain four Features to distribute and additionally pick one Training Feature for free. You do not need to meet prerequisites for the Training Feature you chose."
- **Dependencies:** R030
- **Errata:** false

## character-lifecycle-R032: Max Class Features

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Feature Tags`
- **Quote:** "[Class] – ...These Features are the beginnings of a chain of many other Features. A Trainer may only have a maximum of 4 Class Features."
- **Dependencies:** R030
- **Errata:** false

## character-lifecycle-R033: Stat Tag Effect

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/03-skills-edges-and-features.md#Feature Tags`
- **Quote:** "[+Stat] – Features with this tag increase a Stat by one point; for example, a Feature might read as [+Attack]. This Tag is usually found on Features related to Combat or in Combat-related Classes."
- **Dependencies:** R030, R001
- **Errata:** false

## character-lifecycle-R034: Ranked Feature Tag

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/03-skills-edges-and-features.md#Feature Tags`
- **Quote:** "[Ranked X] – A Feature with the Ranked Tag can be taken up to X Times. Each time you take a new rank, follow the directions in the listed effect. Latter Ranks by default always require any previous ranks."
- **Dependencies:** R030
- **Errata:** false

## character-lifecycle-R035: Branch Feature Tag

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/03-skills-edges-and-features.md#Feature Tags`
- **Quote:** "[Branch] – If on a [Class] Feature, this tag means that Feature may be taken multiple times using a Class slot and choosing a different specialization each time."
- **Dependencies:** R030, R032
- **Errata:** false

## character-lifecycle-R036: Features Per Level

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Every odd Level you gain a Feature."
- **Dependencies:** R030
- **Errata:** false

## character-lifecycle-R037: No Duplicate Features

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Note: Unless a Feature or Edge EXPLICITLY says that you may take it multiple times, such as a Ranked Feature, then you can only take it once!"
- **Dependencies:** R036
- **Errata:** false

## character-lifecycle-R038: Stat Points Per Level

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Every Level you gain a Stat Point. Trainers don't follow Base Relations, so feel free to spend these freely."
- **Dependencies:** R036, R001
- **Errata:** false

## character-lifecycle-R039: Edges Per Level (Advancement)

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Every even Level you gain an Edge."
- **Dependencies:** R036
- **Errata:** false

## character-lifecycle-R040: Max Trainer Level

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Trainers have a Maximum Level of 50."
- **Dependencies:** R036
- **Errata:** false

## character-lifecycle-R041: Action Points Pool

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points, for example."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R042: AP Refresh Per Scene

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Action Points are completely regained at the end of each Scene."
- **Dependencies:** R041
- **Errata:** false

## character-lifecycle-R043: AP Bind and Drain

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. If no means of ending the effect is specified, then the effect may be ended and AP Unbound during your turn as a Free Action. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Dependencies:** R041
- **Errata:** false

## character-lifecycle-R044: Level 2 Milestone — Adept Skills

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 2 – Adept Skills: Gain All Bonuses Below: You now qualify to Rank Up Skills to Adept. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank."
- **Dependencies:** R001, R022, R030
- **Errata:** false

## character-lifecycle-R045: Level 5 Milestone — Amateur Trainer

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 5 – Amateur Trainer: Choose One Bonus Below: On every even-numbered Level Up from Level 6 through Level 10, you gain +1 Stat Point that must be spent on Attack or Special Attack. You also gain +2 Stat Points, representing Levels 2 and 4, retroactively. [OR] Gain one General Feature for which you qualify."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R046: Level 6 Milestone — Expert Skills

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 6 – Expert Skills: Gain All Bonuses Below: You now qualify to Rank Up Skills to Expert. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Expert Rank."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R047: Level 10 Milestone — Capable Trainer

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 10 – Capable Trainer: Choose One Bonus Below: On every even-numbered Level Up from Level 12 through Level 20, you gain +1 Stat Point that must be spent on Attack or Special Attack. [OR] Gain two Edges for which you qualify."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R048: Level 12 Milestone — Master Skills

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 12 - Master Skills: Gain All Bonuses Below: You now qualify to Rank Up Skills to Master. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Master Rank."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R049: Level 20 Milestone — Veteran Trainer

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 20 – Veteran Trainer: Choose One Bonus Below: On every even-numbered Level Up from Level 22 through Level 30, you gain +1 Stat Point that must be spent on Attack or Special Attack. [OR] Gain two Edges for which you qualify."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R050: Level 30/40 Milestones — Elite/Champion

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/02-character-creation.md#Character Advancement`
- **Quote:** "Level 30 – Elite Trainer: Choose One Bonus Below: +1 Stat Point on ATK/SpATK per even level 32-40 [OR] two Edges [OR] one General Feature. Level 40 – Champion: Choose One Bonus Below: +1 Stat Point on ATK/SpATK per even level 42-50 [OR] two Edges [OR] one General Feature."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R051: Character Creation Workflow

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Character Creation Quick-Start Steps`
- **Quote:** "Step 1: Create Character Concept. Step 2: Create Skill Background. Step 3: Choose Edges. Step 4: Choose Features. Step 5: Assign Combat Stats. Step 6: Find Derived Stats. Step 7: Create Basic Descriptions. Step 8: Choose your Starter Pokémon. Step 9: Buy starting items."
- **Dependencies:** R001, R002, R003, R004, R006, R007, R022, R030
- **Errata:** false

## character-lifecycle-R052: Steps 3 and 4 Interleaving

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/02-character-creation.md#Step 4: Choose Features`
- **Quote:** "You can take Steps 3 and 4 in any order, alternating between spending Edges and Features as best suits you."
- **Dependencies:** R022, R030
- **Errata:** false

## character-lifecycle-R053: Leveling Triggers

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Trainer Levels and Milestones`
- **Quote:** "In Pokémon Tabletop United, there are two ways for Trainers to gain levels; Milestones and Experience. Milestones are the most straight forward way of leveling up. A Milestone represents meeting a significant goal."
- **Dependencies:** R044
- **Errata:** false

## character-lifecycle-R054: Experience Bank

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Trainer Levels and Milestones`
- **Quote:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level. Leveling Up through a Milestone does not affect your Experience Bank."
- **Dependencies:** R053
- **Errata:** false

## character-lifecycle-R055: Retraining Costs

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Retraining`
- **Quote:** "You may spend 2 Trainer Experience to Retrain a Feature. You may spend 1 Trainer Experience to Retrain an Edge. You may spend 1 Trainer Experience to move one Stat Point to another Stat."
- **Dependencies:** none
- **Errata:** false

## character-lifecycle-R056: Retraining Prerequisite Lock

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Retraining`
- **Quote:** "You cannot Retrain an Edge or Feature that serves as a Prerequisite for another Edge or Feature you have. This includes Edges that raise skill ranks to the appropriate amount."
- **Dependencies:** R055
- **Errata:** false

## character-lifecycle-R057: Retraining Permanent Effect Lock

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/02-character-creation.md#Retraining`
- **Quote:** "You cannot Retrain Edges or Features that induce permanent effects if you have already used them; if you have used Move Tutor or Type Shift, for example, you cannot retrain those Features."
- **Dependencies:** R055
- **Errata:** false

## character-lifecycle-R058: Retraining Experience Requirement

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/02-character-creation.md#Retraining`
- **Quote:** "You must have the appropriate amount of Trainer Experience to spend; you cannot 'go back' a level to do so."
- **Dependencies:** R055, R054
- **Errata:** false

## character-lifecycle-R059: Retraining Timing

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/02-character-creation.md#Retraining`
- **Quote:** "Retraining should be done during resting periods In-Character, and between sessions if possible."
- **Dependencies:** R055
- **Errata:** false

## character-lifecycle-R060: Experience From Pokemon

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Trainer Levels and Milestones`
- **Quote:** "There is only one automatic source of experience: Pokémon. Whenever a Trainer catches, hatches, or evolves a Pokémon species they did not previously own, they gain +1 Experience."
- **Dependencies:** R054
- **Errata:** false

## character-lifecycle-R061: Cooperative Skill Check — Team

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Cooperative Actions`
- **Quote:** "The GMs set a DC as they would for a normal Skill Check, and then multiplies it by the number of people they would normally expect to be necessary for the task. This becomes the Team DC for the Skill Check. Each Trainer or Pokémon participating rolls their Skill, and the total sum of all the Skill Checks is compared to the Team DC."
- **Dependencies:** R004, R027
- **Errata:** false

## character-lifecycle-R062: Cooperative Skill Check — Assisted

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Cooperative Actions`
- **Quote:** "the primary actor rolls their Skill Check, adding half the Skill Rank of their helper as a bonus to the Check. The helper must have at least a Novice Rank in the Skill being tested to assist in this way."
- **Dependencies:** R004, R027
- **Errata:** false

## character-lifecycle-R063: AP Spend for Roll Bonus

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result. This cannot be done more than once per roll. This can be used to modify your Pokémon's Accuracy or Skill Checks as well as your own!"
- **Dependencies:** R041, R027
- **Errata:** false

## character-lifecycle-R064: Skill Stunt Edge

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skill Edges`
- **Quote:** "Choose a Skill you have at Novice Rank or higher. Choose a specific use of that Skill; when rolling that skill under those circumstances, you may choose to roll one less dice, and instead add +6 to the result."
- **Dependencies:** R004, R022
- **Errata:** false

## character-lifecycle-R065: Skill Enhancement Edge

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skill Edges`
- **Quote:** "Choose two different Skills. You gain a +2 bonus to each of those skills. Skill Enhancement may be taken multiple times, but the bonus may be applied only once to a particular skill."
- **Dependencies:** R004, R022
- **Errata:** false

## character-lifecycle-R066: Categoric Inclination Edge

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skill Edges`
- **Quote:** "Choose Body, Mind, or Spirit. You gain a +1 Bonus to all Skill Checks of that Category."
- **Dependencies:** R003, R022
- **Errata:** false

## character-lifecycle-R067: Virtuoso Edge

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/03-skills-edges-and-features.md#Skill Edges`
- **Quote:** "Prerequisites: A Skill at Master Rank, Level 20. Choose a Skill at Master Rank. Consider that Skill to be effectively 'Rank 8' for any Features or effects that depend on Skill Rank."
- **Dependencies:** R004, R005, R022
- **Errata:** false

## character-lifecycle-R068: Percentages Are Additive

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#System Fundamentals`
- **Quote:** "Percentages are additive, not multiplicative. For example, this means if you gain a 20% boost somewhere and a 30% somewhere else, you gain a 50% boost in total rather than gaining a 20% boost and then 30% more off of that total."
- **Dependencies:** none
- **Errata:** false

---

## Cross-Domain References

### combat-ref-001: Trainer HP Thresholds and Unconsciousness
- **Source Domain:** combat
- **PTU Ref:** `core/02-character-creation.md#Step 6: Find Derived Stats`
- **Quote:** "If a Pokémon or Trainer ever reaches 0 Hit Points, they are unable to take any actions and are unconscious."
- **Note:** Full unconsciousness/injury rules are in the combat domain (chapter 07).

### combat-ref-002: Movement Speed in Combat
- **Source Domain:** combat / vtt-grid
- **PTU Ref:** `core/06-playing-the-game.md#Movement Capabilities`
- **Quote:** "Movement Capabilities don't generally need to be tested, although the Sprint Action may be taken as a Standard Action to increase Movement Speed by 50% for a turn."
- **Note:** Full movement/shift rules in combat domain.

### capture-ref-001: Capture Mechanic Changes (Errata)
- **Source Domain:** capture
- **PTU Ref:** `errata-2.md#Capture Mechanic Changes`
- **Quote:** "A Capture Roll is now a 1d20 roll where you aim to meet or exceed a target number. If you have gained the Amateur Trainer bonus at Level 5, add +1 to this roll..."
- **Note:** Capture bonus scaling from level milestones (R045-R050) connects to capture domain. Full capture rules extracted separately.

### pokemon-lifecycle-ref-001: Starter Pokemon
- **Source Domain:** pokemon-lifecycle
- **PTU Ref:** `core/02-character-creation.md#Step 8: Choose Pokémon`
- **Quote:** "it's recommended for level 1 Trainers to begin with a single level 5 or level 10 Pokémon, chosen from either the Starter Pokémon in the video games or any relatively common species of Pokémon with three evolutionary stages."
- **Note:** Pokemon stat creation is in the pokemon-lifecycle domain.

### healing-ref-001: AP Drain and Extended Rest
- **Source Domain:** healing
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Note:** Full rest/healing rules in the healing domain.

---

## Notes

### Ambiguity: Bonus Skill Edge Restrictions at Milestone Levels
The milestone level bonuses (R044, R046, R048) grant a "Skill Edge for which you qualify" but specify it "may not be used to Rank Up a Skill to [the newly unlocked] Rank." This means at Level 2, you get a bonus Skill Edge that cannot raise a skill to Adept — it can only raise skills to Novice or below. The restriction prevents instant use of the milestone's own unlock. This is clear but may be confusing to implementors who read it as "gain a free Adept edge."

### Note: Stat Points and Base Relations
R038 explicitly states "Trainers don't follow Base Relations" for stat point allocation. This distinguishes Trainers from Pokemon, who do follow Base Relations. Trainers can freely allocate stat points to any stat without restriction.

### Note: Training Feature Duration Discrepancy
The Feature Tags page (page 58) says Training Features last "until the end of your next Extended Rest" when used as [Training] after "at least half an hour" of training. The Training Features section (page 60) says "at least an hour." This is a minor discrepancy in the training time requirement (30 min vs 1 hour). The Feature Tags page (page 58) says "half an hour" while the Training Features section (page 60) says "at least an hour."
