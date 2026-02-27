---
rule_id: capture-R015
name: Status Affliction Modifier — Volatile and Injuries
category: modifier
scope: core
domain: capture
---

## capture-R015: Status Affliction Modifier — Volatile and Injuries

- **Category:** modifier
- **Scope:** core
- **PTU Ref:** `core/05-pokemon.md#Calculating Capture Rates`
- **Quote:** "Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."
- **Dependencies:** capture-R001, capture-R003
- **Errata:** false

## Notes
This rule actually contains multiple sub-modifiers: each Injury adds +5, each Volatile condition adds +5, Stuck adds +10, Slow adds +5. The Stuck and Slow bonuses are explicitly called out as separate additions on top of the Volatile/Injury bonuses.
