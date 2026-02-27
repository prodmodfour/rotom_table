---
domain: pokemon-lifecycle
extracted_at: 2026-02-19T12:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 68
sources:
  - books/markdown/core/05-pokemon.md
  - books/markdown/core/06-playing-the-game.md
  - books/markdown/core/07-combat.md
  - books/markdown/core/09-gear-and-items.md
  - books/markdown/core/11-running-the-game.md
  - books/markdown/pokedexes/how-to-read.md
  - books/markdown/errata-2.md
errata_applied: true
---

# PTU Rules: Pokemon Lifecycle

## Summary
- Total rules: 68
- Categories: formula(16), condition(8), workflow(17), constraint(12), enumeration(8), modifier(5), interaction(2)
- Scopes: core(44), situational(16), edge-case(5), cross-domain-ref(3)

## Dependency Graph

- Foundation: R001, R002, R003, R004, R005, R022, R045, R049, R060, R061
- Derived: R006 (R005), R007 (R005), R008 (R005), R009 (R003), R010 (R003, R009), R011 (R003, R009), R013 (R003), R017 (R003), R018 (R017), R022 (none), R023 (R022), R034 (R003), R046 (R045), R047 (R045), R050 (R049), R062 (R003), R064 (R003)
- Workflow: R014 (R013), R015 (R014), R019 (R017, R018), R020 (R018, R019), R021 (R019), R025 (R009, R010), R026 (R025), R027 (R025, R017), R028 (R025), R029 (R028), R030 (R028, R009, R010, R034), R031 (R028, R013), R032 (R028, R017), R033 (R028, R062, R064), R035 (R034), R036 (R022), R037 (R003, R005, R009, R010, R011, R013, R017), R038 (none), R039 (R038, R017), R040 (R039), R041 (R038, R005, R013), R042 (R038), R043 (R022), R044 (R043), R048 (R045), R051 (none), R052 (R051), R053 (R003), R054 (R053), R055 (R053), R056 (none), R057 (none), R058 (none), R059 (R003), R063 (R017, R062), R066 (R022)

---

## pokemon-lifecycle-R001: Pokemon Party Limit

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Basic Pokémon Rules and Introduction`
- **Quote:** "In most settings, Trainers are allowed to carry with them a maximum of six Pokémon at a time while traveling."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R002: Pokemon Maximum Level

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "Pokémon have a maximum Level of 100."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R003: Base Stats Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "Start by checking the Pokédex to see the Pokémon's Base Stats. These are your starting point."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R004: Pokemon Types

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "Each Pokémon has one or two elemental Types, chosen from the 18 Types in Pokémon. They are Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Normal, Poison, Psychic, Rock, Steel, and Water."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R005: Nature System

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Pokémon Nature Chart`
- **Quote:** "Next, apply your Pokémon's Nature. This will simply raise one stat, and lower another"
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R006: Nature Stat Adjustments

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1."
- **Dependencies:** pokemon-lifecycle-R005
- **Errata:** false

## pokemon-lifecycle-R007: Neutral Natures

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Pokémon Nature Chart`
- **Quote:** "*These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."
- **Dependencies:** pokemon-lifecycle-R005
- **Errata:** false

## pokemon-lifecycle-R008: Nature Flavor Preferences

- **Category:** enumeration
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Nature & Flavor Preference`
- **Quote:** "Each Stat correlates to a flavor; HP with Salty, Attack with Spicy, Defense with Sour, Special Attack with Dry, Special Defense with Bitter, and Speed with Sweet. Pokémon like the flavor associated with the Stat raised by their nature, and dislike the flavor associated with the stat lowered by their nature. Pokémon with neutral natures do not have any flavor preferences."
- **Dependencies:** pokemon-lifecycle-R005
- **Errata:** false

## pokemon-lifecycle-R009: Stat Points Allocation Total

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "Next, add +X Stat Points, where X is the Pokémon's Level plus 10."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R010: Base Relations Rule

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "The Base Relations Rule puts a Pokémon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points. [...] Stats that are equal need not be kept equal, however."
- **Dependencies:** pokemon-lifecycle-R003, pokemon-lifecycle-R009
- **Errata:** false

## pokemon-lifecycle-R011: Pokemon HP Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Combat Stats`
- **Quote:** "Pokémon Hit Points = Pokémon Level + (HP x3) + 10"
- **Dependencies:** pokemon-lifecycle-R003, pokemon-lifecycle-R009
- **Errata:** false

## pokemon-lifecycle-R012: Evasion Calculation

- **Category:** formula
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/07-combat.md#Evasion` (combat domain)
- **Quote:** "for every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense. [...] for every 5 points [...] in Special Defense, they gain +1 Special Evasion [...] for every 5 points [...] in Speed, they gain +1 Speed Evasion"
- **Dependencies:** pokemon-lifecycle-R009
- **Errata:** false

## pokemon-lifecycle-R013: Abilities - Initial Assignment

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Abilities`
- **Quote:** "All Pokémon are born with a single Ability, chosen from their Basic Abilities. Normally the GM will decide what Ability a Pokémon starts with, either randomly or by choosing one."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R014: Abilities - Level 20

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Abilities`
- **Quote:** "At Level 20, a Pokémon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities."
- **Dependencies:** pokemon-lifecycle-R013
- **Errata:** false

## pokemon-lifecycle-R015: Abilities - Level 40

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Abilities`
- **Quote:** "At Level 40, a Pokémon gains a Third Ability, which may be chosen from any of its Abilities."
- **Dependencies:** pokemon-lifecycle-R014
- **Errata:** false

## pokemon-lifecycle-R016: No Ability Maximum

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Abilities`
- **Quote:** "There is no maximum to the number of Abilities that a Pokémon or Trainer may have."
- **Dependencies:** pokemon-lifecycle-R013
- **Errata:** false

## pokemon-lifecycle-R017: Move Slot Limit

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Moves`
- **Quote:** "Pokémon may learn a maximum of 6 Moves from all sources combined. However, certain Abilities and Features may allow a Pokémon to bypass this limit."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R018: Natural Move Sources

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Moves`
- **Quote:** "A Pokémon may fill as many of its Move slots as it likes with Moves from its Natural Move List. This includes all Moves gained from Level Up, all Egg Moves, and all Tutor Moves marked with an (N)."
- **Dependencies:** pokemon-lifecycle-R017
- **Errata:** false

## pokemon-lifecycle-R019: TM/Tutor Move Limit

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Moves`
- **Quote:** "no more than 3 of a Pokémon's Moves may be from TMs and Move Tutors, with the exception of the Natural Tutor Moves noted above. Any Feature that requires Tutor Points to cause a Pokémon to learn Moves is considered a Tutor."
- **Dependencies:** pokemon-lifecycle-R017, pokemon-lifecycle-R018
- **Errata:** false

## pokemon-lifecycle-R020: TM-to-Natural Reclassification

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Moves`
- **Quote:** "If a Pokémon learns a Move via TM or Move Tutor that it can later learn via Level Up, once the Pokémon has the opportunity to learn it naturally, that Move becomes counted as a 'Natural' Move for the purposes of the 3-TM/Tutor Move Limit."
- **Dependencies:** pokemon-lifecycle-R018, pokemon-lifecycle-R019
- **Errata:** false

## pokemon-lifecycle-R021: Tutor Move Level Restrictions

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `errata-2.md#Tutor and Inheritance Move Changes`
- **Quote:** "Pokémon under Level 20 may only learn Moves of an At-Will or EOT Frequency with a max Damage Base of 7. Pokémon from Level 20 to 29 may only learn Moves with up to a Scene Frequency and max Damage Base of 9. Pokémon at Level 30 and above have no restrictions when being taught Moves through Tutors."
- **Dependencies:** pokemon-lifecycle-R019
- **Errata:** true

## pokemon-lifecycle-R022: Tutor Points - Initial

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Tutor Points`
- **Quote:** "Each Pokémon, upon hatching, starts with a single precious Tutor Point."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R023: Tutor Points - Level Progression

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Tutor Points`
- **Quote:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokémon gain another Tutor Point."
- **Dependencies:** pokemon-lifecycle-R022
- **Errata:** false

## pokemon-lifecycle-R024: Tutor Points - Permanent Spend

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Tutor Points`
- **Quote:** "Tutor Points are stored until used by a TM, Feature, or Poké Edge. Once used, Tutor Points are lost forever."
- **Dependencies:** pokemon-lifecycle-R022
- **Errata:** false

## pokemon-lifecycle-R025: Tutor Points - Trade Refund

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Tutor Points`
- **Quote:** "Features which apply to 'your Pokémon' have all effects removed and the Tutor Points refunded if those Pokémon are given to another Trainer."
- **Dependencies:** pokemon-lifecycle-R022
- **Errata:** false

## pokemon-lifecycle-R026: Level Up Workflow

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "Whenever your Pokémon Levels up, follow this list: First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule. Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry to see if either of these happens. [...] Finally, your Pokémon may gain a new Ability. This happens at Level 20 and Level 40"
- **Dependencies:** pokemon-lifecycle-R009, pokemon-lifecycle-R010
- **Errata:** false

## pokemon-lifecycle-R027: Level Up Stat Point

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule."
- **Dependencies:** pokemon-lifecycle-R026, pokemon-lifecycle-R010
- **Errata:** false

## pokemon-lifecycle-R028: Level Up Move Check

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry to see if either of these happens. If a Pokémon evolves, make sure to then check its new form's Move List to see if it learned any Moves that Level."
- **Dependencies:** pokemon-lifecycle-R026, pokemon-lifecycle-R017
- **Errata:** false

## pokemon-lifecycle-R029: Evolution Check on Level Up

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry to see if either of these happens."
- **Dependencies:** pokemon-lifecycle-R026
- **Errata:** false

## pokemon-lifecycle-R030: Optional Evolution Refusal

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Leveling Up`
- **Quote:** "You may choose not to Evolve your Pokémon if you wish."
- **Dependencies:** pokemon-lifecycle-R029
- **Errata:** false

## pokemon-lifecycle-R031: Evolution - Stat Recalculation

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Evolution`
- **Quote:** "Upon Evolving, several changes occur in a Pokémon. Take the new form's Base Stats, apply the Pokémon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokémon, spreading the Stats as you wish. Again, Pokémon add +X Stat Points to their Base Stats, where X is the Pokémon's Level plus 10. You must of course, still follow the Base Relations Rule."
- **Dependencies:** pokemon-lifecycle-R029, pokemon-lifecycle-R009, pokemon-lifecycle-R010, pokemon-lifecycle-R034
- **Errata:** false

## pokemon-lifecycle-R032: Evolution - Ability Remapping

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Evolution`
- **Quote:** "Abilities change to match the Ability in the same spot in the Evolution's Ability List."
- **Dependencies:** pokemon-lifecycle-R029, pokemon-lifecycle-R013
- **Errata:** false

## pokemon-lifecycle-R033: Evolution - Immediate Move Learning

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Evolution`
- **Quote:** "When Pokémon Evolve, they can immediately learn any Moves that their new form learns at a Level lower than their minimum Level for Evolution but that their previous form could not learn."
- **Dependencies:** pokemon-lifecycle-R029, pokemon-lifecycle-R017
- **Errata:** false

## pokemon-lifecycle-R034: Evolution - Skills and Capabilities Update

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Evolution`
- **Quote:** "Finally, check the Pokémon's Skills and Capabilities and update them for its Evolved form."
- **Dependencies:** pokemon-lifecycle-R029, pokemon-lifecycle-R062, pokemon-lifecycle-R064
- **Errata:** false

## pokemon-lifecycle-R035: Vitamins - Base Stat Increase

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Vitamins`
- **Quote:** "HP Up: Raise the user's HP Base Stat 1. Protein: Raise the user's Attack Base Stat 1. Iron: Raise the user's Defense Base Stat 1. Calcium: Raise the user's Special Attack Base Stat 1. Zinc: Raise the user's Special Defense Base Stat 1. Carbos: Raise the user's Speed Base Stat 1."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R036: Vitamins - Maximum Per Pokemon

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Vitamins`
- **Quote:** "you may only get use out of up to five Vitamins per Pokémon. After you have used five Vitamins on a Pokémon, any Vitamins fed to a Pokémon afterwards will have no effect."
- **Dependencies:** pokemon-lifecycle-R035
- **Errata:** false

## pokemon-lifecycle-R037: Heart Booster

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Vitamins`
- **Quote:** "Heart Booster: The Pokémon gains 2 Tutor Points. Use only one per Pokémon."
- **Dependencies:** pokemon-lifecycle-R022
- **Errata:** false

## pokemon-lifecycle-R038: Pokemon Creation Workflow

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Managing Pokémon`
- **Quote:** "While the GM usually assigns a Pokémon's Nature and Abilities when first caught, the Trainer assigns all of their Stat Points up to their current Level. [...] Start by checking the Pokédex to see the Pokémon's Base Stats. [...] Next, apply your Pokémon's Nature. [...] Next, add +X Stat Points [...] Calculate your Pokémon's Hit Points when you're done."
- **Dependencies:** pokemon-lifecycle-R003, pokemon-lifecycle-R005, pokemon-lifecycle-R009, pokemon-lifecycle-R010, pokemon-lifecycle-R011, pokemon-lifecycle-R013, pokemon-lifecycle-R017
- **Errata:** false

## pokemon-lifecycle-R039: Breeding - Species Determination

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "When an egg is produced, roll 1d20 to determine the species of the egg. If the roll is 5 or higher, the egg is of the female's species. If the roll is 4 or lower, the egg is of the male's species."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R040: Breeding - Inheritance Move List

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "Consult the Egg Move List of the Child's Pokémon Species. Note down any Moves on the Egg Move List known by either Parent, or any Moves known by either parent that the Child can learn via TM. This is the Pokémon's Inheritance Move List."
- **Dependencies:** pokemon-lifecycle-R039, pokemon-lifecycle-R017
- **Errata:** false

## pokemon-lifecycle-R041: Breeding - Inheritance Move Schedule

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "At Level 20 and every 10 Levels thereafter, the Child Pokémon can learn a Move from its Inheritance Move List, as if it was learning it via Level-Up."
- **Dependencies:** pokemon-lifecycle-R040
- **Errata:** false

## pokemon-lifecycle-R042: Inheritance Move Level Restrictions

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `errata-2.md#Tutor and Inheritance Move Changes`
- **Quote:** "This applies to Inheritance Moves as well. If a Pokémon were to have Heal Pulse as its only Inheritance Move, that Move would be gained at Level 30 despite the Level 20 slot for Inheritance Moves being empty."
- **Dependencies:** pokemon-lifecycle-R021, pokemon-lifecycle-R041
- **Errata:** true

## pokemon-lifecycle-R043: Breeding - Trait Determination

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "Nature, Ability, and Gender are decided based on the Breeder's Pokémon Education Rank. If their Rank is high enough, they are allowed to choose. If it's not, these are decided by the GM, or randomly generated."
- **Dependencies:** pokemon-lifecycle-R039, pokemon-lifecycle-R005, pokemon-lifecycle-R013
- **Errata:** false

## pokemon-lifecycle-R044: Breeding - Nature Choice Threshold

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "Nature [...] May be picked by Breeders with a Pokémon Education Rank of Adept or higher."
- **Dependencies:** pokemon-lifecycle-R043
- **Errata:** false

## pokemon-lifecycle-R045: Breeding - Ability Choice Threshold

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "Ability is decided from the species' basic Abilities. May be decided by Breeders with a Pokémon Education Rank of Expert or higher."
- **Dependencies:** pokemon-lifecycle-R043
- **Errata:** false

## pokemon-lifecycle-R046: Breeding - Gender Choice Threshold

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "Gender may be determined at random by rolling 100 and checking its Gender Balance [...] May be picked by Breeders with a Pokémon Education Rank of Master."
- **Dependencies:** pokemon-lifecycle-R043
- **Errata:** false

## pokemon-lifecycle-R047: Breeding - Shiny Determination

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Breeding Pokémon`
- **Quote:** "When the egg hatches, roll 1d100 to see if the Pokémon is Shiny; on a roll of either 1 or 100, the Pokémon is special in some way, determined by your GM."
- **Dependencies:** pokemon-lifecycle-R039
- **Errata:** false

## pokemon-lifecycle-R048: Loyalty System - Ranks

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Loyalty`
- **Quote:** "There are 7 Ranks of Loyalty, from 0 to 6, and these ranks measure how well the Pokémon listens to you, how defiant they may become, or how vulnerable they are to being snagged and stolen by illicit parties."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R049: Loyalty - Command Checks

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Loyalty`
- **Quote:** "Loyalty 0 [...] You must make a DC 20 Command Check to give commands to Pokémon with 0 Loyalty. [...] Loyalty 1 [...] require a DC 8 Command Check to give Commands to in battle."
- **Dependencies:** pokemon-lifecycle-R048
- **Errata:** false

## pokemon-lifecycle-R050: Loyalty - Starting Values

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Loyalty`
- **Quote:** "Most caught wild Pokémon will begin at [Loyalty 2] [...] most Pokémon hatched from eggs will bond easily with their Trainers as a parent figure and begin at [Loyalty 3]."
- **Dependencies:** pokemon-lifecycle-R048
- **Errata:** false

## pokemon-lifecycle-R051: Loyalty - Intercept at Rank 3

- **Category:** interaction
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/05-pokemon.md#Loyalty` (combat domain interaction)
- **Quote:** "Pokémon at Loyalty 3 or higher can attempt to Intercept incoming attacks aimed at their Trainers in battle"
- **Dependencies:** pokemon-lifecycle-R048
- **Errata:** false

## pokemon-lifecycle-R052: Loyalty - Intercept at Rank 6

- **Category:** interaction
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/05-pokemon.md#Loyalty` (combat domain interaction)
- **Quote:** "Pokémon at Loyalty 6 may attempt to intercept attacks aimed at any ally in battle."
- **Dependencies:** pokemon-lifecycle-R048
- **Errata:** false

## pokemon-lifecycle-R053: Disposition System

- **Category:** enumeration
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Pokémon Disposition`
- **Quote:** "Wild Pokémon have 6 different Dispositions towards Trainers or a group of Trainers, ranging from Very Friendly to Very Hostile."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R054: Disposition - Charm Check DCs

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Pokémon Disposition`
- **Quote:** "Very Friendly: --- / Friendly: DC 15 / Neutral: DC 12 / Fearful: DC 8 / Hostile: DC 15 / Very Hostile: DC 30"
- **Dependencies:** pokemon-lifecycle-R053
- **Errata:** false

## pokemon-lifecycle-R055: Training Session

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Training Pokémon`
- **Quote:** "By spending an hour Training with their Pokemon, Trainers may apply [Training] Features, teach their Pokemon Poke-Edges, trigger Class Features such as Ace Trainer, or even grant bonus Experience based on their Command Rank. A Trainer can train up to 6 Pokémon at a time."
- **Dependencies:** pokemon-lifecycle-R022
- **Errata:** false

## pokemon-lifecycle-R056: Experience Training Formula

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Training Pokémon`
- **Quote:** "A Pokémon may have Experience Training applied to them only once per day. Pokémon that have Experience Training applied to them gain Experience equal to half their own Level, plus a bonus based on their Trainer's Command Rank. Pathetic or Untrained: 0 / Novice or Adept: +5 / Expert or Master: +10 / Virtuoso: +15"
- **Dependencies:** pokemon-lifecycle-R055
- **Errata:** false

## pokemon-lifecycle-R057: Experience Training Limit

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Training Pokémon`
- **Quote:** "Each day, a Trainer can also apply Experience Training to a number of Pokémon equal to their Command Rank."
- **Dependencies:** pokemon-lifecycle-R055
- **Errata:** false

## pokemon-lifecycle-R058: Pokemon Experience Calculation

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Calculating Pokémon Experience`
- **Quote:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R059: Experience Distribution Rules

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Regulating Experience`
- **Quote:** "As written, Experience can only be distributed to Pokémon who participated directly in an encounter, and it can be split however the player sees fit, even if that means putting all of the Experience for a large encounter into a single Pokémon. Note that unlike in the video games, Fainted Pokémon can still gain Experience."
- **Dependencies:** pokemon-lifecycle-R058
- **Errata:** false

## pokemon-lifecycle-R060: Experience Chart

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Pokémon Experience Chart`
- **Quote:** "Whenever your Pokémon gains Experience, add its Experience to its previous Experience total. If the new total reaches the next Level's 'Exp Needed', the Pokémon Levels up."
- **Dependencies:** pokemon-lifecycle-R002
- **Errata:** false

## pokemon-lifecycle-R061: Size Classes

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `pokedexes/how-to-read.md#Height and Weight`
- **Quote:** "Pokémon sizes vary from Small, to Medium, to Large, to Huge and finally, Gigantic. On a grid, both Small and Medium Pokémon would take up one space, or a 1x1m square. [...] Large Pokémon occupy 2x2 spaces [...] Huge Pokémon occupy 3x3 spaces [...] Gigantic Pokémon occupies 4x4 spaces"
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R062: Weight Classes

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `pokedexes/how-to-read.md#Height and Weight`
- **Quote:** "Weight Classes are used for several Abilities and Moves. They range from 1 to 6 and are labeled in the parenthesis after weights."
- **Dependencies:** none
- **Errata:** false

## pokemon-lifecycle-R063: Species Capabilities

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Capabilities`
- **Quote:** "Unlike Trainers, Pokémon do not derive their Capabilities from their Skill Ranks; instead, they are determined by their species."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R064: Move-Granted Capabilities

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Capabilities`
- **Quote:** "Certain Moves can grant Capabilities or boost existing Capabilities. These bonuses are lost if the Move is ever forgotten."
- **Dependencies:** pokemon-lifecycle-R017, pokemon-lifecycle-R063
- **Errata:** false

## pokemon-lifecycle-R065: Pokemon Skills

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Skills`
- **Quote:** "The Pokédex document assigns each species a roll value in Athletics, Acrobatics, Combat, Stealth, Perception, and Focus."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R066: Mega Evolution - Trigger

- **Category:** workflow
- **Scope:** edge-case
- **PTU Ref:** `core/05-pokemon.md#Mega Evolution`
- **Quote:** "Two prerequisites must be met before Mega Evolution can occur [...] First, the Pokémon must be holding a special type of Held Item called a Mega Stone. [...] Second, their Trainer must be wearing an Accessory Slot item called a Mega Ring. [...] Mega Evolution can be triggered on either the Pokémon or the Trainer's turn as a Swift Action."
- **Dependencies:** pokemon-lifecycle-R003
- **Errata:** false

## pokemon-lifecycle-R067: Mega Evolution - Stat and Ability Changes

- **Category:** formula
- **Scope:** edge-case
- **PTU Ref:** `core/05-pokemon.md#Mega Evolution`
- **Quote:** "When a Pokémon Mega Evolves, its Combat Stats change, receiving an overall boost (of about 10 points!), and it gains a new Ability and sometimes changes its Types. The Ability gained from Mega Evolution is always added to a Pokémon's current Ability list and doesn't replace a current Ability. [...] HP is never changed by a Mega Evolution."
- **Dependencies:** pokemon-lifecycle-R066
- **Errata:** false

## pokemon-lifecycle-R068: Mega Evolution - Constraints

- **Category:** constraint
- **Scope:** edge-case
- **PTU Ref:** `core/05-pokemon.md#Mega Evolution`
- **Quote:** "Once triggered, a Mega Evolution lasts for the rest of the Scene, even if the Pokémon is knocked out. A Mega Ring can only support one Mega Evolution at a time, meaning once a Trainer Mega Evolves a Pokémon, they can't Mega Evolve any others for the rest of the Scene. [...] Mega Stones cannot be removed from their users once Mega Evolution has been activated"
- **Dependencies:** pokemon-lifecycle-R066
- **Errata:** false

---

## Notes

### Rounding Rule (Cross-Domain)
From `core/06-playing-the-game.md#System Fundamentals`: "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher." This applies to all formulas in this domain (HP, evasion, experience, etc.).

### Starter Pokemon Guidelines
From `core/02-character-creation.md` and `core/11-running-the-game.md#Starter Pokémon`: Starter Pokemon are typically Level 5 or 10, commonly with three evolutionary stages. The GM may allow players to choose Ability, Gender, and Nature. These are GM guidelines, not mechanical rules — no formula or constraint to extract.

### Baby Template (Optional)
From `core/05-pokemon.md#Optional Rule: Baby Template`: "subtract 2, 3, or even 4 from each of the Pokémon's Base Stats, lower each of their Skills one Rank, and lower their Capabilities by 2. [...] every 5 levels, they gain +1 to each of their Base Stats." This is an explicitly optional rule and not part of the standard pokemon lifecycle.

### Fossil Pokemon
From `core/05-pokemon.md#Pokémon Fossils`: Fossil eggs hatch at Level 10 with traits determined by GM. Requires Paleontologist Edge. This is narrative/GM-discretion content rather than a mechanical rule with extractable formulas.

### Fishing
From `core/05-pokemon.md#Fishing`: Three rod types (Old: unevolved ≤L10, Good: unevolved any level, Super: any). Roll mechanics (1d20 every 5 min, 15+ = bite, Athletics DC 8 to reel in). These are encounter-generation mechanics more than pokemon-lifecycle rules.

### Poké Edges
From `core/05-pokemon.md#Poké Edges`: Multiple specific edges exist (Attack Conflict, Mixed Sweeper, Underdog's Strength, Realized Potential, Ability Mastery, Accuracy Training, etc.). These modify the Base Relations Rule, grant extra stat points, or provide ability/move flexibility. They use Tutor Points and are removed if prerequisites are lost (TP refunded). Not individually extracted as they are individual features rather than lifecycle rules, but they interact with R010 (Base Relations), R022 (Tutor Points), R013 (Abilities), and R017 (Moves).

### Capture Mechanics
Capture rules are extracted separately in the `capture` domain. The capture workflow (throwing Poké Ball, accuracy check, capture rate calculation) is cross-domain and not duplicated here.

### Errata - Capture Changes
The errata contains a revised d20-based capture system. This is extracted in the `capture` domain, not here.
