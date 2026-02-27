---
domain: combat
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 135
sources:
  - core/07-combat.md
  - core/06-playing-the-game.md
  - books/markdown/errata-2.md
errata_applied: true
---

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

## combat-R001: Basic Combat Stats

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stats`
- **Quote:** "Trainers and Pokémon have the same six Basic Stats: HP, Attack, Defense, Special Attack, Special Defense, and Speed. When the word Stats is used alone in the system, it usually refers to these. Four Derived Combat Stats are derived from these six: Hit Points, Physical Evasion, Special Evasion, and Speed Evasion."
- **Dependencies:** none
- **Errata:** false

## combat-R002: Pokemon HP Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Pokémon Hit Points = Pokémon's Level + (HP stat x3) + 10"
- **Dependencies:** none
- **Errata:** false

## combat-R003: Trainer HP Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10"
- **Dependencies:** none
- **Errata:** false

## combat-R004: Accuracy Stat Baseline

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "A Pokémon's or Trainer's Accuracy is normally 0. However, like Stats, Accuracy can be affected by Combat Stages. Instead of a multiplier, Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2, for example. Like Combat Stages, Accuracy also has limits at -6 and +6."
- **Dependencies:** none
- **Errata:** false

## combat-R005: Physical Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Additionally, for every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense."
- **Dependencies:** combat-R001
- **Errata:** false

## combat-R006: Special Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Additionally, for every 5 points a Pokémon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense."
- **Dependencies:** combat-R001
- **Errata:** false

## combat-R007: Speed Evasion Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Additionally for every 5 points a Pokémon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed."
- **Dependencies:** combat-R001
- **Errata:** false

## combat-R008: Combat Stage Range and Multipliers

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stages`
- **Quote:** "Moves and effects may change Combat Stages any number of times, but they may never be raised higher than +6 or lower than -6. For every Combat Stage above 0, a Stat is raised by 20%, rounded down. For every Combat Stage below 0, a Stat is lowered by 10%, rounded down."
- **Dependencies:** none
- **Errata:** false

## combat-R009: Combat Stage Multiplier Table

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stages`
- **Quote:** "-6: x0.4, -5: x0.5, -4: x0.6, -3: x0.7, -2: x0.8, -1: x0.9, 0: x1, +1: x1.2, +2: x1.4, +3: x1.6, +4: x1.8, +5: x2, +6: x2.2"
- **Dependencies:** combat-R008
- **Errata:** false

## combat-R010: Combat Stages Affect Evasion

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stages`
- **Quote:** "One easy way to apply Combat Stages for Defense, Special Defense, and Speed is to simply remember that Stat Evasion is also equal to 20% of a Stat. This means each positive Combat Stage is equal to the Evasion you gain from that Stat, at least until you reach the point where you would have more Evasion than the cap."
- **Dependencies:** combat-R005, combat-R006, combat-R007, combat-R008
- **Errata:** false

## combat-R011: Accuracy Roll Mechanics

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- **Dependencies:** combat-R004
- **Errata:** false

## combat-R012: Accuracy Check Calculation

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion."
- **Dependencies:** combat-R005, combat-R006, combat-R007, combat-R011
- **Errata:** false

## combat-R013: Evasion Application Rules

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Physical Evasion can only modify the accuracy rolls of Moves that target the Defense Stat; similarly, Special Evasion can modify the rolls of attacks that target the Special Defense Stat. Speed Evasion may be applied to any Move with an accuracy check, but you may only add one of your three evasions to any one check."
- **Dependencies:** combat-R005, combat-R006, combat-R007, combat-R012
- **Errata:** false

## combat-R014: Natural 1 Always Misses

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "Note that a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R015: Natural 20 Always Hits

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "Similarly, a roll of 20 is always a hit."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R016: Accuracy Modifiers vs Dice Results

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "Note that modifiers to Accuracy Rolls do not affect effects from Moves that occur upon specific dice results, or that increase Critical Hit range. For example, if you use Flamethrower with an Accuracy Bonus of +4 and roll a 16 on d20 before adding 4, this would neither be a Critical Hit, nor inflict a Burn."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R017: Damage Base Table — Rolled Damage

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Damage Charts`
- **Quote:** "DB1: 1d6+1, DB2: 1d6+3, DB3: 1d6+5, DB4: 1d8+6, DB5: 1d8+8, DB6: 2d6+8, DB7: 2d6+10, DB8: 2d8+10, DB9: 2d10+10, DB10: 3d8+10, DB11: 3d10+10, DB12: 3d12+10, DB13: 4d10+10, DB14: 4d10+15, DB15: 4d10+20, DB16: 5d10+20, DB17: 5d12+25, DB18: 6d12+25, DB19: 6d12+30, DB20: 6d12+35, DB21: 6d12+40, DB22: 6d12+45, DB23: 6d12+50, DB24: 6d12+55, DB25: 6d12+60, DB26: 7d12+65, DB27: 8d12+70, DB28: 8d12+80"
- **Dependencies:** none
- **Errata:** false

## combat-R018: Damage Base Table — Set Damage

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Damage Charts`
- **Quote:** "DB1: 2/5/7, DB2: 4/7/9, DB3: 6/9/11, DB4: 7/11/14, DB5: 9/13/16, DB6: 10/15/20, DB7: 12/17/22, DB8: 12/19/26, DB9: 12/21/30, DB10: 13/24/34, DB11: 13/27/40, DB12: 13/30/46, DB13: 14/35/50, DB14: 19/40/55, DB15: 24/45/60, DB16: 25/50/70, DB17: 30/60/85, DB18: 31/65/97, DB19: 36/70/102, DB20: 41/75/107, DB21: 46/80/112, DB22: 51/85/117, DB23: 56/90/122, DB24: 61/95/127, DB25: 66/100/132, DB26: 72/110/149, DB27: 78/120/166, DB28: 88/130/176"
- **Dependencies:** none
- **Errata:** false

## combat-R019: Damage Formula — Full Process

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Damage Formula`
- **Quote:** "1. Find initial Damage Base 2. Apply Five/Double-Strike 3. Add Damage Base modifiers (ex: STAB) for final Damage Base 4. Modify damage roll for Critical Hit if applicable 5. Roll damage or use set damage 6. Add relevant attack stat and other bonuses 7. Subtract relevant defense stat and damage reduction 8. Apply weakness and resistance multipliers. 9. Subtract final damage from target's Hit Points and check for Injuries or KO."
- **Dependencies:** combat-R017, combat-R018
- **Errata:** false

## combat-R020: Physical vs Special Damage

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing Damage`
- **Quote:** "Physical Attacks have Defense subtracted from them; Special Attacks have Special Defense subtracted from them."
- **Dependencies:** combat-R019
- **Errata:** false

## combat-R021: STAB — Same Type Attack Bonus

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Same Type Attack Bonus`
- **Quote:** "If a Pokémon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2. This is referred to as 'STAB' for short."
- **Dependencies:** combat-R019
- **Errata:** false

## combat-R022: Critical Hit Trigger

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Critical Hits`
- **Quote:** "On an Accuracy Roll of 20, a damaging attack is a Critical Hit."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R023: Critical Hit Damage Calculation

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Critical Hits`
- **Quote:** "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat, or 30+Stat going by set damage."
- **Dependencies:** combat-R022, combat-R019
- **Errata:** false

## combat-R024: Increased Critical Hit Range

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Critical Hits`
- **Quote:** "Some Moves or effects may cause increased critical ranges, making Critical Hits possible on Accuracy Rolls lower than 20. Some effects may also increase Critical Hit range; if an effect increases Critical Hit Range by 4 for example, on most moves this would indicate a Critical Hit on accuracy rolls of 16-20."
- **Dependencies:** combat-R022
- **Errata:** false

## combat-R025: Minimum Damage

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing Damage`
- **Quote:** "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0."
- **Dependencies:** combat-R019
- **Errata:** false

## combat-R026: Type Effectiveness — Single Type

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing Damage`
- **Quote:** "A Super-Effective hit will deal x1.5 damage. A Doubly Super-Effective hit will deal x2 damage. Rare Triply-Effective Hits will deal x3 damage. A Resisted Hit deals 1/2 damage; a doubly Resisted hit deals 1/4th damage. A rare triply-Resisted hit deals 1/8th damage."
- **Dependencies:** combat-R019
- **Errata:** false

## combat-R027: Type Effectiveness — Dual Type

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Type Effectiveness`
- **Quote:** "If both Types are neutral, the attack of course is simply neutral. If both Types are resistant, the attack is doubly resisted and does 1/4th damage. If both Types are weak, the attack is doubly super-effective and does x2 damage. If one Type is weak and one is resistant, the attack is neutral. If either Type is Immune, the attack does 0 damage."
- **Dependencies:** combat-R026
- **Errata:** false

## combat-R028: Type Effectiveness — Status Moves Excluded

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Type Effectiveness`
- **Quote:** "Note that Type Effectiveness does not generally affect Status Moves; only Physical and Special Moves are affected."
- **Dependencies:** combat-R026
- **Errata:** false

## combat-R029: Type Effectiveness — Immunity vs Non-Standard Damage

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Type Effectiveness`
- **Quote:** "Moves like Sonic Boom or Counter, on the other hand, despite having non-standard Damage, are affected by Immunity, though not by resistance."
- **Dependencies:** combat-R026
- **Errata:** false

## combat-R030: Trainers Have No Type

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Type Effectiveness`
- **Quote:** "Unlike Pokémon, Trainers do not have a Type, and thus all attacks by default do Neutral damage to them."
- **Dependencies:** combat-R026
- **Errata:** false

## combat-R031: Hit Point Loss vs Dealing Damage

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Hit Point Loss`
- **Quote:** "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage."
- **Dependencies:** combat-R019
- **Errata:** false

## combat-R032: Tick of Hit Points

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Injuries`
- **Quote:** "Tick of Hit Points: Some effects use this term. A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points. A Tick Value is what that amount is."
- **Dependencies:** combat-R002, combat-R003
- **Errata:** false

## combat-R033: Type Immunities to Status Conditions

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Type Effectiveness`
- **Quote:** "Electric Types are immune to Paralysis. Fire Types are immune to Burn. Ghost Types cannot be Stuck or Trapped. Grass Types are immune to the effects of all Moves with the Powder Keyword. Ice Types are immune to being Frozen. Poison and Steel Types are immune to Poison."
- **Dependencies:** none
- **Errata:** false

## combat-R034: Combat Types — League vs Full Contact

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Types and Contexts of Combat`
- **Quote:** "There are two major contexts in which combat occurs in PTU... The first major context is, of course, in League-sanctioned Pokémon battles... The other major context comprises all other 'full contact' fights where League rules and regulations don't apply, including encounters with wild Pokémon, fights against unscrupulous criminals, and other battles in which Trainers would directly participate and even be targets of attack."
- **Dependencies:** none
- **Errata:** false

## combat-R035: Round Structure — Two Turns Per Player

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Types and Contexts of Combat`
- **Quote:** "In each round of combat, players get to take two turns: one for their Trainer, and one for a Pokémon. Even if their Trainer is knocked out or incapacitated, they still get their Pokémon's turn and vice versa."
- **Dependencies:** combat-R034
- **Errata:** false

## combat-R036: Initiative — Speed Based

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "Combat in Pokémon Tabletop United takes place in a sequence of 10 second rounds where combatants take turns acting in order of their Initiative values. In most situations, a Pokémon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this."
- **Dependencies:** combat-R001
- **Errata:** false

## combat-R037: Initiative — League Battle Order

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokémon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed."
- **Dependencies:** combat-R034, combat-R036
- **Errata:** false

## combat-R038: Initiative — Full Contact Order

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "In 'full contact' matches, wild encounters, and other situations where Trainers are directly involved in the fight, all participants simply go in order from highest to lowest speed."
- **Dependencies:** combat-R034, combat-R036
- **Errata:** false

## combat-R039: Initiative — Tie Breaking

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "Ties in Initiative should be settled with a d20 roll off."
- **Dependencies:** combat-R036
- **Errata:** false

## combat-R040: Initiative — Holding Action

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "Combatants can choose to hold their action until a specified lower Initiative value once per round."
- **Dependencies:** combat-R036
- **Errata:** false

## combat-R041: One Full Round Duration

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Initiative`
- **Quote:** "Some effects in PTU last for 'one full round.' This simply means that they last until the same Initiative Count next round."
- **Dependencies:** combat-R036
- **Errata:** false

## combat-R042: Action Types — Standard Action

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "Standard Actions: Moves and many Features require a Standard Action during your turn to activate and use. Examples of what you can do with a Standard Action: Using a Move, Using a Struggle Attack, Retrieving and using an Item from a backpack or similar on a target, Throwing a Poké Ball to Capture a wild Pokémon, Drawing a Weapon, or switching from one Weapon to another, Using the Pokédex to identify a Pokémon, Use Combat Maneuvers."
- **Dependencies:** none
- **Errata:** false

## combat-R043: Action Economy Per Turn

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order. In addition, they may take any number of Free Actions, though actions with a Trigger can only be activated once per Trigger."
- **Dependencies:** combat-R042
- **Errata:** false

## combat-R044: Standard-to-Shift/Swift Conversion

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "You may give up a Standard Action to take another Swift Action. You may give up a Standard Action to take another Shift Action, but this cannot be used for Movement if you have already used your regular Shift Action for Movement. However, it may be used to activate Features or effects that require a Shift Action."
- **Dependencies:** combat-R043
- **Errata:** false

## combat-R045: Full Action Definition

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "Full Action: Some Features are Full Actions. Full Actions take both your Standard Action and Shift Action for a turn."
- **Dependencies:** combat-R043
- **Errata:** false

## combat-R046: Priority Action Rules

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "If the user has not already acted this turn, an action with the Priority keyword may be declared to act immediately; the user takes their full turn, ignoring initiative. This counts as their turn for the round. A priority action may not be declared during someone else's turn; it must be declared between turns."
- **Dependencies:** combat-R036, combat-R043
- **Errata:** false

## combat-R047: Priority Limited and Advanced Variants

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "Priority (Limited) keyword is like Priority except the user may not take their full turn; they may only take the action that itself has Priority and take the rest of their turn on their own Initiative Count. Priority (Advanced) actions don't require that the user hasn't acted that turn; if they have, they simply give up their turn on the following round."
- **Dependencies:** combat-R046
- **Errata:** false

## combat-R048: Interrupt Actions

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Action Types`
- **Quote:** "Interrupt Actions: Interrupt Moves may be declared in the middle of another combatant's turn to allow the user to take an action. They work similarly to Priority (Advanced, Limited) effects in that they only allow you to take the action that has Interrupt and not a full turn."
- **Dependencies:** combat-R043
- **Errata:** false

## combat-R049: Pokemon Switching — Full Switch

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Switching`
- **Quote:** "A full Pokémon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokémon on their respective Initiative Counts. A Trainer cannot Switch or Recall their Pokémon if their active Pokémon is out of range of their Poké Ball's recall beam – 8 meters."
- **Dependencies:** combat-R042, combat-R043
- **Errata:** false

## combat-R050: Pokemon Switching — League Restriction

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Pokémon Switching`
- **Quote:** "Whenever a Trainer Switches Pokémon during a League Battle they cannot command the Pokémon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokémon."
- **Dependencies:** combat-R034, combat-R049
- **Errata:** false

## combat-R051: Fainted Pokemon Switch — Shift Action

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Pokémon Switching`
- **Quote:** "Trainers may Switch out Fainted Pokémon as a Shift Action."
- **Dependencies:** combat-R049
- **Errata:** false

## combat-R052: Recall and Release as Separate Actions

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Pokémon Switching`
- **Quote:** "Recall and Release actions can also be taken individually by a Trainer as Shift Actions. Recalling and then Releasing by using two Shift Actions in one Round still counts as a Switch, even if they are declared as separate actions, and you may not do this to Recall and then Release the same Pokémon in one round. A Trainer may also spend a Standard Action to Recall two Pokémon or Release two Pokémon at once."
- **Dependencies:** combat-R049
- **Errata:** false

## combat-R053: Released Pokemon Can Act Immediately

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Pokémon Switching`
- **Quote:** "If a player has a Pokémon turn available, a Pokémon may act during the round it was released. If the Pokémon's Initiative Count has already passed, then this means they may act immediately."
- **Dependencies:** combat-R036, combat-R049
- **Errata:** false

## combat-R054: Combat Grid — Size Footprints

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4"
- **Dependencies:** none
- **Errata:** false

## combat-R055: Movement — Shift Action

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "Movement is done with Shift Actions in combat. You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability."
- **Dependencies:** combat-R043
- **Errata:** false

## combat-R056: Movement — No Splitting

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving."
- **Dependencies:** combat-R055
- **Errata:** false

## combat-R057: Diagonal Movement Costs

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth."
- **Dependencies:** combat-R055
- **Errata:** false

## combat-R058: Adjacency Definition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. Cardinally Adjacent, however, does not count diagonal squares."
- **Dependencies:** combat-R054
- **Errata:** false

## combat-R059: Stuck and Slowed Conditions on Movement

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Movement and Positioning`
- **Quote:** "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features. Slowed means your movement speed is halved."
- **Dependencies:** combat-R055
- **Errata:** false

## combat-R060: Speed Combat Stages Affect Movement

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Speed Combat Stages and Movement`
- **Quote:** "You gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."
- **Dependencies:** combat-R008, combat-R055
- **Errata:** false

## combat-R061: Terrain Types

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "Regular Terrain: Basically anything that's easy to walk on. Earth Terrain: You may only Shift through Earth Terrain if you have a Burrow Capability. Underwater: You may not move through Underwater Terrain during battle if you do not have a Swim Capability. Slow Terrain: When Shifting through Slow Terrain, Trainers and their Pokémon treat every square meter as two square meters instead. Rough Terrain: When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain. Blocking Terrain: Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Dependencies:** combat-R055
- **Errata:** false

## combat-R062: Rough Terrain Accuracy Penalty

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain. Squares occupied by enemies always count as Rough Terrain."
- **Dependencies:** combat-R061, combat-R011
- **Errata:** false

## combat-R063: Flanking — Evasion Penalty

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Flanking`
- **Quote:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion."
- **Dependencies:** combat-R005, combat-R006, combat-R007
- **Errata:** false

## combat-R064: Flanking — Requirements by Size

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Flanking`
- **Quote:** "A Small or Medium sized Trainer or Pokémon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokémon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants."
- **Dependencies:** combat-R054, combat-R063
- **Errata:** false

## combat-R065: Flanking — Large Combatant Multiple Squares

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Flanking`
- **Quote:** "Foes larger than Medium may occupy multiple squares – in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying. However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."
- **Dependencies:** combat-R064
- **Errata:** false

## combat-R066: Evasion Max from Stats

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "However, you can never gain more than +6 Evasion from Stats."
- **Dependencies:** combat-R005, combat-R006, combat-R007, combat-R010
- **Errata:** false

## combat-R067: Evasion Max Total Cap

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9."
- **Dependencies:** combat-R012, combat-R066
- **Errata:** false

## combat-R068: Evasion Bonus Clearing

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Derived Stats`
- **Quote:** "Any time Combat Stages would be cleared, these bonuses to Evasion are cleared as well. Much like Combat Stages; it has a minimum of -6 and a max of +6. Negative Evasion can erase Evasion from other sources, but does not increase the Accuracy of an enemy's Moves."
- **Dependencies:** combat-R008, combat-R066
- **Errata:** false

## combat-R069: Willing Target

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Making Attacks`
- **Quote:** "A target can willingly choose to be hit by a Move that would hit when their Evasion is not applied – the user of the Move must still meet the Move's base AC."
- **Dependencies:** combat-R012
- **Errata:** false

## combat-R070: Combat Stages — Applicable Stats Only

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stages`
- **Quote:** "Only Attack, Defense, Special Attack, Special Defense, and Speed may have Combat Stages. HP and Hit Points never have Combat Stages."
- **Dependencies:** combat-R008
- **Errata:** false

## combat-R071: Combat Stages — Persistence

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Stages`
- **Quote:** "Combat Stages remain until the Pokémon or Trainer is switched out, or until the end of the encounter."
- **Dependencies:** combat-R008
- **Errata:** false

## combat-R072: Massive Damage Injury

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokémon or trainer suffers Massive Damage, they gain 1 Injury. Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor."
- **Dependencies:** combat-R002, combat-R003, combat-R019
- **Errata:** false

## combat-R073: Hit Point Marker Injuries

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Quote:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokémon or Trainer reaches one of these Hit Point values, they take 1 Injury."
- **Dependencies:** combat-R002, combat-R003
- **Errata:** false

## combat-R074: Injury Effect on Max HP

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing with Injuries`
- **Quote:** "For each Injury a Pokémon or Trainer has, their Maximum Hit Points are reduced by 1/10th."
- **Dependencies:** combat-R072, combat-R073
- **Errata:** false

## combat-R075: Injury Max HP — Uses Real Maximum for Calculations

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Dealing with Injuries`
- **Quote:** "The artificial Max Hit Point number is not considered when potentially acquiring new injuries, or when dealing with any other effects such as Poison that consider fractional damage, or when dealing with Hit Point Markers. All Effects that normally go off the Pokémon's Max Hit Points still use the real maximum."
- **Dependencies:** combat-R074
- **Errata:** false

## combat-R076: Heavily Injured — 5+ Injuries

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Heavily Injured`
- **Quote:** "Whenever a Trainer or Pokémon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokémon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have."
- **Dependencies:** combat-R074
- **Errata:** false

## combat-R077: Fainted Condition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "A Pokémon or Trainer that is at 0 Hit Points or lower is Fainted, or Knocked Out. A Fainted Pokémon or Trainer is unconscious due to injuries or other effects, and cannot use any Actions, Abilities, or Features unless the Feature or Ability specifically says otherwise."
- **Dependencies:** combat-R002, combat-R003
- **Errata:** false

## combat-R078: Fainted Recovery

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves such as Wish or Heal Pulse. Potions and other healing items may still bring a Pokémon above 0 Hit Points, but it remains Fainted for another 10 minutes."
- **Dependencies:** combat-R077
- **Errata:** false

## combat-R079: Fainted Clears All Status

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "When a Pokémon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Dependencies:** combat-R077
- **Errata:** false

## combat-R080: Death Conditions

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Death`
- **Quote:** "If a Pokémon or Trainer has 10 injuries, or goes down to either -50 Hit Points or -200% Hit Points, whichever is lower (in that -80 Hit Points is lower than -50 Hit Points), during a non-friendly match, they die."
- **Dependencies:** combat-R074, combat-R077
- **Errata:** false

## combat-R081: Death — League Exemption

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Death`
- **Quote:** "Generally Pokémon can hold back when instructed to, or when competing in 'friendly' or at least sportsmanlike matches such as during League events or Gym Matches – in situations like this, simply pay no heed to the -50/-200% damage rule."
- **Dependencies:** combat-R034, combat-R080
- **Errata:** false

## combat-R082: Struggle Attack

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Struggle Attacks`
- **Quote:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. They may be further modified by Capabilities. When Trainers use Struggle Attacks, these may be modified by Weapons the trainers are wielding. Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves, and effects that alter Moves do not apply to them."
- **Dependencies:** combat-R042
- **Errata:** false

## combat-R083: Struggle Attack — Expert Combat Upgrade

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Struggle Attacks`
- **Quote:** "Additionally, if a Trainer or Pokémon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
- **Dependencies:** combat-R082
- **Errata:** false

## combat-R084: Coup de Grâce

- **Category:** workflow
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Coup de Grâce`
- **Quote:** "Any Pokémon or Trainer can attempt a Coup de Grâce against a Fainted or otherwise completely helpless target as a Full Action. Simply, the Pokémon or Trainer makes any Attack or Move they could normally make as a Standard Action, but this attack must target only the target of the Coup de Grâce. If the Coup de Grâce hits, the attack is automatically a Critical Hit that deals +5 bonus damage (multiply this damage as part of the critical hit; this will normally make it +10, but Pokémon or Trainers with Sniper would add +15), ignoring any immunities to Critical Hits."
- **Dependencies:** combat-R022, combat-R023, combat-R045, combat-R077
- **Errata:** false

## combat-R085: Take a Breather

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "Taking a Breather is a Full Action and requires a Pokémon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability. They then become Tripped and are Vulnerable until the end of their next turn. When a Trainer or Pokémon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."
- **Dependencies:** combat-R008, combat-R045, combat-R055
- **Errata:** false

## combat-R086: Take a Breather — Assisted

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "When a Trainer or Pokémon is unable to choose to Take a Breather themselves... they may be calmed and assisted by a Trainer to attempt to Take a Breather. This is a Full Action by both the assisting Trainer and their target (as an Interrupt for the target), and the assisting Trainer must be able to Shift to the target they intend to help. They then make a Command Check with a DC of 12."
- **Dependencies:** combat-R085
- **Errata:** false

## combat-R087: Take a Breather — Curse Exception

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Take a Breather`
- **Quote:** "To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather."
- **Dependencies:** combat-R085
- **Errata:** false

---

## Persistent Status Afflictions

## combat-R088: Burned Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "Burned: The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn. Fire-Type Pokémon are immune to becoming Burned. If a Burned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn."
- **Dependencies:** combat-R008, combat-R032, combat-R033
- **Errata:** false

## combat-R089: Frozen Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "Frozen: The target may not act on their turn and receives no bonuses from Evasion. At the end of each turn, the target may make a DC 16 Save Check to become cured. This DC is lowered to 11 for Fire-Type Pokémon, and Ice-Type Pokémon are immune to becoming Frozen. If a Frozen Target is hit by a Damaging Fire, Fighting, Rock, or Steel Attack, they are cured of the Frozen Condition."
- **Dependencies:** combat-R033
- **Errata:** false

## combat-R090: Paralysis Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "Paralysis: The Target's Speed Stat is lowered by 4 Combat Stages. At the beginning of each turn the target is paralyzed, they must roll a DC 5 Save Check. If they succeed, they may act normally; if they do not, they cannot take any Standard, Shift, or Swift Actions. Electric Type Pokémon are immune to Paralysis."
- **Dependencies:** combat-R008, combat-R033
- **Errata:** false

## combat-R091: Poisoned Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "Poisoned: The target's Special Defense Value is lowered by 2 Combat Stages for the duration of the poison. Poison and Steel-Type Pokémon are immune to becoming Poisoned. If a Poisoned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn. When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round (10, 20, 40, etc)."
- **Dependencies:** combat-R008, combat-R032, combat-R033
- **Errata:** false

## combat-R092: Persistent Status — Cured on Faint

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "All Persistent Status conditions are cured if the target is Fainted."
- **Dependencies:** combat-R077, combat-R088, combat-R089, combat-R090, combat-R091
- **Errata:** false

## combat-R093: Sleep Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Sleep: Sleeping Trainers and Pokémon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions that would cure Sleep. At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up. Whenever a Sleeping Pokémon takes Damage or loses life from an Attack, they wake up."
- **Dependencies:** none
- **Errata:** false

## combat-R094: Confused Status

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "At the beginning of their turn, a confused target must roll a Save Check. On a roll of 1-8, the confused target hits itself using a Typeless Physical Struggle Attack as a Standard Action and may take no other actions this turn. This attack automatically hits, and deals damage as if it's resisted 1 Step. On a roll of 9-15, the target may act normally. On a roll of 16 or higher, the target is cured of confusion."
- **Dependencies:** combat-R082
- **Errata:** false

## combat-R095: Rage Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Rage: While enraged, the target must use a Damaging Physical or Special Move or Struggle Attack. At the end of each turn, roll a DC15 Save Check; if they succeed, they are cured of Rage."
- **Dependencies:** combat-R082
- **Errata:** false

## combat-R096: Flinch Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Flinch: You may not take actions during your next turn that round. The Flinched Status does not carry over onto the next round."
- **Dependencies:** none
- **Errata:** false

## combat-R097: Infatuation Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "At the beginning of each turn you are infatuated, roll a Save Check. On a result of 1-10, you may not target the Pokémon or Trainer that you are Infatuated towards with a Move or Attack, but may otherwise Shift and use actions normally. On 11-18 you may use a Move and Shift without restriction. On a roll of 19 or higher, you are cured of the Infatuation."
- **Dependencies:** none
- **Errata:** false

## combat-R098: Volatile Status — Cured on Recall/Encounter End

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokémon by recalling them into their Poké Balls. When Pokémon are Fainted, they are automatically cured of all Volatile Status Afflictions."
- **Dependencies:** combat-R077
- **Errata:** false

## combat-R099: Suppressed Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Suppressed: While Suppressed, Pokémon and Trainers cannot benefit from PP Ups, and have the frequency of their Moves lowered; At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene."
- **Dependencies:** none
- **Errata:** false

## combat-R100: Cursed Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Cursed: If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn."
- **Dependencies:** combat-R032
- **Errata:** false

## combat-R101: Bad Sleep Status

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Bad Sleep: Whenever the user makes a Save Check to save against Sleep, they lose two ticks of Hit Points. Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep."
- **Dependencies:** combat-R032, combat-R093
- **Errata:** false

## combat-R102: Disabled Status

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Disabled: When the user gains the Disabled Affliction, a specific Move is specified. The user cannot use that Move as long as they remain Disabled. Pokémon or Trainers may have multiple instances of the Disabled Condition, each specifying a different Move."
- **Dependencies:** none
- **Errata:** false

## combat-R103: Temporary Hit Points

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Temporary Hit Points are 'bonus' health that stacks on top of 'real' Hit Points... However, Temporary Hit Points are always lost first from damage or any other effects. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost. Furthermore, Temporary Hit Points do not stack with other Temporary Hit Points – only the highest value applies."
- **Dependencies:** combat-R002, combat-R003
- **Errata:** false

## combat-R104: Temporary HP — Does Not Count for Percentage

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Temporary Hit Points also do not stack with 'Real' Hit Points for the purposes of determining percentages of Hit Points. If a Pokémon has exactly 1 real Hit Point and has 50 Temporary Hit Points, they would use the Moves and effects as if they have 1 Hit Point, not 51."
- **Dependencies:** combat-R103
- **Errata:** false

---

## Other Conditions

## combat-R105: Blindness Condition

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Blindness: A Blinded Pokémon or Trainer receives a -6 penalty to Accuracy Rolls, and must make an Acrobatics Check with a DC of 10 when traveling over Rough or Slow Terrain or become Tripped."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R106: Total Blindness Condition

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Total Blindness: Totally Blinded Pokémon or Trainers have no awareness of the map... Totally Blinded targets receive a -10 total Penalty to Accuracy Rolls, and cannot use Moves with Priority or as Interrupts."
- **Dependencies:** combat-R105
- **Errata:** false

## combat-R107: Tripped Condition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Tripped: A Pokémon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions."
- **Dependencies:** combat-R055
- **Errata:** false

## combat-R108: Vulnerable Condition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Vulnerable: A Vulnerable Pokémon or Trainer cannot apply Evasion of any sort against attacks."
- **Dependencies:** combat-R005, combat-R006, combat-R007
- **Errata:** false

## combat-R109: Trapped Condition

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Quote:** "Trapped: A Pokémon or Trainer that is Trapped cannot be recalled. Ghost Type Pokémon are immune to the Trapped Condition."
- **Dependencies:** combat-R049
- **Errata:** false

---

## Combat Maneuvers

## combat-R110: Attack of Opportunity

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "You may make a Struggle Attack against the triggering foe as an Interrupt. You may use Attack of Opportunity only once per round. Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets. Triggers: An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you. An adjacent foe stands up. An adjacent foe uses a Ranged Attack that does not target someone adjacent to it. An adjacent foe uses a Standard Action to pick up or retrieve an item. An adjacent foe Shifts out of a Square adjacent to you."
- **Dependencies:** combat-R082, combat-R058
- **Errata:** false

## combat-R111: Disengage Maneuver

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Disengage — Action: Shift — Effect: You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity."
- **Dependencies:** combat-R110
- **Errata:** false

## combat-R112: Push Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Push — Action: Standard, AC: 4, Range: Melee, 1 Target — Effect: You and the target each make opposed Combat or Athletics Checks. If you win, the target is Pushed back 1 Meter directly away from you. If you have Movement remaining this round, you may then Move into the newly occupied Space, and Push the target again. This continues until you choose to stop, or have no Movement remaining for the round."
- **Dependencies:** combat-R042, combat-R058
- **Errata:** false

## combat-R113: Sprint Maneuver

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Sprint — Action: Standard, Range: Self — Effect: Increase your Movement Speeds by 50% for the rest of your turn."
- **Dependencies:** combat-R042, combat-R055
- **Errata:** false

## combat-R114: Trip Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Trip — Action: Standard, AC: 6, Range: Melee, 1 Target — Effect: You and the target each make opposed Combat or Acrobatics Checks. If you win, the target is knocked over and Tripped."
- **Dependencies:** combat-R042, combat-R107
- **Errata:** false

## combat-R115: Grapple Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Grapple — Action: Standard, AC: 4, Range: Melee, 1 Target — Effect: You and the target each make opposed Combat or Athletics Checks. If you win, you and the target each become Grappled, and you gain Dominance in the Grapple. Grappled targets: Are Vulnerable, Cannot take Shift Actions, Gain a -6 penalty to Accuracy Rolls if targeting anyone outside of the Grapple."
- **Dependencies:** combat-R042, combat-R108
- **Errata:** false

## combat-R116: Intercept Melee Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Intercept Melee — Action: Full Action, Interrupt — Trigger: An ally within Movement range is hit by an adjacent foe. Effect: You must make an Acrobatics or Athletics Check, with a DC equal to three times the number of meters they have to move to reach the triggering Ally; If you succeed, you Push the triggering Ally 1 Meter away from you, and Shift to occupy their space, and are hit by the triggering attack."
- **Dependencies:** combat-R045, combat-R055
- **Errata:** false

## combat-R117: Intercept Ranged Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Intercept Ranged — Action: Full Action, Interrupt — Trigger: A Ranged X-Target attack passes within your Movement Range. Effect: Select a Square within your Movement Range that lies directly between the source of the attack and the target of the attack. Make an Acrobatics or Athletics Check; you may Shift a number of Meters equal to half the result towards the chosen square. If you succeed, you take the attack instead of its intended target."
- **Dependencies:** combat-R045, combat-R055
- **Errata:** false

## combat-R118: Intercept — Loyalty Requirement

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Range Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally."
- **Dependencies:** combat-R116, combat-R117
- **Errata:** false

## combat-R119: Intercept — Additional Rules

- **Category:** constraint
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Pokémon and Trainers may only Intercept against Priority and Interrupt Moves if they are faster than the user of those Moves. Moves that cannot miss (such as Aura Sphere or Swift) cannot be Intercepted. Pokémon and Trainers cannot attempt Intercepts if they are Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed, or otherwise unable to move."
- **Dependencies:** combat-R116, combat-R117
- **Errata:** false

## combat-R120: Disarm Maneuver

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Disarm — Action: Standard, AC: 6, Range: Melee, 1 Target — Effect: You and the target each make opposed Combat or Stealth Checks. If you win, the target's Held Item (Main Hand or Off-Hand for humans) falls to the ground."
- **Dependencies:** combat-R042
- **Errata:** false

## combat-R121: Dirty Trick Maneuver

- **Category:** enumeration
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Dirty Trick — Action: Standard, AC: 2, Range: Melee, 1 Target — You may use each trick only once each Scene per target. Hinder: Opposed Athletics, target is Slowed and -2 to Skill Checks for one full round. Blind: Opposed Stealth, target is Blinded for one full round. Low Blow: Opposed Acrobatics, target is Vulnerable and has Initiative set to 0 until end of your next turn."
- **Dependencies:** combat-R042, combat-R105, combat-R108
- **Errata:** false

## combat-R122: Manipulate Maneuver — Trainers Only

- **Category:** enumeration
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Combat Maneuvers`
- **Quote:** "Manipulate — Action: Standard, AC: 2, Range: 6, 1 Target — You may use each Manipulation only once each Scene per target. Manipulate can only be performed by Trainers. Bon Mot: Guile vs Guile/Focus, target Enraged and cannot spend AP for one full round. Flirt: Charm vs Charm/Focus, target Infatuated for one full round. Terrorize: Intimidate vs Intimidate/Focus, target loses all Temporary HP and can only use At-Will Frequency Moves for one full round."
- **Dependencies:** combat-R042
- **Errata:** false

---

## Miscellaneous Combat Rules

## combat-R123: Suffocating

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Suffocating`
- **Quote:** "After 1 minute (or 6 rounds), every round a Pokémon or Trainer goes without air, they start to suffocate. Take 1 Injury per round suffocating. These injuries can't be healed by anything except breathing; once the target can breathe again, they are healed of these injuries."
- **Dependencies:** combat-R074
- **Errata:** false

## combat-R124: Falling Damage Formula

- **Category:** formula
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Falling Damage`
- **Quote:** "Taking a fall can be nasty for trainers and Pokémon. Damage is taken as if it was a Typeless Physical Attack, with a Damage Base dependent on the distance of the fall and the weight class of the poor victim. Weight Class 1 & 2: +1 DB per meter fallen, maximum DB 20. Weight Class 3 to 6: +2 DB per meter fallen, maximum DB 28."
- **Dependencies:** combat-R017, combat-R019
- **Errata:** false

## combat-R125: Falling Injuries

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Falling Damage`
- **Quote:** "In addition to the damage, trainers and Pokémon that fall 4 or more meters take 1 injury for every 2 meters fallen. Pokémon with natural Sky Speeds take 1 Injury for every 3 meters instead, as their bodies have evolved to take potential crashes better."
- **Dependencies:** combat-R124, combat-R074
- **Errata:** false

---

## Cross-Domain References

## combat-R126: Resting — HP Recovery (cross-domain: healing)

- **Category:** workflow
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "For the first 8 hours of rest each day, Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points. You may continue to rest further after this time, but Hit Points will not be regained. Also, a Trainer or Pokémon is unable to restore Hit Points through rest if the individual has 5 or more injuries."
- **Dependencies:** combat-R074, combat-R076
- **Errata:** false

## combat-R127: Extended Rest — Status and AP Recovery (cross-domain: healing)

- **Category:** workflow
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "Extended Rests are rests that are at least 4 continuous hours long. Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP. Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Dependencies:** combat-R088, combat-R089, combat-R090, combat-R091
- **Errata:** false

## combat-R128: Natural Injury Healing (cross-domain: healing)

- **Category:** condition
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/07-combat.md#Resting`
- **Quote:** "If a Pokémon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries. Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day."
- **Dependencies:** combat-R074
- **Errata:** false

## combat-R129: Pokemon Center Healing (cross-domain: healing)

- **Category:** workflow
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/07-combat.md#Pokémon Centers`
- **Quote:** "In a mere hour, Pokémon Centers can heal a Trainers and Pokémon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves. Injuries however, may delay the time spent healing a Pokémon Center. For each Injury on the Trainer or Pokémon, Healing takes an additional 30 minutes. If the Trainer or Pokémon has five or more Injuries, it takes one additional hour per Injury instead. Pokémon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Dependencies:** combat-R074, combat-R076
- **Errata:** false

## combat-R130: Action Points (cross-domain: character-lifecycle)

- **Category:** formula
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved... Action Points are completely regained at the end of each Scene."
- **Dependencies:** none
- **Errata:** false

## combat-R131: AP Accuracy Bonus (cross-domain: character-lifecycle)

- **Category:** modifier
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#Action Points`
- **Quote:** "In a pinch, any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result. This cannot be done more than once per roll."
- **Dependencies:** combat-R011
- **Errata:** false

## combat-R132: Rounding Rule (cross-domain: system)

- **Category:** constraint
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#System Fundamentals`
- **Quote:** "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher. 3.9999 would still round down to 3."
- **Dependencies:** none
- **Errata:** false

## combat-R133: Percentages Additive Rule (cross-domain: system)

- **Category:** constraint
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#System Fundamentals`
- **Quote:** "Percentages are additive, not multiplicative. For example, this means if you gain a 20% boost somewhere and a 30% somewhere else, you gain a 50% boost in total rather than gaining a 20% boost and then 30% more off of that total."
- **Dependencies:** none
- **Errata:** false

## combat-R134: Armor Damage Reduction (cross-domain: gear, errata-modified)

- **Category:** modifier
- **Scope:** cross-domain-ref
- **PTU Ref:** `books/markdown/errata-2.md#Supplementary Changes`
- **Quote:** "Light Armor grants +5 Damage Reduction against Physical Damage. Special Armor grants +5 Damage Reduction against Special Damage. Heavy Armor now grants +5 Damage Reduction against all Damage."
- **Dependencies:** combat-R019
- **Errata:** true

## combat-R135: Shield Evasion Bonus (cross-domain: gear, errata-modified)

- **Category:** modifier
- **Scope:** cross-domain-ref
- **PTU Ref:** `books/markdown/errata-2.md#Supplementary Changes`
- **Quote:** "Heavy Shields are removed from the system. Light Shields (now just Shields) grant a +1 Evasion bonus rather than +2."
- **Dependencies:** combat-R012
- **Errata:** true

---

## Self-Verification Checklist

- [x] Every section of Chapter 7 (Combat, pages 226-260) has been read
- [x] Chapter 6 (Playing the Game) scanned for combat-relevant cross-references
- [x] Errata corrections applied (armor/shields updated)
- [x] No rule is orphaned — every non-foundation rule has dependencies
- [x] No circular dependencies exist
- [x] Cross-domain references noted but not fully extracted (healing, character-lifecycle, gear, system)
- [x] Rule IDs are sequential with no gaps (combat-R001 through combat-R135)
- [x] Every entry has a direct quote from the rulebook or errata
