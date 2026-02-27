---
domain: encounter-tables
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 27
sources:
  - core/11-running-the-game.md
  - pokedexes/how-to-read.md
errata_applied: true
---

# PTU Rules: Encounter Tables

## Summary
- Total rules: 27
- Categories: formula(4), condition(0), workflow(5), constraint(5), enumeration(3), modifier(5), interaction(5)
- Scopes: core(12), situational(10), edge-case(5)

## Dependency Graph
- Foundation: R001, R002, R003, R004, R005
- Derived: R006 (depends on R001, R005), R007 (depends on R001), R008 (depends on R005), R009 (depends on R005), R010 (depends on R001), R011 (depends on R003, R004), R012 (depends on R001, R005), R013 (depends on R001, R005), R014 (depends on R001), R015 (depends on R001, R004)
- Workflow: R016 (depends on R006, R003), R017 (depends on R016, R006), R018 (depends on R016, R011), R019 (depends on R016), R020 (depends on R016, R017), R021 (depends on R006, R017), R022 (depends on R016), R023 (depends on R022), R024 (depends on R022, R023), R025 (depends on R016), R026 (depends on R016), R027 (depends on R016)

---

## encounter-tables-R001: Habitat Types Enumeration

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Habitat List`
- **Quote:** "This list is simply a compilation of the information in the Pokédex PDF on which Pokémon live in which habitats. If you're stumped on what species to populate a route or section of your world with, this makes for a handy reference. Feel free to deviate from this list, however, if you have other ideas for where Pokémon might make their homes in your setting."
- **Dependencies:** none
- **Errata:** false

### Notes
The habitat types enumerated in the rulebook are: Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Rainforest, Taiga, Tundra, Urban. These 14 habitats are the canonical set used to categorize where wild Pokemon can be found.

---

## encounter-tables-R002: Species-to-Habitat Assignment

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `pokedexes/how-to-read.md#Habitat`
- **Quote:** "There are some places that a particular Species of Pokémon will not thrive. For obvious reason, you'll only find fish-like Pokémon in the water or rocky Pokémon near rocky places. The Habitat entry explains what kind of terrain to look for if you intend to hunt for a particular Species of Pokémon. Keep in mind, just because you may be in the appropriate terrain to find a particular Pokémon, it doesn't mean you are in the right region of specific location."
- **Dependencies:** none
- **Errata:** false

### Notes
Each Pokemon species has a Habitat field in its Pokedex entry that maps to one or more of the habitat types from R001. The Chapter 11 habitat list is a compilation of all species grouped by habitat. A single species can appear in multiple habitats.

---

## encounter-tables-R003: Fun Game Progression Principle

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Fun Game Progression`
- **Quote:** "The first principle is Fun Game Progression – making sure it's enjoyable to journey through your world and the progression of Pokémon encountered from early in the campaign to later on is satisfying to the players. [...] the weaker, more vanilla Pokémon appear in earlier routes, and the more powerful and advanced Pokémon only show up after a good deal of adventuring."
- **Dependencies:** none
- **Errata:** false

---

## encounter-tables-R004: Sensible Ecosystems Principle

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "The second is Sensible Ecosystems – that is, making sure the habitats and environments make up a believable world. [...] You don't put water types in the middle of a desert, and you don't populate a dark cave with grass types who need sunlight to survive."
- **Dependencies:** none
- **Errata:** false

---

## encounter-tables-R005: Experience Calculation from Encounter

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Calculating Pokémon Experience`
- **Quote:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience."
- **Dependencies:** none
- **Errata:** false

### Notes
Formula: `(Sum of enemy levels, trainers count as 2× their level) × Significance Multiplier ÷ Number of Players = XP per player`. Fainted Pokemon CAN still gain Experience.

---

## encounter-tables-R006: Encounter Level Budget Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Basic Encounter Creation Guidelines`
- **Quote:** "One good guideline here for an everyday encounter is to multiply the average Pokémon Level of your PCs by 2 (average Trainer Level x 4 works in a pinch too given most games maintain Pokémon Levels at twice average Trainer Levels) and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."
- **Dependencies:** encounter-tables-R001, encounter-tables-R005
- **Errata:** false

### Notes
Formula: `Baseline XP per player = avg Pokemon level × 2`. `Total Level Budget = Baseline XP × number of trainers`. This budget is then distributed across enemy Pokemon. Example: 3 trainers with avg L20 Pokemon → baseline 40 XP → 120 total levels → six L20 enemies.

---

## encounter-tables-R007: Energy Pyramid / Rarity Distribution

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "producers, that is, plant-life (or photosynthetic grass Pokémon perhaps!) are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes. The Sewaddles which feed off of leaves in the forest will be much more numerous than the Pidgeys eating them which are in turn less common than higher level predators such as Sevipers."
- **Dependencies:** encounter-tables-R001
- **Errata:** false

### Notes
Rarity is inversely correlated with food chain position. Producers/herbivores are most common, apex predators are rarest. This naturally aligns with game progression since powerful Pokemon tend to be predators.

---

## encounter-tables-R008: Significance Multiplier

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Significance Multiplier`
- **Quote:** "The Significance Multiplier should range from x1 to about x5 [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance; a match against an average gym leader might merit as high as x4. A decisive battle against a Rival or in the top tiers of a tournament might be worth x5 or even higher!"
- **Dependencies:** encounter-tables-R005
- **Errata:** false

### Notes
Scale: x1–x1.5 (insignificant), x2–x3 (everyday), x4–x5+ (significant). Can also be adjusted ±x0.5–x1.5 based on challenge/difficulty independent of narrative significance.

---

## encounter-tables-R009: Difficulty Adjustment Modifier

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Significance Multiplier`
- **Quote:** "Next, consider the challenge and threat being posed. Even if a wild Pokémon doesn't have much narrative significance, a very strong wild Pokémon may be able to inflict serious damage to trainers and their Pokémon. Conversely, a fight against an unskilled Gym Leader might hardly be a challenge at all. Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge."
- **Dependencies:** encounter-tables-R005
- **Errata:** false

---

## encounter-tables-R010: Habitat Deviation Allowance

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Habitat List`
- **Quote:** "Feel free to deviate from this list, however, if you have other ideas for where Pokémon might make their homes in your setting. For example, you might have a mountain-dwelling version of Spinark and Ariados."
- **Dependencies:** encounter-tables-R001
- **Errata:** false

### Notes
The habitat list is a guideline, not a hard constraint. GMs can place Pokemon in habitats they aren't listed in, especially with type shifts or regional adaptations.

---

## encounter-tables-R011: Pseudo-Legendary Placement Constraint

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Fun Game Progression`
- **Quote:** "Save the pseudo-legendaries like Dratini and Beldum for the out of the way, difficult to reach places. In a cave system accessible only by diving underwater in a treacherous sea, for example. Or near the peaks in a mountain range filled with odd electromagnetic activity."
- **Dependencies:** encounter-tables-R003, encounter-tables-R004
- **Errata:** false

---

## encounter-tables-R012: Species Diversity per Encounter

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Quick-Statting Pokémon`
- **Quote:** "Stick to 2 or 3 different species. You want to clone a few Pokémon to populate your encounter, but you don't want an encounter made entirely of one species either. Luckily, it makes logical sense for most Pokémon to travel in packs, and you can pick species which supplement the 'main' species you select for the encounter."
- **Dependencies:** encounter-tables-R001, encounter-tables-R005
- **Errata:** false

---

## encounter-tables-R013: Niche Competition and Adaptation

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "you will also want to consider niches and competition in an ecosystem [...] In a dark forest, a Pokémon such as Murkrow may be a much more efficient predator due to its ability to blend in with its surroundings, compared to Pokémon in the Spearow line. If both exist in one ecosystem, it's likely the Murkrow will out-compete the Spearows and the latter will go extinct."
- **Dependencies:** encounter-tables-R001, encounter-tables-R005
- **Errata:** false

### Notes
Applies to habitat design: similar species in the same habitat should be differentiated via adaptation (type shifts, different abilities, changed move lists, different skill allocations, capability changes).

---

## encounter-tables-R014: Social Hierarchy in Encounters

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Pokémon Behavior and Intelligence`
- **Quote:** "you should consider Pokémon hierarchies and social organization. Very few Pokémon live in complete isolation. Bug Types have hive structures, many feline and canine Pokémon have packs, Flying Types have flocks, and Water Types may live in large schools of fish. These should factor into encounters you create, as some sort of leader will usually be present in a group of Pokémon."
- **Dependencies:** encounter-tables-R001
- **Errata:** false

### Notes
Encounters should reflect social structures: packs have leaders, hives have queens, flocks have alphas. The leader is typically a higher-level or evolved form of the group's species.

---

## encounter-tables-R015: Special Habitat Requirements

- **Category:** modifier
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Sensible Ecosystems`
- **Quote:** "many Pokémon have very weird diets and other living requirements. Magnemites, Voltorbs, and the like are probably mostly found in industrial areas, where there's enough electrical machinery from human civilization to sustain their populations. [...] Ghosts, while they do not strictly require run-down habitats, may be much more comfortable living in abandoned homes and similar places."
- **Dependencies:** encounter-tables-R001, encounter-tables-R004
- **Errata:** false

### Notes
Some species have specific environmental needs beyond their basic habitat type. Electric-types need industrial areas, Ghost-types prefer haunted/abandoned locations, Dragons may be confined to remote areas due to historical hunting.

---

## encounter-tables-R016: Encounter Creation Workflow

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Setting Up the Encounter`
- **Quote:** "The first step to crafting a combat encounter is figuring out why the players will be fighting. [...] When your players are traveling between towns, however, it can be boring to always have a pack of wild Pokémon ambush them for no reason simply so you can give the players something to fight and catch."
- **Dependencies:** encounter-tables-R006, encounter-tables-R003
- **Errata:** false

### Notes
Workflow: 1) Determine encounter purpose/narrative context → 2) Calculate level budget (R006) → 3) Select species from habitat (R001) → 4) Distribute levels across enemies → 5) Customize moves/abilities based on significance. This is a GM-driven process, not a random table roll.

---

## encounter-tables-R017: Level Distribution Across Enemies

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Basic Encounter Creation Guidelines`
- **Quote:** "For normal encounters, don't sink all of the Levels you have to work with into one or two Pokémon with extremely high Levels! But also, Levels aren't the only factor that should be affected by the Significance Multiplier. How well the enemies synergize, whether they have Egg, TM, or Tutor Moves, and how powerful the species are should vary as well."
- **Dependencies:** encounter-tables-R016, encounter-tables-R006
- **Errata:** false

### Notes
Example: 120 level budget → six L20 Pokemon (even split for casual encounter) vs. two L40 + four L25 (concentrated for important encounter). The distribution affects difficulty independently of total budget.

---

## encounter-tables-R018: Significance-Scaling Movesets

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Basic Encounter Creation Guidelines`
- **Quote:** "However, for the more important encounter, he uses Level 40 Cacturne and gives them Thunder Punch and Poison Jab to help cover their Flying and Fairy weaknesses, respectively. He also ensures they have the Twisted Power and Sand Veil Abilities."
- **Dependencies:** encounter-tables-R016, encounter-tables-R011
- **Errata:** false

### Notes
Low-significance encounters may use only Level-Up moves and basic abilities. Higher-significance encounters should feature Egg/TM/Tutor moves and strategically chosen abilities to cover weaknesses.

---

## encounter-tables-R019: Quick-Stat Workflow

- **Category:** workflow
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Quick-Statting Pokémon`
- **Quote:** "Pick species that are easy to stat. An ideal Pokémon for quickly statting an encounter has one attacking Stat and HP as their highest Base Stats or is in a position where a choice of Nature can easily make that the case. [...] Pick 3-4 Stats to focus on per Pokémon. [...] simply evenly divide Stat Points for the Pokémon among their highest 3 or 4 stats"
- **Dependencies:** encounter-tables-R016
- **Errata:** false

### Notes
Quick-stat workflow: 1) Pick 2-3 species for the encounter → 2) Choose species with clear stat profiles → 3) Distribute stat points evenly across top 3-4 stats → 4) Add level-up moves and abilities. Emergency option: distribute stats evenly across all 6 stats (weaker result).

---

## encounter-tables-R020: Action Economy Warning

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/11-running-the-game.md#Basic Encounter Creation Guidelines`
- **Quote:** "As a final bit of advice, be wary of action economy! A large swarm of low Level foes can quickly overwhelm even the strongest of parties. It's usually better to use a moderate number of foes than go in either extreme"
- **Dependencies:** encounter-tables-R016, encounter-tables-R017
- **Errata:** false

---

## encounter-tables-R021: Tax vs Threat Encounter Design

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#The Types and Roles of Combat Encounters`
- **Quote:** "Broadly speaking, combat encounters can do two things to the PCs. They can Tax them or Threaten them. An encounter that Taxes the PCs most likely won't have a high chance of resulting in their defeat [...] However, what it does do is cost them resources. [...] An encounter that Threatens the PCs does just what it sounds like. It threatens to defeat the PCs and result in their demise, capture, or other form of incapacitation."
- **Dependencies:** encounter-tables-R006, encounter-tables-R017
- **Errata:** false

### Notes
Tax encounters: widespread damage, status afflictions, injuries → resource drain. Threat encounters: high damage, longer fights, boss encounters. Designing Tax and Threat encounters in concert creates interesting player choices.

---

## encounter-tables-R022: Swarm Multiplier Scale

- **Category:** formula
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Spicing Up Encounters`
- **Quote:** "Swarm Multiplier / Size of Swarm: 1 / Less than a dozen Pokémon; 2 / 15-25 Pokémon; 3 / 25-40 Pokémon; 4 / 40-60 Pokémon; 5 / 60+ Pokémon"
- **Dependencies:** encounter-tables-R016
- **Errata:** false

---

## encounter-tables-R023: Swarm HP and Actions

- **Category:** formula
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Spicing Up Encounters`
- **Quote:** "The Swarm is treated as one entity and should be given one stat block for a Pokémon of an appropriate Level. It has a number of 'Hit Point bars' to its Swarm Multiplier. It can't suffer Injuries, but as it takes damage in battle and loses all the Hit Points in a bar, its Swarm Multiplier decreases by one each time."
- **Dependencies:** encounter-tables-R022
- **Errata:** false

---

## encounter-tables-R024: Swarm Action Economy

- **Category:** workflow
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Spicing Up Encounters`
- **Quote:** "The Swarm acts multiple times each turn in battle – it has a number of Swarm Points each turn equal to its Swarm Multiplier that it spends on actions. The first Standard Action or attack each turn is free for the Swarm. It then subtracts 5 from its Initiative and can act again on that new value. [...] At-Will actions cost 1 Swarm Point, EOT costs 2, Scene costs 3, and Daily costs 4."
- **Dependencies:** encounter-tables-R022, encounter-tables-R023
- **Errata:** false

### Notes
Additional swarm rules: Accuracy rolls against swarm get +Swarm Multiplier bonus. Single-target damage resisted one step further. AoE attacks treated as one step more super-effective. When afflicted by status (e.g., Sleep), swarm loses 1 Swarm Point instead of being fully disabled. Swarm always gets at least one action per turn.

---

## encounter-tables-R025: Environmental Encounter Modifiers

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/11-running-the-game.md#Spicing Up Encounters`
- **Quote:** "Consider the environment the encounter takes place in. A couple of simple rules for a hazardous environment such as traps, poor visibility, or restricted movement can turn what is ordinarily a mundane and easy encounter into a real trial for the players."
- **Dependencies:** encounter-tables-R016
- **Errata:** false

### Notes
Examples given: Dark caves (visibility penalties: -2 per unilluminated meter to accuracy/perception), Arctic battles (weight class 5+ breaks ice, slow terrain, acrobatics checks), Hazard factories (machinery as interactive elements). Environmental modifiers affect encounter difficulty independently of enemy levels.

---

## encounter-tables-R026: Type Shift and Variant Pokemon

- **Category:** interaction
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Defy Player Expectations`
- **Quote:** "Using the occasional Type Shift or other variants of a Pokémon can take players by surprise and turn their battle tactics upside down. [...] Type Shifts are only the start of the variations you can use to give more variety to your encounters."
- **Dependencies:** encounter-tables-R016
- **Errata:** false

### Notes
Type shifts, alternate move effects, and giant Pokemon variants are encounter design tools. Giant Pokemon: boosted stats, modified move/ability lists, appropriate size-related moves (Body Slam, Earthquake, Bounce). These modify what species can appear in an encounter beyond standard habitat lists.

---

## encounter-tables-R027: Giant Pokemon Encounter Modifier

- **Category:** modifier
- **Scope:** edge-case
- **PTU Ref:** `core/11-running-the-game.md#Spicing Up Encounters`
- **Quote:** "Larger variations of a typically small Pokémon are also great for adding unpredictability to a fight. [...] Other great candidates for making giant Pokémon are Trapinch, Magikarp, and Ditto. [...] Give giant Pokémon boosted stats and changes to their Move and Ability lists to account for their size."
- **Dependencies:** encounter-tables-R016
- **Errata:** false

---

## Cross-Domain References

### XRef-1: Wild Pokemon Stat Generation
- **Source domain:** pokemon-lifecycle
- **PTU Ref:** `core/05-pokemon.md`
- **Note:** Wild Pokemon stats (base stats, natures, abilities, moves) are determined per the pokemon-lifecycle domain rules. The encounter-tables domain determines which species appear and at what levels; the actual stat blocks use pokemon-lifecycle rules.

### XRef-2: Capture Mechanics in Encounters
- **Source domain:** capture
- **PTU Ref:** `core/11-running-the-game.md`
- **Note:** "Not all encounters with Wild Pokémon have to end in [combat]" — capture mechanics from the capture domain apply when players attempt to catch wild Pokemon encountered through this domain's systems.

### XRef-3: Combat Mechanics
- **Source domain:** combat
- **PTU Ref:** `core/07-combat.md`
- **Note:** Once an encounter is generated, combat resolution uses the full combat domain rules (initiative, damage, status, injuries, etc.).

### XRef-4: Rest and Healing Between Encounters
- **Source domain:** healing
- **PTU Ref:** `core/07-combat.md#Resting`
- **Note:** Resource taxation from encounters (HP loss, injuries, move frequency) is recovered via the healing domain's rest mechanics, which directly affects encounter pacing design.

---

## Extractor Notes

### Important Context: PTU Does NOT Define Formal Encounter Tables

The PTU 1.05 rulebook does **not** provide a mechanical system for random encounter tables. There are no:

- Weighted probability percentages for species appearance
- Density tiers (sparse/average/dense)
- Random roll encounter generation (no d100 tables, no encounter rate rolls)
- Formalized level range formulas for wild Pokemon in specific areas
- Sub-habitat modification mechanics

Instead, PTU provides:
1. **Habitat lists** — which species live where (qualitative reference data)
2. **Design principles** — fun progression + sensible ecosystems (qualitative guidance)
3. **XP-budget encounter creation** — work backwards from desired XP reward (formulaic but GM-driven)
4. **Quick-statting guidelines** — fast stat distribution for on-the-fly encounters

The app's encounter table system (weighted spawn tables, density tiers, sub-habitat modifications, level range overrides) is a **GM tooling system** that operationalizes the rulebook's qualitative guidance into structured, reusable data. The Coverage Analyzer should evaluate whether the app's implementation is *consistent with* PTU's guidance rather than checking for 1:1 rule mapping.
