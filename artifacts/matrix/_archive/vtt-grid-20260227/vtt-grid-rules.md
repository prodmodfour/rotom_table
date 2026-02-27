---
domain: vtt-grid
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 42
sources:
  - core/07-combat.md
  - core/06-playing-the-game.md
  - core/10-indices-and-reference.md
  - books/markdown/pokedexes/how-to-read.md
errata_applied: true
---

# PTU Rules: VTT Grid

## Summary
- Total rules: 42
- Categories: formula(5), condition(7), workflow(3), constraint(8), enumeration(5), modifier(8), interaction(6)
- Scopes: core(22), situational(14), edge-case(4), cross-domain-ref(2)

## Dependency Graph
- Foundation: vtt-grid-R001, vtt-grid-R002, vtt-grid-R003, vtt-grid-R004, vtt-grid-R005, vtt-grid-R006, vtt-grid-R012, vtt-grid-R013
- Derived: vtt-grid-R007 (depends on R004, R006), vtt-grid-R008 (depends on R004), vtt-grid-R009 (depends on R004), vtt-grid-R010 (depends on R001, R004), vtt-grid-R011 (depends on R004), vtt-grid-R014 (depends on R012, R013), vtt-grid-R015 (depends on R012), vtt-grid-R016 (depends on R012), vtt-grid-R017 (depends on R012), vtt-grid-R018 (depends on R001, R002), vtt-grid-R019 (depends on R004), vtt-grid-R020 (depends on R019), vtt-grid-R021 (depends on R006), vtt-grid-R022 (depends on R004), vtt-grid-R023 (depends on R022), vtt-grid-R024 (depends on R004), vtt-grid-R025 (depends on R024), vtt-grid-R026 (depends on R004), vtt-grid-R027 (depends on R004), vtt-grid-R028 (depends on R004), vtt-grid-R029 (depends on R004), vtt-grid-R030 (depends on R012, R016), vtt-grid-R031 (depends on R004), vtt-grid-R032 (depends on R001), vtt-grid-R033 (depends on R004), vtt-grid-R034 (depends on R004), vtt-grid-R035 (depends on R012, R016), vtt-grid-R036 (depends on R001), vtt-grid-R037 (depends on R004), vtt-grid-R038 (depends on R001), vtt-grid-R039 (depends on R006), vtt-grid-R040 (depends on R004)
- Workflow: vtt-grid-R041 (depends on R004, R019, R032), vtt-grid-R042 (depends on R004, R019, R032)

---

## vtt-grid-R001: Square Grid System

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Pokémon Tabletop United uses a square combat grid. However, it is a simple matter to treat distances and movement abstractly if you don't wish to use a map."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R002: Grid Scale (1 Meter Per Square)

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `pokedexes/how-to-read.md#Page 8`
- **Quote:** "On a grid, both Small and Medium Pokémon would take up one space, or a 1x1m square."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R003: Size Category Footprints

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4, but you may choose to use other shapes for Pokémon that have different body shapes such as serpents."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R004: Movement Via Shift Actions

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Movement is done with Shift Actions in combat. You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R005: Diagonal Movement Cost (Alternating 1m/2m)

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R006: Adjacency Definition

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. Cardinally Adjacent, however, does not count diagonal squares."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R007: No Split Movement

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving."
- **Dependencies:** vtt-grid-R004, vtt-grid-R006
- **Errata:** false

---

## vtt-grid-R008: Mixed Movement Capabilities

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value. For example, if a Pokémon has Overland 7 and Swim 5, they can shift a maximum of 6 meters on a turn that they use both Capabilities."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R009: Jump Capability Movement

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Using Jump Capabilities consumes distance from the main Capability used to Shift, such as Overland., or can be used as a whole Shift Action by itself."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R010: Custom Size Shapes

- **Category:** constraint
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "you may choose to use other shapes for Pokémon that have different body shapes such as serpents. As a rough guideline, create the new shape to be roughly the same number of total squares as the default shape. For example, a Steelix (Gigantic) might be 8x2 meters, twisting into different shapes as it moves on the map."
- **Dependencies:** vtt-grid-R001, vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R011: Small Pokémon Space Sharing

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `pokedexes/how-to-read.md#Page 8`
- **Quote:** "A Small Pokémon may occupy a space with up to one other Medium or Small Pokémon, or a human who is 'Medium' in size."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R012: Basic Terrain Types

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Regular Terrain: Regular Terrain is dirt, short grass, cement, smooth rock, indoor building etc. Basically anything that's easy to walk on. Shift as normal on regular terrain! [...] Earth Terrain: Earth Terrain is underground terrain that has no existing tunnel that you are trying to Shift through. You may only Shift through Earth Terrain if you have a Burrow Capability. [...] Underwater: Underwater Terrain is any water that a Pokémon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R013: Movement Capability Types

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Page 223`
- **Quote:** "Overland: Overland is a Movement Capability that defines how many meters the Pokémon may shift while on dry land. [...] Sky: The Sky Speed determines how many meters a Pokémon may shift in the air. [...] Swim: Swim is a Movement Capability that defines how quickly the Pokémon can move underwater. [...] Levitate: Levitate is a Movement Capability that defines how quickly the Pokémon moves while floating or levitating. [...] Teleporter: Teleporter is a Movement Capability that defines how far the Pokémon can travel by teleportation. [...] Burrow: The Burrow Capability determines how much a Pokémon can shift each turn while underground."
- **Dependencies:** none
- **Errata:** false

---

## vtt-grid-R014: Slow Terrain

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Slow Terrain: Slow Terrain is anywhere with enough debris or brush around so that Trainers and Pokémon are significantly slowed down. [...] When Shifting through Slow Terrain, Trainers and their Pokémon treat every square meter as two square meters instead."
- **Dependencies:** vtt-grid-R012, vtt-grid-R013
- **Errata:** false

---

## vtt-grid-R015: Rough Terrain

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Rough Terrain: Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain. [...] Squares occupied by enemies always count as Rough Terrain."
- **Dependencies:** vtt-grid-R012
- **Errata:** false

---

## vtt-grid-R016: Blocking Terrain

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Dependencies:** vtt-grid-R012
- **Errata:** false

---

## vtt-grid-R017: Naturewalk Capability

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/10-indices-and-reference.md#Page 303`
- **Quote:** "Naturewalk: Naturewalk is always listed with Terrain types in parentheses, such as Naturewalk (Forest and Grassland). Pokémon with Naturewalk treat all listed terrains as Basic Terrain."
- **Dependencies:** vtt-grid-R012
- **Errata:** false

---

## vtt-grid-R018: Flanking

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 232`
- **Quote:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion. A Small or Medium sized Trainer or Pokémon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokémon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants."
- **Dependencies:** vtt-grid-R001, vtt-grid-R002
- **Errata:** false

---

## vtt-grid-R019: Flanking — Large Combatant Multi-Square Counting

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 232`
- **Quote:** "Foes larger than Medium may occupy multiple squares – in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying. However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R020: Flanking Self-Flank Prevention

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 232`
- **Quote:** "a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."
- **Dependencies:** vtt-grid-R019
- **Errata:** false

---

## vtt-grid-R021: Melee Range (Adjacency)

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 241`
- **Quote:** "Range: Melee, 1 Target" (used consistently across all melee maneuvers — Disarm, Dirty Trick, Push, Trip, Grapple). Melee range requires adjacency per R006.
- **Dependencies:** vtt-grid-R006
- **Errata:** false

---

## vtt-grid-R022: Stuck Condition (No Movement)

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 231`
- **Quote:** "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R023: Ghost Type Stuck/Trapped Immunity

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 239`
- **Quote:** "Ghost Types cannot be Stuck or Trapped"
- **Dependencies:** vtt-grid-R022
- **Errata:** false

---

## vtt-grid-R024: Slowed Condition (Half Movement)

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 248`
- **Quote:** "Slowed: A Pokémon that is Slowed has its Movement halved (minimum 1). This condition may be removed by switching, or at the end of a Scene as an Extended Action."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R025: Tripped Condition (Stand Up Cost)

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 248`
- **Quote:** "Tripped: A Pokémon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions."
- **Dependencies:** vtt-grid-R024
- **Errata:** false

---

## vtt-grid-R026: Speed Combat Stages Affect Movement

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 235`
- **Quote:** "Combat Stages in the Speed Stat are special; they affect the movement capabilities of the Trainer or Pokémon. Quite simply, you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R027: Speed CS Movement Floor

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 235`
- **Quote:** "Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R028: Sprint Maneuver

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 242`
- **Quote:** "Maneuver: Sprint. Action: Standard. Class: Status. Range: Self. Effect: Increase your Movement Speeds by 50% for the rest of your turn."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R029: Push Maneuver

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 242`
- **Quote:** "Maneuver: Push. Action: Standard. AC: 4. Class: Status. Range: Melee, 1 Target. Effect: You and the target each make opposed Combat or Athletics Checks. If you win, the target is Pushed back 1 Meter directly away from you. If you have Movement remaining this round, you may then Move into the newly occupied Space, and Push the target again. This continues until you choose to stop, or have no Movement remaining for the round. Push may only be used against a target whose weight is no heavier than your Heavy Lifting rating."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R030: Disengage Maneuver

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 241`
- **Quote:** "Maneuver: Disengage. Action: Shift. Effect: You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity."
- **Dependencies:** vtt-grid-R012, vtt-grid-R016
- **Errata:** false

---

## vtt-grid-R031: Attack of Opportunity (Movement Trigger)

- **Category:** interaction
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Page 241`
- **Quote:** "An adjacent foe Shifts out of a Square adjacent to you." (one of several AoO triggers)
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R032: Throwing Range

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/06-playing-the-game.md#Page 223`
- **Quote:** "Trainers have a Throwing Range that determines how far they can throw Poké Balls and other small items. This Capability is equal to 4 plus their Athletics Rank in meters."
- **Dependencies:** vtt-grid-R001
- **Errata:** false

---

## vtt-grid-R033: Recall Beam Range

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 229`
- **Quote:** "A Trainer cannot Switch or Recall their Pokémon if their active Pokémon is out of range of their Poké Ball's recall beam – 8 meters."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R034: Reach Capability

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/10-indices-and-reference.md#Reach`
- **Quote:** "Reach: A Pokémon with Reach has the Range of their Melee attacks increased based on their size category; Small and Medium Pokémon may make Melee attacks from up to 2 meters away, and Large and bigger Pokémon may make Melee attacks from up to 3 meters away."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R035: Blindness Movement Penalty

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 248`
- **Quote:** "A Blinded Pokémon or Trainer [...] must make an Acrobatics Check with a DC of 10 when traveling over Rough or Slow Terrain or become Tripped."
- **Dependencies:** vtt-grid-R012, vtt-grid-R016
- **Errata:** false

---

## vtt-grid-R036: Total Blindness Movement

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Page 248`
- **Quote:** "Totally Blinded Pokémon or Trainers have no awareness of the map, and must declare any shifts as distance relative to them. [...] When making a Shift action, they must declare if they are moving Slowly or Quickly; moving Slowly restricts Movement as if Slowed. Moving Quickly has no Movement Penalty, but if the user attempts to Shift into Blocking Terrain, Rough Terrain, or Slow Terrain, they become Tripped."
- **Dependencies:** vtt-grid-R001
- **Errata:** false

---

## vtt-grid-R037: Teleporter Movement Constraints

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Page 223`
- **Quote:** "Only one teleport action can be taken during a round of combat. The Pokémon must have line of sight to the location they wish to teleport to, and they must end each teleport action touching a surface (ie it is not possible to 'chain' teleports in order to fly). [...] Teleporter cannot be increased by taking a Sprint Action."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

---

## vtt-grid-R038: Levitate Maximum Height

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/06-playing-the-game.md#Page 223`
- **Quote:** "When using the Levitate Capability, the maximum height off the ground the Pokémon can achieve is equal to half of their Levitate Capability."
- **Dependencies:** vtt-grid-R001
- **Errata:** false

---

## vtt-grid-R039: Phasing Capability

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/10-indices-and-reference.md#Phasing`
- **Quote:** "Phasing: A Pokémon with Phasing may Shift through Slow Terrain without their Speed Capabilities being affected. As a Standard action, they may turn completely Intangible. While Intangible, they cannot be targeted by Moves or attacks, cannot perform Standard Actions, and lose a Tick of Hit Points at the end of each round."
- **Dependencies:** vtt-grid-R006
- **Errata:** false

---

## vtt-grid-R040: Falling Damage By Distance and Weight

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 249`
- **Quote:** "Damage is taken as if it was a Typeless Physical Attack, with a Damage Base dependent on the distance of the fall and the weight class of the poor victim. Weight Class 1 & 2: +1 DB per meter fallen, maximum DB 20. Weight Class 3 to 6: +2 DB per meter fallen, maximum DB 28."
- **Dependencies:** vtt-grid-R004
- **Errata:** false

## Notes
Falling also causes injuries: "trainers and Pokémon that fall 4 or more meters take 1 injury for every 2 meters fallen. Pokémon with natural Sky Speeds take 1 Injury for every 3 meters instead."

---

## vtt-grid-R041: Intercept Melee (Movement-Based)

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 242`
- **Quote:** "Maneuver: Intercept Melee. Action: Full Action, Interrupt. Trigger: An ally within Movement range is hit by an adjacent foe. Effect: You must make an Acrobatics or Athletics Check, with a DC equal to three times the number of meters they have to move to reach the triggering Ally; If you succeed, you Push the triggering Ally 1 Meter away from you, and Shift to occupy their space, and are hit by the triggering attack. On Failure to make the Check, the user still Shifts a number of meters equal a third of their check result."
- **Dependencies:** vtt-grid-R004, vtt-grid-R019, vtt-grid-R032
- **Errata:** false

## Notes
"If the target that was Intercepted was hit by an Area of Effect Move, and the 1 meter push does not remove them from the Area of Effect, the Intercept has no effect since they are still in the area of the attack – it would cause the Interceptor to be hit by the Move however."

---

## vtt-grid-R042: Intercept Ranged (Movement-Based)

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Page 242`
- **Quote:** "Maneuver: Intercept Ranged. Action: Full Action, Interrupt. Trigger: A Ranged X-Target attack passes within your Movement Range. Effect: Select a Square within your Movement Range that lies directly between the source of the attack and the target of the attack. Make an Acrobatics or Athletics Check; you may Shift a number of Meters equal to half the result towards the chosen square. If you succeed, you take the attack instead of its intended target. If you fail, you still Shift a number of Meters equal to half the result."
- **Dependencies:** vtt-grid-R004, vtt-grid-R019, vtt-grid-R032
- **Errata:** false

## Notes
"Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Range Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally."
