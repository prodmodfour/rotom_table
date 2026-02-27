---
domain: scenes
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 42
sources:
  - core/11-running-the-game.md
  - core/10-indices-and-reference.md
  - core/07-combat.md
  - core/06-playing-the-game.md
errata_applied: true
---

# PTU Rules: Scenes

## Summary
- Total rules: 42
- Categories: formula(1), condition(3), workflow(6), constraint(9), enumeration(7), modifier(7), interaction(9)
- Scopes: core(24), situational(11), edge-case(4), cross-domain-ref(3)

## Dependency Graph
- Foundation: scenes-R001, scenes-R002, scenes-R009, scenes-R016, scenes-R025, scenes-R029
- Derived: scenes-R003 (R001, R002), scenes-R004 (R001, R002), scenes-R005 (R004), scenes-R006 (R004), scenes-R007 (R002), scenes-R010 (R009), scenes-R011 (R009), scenes-R012 (R009), scenes-R013 (R009), scenes-R014 (R009), scenes-R015 (R011-R014), scenes-R017 (R016), scenes-R018 (R016), scenes-R019 (R016), scenes-R020 (R017, R018), scenes-R026 (R025), scenes-R027 (R025), scenes-R028 (R025), scenes-R030 (R029), scenes-R039 (R009), scenes-R040 (R009), scenes-R041 (R011, R014), scenes-R042 (R021)
- Workflow: scenes-R008 (R002, R007), scenes-R021 (R016, R018), scenes-R022 (R016), scenes-R023 (R022), scenes-R024 (R022), scenes-R031 (R029, R030), scenes-R032 (R001, R002, R029), scenes-R033 (R029, R030), scenes-R034 (R029), scenes-R035 (R016), scenes-R036 (R002), scenes-R037 (R029, R030), scenes-R038 (R025, R027)

---

## scenes-R001: Habitat Type Enumeration

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Habitat List`
- **Quote:** "This list is simply a compilation of the information in the Pokédex PDF on which Pokémon live in which habitats. If you're stumped on what species to populate a route or section of your world with, this makes for a handy reference."
- **Dependencies:** none
- **Errata:** false

### Values
Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Taiga, Tundra, Urban

---

## scenes-R002: Habitat Pokemon Assignment

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Habitat List`
- **Quote:** "Feel free to deviate from this list, however, if you have other ideas for where Pokémon might make their homes in your setting. For example, you might have a mountain-dwelling version of Spinarak and Ariados."
- **Dependencies:** scenes-R001
- **Errata:** false

---

## scenes-R003: Fun Game Progression

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Fun Game Progression`
- **Quote:** "There's an obvious trend in Pokémon games regarding how the populations of the various routes, forests and caves change as you go through the game – the weaker, more vanilla Pokémon appear in earlier routes, and the more powerful and advanced Pokémon only show up after a good deal of adventuring."
- **Dependencies:** scenes-R001, scenes-R002
- **Errata:** false

---

## scenes-R004: Sensible Ecosystems

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "They want their world to make sense under scrutiny, for every chosen species to have its spot in its ecosystem... you don't put water types in the middle of a desert, and you don't populate a dark cave with grass types who need sunlight to survive."
- **Dependencies:** scenes-R001, scenes-R002
- **Errata:** false

---

## scenes-R005: Energy Pyramid Population Distribution

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "Keep in mind that producers, that is, plant-life (or photosynthetic grass Pokémon perhaps!) are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes."
- **Dependencies:** scenes-R004
- **Errata:** false

---

## scenes-R006: Niche Competition

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "If both exist in one ecosystem, it's likely the Murkrow will out-compete the Spearows and the latter will go extinct... another possible result of this is, of course, adaptation. Species in a particular area may adopt traits that help them compete against and survive against otherwise better prepared species."
- **Dependencies:** scenes-R004
- **Errata:** false

---

## scenes-R007: Pokemon Hierarchies and Social Organization

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Behavior and Intelligence`
- **Quote:** "Very few Pokémon live in complete isolation. Bug Types have hive structures, many feline and canine Pokémon have packs, Flying Types have flocks, and Water Types may live in large schools of fish. These should factor into encounters you create, as some sort of leader will usually be present in a group of Pokémon."
- **Dependencies:** scenes-R002
- **Errata:** false

---

## scenes-R008: Pokemon Behavior and Intelligence

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Behavior and Intelligence`
- **Quote:** "In general, assume that a Pokemon is at least as intelligent as it needs to be to survive in its natural habitat. Predator species can tell the difference between Rattata and Nidoran, to avoid getting poisoned by the latter."
- **Dependencies:** scenes-R002, scenes-R007
- **Errata:** false

---

## scenes-R009: Weather Keyword Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather`
- **Quote:** "Moves with the Weather keyword affects an area, changing the rules of the battle. Damage can be altered and even the Effects of moves can change depending on the Weather in battle. There can only be one Weather Effect in place at a time; new Weather Effects replace old Weather Effects. Weather Conditions last 5 rounds."
- **Dependencies:** none
- **Errata:** false

---

## scenes-R010: Natural Weather vs Game Weather

- **Category:** condition
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather`
- **Quote:** "Note that despite their names, Weather Conditions are not usually found as natural occurrences. A bright and sunny day does not count as Sunny Weather, nor does rain count as Rainy Weather. However, particularly severe examples of the corresponding weather can count. For example, a tropical rainstorm could count as Rainy weather."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R011: Hail Weather Effects

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather Conditions`
- **Quote:** "Hail: While it is Hailing, all non-Ice Type Pokémon lose a Tick of Hit Points at the beginning of their turn. Blizzard cannot miss in Hail. Users with Ice Body recover a Tick of Hit Points at the beginning of each turn. Users with Snow Cloak have their Evasion increased by +2 and adjacent allies are not damaged. Users with Thermosensitive have Movement Capabilities reduced by half."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R012: Rainy Weather Effects

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather Conditions`
- **Quote:** "Rainy: While Rainy, Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty. Thunder and Hurricane cannot miss in Rain. Users with Hydration are cured of one Status Affliction at the end of each turn. Users with Rain Dish recover a Tick of Hit Points at the beginning of each turn. Users with Swift Swim have their Speed Combat Stages increased by +4. Users with Desert Weather gain 1/16th of their Max Hit Points at the end of each turn. Users with Dry Skin gain a Tick of Hit Points at the end of each turn."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R013: Sandstorm Weather Effects

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather Conditions`
- **Quote:** "Sandstorm: While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokémon lose a Tick of Hit Points at the beginning of their turn. Users with Sand Force gain a +5 Damage Bonus to Ground, Rock, and Steel-Type Moves. Users with Sand Rush have their Speed Combat Stages increased by +4. Users with Desert Weather are immune to Sandstorm."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R014: Sunny Weather Effects

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather Conditions`
- **Quote:** "Sunny: While Sunny, Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty. Thunder and Hurricane are AC 11 in Sun. Users with Dry Skin lose a Tick of Hit Points at the end of each turn. Users with Thermosensitive have their Attack and Special Attack Combat Stages increased by +2. Users with Desert Weather resist Fire-Type Moves one step further. Users with Sun Blanket gain 1/16th of their Max Hit Points at the beginning of each turn. Users with Leaf Guard are cured of one Status Affliction at the end of each turn. Users with Harvest automatically retain uses of Digestion Buffs. Users with Chlorophyll have their Speed Combat Stages increased by +4. Users with Flower Gift can create a Burst 4 that increases the Stats of allies and the user by two 2 Combat Stages, distributed as they wish."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R015: Weather-Dependent Ability Interactions

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/10-indices-and-reference.md#Weather Conditions`
- **Quote:** "Users with Forecast change their Type based on the Weather. Fire-Type if Sunny, Water-Type if Rainy, Ice-Type if Hailing, and Rock-Type if in a Sandstorm. Weather Ball changes Types in Weather. Fire-Type if Sunny, Water-Type if Rainy, Ice-Type if Hailing, and Rock-Type if in a Sandstorm."
- **Dependencies:** scenes-R011, scenes-R012, scenes-R013, scenes-R014
- **Errata:** false

---

## scenes-R016: Basic Terrain Types

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "Regular Terrain: Regular Terrain is dirt, short grass, cement, smooth rock, indoor building etc. Basically anything that's easy to walk on. Earth Terrain: Earth Terrain is underground terrain that has no existing tunnel that you are trying to Shift through. You may only Shift through Earth Terrain if you have a Burrow Capability. Underwater: Underwater Terrain is any water that a Pokémon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability."
- **Dependencies:** none
- **Errata:** false

---

## scenes-R017: Slow Terrain

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "Slow Terrain: Slow Terrain is anywhere with enough debris or brush around so that Trainers and Pokémon are significantly slowed down. Some examples of Slow Terrain are uneven earth, mud, or deep snow or water (that's not deep enough to count as 'underwater'). Even ice may count as Slow Terrain due to the need to move carefully and slowly. When Shifting through Slow Terrain, Trainers and their Pokémon treat every square meter as two square meters instead."
- **Dependencies:** scenes-R016
- **Errata:** false

---

## scenes-R018: Rough Terrain

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "Rough Terrain: Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain. Certain types of Rough Terrain may be ignored by certain Pokémon, based on their capabilities. Rough terrain includes tall grass, shrubs, rocks, or anything else that might obscure attacks. Squares occupied by enemies always count as Rough Terrain."
- **Dependencies:** scenes-R016
- **Errata:** false

---

## scenes-R019: Blocking Terrain

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Terrain`
- **Quote:** "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Dependencies:** scenes-R016
- **Errata:** false

---

## scenes-R020: Naturewalk Terrain Bypass

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Setting the Scene`
- **Quote:** "Other Pokémon would also take a penalty of 2 from targeting through Rough Terrain, but Oddish has the Naturewalk (Forest, Grassland) Capability and is not hindered by the grassy terrain."
- **Dependencies:** scenes-R017, scenes-R018
- **Errata:** false

---

## scenes-R021: Dark Cave Environment

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Use the Environment`
- **Quote:** "These caves are pitch black without light sources available, making fighting nigh impossible without Darkvision or Blindsense. Light sources help, but they can only perfectly illuminate your surroundings for a short distance around you. A standard lantern or a small or medium sized Pokémon with the Glow Capability creates a Burst 2 of light around it where you can see unimpeded. Every meter between a character and their target imposes a -2 penalty to Accuracy Rolls and Perception Checks regarding that target, but squares illuminated by light do not count toward this total."
- **Dependencies:** scenes-R016, scenes-R018
- **Errata:** false

---

## scenes-R022: Environmental Hazard Encounters

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Use the Environment`
- **Quote:** "Consider the environment the encounter takes place in. A couple of simple rules for a hazardous environment such as traps, poor visibility, or restricted movement can turn what is ordinarily a mundane and easy encounter into a real trial for the players. You can also set up scenarios where the players' actions and choices leading up to the encounter affect the final environment they fight in."
- **Dependencies:** scenes-R016
- **Errata:** false

---

## scenes-R023: Collateral Damage Environment

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Use the Environment`
- **Quote:** "Set your encounter indoors or in an area with many fragile items or innocent bystanders. Players might be more careful to use their powerful area of effect attacks if they have to keep collateral damage to a minimum. Even single target attacks such as Flamethrower can be extremely dangerous to use in a wooden shack."
- **Dependencies:** scenes-R022
- **Errata:** false

---

## scenes-R024: Arctic/Ice Environment

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Use the Environment`
- **Quote:** "A battle over a frozen lake could pose a unique challenge... The thin ice makes it dangerous to use any Pokémon of significant size – anything with a Weight Class of 5 or higher breaks the ice and falls into the lake. Groundsource attacks and other Moves at the GM's discretion also make holes in the ice in their area of effect. You could make the ice slow terrain as well to represent how one must move slowly over it."
- **Dependencies:** scenes-R022
- **Errata:** false

---

## scenes-R025: Scene Frequency Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Frequency`
- **Quote:** "Scene X: This Frequency means this Move can be performed X times per Scene. Moves that simply have the Scene Frequency without a number can be performed once a Scene. Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
- **Dependencies:** none
- **Errata:** false

---

## scenes-R026: Scene Frequency EOT Restriction

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Frequency`
- **Quote:** "Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
- **Dependencies:** scenes-R025
- **Errata:** false

---

## scenes-R027: Daily Frequency Scene Limit

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Frequency`
- **Quote:** "Daily is the lowest Frequency. This Move's Frequency is only refreshed by an Extended Rest, or by a visit to the Pokémon Center. Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."
- **Dependencies:** scenes-R025
- **Errata:** false

---

## scenes-R028: Narrative Frequency Optional Rule

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Narrative Frequency`
- **Quote:** "When the game says 'Per day', it generally refers to one in-game day. But if you play a game where there are often in-character time-skips in between days represented by sessions, or even if you would just like to keep all of those things a bit easier to track, you may want to consider putting your game on Narrative Frequency. 'Per Day' can instead be interpreted as 'Per Session'."
- **Dependencies:** scenes-R025
- **Errata:** false

### Notes
This also includes: "If you end the session in the middle of an encounter, you may also want to establish that the session 'refreshes' after you finish any encounters that are still unfinished."

---

## scenes-R029: Encounter Creation Baseline

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Basic Encounter Creation Guidelines`
- **Quote:** "One good guideline here for an everyday encounter is to multiply the average Pokémon Level of your PCs by 2 (average Trainer Level x 4 works in a pinch too given most games maintain Pokémon Levels at twice average Trainer Levels) and use that as a projected baseline Experience drop per player for the encounter... From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."
- **Dependencies:** none
- **Errata:** false

---

## scenes-R030: Significance Multiplier

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Significance Multiplier`
- **Quote:** "The Significance Multiplier should range from x1 to about x5, and there's many things to consider when picking this value. First, consider narrative significance... Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance."
- **Dependencies:** scenes-R029
- **Errata:** false

---

## scenes-R031: Quick-Stat Wild Pokemon

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Quick-Statting Pokémon`
- **Quote:** "1. Stick to 2 or 3 different species. You want to clone a few Pokémon to populate your encounter, but you don't want an encounter made entirely of one species either. 2. Pick species that are easy to stat. An ideal Pokémon for quickly statting an encounter has one attacking Stat and HP as their highest Base Stats. 3. Pick 3-4 Stats to focus on per Pokémon."
- **Dependencies:** scenes-R029, scenes-R030
- **Errata:** false

---

## scenes-R032: Wild Encounter Trigger Scenarios

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Encounter Creation Guide`
- **Quote:** "There's an ongoing fight between Pokémon on the road... Pokémon are protecting something valuable. Most wild Pokémon will leave Trainers alone, but if they're guarding eggs, children, or wounded members of their pack, they may act more aggressively... Pokémon are agitated by an external source. A Team Rocket radio broadcast might be riling up the wildlife."
- **Dependencies:** scenes-R001, scenes-R002, scenes-R029
- **Errata:** false

---

## scenes-R033: Encounter Tax vs Threat

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Types and Roles of Combat Encounters`
- **Quote:** "Broadly speaking, combat encounters can do two things to the PCs. They can Tax them or Threaten them. An encounter that Taxes the PCs most likely won't have a high chance of resulting in their defeat... However, what it does do is cost them resources... An encounter that Threatens the PCs does just what it sounds like. It threatens to defeat the PCs and result in their demise, capture, or other form of incapacitation."
- **Dependencies:** scenes-R029, scenes-R030
- **Errata:** false

---

## scenes-R034: Quick NPC Building

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Quickly Building NPCs`
- **Quote:** "Use the following process to quickly generate NPCs: Decide on Level. The easiest way to do this is simply by reference to the PCs' Levels... Choose major Classes and Features... Choose major Skills and Edges... (Optional) Distribute Combat Stats. Starting Trainers have 10 HP and 5 in the rest of their Combat Stats. They then add 10 points on top of that."
- **Dependencies:** scenes-R029
- **Errata:** false

---

## scenes-R035: Movement Capabilities

- **Category:** enumeration
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/06-playing-the-game.md#Movement Capabilities`
- **Quote:** "There are many different kinds of Movement Capabilities. The most basic Movement Capability is the Overland Capability, which measures how fast a Trainer or Pokémon can walk or run on a surface. Movement Capabilities don't generally need to be tested, although the Sprint Action may be taken as a Standard Action to increase Movement Speed by 50% for a turn."
- **Dependencies:** scenes-R016
- **Errata:** false

### Notes
Cross-domain reference to vtt-grid domain. Movement capabilities include: Overland, Swim, Sky, Levitate, Burrow, Teleporter. Each defines meters of shift per turn in their respective terrain.

---

## scenes-R036: Shiny and Variant Pokemon

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Shiny Pokémon`
- **Quote:** "'Shiny Pokémon' is a catch-all term for Pokémon with unusual characteristics. The most common kind of Shiny Pokémon are the kind that simply have a Shiny Color... Rarer 'Shiny Pokémon' are usually the result of an environmental adaptation or more extreme genetic mutation. These Pokémon may have Abilities, Capabilities, or a Moveset different from other Pokémon of their Species – some may even be of a different Type."
- **Dependencies:** scenes-R002
- **Errata:** false

---

## scenes-R037: Experience Calculation from Encounters

- **Category:** interaction
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/11-running-the-game.md#Significance Multiplier`
- **Quote:** "First, consider the levels of the enemies. Find the combined levels of all enemies in the encounter, and treat any Trainer's Level as doubled for the sake of this calculation. Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. Third, divide the Experience by the number of players gaining Experience."
- **Dependencies:** scenes-R029, scenes-R030
- **Errata:** false

### Notes
Cross-domain reference to combat domain. Full experience calculation mechanics belong there; this rule notes the connection between scene significance and experience rewards.

---

## scenes-R038: Scene Boundary and Frequency Reset

- **Category:** condition
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/10-indices-and-reference.md#Frequency`
- **Quote:** "Scene X: This Frequency means this Move can be performed X times per Scene." Combined with: "Daily is the lowest Frequency... Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."
- **Dependencies:** scenes-R025, scenes-R027
- **Errata:** false

### Notes
Cross-domain reference to combat domain. The definition of when a "scene" starts and ends is implicit in PTU — a scene encompasses one encounter/combat plus surrounding narrative. Scene-frequency moves reset between scenes. This boundary determines when limited-use abilities refresh.

---

## scenes-R039: Weather Exclusivity Constraint

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather`
- **Quote:** "There can only be one Weather Effect in place at a time; new Weather Effects replace old Weather Effects."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R040: Weather Duration Constraint

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/10-indices-and-reference.md#Weather`
- **Quote:** "Weather Conditions last 5 rounds."
- **Dependencies:** scenes-R009
- **Errata:** false

---

## scenes-R041: Frozen Status Weather Interaction

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/07-combat.md#Status Afflictions`
- **Quote:** "Save Checks to cure this condition receive a +4 Bonus in Sunny Weather, and a -2 Penalty in Hail."
- **Dependencies:** scenes-R011, scenes-R014
- **Errata:** false

### Notes
The Frozen status condition is modified by weather — Sunny makes it easier to thaw (+4 to save check DC 16), while Hail makes it harder (-2 penalty). This is a key weather-status interaction for scenes where weather is active.

---

## scenes-R042: Light Source Radii in Dark Environments

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Dark Caves`
- **Quote:** "The size and quality of the light source affects the usable radius around it. Large Pokémon with Glow and powerful artificial light sources generate a Burst 3, Huge Pokémon generate a Burst 4, and the Illuminate Ability adds 1 to the Burst radius of a light source."
- **Dependencies:** scenes-R021
- **Errata:** false
