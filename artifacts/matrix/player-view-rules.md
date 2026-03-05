# Player-View Rules Catalog

Domain: **player-view**
Extracted from: PTU 1.05 Core (chapters 02, 05, 06, 07) + Errata (errata-2.md)
Extraction date: 2026-03-05

---

## Foundation Rules (Player Identity & Character Sheet)

### player-view-R001
- **name**: Trainer Combat Stats
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 02-character-creation.md p.15, 07-combat.md p.234
- **quote**: "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed."
- **dependencies**: []
- **errata**: false

### player-view-R002
- **name**: Trainer Derived Stats
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234
- **quote**: "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10"
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R003
- **name**: Pokemon Hit Points Formula
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.198, 07-combat.md p.234
- **quote**: "Pokemon Hit Points = Pokemon's Level + (HP stat x3) + 10"
- **dependencies**: []
- **errata**: false

### player-view-R004
- **name**: Evasion from Defense Stats
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234
- **quote**: "For every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R005
- **name**: Evasion from Special Defense
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234
- **quote**: "For every 5 points a Pokemon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R006
- **name**: Evasion from Speed
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234
- **quote**: "Additionally for every 5 points a Pokemon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R007
- **name**: Evasion Application to Accuracy Check
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234-235
- **quote**: "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat; similarly, Special Evasion can modify the rolls of attacks that target the Special Defense Stat. Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check."
- **dependencies**: [player-view-R004, player-view-R005, player-view-R006]
- **errata**: false

### player-view-R008
- **name**: Evasion Cap
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234-235
- **quote**: "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9."
- **dependencies**: [player-view-R007]
- **errata**: false

### player-view-R009
- **name**: Trainer Starting Stats
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 02-character-creation.md p.15
- **quote**: "Starting Trainers begin with 10 HP and 5 points each in the rest of their Combat Stats. You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R010
- **name**: Action Points Pool
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.221
- **quote**: "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points, for example."
- **dependencies**: []
- **errata**: false

### player-view-R011
- **name**: Action Points Scene Recovery
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 06-playing-the-game.md p.221
- **quote**: "Action Points are completely regained at the end of each Scene."
- **dependencies**: [player-view-R010]
- **errata**: false

### player-view-R012
- **name**: AP Bound and Drain
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 06-playing-the-game.md p.221
- **quote**: "Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect. If no means of ending the effect is specified, then the effect may be ended and AP Unbound during your turn as a Free Action. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **dependencies**: [player-view-R010]
- **errata**: false

### player-view-R013
- **name**: AP Accuracy Boost
- **category**: modifier
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.221
- **quote**: "In a pinch, any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result. This cannot be done more than once per roll. This can be used to modify your Pokemon's Accuracy or Skill Checks as well as your own!"
- **dependencies**: [player-view-R010]
- **errata**: false

### player-view-R014
- **name**: Maximum Pokemon in Party
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.196
- **quote**: "In most settings, Trainers are allowed to carry with them a maximum of six Pokemon at a time while traveling."
- **dependencies**: []
- **errata**: false

### player-view-R015
- **name**: Maximum Moves Per Pokemon
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.200
- **quote**: "Pokemon may learn a maximum of 6 Moves from all sources combined."
- **dependencies**: []
- **errata**: false

### player-view-R016
- **name**: TM/Tutor Move Limit
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.200
- **quote**: "No more than 3 of a Pokemon's Moves may be from TMs and Move Tutors, with the exception of the Natural Tutor Moves noted above."
- **dependencies**: [player-view-R015]
- **errata**: false

### player-view-R017
- **name**: Pokemon Stat Points Allocation
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.198
- **quote**: "Next, add +X Stat Points, where X is the Pokemon's Level plus 10."
- **dependencies**: []
- **errata**: false

### player-view-R018
- **name**: Base Relations Rule
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.198
- **quote**: "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."
- **dependencies**: [player-view-R017]
- **errata**: false

### player-view-R019
- **name**: Pokemon Nature Application
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.198-199
- **quote**: "Next, apply your Pokemon's Nature. This will simply raise one stat, and lower another; HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1."
- **dependencies**: []
- **errata**: false

### player-view-R020
- **name**: Pokemon Ability Progression
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.200
- **quote**: "All Pokemon are born with a single Ability, chosen from their Basic Abilities. At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities. At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities."
- **dependencies**: []
- **errata**: false

### player-view-R021
- **name**: Pokemon Leveling Up Workflow
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "Whenever your Pokemon Levels up, follow this list: First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule. Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens."
- **dependencies**: [player-view-R018, player-view-R017]
- **errata**: false

### player-view-R022
- **name**: Tutor Points Progression
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "Each Pokemon, upon hatching, starts with a single precious Tutor Point. Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."
- **dependencies**: []
- **errata**: false

### player-view-R023
- **name**: Loyalty Is GM Secret
- **category**: constraint
- **scope**: core
- **actor**: gm
- **ptu_ref**: 05-pokemon.md p.210
- **quote**: "A Pokemon's Loyalty is a secret value kept by the GM."
- **dependencies**: []
- **errata**: false

### player-view-R024
- **name**: Loyalty Ranks and Effects
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.210-211
- **quote**: "There are 7 Ranks of Loyalty, from 0 to 6, and these ranks measure how well the Pokemon listens to you, how defiant they may become, or how vulnerable they are to being snagged and stolen by illicit parties."
- **dependencies**: [player-view-R023]
- **errata**: false

### player-view-R025
- **name**: Loyalty Command Checks
- **category**: condition
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.210
- **quote**: "Loyalty 0 Pokemon detest their trainers, and defy them at every opportunity. You must make a DC 20 Command Check to give commands to Pokemon with 0 Loyalty. [...] Loyalty 1 Pokemon similarly dislike their trainer, and require a DC 8 Command Check to give Commands to in battle."
- **dependencies**: [player-view-R024]
- **errata**: false

---

## Skill Checks & Capabilities (Player Actions Out of Combat)

### player-view-R026
- **name**: Skill Check Resolution
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.219
- **quote**: "Making a Skill Check is easy. Simply roll a number of d6s equal to your Rank in the appropriate Skill and then add your modifiers from equipment and other bonuses. If you meet or exceed the GM's set Difficulty Check, or DC, for the task, then you succeed."
- **dependencies**: []
- **errata**: false

### player-view-R027
- **name**: Opposed Check Resolution
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.220
- **quote**: "Whoever rolls higher wins the Opposed Check. On a tie, the defender wins."
- **dependencies**: [player-view-R026]
- **errata**: false

### player-view-R028
- **name**: Team Skill Check
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.220
- **quote**: "The GMs set a DC as they would for a normal Skill Check, and then multiplies it by the number of people they would normally expect to be necessary for the task. This becomes the Team DC for the Skill Check. Each Trainer or Pokemon participating rolls their Skill, and the total sum of all the Skill Checks is compared to the Team DC."
- **dependencies**: [player-view-R026]
- **errata**: false

### player-view-R029
- **name**: Assisted Skill Check
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.220
- **quote**: "The primary actor rolls their Skill Check, adding half the Skill Rank of their helper as a bonus to the Check. The helper must have at least a Novice Rank in the Skill being tested to assist in this way."
- **dependencies**: [player-view-R026]
- **errata**: false

### player-view-R030
- **name**: Rounding Rule
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 06-playing-the-game.md p.219
- **quote**: "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher. 3.9999 would still round down to 3."
- **dependencies**: []
- **errata**: false

### player-view-R031
- **name**: Percentages Are Additive
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 06-playing-the-game.md p.219
- **quote**: "Percentages are additive, not multiplicative. For example, this means if you gain a 20% boost somewhere and a 30% somewhere else, you gain a 50% boost in total."
- **dependencies**: []
- **errata**: false

### player-view-R032
- **name**: Specific Rules Trump General
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 06-playing-the-game.md p.219
- **quote**: "Specific rules trump more general ones."
- **dependencies**: []
- **errata**: false

### player-view-R033
- **name**: Throwing Range
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.223
- **quote**: "Trainers have a Throwing Range that determines how far they can throw Poke Balls and other small items. This Capability is equal to 4 plus their Athletics Rank in meters."
- **dependencies**: []
- **errata**: false

### player-view-R034
- **name**: Overland Movement Capability
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.223
- **quote**: "The most basic Movement Capability is the Overland Capability, which measures how fast a Trainer or Pokemon can walk or run on a surface."
- **dependencies**: []
- **errata**: false

### player-view-R035
- **name**: Sprint Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.223, 07-combat.md p.242
- **quote**: "The Sprint Action may be taken as a Standard Action to increase Movement Speed by 50% for a turn."
- **dependencies**: [player-view-R034]
- **errata**: false

### player-view-R036
- **name**: Scene Definition
- **category**: enumeration
- **scope**: core
- **actor**: gm
- **ptu_ref**: 06-playing-the-game.md p.221
- **quote**: "Scenes do not have a fixed duration but are defined by the narrative. Think about how scenes work in television. If you cut to a transition, have a time skip, or everyone is leaving the location after a dramatic event, it's probably a change in Scene."
- **dependencies**: []
- **errata**: false

### player-view-R037
- **name**: Pokemon Skill Checks Outside Combat
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 06-playing-the-game.md p.224
- **quote**: "Pokemon can make Skill Checks and use Capabilities just as Trainers can, and while Pokemon aren't directly controlled by a player, the process is quite similar when it comes to taking action. Simply roleplay your Trainer asking your Pokemon for help or giving it instructions, and then your GM narrates the result."
- **dependencies**: [player-view-R026]
- **errata**: false

### player-view-R038
- **name**: Player Does Not Control Pokemon Out of Combat
- **category**: constraint
- **scope**: core
- **actor**: gm
- **ptu_ref**: 06-playing-the-game.md p.224
- **quote**: "Players typically do not exercise direct control over their Trainer's Pokemon except in combat."
- **dependencies**: []
- **errata**: false

---

## Combat: Initiative & Turn Structure

### player-view-R039
- **name**: Initiative Equals Speed Stat
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "In most situations, a Pokemon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R040
- **name**: League Battle Initiative Order
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokemon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed."
- **dependencies**: [player-view-R039]
- **errata**: false

### player-view-R041
- **name**: Full Contact Initiative Order
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "In 'full contact' matches, wild encounters, and other situations where Trainers are directly involved in the fight, all participants simply go in order from highest to lowest speed."
- **dependencies**: [player-view-R039]
- **errata**: false

### player-view-R042
- **name**: Initiative Tie Resolution
- **category**: workflow
- **scope**: edge-case
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Ties in Initiative should be settled with a d20 roll off."
- **dependencies**: [player-view-R039]
- **errata**: false

### player-view-R043
- **name**: Hold Action
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Combatants can choose to hold their action until a specified lower Initiative value once per round."
- **dependencies**: [player-view-R039]
- **errata**: false

### player-view-R044
- **name**: Two Turns Per Round (Trainer + Pokemon)
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.226
- **quote**: "In each round of combat, players get to take two turns: one for their Trainer, and one for a Pokemon. Even if their Trainer is knocked out or incapacitated, they still get their Pokemon's turn and vice versa."
- **dependencies**: []
- **errata**: false

### player-view-R045
- **name**: Round Duration
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Combat in Pokemon Tabletop United takes place in a sequence of 10 second rounds."
- **dependencies**: []
- **errata**: false

### player-view-R046
- **name**: One Full Round Duration
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Some effects in PTU last for 'one full round.' This simply means that they last until the same Initiative Count next round."
- **dependencies**: [player-view-R045]
- **errata**: false

---

## Combat: Action Types

### player-view-R047
- **name**: Actions Per Turn
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order. In addition, they may take any number of Free Actions, though actions with a Trigger can only be activated once per Trigger."
- **dependencies**: []
- **errata**: false

### player-view-R048
- **name**: Standard Action Options (Trainer)
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Using a Move; Using a Struggle Attack; Retrieving and using an Item from a backpack or similar on a target; Throwing a Poke Ball to Capture a wild Pokemon; Drawing a Weapon, or switching from one Weapon to another; Using the Pokedex to identify a Pokemon; You may give up a Standard Action to take another Swift Action; You may give up a Standard Action to take another Shift Action [...]; Use Combat Maneuvers."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R049
- **name**: Standard Action to Extra Shift Limitation
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "You may give up a Standard Action to take another Shift Action, but this cannot be used for Movement if you have already used your regular Shift Action for Movement."
- **dependencies**: [player-view-R048]
- **errata**: false

### player-view-R050
- **name**: Shift Action for Movement
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "The Shift Action is the most straightforward action during a Pokemon or Trainer's turn; it's simply used for movement most of the time."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R051
- **name**: Shift Action Item Passing
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Trainers may hand other Trainers a small item they have on hand as part of a Shift Action, as long as the ally is adjacent at either the beginning or end of the shift."
- **dependencies**: [player-view-R050]
- **errata**: false

### player-view-R052
- **name**: Swift Action Limitation
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Trainers have exactly one Swift Action a round, and it can only be used on their turn."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R053
- **name**: Full Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Full Actions take both your Standard Action and Shift Action for a turn."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R054
- **name**: Priority Action
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.228
- **quote**: "If the user has not already acted this turn, an action with the Priority keyword may be declared to act immediately; the user takes their full turn, ignoring initiative. This counts as their turn for the round. A priority action may not be declared during someone else's turn; it must be declared between turns."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R055
- **name**: Priority (Limited) Action
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.228
- **quote**: "The Priority (Limited) keyword is like Priority except the user may not take their full turn; they may only take the action that itself has Priority and take the rest of their turn on their own Initiative Count."
- **dependencies**: [player-view-R054]
- **errata**: false

### player-view-R056
- **name**: Interrupt Action
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.228
- **quote**: "Interrupt Moves may be declared in the middle of another combatant's turn to allow the user to take an action. They work similarly to Priority (Advanced, Limited) effects in that they only allow you to take the action that has Interrupt and not a full turn."
- **dependencies**: [player-view-R047]
- **errata**: false

### player-view-R057
- **name**: No Action Tax at Combat Start
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Generally Trainers do not have to spend actions at the very beginning of Combat to draw a weapon or send out their first Pokemon for the fight."
- **dependencies**: []
- **errata**: false

---

## Combat: Pokemon Commanding & Switching

### player-view-R058
- **name**: Player Commands Pokemon in Combat
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.228
- **quote**: "Basically, when a Pokemon's initiative in combat comes up, simply let the player decide what the Pokemon does. You do not need to announce your Pokemon's action during your Trainer Turn."
- **dependencies**: [player-view-R044]
- **errata**: false

### player-view-R059
- **name**: Pokemon Standard Action Options
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.228
- **quote**: "Pokemon can do the following with a Standard Action: Use a Move or Struggle Attack; Use Combat Maneuvers; Activate an effect that requires a Shift Action. This cannot be used for Movement; Use Abilities, Capabilities, or make Skill Checks requiring Standard Actions; Recall themselves into a Poke Ball for a Switch; Pick up Held Items."
- **dependencies**: [player-view-R058]
- **errata**: false

### player-view-R060
- **name**: Pokemon Switch - Standard Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts."
- **dependencies**: [player-view-R058]
- **errata**: false

### player-view-R061
- **name**: Poke Ball Recall Range
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam - 8 meters. During a League Battle, Trainers are generally considered to always be in Switching range."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R062
- **name**: Fainted Pokemon Switch - Shift Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "Trainers may Switch out Fainted Pokemon as a Shift Action."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R063
- **name**: League Battle Switch Penalty
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.229
- **quote**: "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R064
- **name**: Recall and Release as Shift Actions
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "Recall and Release actions can also be taken individually by a Trainer as Shift Actions. Recalling and then Releasing by using two Shift Actions in one Round still counts as a Switch, even if they are declared as separate actions."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R065
- **name**: Recall/Release Two Pokemon at Once
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "A Trainer may also spend a Standard Action to Recall two Pokemon or Release two Pokemon at once."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R066
- **name**: Released Pokemon Can Act Immediately
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.229
- **quote**: "If a player has a Pokemon turn available, a Pokemon may act during the round it was released. If the Pokemon's Initiative Count has already passed, then this means they may act immediately."
- **dependencies**: [player-view-R060, player-view-R044]
- **errata**: false

---

## Combat: Making Attacks

### player-view-R067
- **name**: Accuracy Roll
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.236
- **quote**: "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- **dependencies**: []
- **errata**: false

### player-view-R068
- **name**: Accuracy Check Calculation
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion."
- **dependencies**: [player-view-R067, player-view-R007]
- **errata**: false

### player-view-R069
- **name**: Natural 1 Always Misses
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "A roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit."
- **dependencies**: [player-view-R067]
- **errata**: false

### player-view-R070
- **name**: Natural 20 Always Hits
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "Similarly, a roll of 20 is always a hit."
- **dependencies**: [player-view-R067]
- **errata**: false

### player-view-R071
- **name**: Willingly Be Hit
- **category**: condition
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.236
- **quote**: "A target can willingly choose to be hit by a Move that would hit when their Evasion is not applied - the user of the Move must still meet the Move's base AC."
- **dependencies**: [player-view-R068]
- **errata**: false

### player-view-R072
- **name**: Accuracy Modifiers Don't Affect Effect Triggers
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "Note that modifiers to Accuracy Rolls do not affect effects from Moves that occur upon specific dice results, or that increase Critical Hit range."
- **dependencies**: [player-view-R067]
- **errata**: false

---

## Combat: Damage Calculation

### player-view-R073
- **name**: Damage Formula Workflow
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.237
- **quote**: "1. Find initial Damage Base; 2. Apply Five/Double-Strike; 3. Add Damage Base modifiers (ex: STAB) for final Damage Base; 4. Modify damage roll for Critical Hit if applicable; 5. Roll damage or use set damage; 6. Add relevant attack stat and other bonuses; 7. Subtract relevant defense stat and damage reduction; 8. Apply weakness and resistance multipliers; 9. Subtract final damage from target's Hit Points and check for Injuries or KO."
- **dependencies**: [player-view-R067]
- **errata**: false

### player-view-R074
- **name**: Damage Base to Actual Damage
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.237
- **quote**: "When rolling Damage, check the attack's Damage Base. This number serves as a guide for an attack's strength, which translates to a specific amount of damage."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R075
- **name**: STAB (Same Type Attack Bonus)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2."
- **dependencies**: [player-view-R074]
- **errata**: false

### player-view-R076
- **name**: Physical vs Special Damage
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "The target then subtracts the appropriate Defense Stat. Physical Attacks have Defense subtracted from them; Special Attacks have Special Defense subtracted from them."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R077
- **name**: Minimum Damage of 1
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0."
- **dependencies**: [player-view-R076]
- **errata**: false

### player-view-R078
- **name**: Critical Hit on Natural 20
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "On an Accuracy Roll of 20, a damaging attack is a Critical Hit. A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time."
- **dependencies**: [player-view-R067]
- **errata**: false

### player-view-R079
- **name**: Increased Critical Hit Range
- **category**: modifier
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "Some Moves or effects may cause increased critical ranges, making Critical Hits possible on Accuracy Rolls lower than 20."
- **dependencies**: [player-view-R078]
- **errata**: false

### player-view-R080
- **name**: Type Effectiveness - Super Effective
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "A Super-Effective hit will deal x1.5 damage. A Doubly Super-Effective hit will deal x2 damage. Rare Triply-Effective Hits will deal x3 damage."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R081
- **name**: Type Effectiveness - Resisted
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "A Resisted Hit deals 1/2 damage; a doubly Resisted hit deals 1/4th damage. A rare triply-Resisted hit deals 1/8th damage."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R082
- **name**: Type Immunity
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.238
- **quote**: "If either Type is Immune, the attack does 0 damage."
- **dependencies**: [player-view-R080]
- **errata**: false

### player-view-R083
- **name**: Dual-Type Effectiveness Interaction
- **category**: interaction
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.238-239
- **quote**: "If both Types are resistant, the attack is doubly resisted and does 1/4th damage. If both Types are weak, the attack is doubly super-effective and does x2 damage. If one Type is weak and one is resistant, the attack is neutral."
- **dependencies**: [player-view-R080, player-view-R081]
- **errata**: false

### player-view-R084
- **name**: Status Moves Ignore Type Effectiveness
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.238
- **quote**: "Note that Type Effectiveness does not generally affect Status Moves; only Physical and Special Moves are affected."
- **dependencies**: [player-view-R080]
- **errata**: false

### player-view-R085
- **name**: Trainers Have No Type
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.238
- **quote**: "Unlike Pokemon, Trainers do not have a Type, and thus all attacks by default do Neutral damage to them."
- **dependencies**: [player-view-R080]
- **errata**: false

### player-view-R086
- **name**: Hit Point Loss vs Damage
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.236
- **quote**: "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R087
- **name**: Tick of Hit Points
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.237
- **quote**: "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points."
- **dependencies**: []
- **errata**: false

---

## Combat: Combat Stages

### player-view-R088
- **name**: Combat Stage Stats
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.235
- **quote**: "Only Attack, Defense, Special Attack, Special Defense, and Speed may have Combat Stages. HP and Hit Points never have Combat Stages."
- **dependencies**: [player-view-R001]
- **errata**: false

### player-view-R089
- **name**: Combat Stage Limits
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.235
- **quote**: "Moves and effects may change Combat Stages any number of times, but they may never be raised higher than +6 or lower than -6."
- **dependencies**: [player-view-R088]
- **errata**: false

### player-view-R090
- **name**: Combat Stage Multipliers
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.235
- **quote**: "For every Combat Stage above 0, a Stat is raised by 20%, rounded down. For every Combat Stage below 0, a Stat is lowered by 10%, rounded down."
- **dependencies**: [player-view-R088]
- **errata**: false

### player-view-R091
- **name**: Combat Stages Persist Until Switch/End
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.235
- **quote**: "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter."
- **dependencies**: [player-view-R088]
- **errata**: false

### player-view-R092
- **name**: Speed CS Affects Movement
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.235
- **quote**: "You gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."
- **dependencies**: [player-view-R088]
- **errata**: false

### player-view-R093
- **name**: Accuracy Combat Stages
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.234
- **quote**: "Instead of a multiplier, Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2, for example. Like Combat Stages, Accuracy also has limits at -6 and +6."
- **dependencies**: [player-view-R067]
- **errata**: false

---

## Combat: Movement & Positioning

### player-view-R094
- **name**: Grid-Based Movement
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Pokemon Tabletop United uses a square combat grid."
- **dependencies**: []
- **errata**: false

### player-view-R095
- **name**: Size Footprint on Grid
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4."
- **dependencies**: [player-view-R094]
- **errata**: false

### player-view-R096
- **name**: Shift Movement in Combat
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Movement is done with Shift Actions in combat. You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability."
- **dependencies**: [player-view-R050, player-view-R034]
- **errata**: false

### player-view-R097
- **name**: No Split Shift Action
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.231
- **quote**: "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving."
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R098
- **name**: Diagonal Movement Cost
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth."
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R099
- **name**: Adjacency Definition
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. Cardinally Adjacent, however, does not count diagonal squares."
- **dependencies**: [player-view-R094]
- **errata**: false

### player-view-R100
- **name**: Flanking
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.232
- **quote**: "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion. A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other."
- **dependencies**: [player-view-R099]
- **errata**: false

### player-view-R101
- **name**: Flanking Size Scaling
- **category**: modifier
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.232
- **quote**: "For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants."
- **dependencies**: [player-view-R100]
- **errata**: false

### player-view-R102
- **name**: Mixed Movement Capability Averaging
- **category**: formula
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value."
- **dependencies**: [player-view-R096]
- **errata**: false

---

## Combat: Terrain (Player-Visible)

### player-view-R103
- **name**: Regular Terrain
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Regular Terrain is dirt, short grass, cement, smooth rock, indoor building etc. Basically anything that's easy to walk on. Shift as normal on regular terrain!"
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R104
- **name**: Slow Terrain
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R105
- **name**: Rough Terrain Accuracy Penalty
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokemon are considered Rough Terrain."
- **dependencies**: [player-view-R067]
- **errata**: false

### player-view-R106
- **name**: Blocking Terrain
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.231
- **quote**: "Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **dependencies**: [player-view-R096]
- **errata**: false

---

## Combat: Struggle Attacks

### player-view-R107
- **name**: Struggle Attack Stats
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.240
- **quote**: "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks."
- **dependencies**: []
- **errata**: false

### player-view-R108
- **name**: Expert Struggle Attack Upgrade
- **category**: modifier
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.240
- **quote**: "If a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
- **dependencies**: [player-view-R107]
- **errata**: false

### player-view-R109
- **name**: Struggle Attacks Are Not Moves
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.240
- **quote**: "Struggle Attacks do not count as Moves, and effects that alter Moves do not apply to them."
- **dependencies**: [player-view-R107]
- **errata**: false

---

## Combat: Combat Maneuvers (Player-Initiated)

### player-view-R110
- **name**: Attack of Opportunity
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "You may make a Struggle Attack against the triggering foe as an Interrupt. You may use Attack of Opportunity only once per round."
- **dependencies**: [player-view-R107]
- **errata**: false

### player-view-R111
- **name**: Attack of Opportunity Triggers
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.241
- **quote**: "An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you; An adjacent foe stands up; An adjacent foe uses a Ranged Attack that does not target someone adjacent to it; An adjacent foe uses a Standard Action to pick up or retrieve an item; An adjacent foe Shifts out of a Square adjacent to you."
- **dependencies**: [player-view-R110]
- **errata**: false

### player-view-R112
- **name**: Disengage Maneuver
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity."
- **dependencies**: [player-view-R110]
- **errata**: false

### player-view-R113
- **name**: Disarm Maneuver
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "AC: 6, Range: Melee, 1 Target. You and the target each make opposed Combat or Stealth Checks. If you win, the target's Held Item falls to the ground."
- **dependencies**: []
- **errata**: false

### player-view-R114
- **name**: Dirty Trick - Hinder
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "You and the target make Opposed Athletics Checks. If you win, the target is Slowed and takes a -2 penalty to all Skill Checks for one full round."
- **dependencies**: []
- **errata**: false

### player-view-R115
- **name**: Dirty Trick - Blind
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "You and the target make Opposed Stealth Checks. If you win, the target is Blinded for one full round."
- **dependencies**: []
- **errata**: false

### player-view-R116
- **name**: Dirty Trick - Low Blow
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "You and the target make Opposed Acrobatics Checks. If you win, the target is Vulnerable and has their Initiative set to 0 until the end of your next turn."
- **dependencies**: []
- **errata**: false

### player-view-R117
- **name**: Manipulate Maneuver (Trainer Only)
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.241
- **quote**: "Manipulate can only be performed by Trainers. AC: 2, Range: 6, 1 Target."
- **dependencies**: []
- **errata**: false

### player-view-R118
- **name**: Push Maneuver
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.242
- **quote**: "AC: 4, Range: Melee, 1 Target. You and the target each make opposed Combat or Athletics Checks. If you win, the target is Pushed back 1 Meter directly away from you."
- **dependencies**: []
- **errata**: false

### player-view-R119
- **name**: Trip Maneuver
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.242
- **quote**: "AC: 6, Range: Melee, 1 Target. You and the target each make opposed Combat or Acrobatics Checks. If you win, the target is knocked over and Tripped."
- **dependencies**: []
- **errata**: false

### player-view-R120
- **name**: Grapple Maneuver
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.243
- **quote**: "AC: 4, Range: Melee, 1 Target. You and the target each make opposed Combat or Athletics Checks. If you win, you and the target each become Grappled, and you gain Dominance in the Grapple."
- **dependencies**: []
- **errata**: false

### player-view-R121
- **name**: Intercept Melee Maneuver
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.242
- **quote**: "Full Action, Interrupt. Trigger: An ally within Movement range is hit by an adjacent foe. You must make an Acrobatics or Athletics Check, with a DC equal to three times the number of meters they have to move to reach the triggering Ally."
- **dependencies**: []
- **errata**: false

### player-view-R122
- **name**: Intercept Loyalty Requirement
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.242
- **quote**: "Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Range Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally."
- **dependencies**: [player-view-R121, player-view-R024]
- **errata**: false

---

## Combat: Take a Breather

### player-view-R123
- **name**: Take a Breather Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.245
- **quote**: "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability. They then become Tripped and are Vulnerable until the end of their next turn."
- **dependencies**: [player-view-R053]
- **errata**: false

### player-view-R124
- **name**: Take a Breather Effects
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.245
- **quote**: "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **dependencies**: [player-view-R123]
- **errata**: false

### player-view-R125
- **name**: Assisted Take a Breather
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.245
- **quote**: "When a Trainer or Pokemon is unable to choose to Take a Breather themselves [...] they may be calmed and assisted by a Trainer to attempt to Take a Breather. This is a Full Action by both the assisting Trainer and their target [...] and the assisting Trainer must be able to Shift to the target they intend to help. They then make a Command Check with a DC of 12."
- **dependencies**: [player-view-R123]
- **errata**: false

---

## Combat: Status Afflictions (Player-Visible)

### player-view-R126
- **name**: Persistent Afflictions Enumeration
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "Burned, Frozen, Paralysis, Poisoned, Sleep"
- **dependencies**: []
- **errata**: false

### player-view-R127
- **name**: Burned Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn. [...] If a Burned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn."
- **dependencies**: [player-view-R087, player-view-R088]
- **errata**: false

### player-view-R128
- **name**: Frozen Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "The target may not act on their turn and receives no bonuses from Evasion. At the end of each turn, the target may make a DC 16 Save Check to become cured."
- **dependencies**: []
- **errata**: false

### player-view-R129
- **name**: Paralysis Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "The Target's Speed Stat is lowered by 4 Combat Stages. At the beginning of each turn the target is paralyzed, they must roll a DC 5 Save Check. If they succeed, they may act normally; if they do not, they cannot take any Standard, Shift, or Swift Actions."
- **dependencies**: [player-view-R088]
- **errata**: false

### player-view-R130
- **name**: Poisoned Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "The target's Special Defense Value is lowered by 2 Combat Stages for the duration of the poison. [...] If a Poisoned Target takes a Standard Action or is prevented from taking a Standard Action, they lose a Tick of Hit Points at the end of that turn. When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round."
- **dependencies**: [player-view-R087, player-view-R088]
- **errata**: false

### player-view-R131
- **name**: Sleep Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "Sleeping Trainers and Pokemon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions that would cure Sleep. At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up. Whenever a Sleeping Pokemon takes Damage or loses life from an Attack, they wake up."
- **dependencies**: []
- **errata**: false

### player-view-R132
- **name**: Volatile Afflictions Enumeration
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Suppressed"
- **dependencies**: []
- **errata**: false

### player-view-R133
- **name**: Volatile Afflictions Cured on Recall
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls."
- **dependencies**: [player-view-R132]
- **errata**: false

### player-view-R134
- **name**: Confused Save Check
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "On a roll of 1-8, the confused target hits itself using a Typeless Physical Struggle Attack as a Standard Action and may take no other actions this turn. On a roll of 9-15, the target may act normally. On a roll of 16 or higher, the target is cured of confusion."
- **dependencies**: [player-view-R132]
- **errata**: false

### player-view-R135
- **name**: Rage Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "While enraged, the target must use a Damaging Physical or Special Move or Struggle Attack. At the end of each turn, roll a DC15 Save Check; if they succeed, they are cured of Rage."
- **dependencies**: [player-view-R132]
- **errata**: false

### player-view-R136
- **name**: Flinch Effects
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "You may not take actions during your next turn that round. The Flinched Status does not carry over onto the next round."
- **dependencies**: [player-view-R132]
- **errata**: false

### player-view-R137
- **name**: Infatuation Save Check
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "On a result of 1-10, you may not target the Pokemon or Trainer that you are Infatuated towards with a Move or Attack. On 11-18 you may use a Move and Shift without restriction. On a roll of 19 or higher, you are cured of the Infatuation."
- **dependencies**: [player-view-R132]
- **errata**: false

### player-view-R138
- **name**: Persistent Afflictions Cured on Faint
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.246
- **quote**: "All Persistent Status conditions are cured if the target is Fainted."
- **dependencies**: [player-view-R126]
- **errata**: false

### player-view-R139
- **name**: Type-Based Status Immunities
- **category**: enumeration
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.239
- **quote**: "Electric Types are immune to Paralysis; Fire Types are immune to Burn; Ghost Types cannot be Stuck or Trapped; Grass Types are immune to the effects of all Moves with the Powder Keyword; Ice Types are immune to being Frozen; Poison and Steel Types are immune to Poison."
- **dependencies**: [player-view-R126]
- **errata**: false

### player-view-R140
- **name**: Temporary Hit Points
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "Temporary Hit Points are 'bonus' health that stacks on top of 'real' Hit Points. However, Temporary Hit Points are always lost first from damage. Furthermore, Temporary Hit Points do not stack with other Temporary Hit Points - only the highest value applies."
- **dependencies**: []
- **errata**: false

### player-view-R141
- **name**: Temporary HP Does Not Count for Percentage
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.247
- **quote**: "Temporary Hit Points also do not stack with 'Real' Hit Points for the purposes of determining percentages of Hit Points."
- **dependencies**: [player-view-R140]
- **errata**: false

---

## Combat: Other Conditions (Player-Visible)

### player-view-R142
- **name**: Fainted Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Pokemon or Trainer that is at 0 Hit Points or lower is Fainted, or Knocked Out. A Fainted Pokemon or Trainer is unconscious due to injuries or other effects, and cannot use any Actions, Abilities, or Features unless the Feature or Ability specifically says otherwise."
- **dependencies**: [player-view-R002, player-view-R003]
- **errata**: false

### player-view-R143
- **name**: Fainted Recovery
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.248
- **quote**: "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves such as Wish or Heal Pulse. Potions and other healing items may still bring a Pokemon above 0 Hit Points, but it remains Fainted for another 10 minutes."
- **dependencies**: [player-view-R142]
- **errata**: false

### player-view-R144
- **name**: Blindness Effects
- **category**: condition
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Blinded Pokemon or Trainer receives a -6 penalty to Accuracy Rolls, and must make an Acrobatics Check with a DC of 10 when traveling over Rough or Slow Terrain or become Tripped."
- **dependencies**: []
- **errata**: false

### player-view-R145
- **name**: Slowed Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Pokemon that is Slowed has its Movement halved (minimum 1). This condition may be removed by switching, or at the end of a Scene as an Extended Action."
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R146
- **name**: Stuck Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move and cannot apply their Speed Evasion to attacks."
- **dependencies**: [player-view-R096]
- **errata**: false

### player-view-R147
- **name**: Trapped Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Pokemon or Trainer that is Trapped cannot be recalled."
- **dependencies**: [player-view-R060]
- **errata**: false

### player-view-R148
- **name**: Tripped Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Pokemon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions."
- **dependencies**: [player-view-R050]
- **errata**: false

### player-view-R149
- **name**: Vulnerable Condition
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.248
- **quote**: "A Vulnerable Pokemon or Trainer cannot apply Evasion of any sort against attacks."
- **dependencies**: [player-view-R007]
- **errata**: false

---

## Combat: Injuries & Death (Player-Visible)

### player-view-R150
- **name**: Injury from Massive Damage
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.250
- **quote**: "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokemon or trainer suffers Massive Damage, they gain 1 Injury."
- **dependencies**: [player-view-R073]
- **errata**: false

### player-view-R151
- **name**: Injury from Hit Point Markers
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.250
- **quote**: "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokemon or Trainer reaches one of these Hit Point values, they take 1 Injury."
- **dependencies**: [player-view-R002, player-view-R003]
- **errata**: false

### player-view-R152
- **name**: Injury Reduces Max HP
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.250
- **quote**: "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th."
- **dependencies**: [player-view-R150, player-view-R151]
- **errata**: false

### player-view-R153
- **name**: Heavily Injured Threshold
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.250
- **quote**: "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."
- **dependencies**: [player-view-R152]
- **errata**: false

### player-view-R154
- **name**: Death Conditions
- **category**: condition
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.251
- **quote**: "If a Pokemon or Trainer has 10 injuries, or goes down to either -50 Hit Points or -200% Hit Points, whichever is lower, during a non-friendly match, they die."
- **dependencies**: [player-view-R152]
- **errata**: false

### player-view-R155
- **name**: League Matches Exempt from Death by HP
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.251
- **quote**: "Generally Pokemon can hold back when instructed to, or when competing in 'friendly' or at least sportsmanlike matches such as during League events or Gym Matches - in situations like this, simply pay no heed to the -50/-200% damage rule."
- **dependencies**: [player-view-R154]
- **errata**: false

---

## Capture (Player-Initiated)

### player-view-R156
- **name**: Poke Ball Throw Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank."
- **dependencies**: [player-view-R033, player-view-R048]
- **errata**: false

### player-view-R157
- **name**: Natural 20 Capture Bonus
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll."
- **dependencies**: [player-view-R156]
- **errata**: false

### player-view-R158
- **name**: Capture Roll (Core)
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured! A natural roll of 100 always captures the target without fail."
- **dependencies**: [player-view-R156]
- **errata**: false

### player-view-R159
- **name**: Capture Rate Calculation (Core)
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "First, begin with 100. Then subtract the Pokemon's Level x2. [HP modifiers] [Evolution stage modifiers] [Rarity modifiers] [Status/Injury modifiers]"
- **dependencies**: [player-view-R158]
- **errata**: false

### player-view-R160
- **name**: Capture Rate - HP Modifiers (Core)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "If the Pokemon is above 75% Hit Points, subtract 30. If at 75% or lower, subtract 15. If at 50% or lower, unmodified. If at 25% or lower, add +15. If at exactly 1 Hit Point, add +30."
- **dependencies**: [player-view-R159]
- **errata**: false

### player-view-R161
- **name**: Capture Rate - Evolution Stage Modifiers (Core)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "If the Pokemon has two evolutions remaining, add +10. If the Pokemon has one evolution remaining, don't change. If the Pokemon has no evolutions remaining, subtract 10."
- **dependencies**: [player-view-R159]
- **errata**: false

### player-view-R162
- **name**: Capture Rate - Status/Injury Modifiers (Core)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "Persistent Conditions add +10. Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10, and Slow adds +5."
- **dependencies**: [player-view-R159]
- **errata**: false

### player-view-R163
- **name**: KO'd Pokemon Cannot Be Captured
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 05-pokemon.md p.214
- **quote**: "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them."
- **dependencies**: [player-view-R158]
- **errata**: false

### player-view-R164
- **name**: Capture Rate (Errata - d20 System)
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: errata-2.md p.8
- **quote**: "A Capture Roll is now a 1d20 roll where you aim to meet or exceed a target number. If you have gained the Amateur Trainer bonus at Level 5, add +1 to this roll. If you have gained the Capable Trainer bonus at Level 10, instead add +2 to this roll."
- **dependencies**: []
- **errata**: true

### player-view-R165
- **name**: Capture Rate Calculation (Errata)
- **category**: formula
- **scope**: core
- **actor**: system
- **ptu_ref**: errata-2.md p.8
- **quote**: "A Pokemon's base Capture Rate is 10. For each 10 Levels it has, add 1 to this Capture Rate. [...] Checklist: at/under 50% HP (-2), at/under 25% HP (-2), 5+ injuries (-4), persistent/volatile status (-2), two evolution stages remaining (-4), one evolution stage remaining (-2)."
- **dependencies**: [player-view-R164]
- **errata**: true

### player-view-R166
- **name**: Poke Ball Modifier Conversion (Errata)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: errata-2.md p.8
- **quote**: "Flip the sign on all modifiers, then divide by 5. For example, a Great Ball gives a +2 bonus to Capturing. An Ultra Ball gives +3."
- **dependencies**: [player-view-R165]
- **errata**: true

---

## Healing & Resting (Player-Initiated)

### player-view-R167
- **name**: Rest Healing Rate
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.252
- **quote**: "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **dependencies**: [player-view-R002, player-view-R003]
- **errata**: false

### player-view-R168
- **name**: Rest Blocked by Heavy Injuries
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.252
- **quote**: "A Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries."
- **dependencies**: [player-view-R167, player-view-R153]
- **errata**: false

### player-view-R169
- **name**: Natural Injury Healing
- **category**: workflow
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.252
- **quote**: "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."
- **dependencies**: [player-view-R152]
- **errata**: false

### player-view-R170
- **name**: Trainer AP Drain to Remove Injury
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.252
- **quote**: "Trainers can also remove Injuries as an Extended Action by Draining 2 AP."
- **dependencies**: [player-view-R152, player-view-R012]
- **errata**: false

### player-view-R171
- **name**: Extended Rest Definition and Effects
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.252
- **quote**: "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP. Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **dependencies**: [player-view-R126, player-view-R012]
- **errata**: false

### player-view-R172
- **name**: Pokemon Center Healing
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.252
- **quote**: "In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves. Injuries however, may delay the time spent healing. For each Injury, Healing takes an additional 30 minutes. If 5+ Injuries, it takes one additional hour per Injury instead."
- **dependencies**: [player-view-R152]
- **errata**: false

### player-view-R173
- **name**: Pokemon Center Injury Limit
- **category**: constraint
- **scope**: core
- **actor**: system
- **ptu_ref**: 07-combat.md p.252
- **quote**: "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **dependencies**: [player-view-R172]
- **errata**: false

---

## Combat: Using Items (Player Action)

### player-view-R174
- **name**: Use Item as Standard Action
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Retrieving and using an Item from a backpack or similar on a target [requires a Standard Action]."
- **dependencies**: [player-view-R048]
- **errata**: false

### player-view-R175
- **name**: Pokedex Identification
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.227
- **quote**: "Using the Pokedex to identify a Pokemon [requires a Standard Action]."
- **dependencies**: [player-view-R048]
- **errata**: false

---

## Pokemon Evolution & Training (Player-Managed)

### player-view-R176
- **name**: Evolution Workflow
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "Upon Evolving, several changes occur in a Pokemon. Take the new form's Base Stats, apply the Pokemon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokemon, spreading the Stats as you wish."
- **dependencies**: [player-view-R018, player-view-R019]
- **errata**: false

### player-view-R177
- **name**: Player May Refuse Evolution
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "You may choose not to Evolve your Pokemon if you wish."
- **dependencies**: [player-view-R176]
- **errata**: false

### player-view-R178
- **name**: Training Session Duration
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "By spending an hour Training with their Pokemon, Trainers may apply [Training] Features, teach their Pokemon Poke-Edges, trigger Class Features such as Ace Trainer, or even grant bonus Experience based on their Command Rank. A Trainer can train up to 6 Pokemon at a time."
- **dependencies**: []
- **errata**: false

### player-view-R179
- **name**: Experience Training
- **category**: formula
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.202
- **quote**: "Each day, a Trainer can also apply Experience Training to a number of Pokemon equal to their Command Rank. Pokemon that have Experience Training applied to them gain Experience equal to half their own Level, plus a bonus based on their Trainer's Command Rank."
- **dependencies**: [player-view-R178]
- **errata**: false

### player-view-R180
- **name**: Mega Evolution Trigger
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.206
- **quote**: "Mega Evolution can be triggered on either the Pokemon or the Trainer's turn as a Swift Action. Once triggered, a Mega Evolution lasts for the rest of the Scene, even if the Pokemon is knocked out. A Mega Ring can only support one Mega Evolution at a time."
- **dependencies**: [player-view-R052]
- **errata**: false

---

## Miscellaneous: Falling & Environmental (Player-Visible)

### player-view-R181
- **name**: Falling Damage Formula
- **category**: formula
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.249
- **quote**: "Weight Class 1 & 2: +1 DB per meter fallen, maximum DB 20. Weight Class 3 to 6: +2 DB per meter fallen, maximum DB 28."
- **dependencies**: [player-view-R074]
- **errata**: false

### player-view-R182
- **name**: Falling Injuries
- **category**: condition
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.249
- **quote**: "Trainers and Pokemon that fall 4 or more meters take 1 injury for every 2 meters fallen. Pokemon with natural Sky Speeds take 1 Injury for every 3 meters instead."
- **dependencies**: [player-view-R181]
- **errata**: false

### player-view-R183
- **name**: Suffocation Rules
- **category**: condition
- **scope**: situational
- **actor**: system
- **ptu_ref**: 07-combat.md p.249
- **quote**: "After 1 minute (or 6 rounds), every round a Pokemon or Trainer goes without air, they start to suffocate. Take 1 Injury per round suffocating."
- **dependencies**: [player-view-R152]
- **errata**: false

### player-view-R184
- **name**: Precision Skill Checks in Combat
- **category**: modifier
- **scope**: situational
- **actor**: player
- **ptu_ref**: 07-combat.md p.245
- **quote**: "When a Trainer or Pokemon performs such a Skill Check after having been attacked, successfully or not, in either the current or the previous round of combat, they must make a Focus Check in addition to their normal Skill Check. This Focus Check has a DC of 16."
- **dependencies**: [player-view-R026]
- **errata**: false

---

## Errata-Specific Rules

### player-view-R185
- **name**: Tutor Move Level Restrictions (Errata)
- **category**: constraint
- **scope**: core
- **actor**: player
- **ptu_ref**: errata-2.md p.9
- **quote**: "Pokemon under Level 20 may only learn Moves of an At-Will or EOT Frequency with a max Damage Base of 7. Pokemon from Level 20 to 29 may only learn Moves with up to a Scene Frequency and max Damage Base of 9. Pokemon at Level 30 and above have no restrictions when being taught Moves through Tutors."
- **dependencies**: [player-view-R015, player-view-R016]
- **errata**: true

### player-view-R186
- **name**: Mixed Power Poke Edge (Errata replaces Mixed Sweeper)
- **category**: modifier
- **scope**: situational
- **actor**: player
- **ptu_ref**: errata-2.md p.9
- **quote**: "Mixed Power: Prerequisites: Level 10, Invested at least 5 Level-Up Stat Points into both Attack and Special Attack. Cost: 2 Tutor Points. Effect: The user gains the Twisted Power Ability."
- **dependencies**: [player-view-R022]
- **errata**: true

### player-view-R187
- **name**: Basic Ranged Attacks No Level Prerequisite (Errata)
- **category**: modifier
- **scope**: situational
- **actor**: player
- **ptu_ref**: errata-2.md p.9
- **quote**: "Basic Ranged Attacks now has no Level Prerequisite."
- **dependencies**: []
- **errata**: true

### player-view-R188
- **name**: Shield Evasion Bonus Reduced (Errata)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: errata-2.md p.4
- **quote**: "Heavy Shields are removed from the system. Light Shields (now just Shields) grant a +1 Evasion bonus rather than +2."
- **dependencies**: [player-view-R007]
- **errata**: true

### player-view-R189
- **name**: Armor Damage Reduction Split (Errata)
- **category**: modifier
- **scope**: core
- **actor**: system
- **ptu_ref**: errata-2.md p.4
- **quote**: "Light Armor grants +5 Damage Reduction against Physical Damage. Special Armor grants +5 Damage Reduction against Special Damage. Heavy Armor now grants +5 Damage Reduction against all Damage."
- **dependencies**: [player-view-R076]
- **errata**: true

---

## Player Information Visibility Rules

### player-view-R190
- **name**: Player Sees Own Trainer Stats
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 02-character-creation.md p.12-16
- **quote**: "Before you begin, you'll want a blank character sheet to fill out."
- **dependencies**: [player-view-R001, player-view-R002]
- **errata**: false

### player-view-R191
- **name**: Player Assigns Pokemon Stats
- **category**: workflow
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.196
- **quote**: "The GM usually determines which Abilities a Pokemon has at their current Level in the wild as well as their Nature, but the player assigns their Stat Points when they capture a Pokemon."
- **dependencies**: [player-view-R017]
- **errata**: false

### player-view-R192
- **name**: GM Determines Wild Pokemon Abilities and Nature
- **category**: constraint
- **scope**: core
- **actor**: gm
- **ptu_ref**: 05-pokemon.md p.196
- **quote**: "The GM usually determines which Abilities a Pokemon has at their current Level in the wild as well as their Nature."
- **dependencies**: [player-view-R019, player-view-R020]
- **errata**: false

### player-view-R193
- **name**: Player Knows Own Pokemon's Moves and Abilities
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.198-200
- **quote**: "[Trainer manages Pokemon Moves, Abilities, Stats, Capabilities as part of character sheet]"
- **dependencies**: [player-view-R015, player-view-R020]
- **errata**: false

### player-view-R194
- **name**: Loyalty Hidden from Player
- **category**: constraint
- **scope**: core
- **actor**: gm
- **ptu_ref**: 05-pokemon.md p.212
- **quote**: "They may give you hints about how much a Pokemon loves you but are not obligated to tell you a Pokemon's precise Loyalty Rank."
- **dependencies**: [player-view-R023]
- **errata**: false

### player-view-R195
- **name**: Player Sees Type Effectiveness Chart
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.238
- **quote**: "This is the Type Effectiveness chart! Whenever a Move of one of the Types on the left targets a Pokemon, find its Type on the right to check for Type Effectiveness."
- **dependencies**: [player-view-R080, player-view-R081]
- **errata**: false

### player-view-R196
- **name**: Player Sees Damage Charts
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.237
- **quote**: "Below we have provided two different Damage Charts. [...] Which Chart you use is up to your GM; if combat is taking too long, consider using the Set Damage chart."
- **dependencies**: [player-view-R074]
- **errata**: false

### player-view-R197
- **name**: Player Sees Combat Stage Multiplier Table
- **category**: enumeration
- **scope**: core
- **actor**: player
- **ptu_ref**: 07-combat.md p.235
- **quote**: "Consult the chart on the right to see the multiplier for any given Combat Stage."
- **dependencies**: [player-view-R090]
- **errata**: false

---

## Pokemon Disposition (Player Interaction)

### player-view-R198
- **name**: Pokemon Disposition Scale
- **category**: enumeration
- **scope**: core
- **actor**: gm
- **ptu_ref**: 05-pokemon.md p.215
- **quote**: "Wild Pokemon have 6 different Dispositions towards Trainers or a group of Trainers, ranging from Very Friendly to Very Hostile."
- **dependencies**: []
- **errata**: false

### player-view-R199
- **name**: Charm Check to Improve Disposition
- **category**: workflow
- **scope**: situational
- **actor**: player
- **ptu_ref**: 05-pokemon.md p.215
- **quote**: "As a Standard Action, Trainers may make a Charm Check to try to improve a Wild Pokemon's Disposition one step. [...] If you fail, you cannot try again to improve your disposition through a Charm check."
- **dependencies**: [player-view-R198]
- **errata**: false

---

## Cross-Domain References

### player-view-R200
- **name**: Weather Effects on Combat
- **category**: modifier
- **scope**: cross-domain-ref
- **actor**: gm
- **ptu_ref**: 11-running-the-game.md (weather section)
- **quote**: "[Weather modifiers affect combat — Sunny, Rain, Sandstorm, Hail, Snow]"
- **dependencies**: []
- **errata**: false

### player-view-R201
- **name**: Encounter XP Rewards
- **category**: formula
- **scope**: cross-domain-ref
- **actor**: gm
- **ptu_ref**: 11-running-the-game.md (XP section)
- **quote**: "[GM distributes XP after encounters based on total levels defeated and significance multiplier]"
- **dependencies**: []
- **errata**: false

### player-view-R202
- **name**: Poke Ball Types and Modifiers
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 09-gear-and-items.md (Poke Balls section)
- **quote**: "[Various Poke Ball types with capture modifiers — Great Ball, Ultra Ball, Timer Ball, etc.]"
- **dependencies**: [player-view-R158]
- **errata**: false

### player-view-R203
- **name**: Healing Items List
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 09-gear-and-items.md (healing items section)
- **quote**: "[Potions, Super Potions, Hyper Potions, Revives, Full Restores, status healing items]"
- **dependencies**: [player-view-R174]
- **errata**: false

### player-view-R204
- **name**: Held Items
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 09-gear-and-items.md (held items section)
- **quote**: "[Pokemon can hold items that provide passive or triggered effects]"
- **dependencies**: []
- **errata**: false

### player-view-R205
- **name**: Move Data Format
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 10-indices-and-reference.md p.338+
- **quote**: "[Each Move has: Name, Type, Frequency, AC, Class (Physical/Special/Status), Range, Effect, Contest data]"
- **dependencies**: [player-view-R015]
- **errata**: false

### player-view-R206
- **name**: Ability Data Format
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 10-indices-and-reference.md p.311-335
- **quote**: "[Each Ability has: Name, Frequency/Trigger, Effect text]"
- **dependencies**: [player-view-R020]
- **errata**: false

### player-view-R207
- **name**: Trainer Class Features
- **category**: enumeration
- **scope**: cross-domain-ref
- **actor**: player
- **ptu_ref**: 04-trainer-classes.md
- **quote**: "[Trainer Classes provide Features that modify combat, Pokemon management, and non-combat capabilities]"
- **dependencies**: []
- **errata**: false

---

## Dependency Graph Summary

### Foundation Layer (no dependencies)
- R001, R003, R010, R014, R015, R019, R022, R023, R030-032, R034, R036, R038, R045, R057, R067, R087, R094, R107, R126, R132, R140, R198

### Derived Layer (depends on foundation)
- R002, R004-R008, R009, R011-R013, R017-R018, R020-R021, R024-R025, R026-R029, R033, R035, R037, R039-R044, R046-R056, R058-R066, R068-R072, R074-R079, R088-R093, R095-R106, R108-R109, R127-R131, R133-R139, R141-R149, R150-R155, R156-R163, R167-R173, R176-R179, R190-R197, R199

### Workflow/Interaction Layer (depends on derived)
- R073, R080-R086, R110-R125, R164-R166, R174-R175, R180-R189

### Cross-Domain References
- R200-R207

---

## Self-Verification Checklist

- [x] Chapter 06 (Playing the Game) — read completely, all sections extracted
- [x] Chapter 07 (Combat) — read completely (pp.226-260), all sections extracted
- [x] Chapter 05 (Pokemon) — read relevant sections (pp.196-218), player-managed rules extracted
- [x] Chapter 02 (Character Creation) — read starting stats and background rules
- [x] Errata (errata-2.md) — read completely, applied capture changes, armor/shield changes, tutor restrictions, Poke Edge changes
- [x] Every rule has an actor tag
- [x] No orphan rules (all dependencies reference existing rule IDs)
- [x] No circular dependencies
- [x] Cross-domain references marked with scope: cross-domain-ref
- [x] Errata overrides flagged with errata: true

Total rules extracted: **207** (197 core + situational rules, 8 cross-domain references, 2 capture systems — core + errata)
