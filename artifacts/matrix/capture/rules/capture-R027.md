---
rule_id: capture-R027
name: Capture Workflow
category: workflow
scope: core
domain: capture
---

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
