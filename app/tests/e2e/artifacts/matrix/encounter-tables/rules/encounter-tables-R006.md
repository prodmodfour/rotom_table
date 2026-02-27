---
rule_id: encounter-tables-R006
name: Encounter Level Budget Formula
category: formula
scope: core
domain: encounter-tables
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
