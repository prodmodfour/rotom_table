---
domain: capture
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 33
sources:
  - core/05-pokemon.md
  - core/07-combat.md
  - core/09-gear-and-items.md
  - core/04-trainer-classes.md
  - books/markdown/errata-2.md
errata_applied: true
---

# PTU Rules: Capture

## Summary
- Total rules: 33
- Categories: formula(7), condition(6), workflow(3), constraint(4), enumeration(3), modifier(8), interaction(2)
- Scopes: core(16), situational(12), edge-case(5)

## Dependency Graph
- Foundation: capture-R001, capture-R002, capture-R003, capture-R004, capture-R005, capture-R017, capture-R020
- Derived: capture-R006 (depends on capture-R001), capture-R007 (depends on capture-R001), capture-R008 (depends on capture-R001), capture-R009 (depends on capture-R001), capture-R010 (depends on capture-R001), capture-R011 (depends on capture-R001), capture-R012 (depends on capture-R001), capture-R013 (depends on capture-R001), capture-R014 (depends on capture-R001, capture-R002), capture-R015 (depends on capture-R001, capture-R003), capture-R016 (depends on capture-R001), capture-R018 (depends on capture-R017), capture-R019 (depends on capture-R017), capture-R021 (depends on capture-R020), capture-R022 (depends on capture-R020), capture-R023 (depends on capture-R020), capture-R024 (depends on capture-R020), capture-R025 (depends on capture-R020), capture-R026 (depends on capture-R020)
- Workflow: capture-R027 (depends on capture-R003, capture-R004, capture-R005, capture-R014), capture-R028 (depends on capture-R027, capture-R001), capture-R029 (depends on capture-R028, capture-R005)

---

## capture-R001: Capture Rate Base Formula

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "A Pokémon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity. First, begin with 100. Then subtract the Pokémon's Level x2."
- **Dependencies:** none
- **Errata:** false

## capture-R002: Persistent Status Condition Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Persistent Afflictions`
- **Quote:** "Persistent Afflictions are retained even if the Pokémon is recalled into its Poké Ball. Sleeping Pokémon will naturally awaken given time, and Frozen Pokémon can be thawed as an Extended Action after combat. Burned, Paralyzed, and Poisoned Pokémon must be treated with items or at a Pokémon Center to be cured, however."
- **Dependencies:** none
- **Errata:** false

## Notes
Persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Sleep.

## capture-R003: Volatile Status Condition Definition

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Volatile Afflictions`
- **Quote:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokémon by recalling them into their Poké Balls."
- **Dependencies:** none
- **Errata:** false

## Notes
Volatile conditions: Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep (Sleep appears in both persistent and volatile contexts), Suppressed.

## capture-R004: Throwing Accuracy Check

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Poké Balls`
- **Quote:** "Throwing Poké Balls is an AC6 Status Attack, with a range equal to the Trainer's Throwing Range: 4 plus their Athletics Rank."
- **Dependencies:** none
- **Errata:** false

## capture-R005: Capture Roll Mechanic

- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Poké Balls`
- **Quote:** "If it hits, and the Pokémon is able to be Captured, you then make a Capture Roll by rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll."
- **Dependencies:** none
- **Errata:** false

## capture-R006: HP Modifier — Above 75%

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon is above 75% Hit Points, subtract 30 from the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R007: HP Modifier — 51-75%

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon is at 75% Hit Points or lower, subtract 15 from the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R008: HP Modifier — 26-50%

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon is at 50% or lower, the Capture Rate is unmodified."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R009: HP Modifier — 1-25%

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon is at 25% Hit Points or lower, add a total of +15 to the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R010: HP Modifier — Exactly 1 HP

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "And if the Pokémon is at exactly 1 Hit Point, add a total of +30 to the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R011: Evolution Stage Modifier — Two Evolutions Remaining

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon has two evolutions remaining, add +10 to the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R012: Evolution Stage Modifier — One Evolution Remaining

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon has one evolution remaining, don't change the Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R013: Evolution Stage Modifier — No Evolutions Remaining

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "If the Pokémon has no evolutions remaining, subtract 10 from the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R014: Status Affliction Modifier — Persistent

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "And last, consider any Status Afflictions and Injuries. Persistent Conditions add +10 to the Pokémon's Capture Rate"
- **Dependencies:** capture-R001, capture-R002
- **Errata:** false

## capture-R015: Status Affliction Modifier — Volatile and Injuries

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."
- **Dependencies:** capture-R001, capture-R003
- **Errata:** false

## Notes
This rule actually contains multiple sub-modifiers: each Injury adds +5, each Volatile condition adds +5, Stuck adds +10, Slow adds +5. The Stuck and Slow bonuses are explicitly called out as separate additions on top of the Volatile/Injury bonuses.

## capture-R016: Rarity Modifier — Shiny and Legendary

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "Next, consider the Pokémon's Rarity. Shiny Pokémon subtract 10 from the Pokémon's Capture Rate. Legendary Pokémon subtract 30 from the Pokémon's Capture Rate."
- **Dependencies:** capture-R001
- **Errata:** false

## capture-R017: Fainted Cannot Be Captured

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "Pokémon reduced to 0 Hit Points or less cannot be captured. Poké Balls will simply fail to attempt to energize them."
- **Dependencies:** none
- **Errata:** false

## capture-R018: Owned Pokémon Cannot Be Captured

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Poké Balls`
- **Quote:** "And of course, Poké Balls fail to activate against owned Pokémon already registered to a Trainer and Ball!"
- **Dependencies:** capture-R017
- **Errata:** false

## capture-R019: Fainted Pokémon Capture Failsafe

- **Category:** constraint
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Poké Balls`
- **Quote:** "Poké Balls cannot ever capture a Pokémon that's been reduced to 0 Hit Points or less. The energizing process is too dangerous for seriously injured Pokémon and is thus halted by a failsafe built into all Poké Balls and Poké Ball parts sold on the market for self-assembly."
- **Dependencies:** capture-R017
- **Errata:** false

## capture-R020: Poké Ball Type Modifiers

- **Category:** enumeration
- **Scope:** core
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "Basic Ball: +0; Great Ball: -10; Ultra Ball: -15; Master Ball: -100"
- **Dependencies:** none
- **Errata:** false

## Notes
Full Poké Ball modifier chart:
- Basic Ball: +0
- Great Ball: -10
- Ultra Ball: -15
- Master Ball: -100
- Safari Ball: +0
- Level Ball: +0 (or -20 if target under half user's active Pokémon level)
- Lure Ball: +0 (or -20 if target baited)
- Moon Ball: +0 (or -20 if target evolves with Evolution Stone)
- Friend Ball: -5
- Love Ball: +0 (or -30 if active Pokémon same evo line & opposite gender)
- Heavy Ball: +0 (-5 per Weight Class above 1)
- Fast Ball: +0 (or -20 if target Movement above 7)
- Sport Ball: +0
- Premier Ball: +0
- Repeat Ball: +0 (or -20 if already own species)
- Timer Ball: +5 (-5 per round since encounter start, max -20)
- Nest Ball: +0 (or -20 if target under level 10)
- Net Ball: +0 (or -20 if target Water or Bug type)
- Dive Ball: +0 (or -20 if found underwater/underground)
- Luxury Ball: -5
- Heal Ball: -5
- Quick Ball: -20 (+5 after round 1, +10 after round 2, +20 after round 3)
- Dusk Ball: +0 (or -20 in dark/low light)
- Cherish Ball: -5
- Park Ball: -15

## capture-R021: Level Ball Condition

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "-20 Modifier if the target is under half the level your active Pokémon is."
- **Dependencies:** capture-R020
- **Errata:** false

## capture-R022: Love Ball Condition

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "-30 Modifier if the user has an active Pokémon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokémon."
- **Dependencies:** capture-R020
- **Errata:** false

## capture-R023: Timer Ball Scaling

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "+5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20."
- **Dependencies:** capture-R020
- **Errata:** false

## capture-R024: Quick Ball Decay

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "-20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3."
- **Dependencies:** capture-R020
- **Errata:** false

## Notes
Quick Ball effectively becomes: round 1: -20, round 2: -15, round 3: -10, round 4+: 0.

## capture-R025: Heavy Ball Scaling

- **Category:** formula
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "-5 Modifier for each Weight Class the target is above 1."
- **Dependencies:** capture-R020
- **Errata:** false

## capture-R026: Heal Ball Post-Capture Effect

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Ball Chart`
- **Quote:** "A caught Pokémon will heal to Max HP immediately upon capture."
- **Dependencies:** capture-R020
- **Errata:** false

## capture-R027: Capture Workflow

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Capturing Pokémon`
- **Quote:** "Typically, Capturing Pokémon is a two-step process requiring some Poké Balls. Poké Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank. [...] Once the Poké Ball hits, you must roll the Capture Roll. Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokémon's Capture Rate, the Pokémon is Captured!"
- **Dependencies:** capture-R003, capture-R004, capture-R005, capture-R014
- **Errata:** false

## Notes
Full workflow:
1. Throw Poké Ball as Standard Action (AC 6 status attack, range = 4 + Athletics Rank)
2. If missed, ball lands harmlessly behind target
3. If hit, roll 1d100 Capture Roll
4. Subtract Trainer's Level from roll
5. Apply Poké Ball type modifier to roll
6. Apply any equipment/Feature modifiers to roll
7. Compare result to Pokémon's Capture Rate
8. If roll <= Capture Rate, Pokémon is captured

## capture-R028: Natural 20 Accuracy Bonus

- **Category:** interaction
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Capturing Pokémon`
- **Quote:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll."
- **Dependencies:** capture-R027, capture-R001
- **Errata:** false

## capture-R029: Natural 100 Auto-Capture

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/05-pokemon.md#Capturing Pokémon`
- **Quote:** "A natural roll of 100 always captures the target without fail."
- **Dependencies:** capture-R028, capture-R005
- **Errata:** false

## capture-R030: Missed Ball Recovery

- **Category:** condition
- **Scope:** situational
- **PTU Ref:** `core/05-pokemon.md#Capturing Pokémon`
- **Quote:** "Poké Balls that fail to hit their target land on the terrain behind the target Pokémon harmlessly, and will usually land without breaking."
- **Dependencies:** capture-R004
- **Errata:** false

## capture-R031: Poké Ball Recall Range

- **Category:** constraint
- **Scope:** situational
- **PTU Ref:** `core/09-gear-and-items.md#Poké Balls`
- **Quote:** "Poké Balls can recall Pokémon into them from 8 meters away."
- **Dependencies:** none
- **Errata:** false

## capture-R032: Capture Is a Standard Action

- **Category:** workflow
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Standard Actions`
- **Quote:** "Throwing a Poké Ball to Capture a wild Pokémon"
- **Dependencies:** capture-R027
- **Errata:** false

## capture-R033: Accuracy Check Natural 1 Always Misses

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Accuracy`
- **Quote:** "Note that a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit. Similarly, a roll of 20 is always a hit."
- **Dependencies:** capture-R004
- **Errata:** false

---

## Cross-Domain References

### capture-XREF-001: Injury System

- **Scope:** cross-domain-ref
- **Source Domain:** combat
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Note:** Capture rate modifier (capture-R015) references injuries. Injuries are gained from Massive Damage (>=50% max HP in one hit) and Hit Point Markers (50%, 0%, -50%, -100%). Each injury reduces max HP by 1/10th. See combat domain for full injury rules.

### capture-XREF-002: Stuck and Slow Conditions

- **Scope:** cross-domain-ref
- **Source Domain:** combat
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Note:** Stuck (+10 capture rate) and Slow (+5 capture rate) are "Other Afflictions" — not true Status Afflictions. Stuck prevents Shift actions and negates Speed Evasion. Slowed halves movement. Both curable by switching or end of Scene.

### capture-XREF-003: Capture Specialist Trainer Class

- **Scope:** cross-domain-ref
- **Source Domain:** character-lifecycle
- **PTU Ref:** `core/04-trainer-classes.md#Capture Specialist`
- **Note:** Capture Specialist class provides Capture Techniques that modify capture mechanics: Snare (-10 to capture rolls for baited/stuck), Tools of the Trade (+2 accuracy with balls), Curve Ball (deals Struggle damage on ball hit), Fast Pitch (Priority ball throw), Captured Momentum (bonuses on successful capture), Gotta Catch 'Em All (swap digits on 1d100 roll), Catch Combo (capture fainted Pokemon as if 1 HP), False Strike (reduce to 1 HP instead of faint), Devitalizing Throw (inflict conditions on escape), Relentless Pursuit (interrupt fleeing).

### capture-XREF-004: Loyalty on Capture

- **Scope:** cross-domain-ref
- **Source Domain:** pokemon-lifecycle
- **PTU Ref:** `core/05-pokemon.md#Loyalty`
- **Note:** Most caught wild Pokémon begin at Loyalty 2. Friend Ball grants +1 Loyalty. Disposition and circumstances can affect starting loyalty.

### capture-XREF-005: Errata Capture Mechanic Revision

- **Scope:** cross-domain-ref
- **Source Domain:** capture
- **PTU Ref:** `books/markdown/errata-2.md#Capture Mechanic Changes`
- **Note:** The September 2015 playtest errata proposes an alternative d20-based capture system replacing the d100 system. Base Capture Rate becomes 10 + (level/10), with a checklist of -2 modifiers. Trainer level bonuses: Amateur +1, Capable +2, Veteran +3, Elite +4, Champion +5. This is PLAYTEST MATERIAL — the base 1.05 rules use the d100 system described in capture-R001 through capture-R029.

## Notes on Errata

The errata file (`errata-2.md`) contains a **playtest revision** to the capture mechanic that changes it from a d100 roll-under system to a d20 roll-over system. Key differences:

**Base 1.05 (d100 system — implemented in app):**
- Roll 1d100, subtract Trainer Level and ball modifiers
- Compare to Capture Rate (base 100 - level*2 + HP/evo/status modifiers)
- Roll under or equal = captured
- Natural 100 = auto-capture

**Errata Playtest (d20 system — NOT the default):**
- Roll 1d20, add Trainer tier bonus (+1 to +5)
- Compare to Capture Rate (base 10 + level/10 - checklist modifiers)
- Roll meets or exceeds = captured
- Checklist: <=50% HP (-2), <=25% HP (-2), 5+ injuries (-4), any status (-2), 2 evo stages remaining (-4), 1 evo stage remaining (-2)
- Rarity: GM discretion +5 to +20

The app should implement the **base 1.05 d100 system** unless the GM has opted into errata rules. The errata is clearly labeled as playtest material and subject to change.
