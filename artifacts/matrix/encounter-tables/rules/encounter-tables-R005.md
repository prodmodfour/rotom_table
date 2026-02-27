---
rule_id: encounter-tables-R005
name: Experience Calculation from Encounter
category: formula
scope: core
domain: encounter-tables
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
