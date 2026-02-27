---
rule_id: pokemon-lifecycle-R068
name: Mega Evolution - Constraints
category: constraint
scope: edge-case
domain: pokemon-lifecycle
---

## pokemon-lifecycle-R068: Mega Evolution - Constraints

- **Category:** constraint
- **Scope:** edge-case
- **PTU Ref:** `core/05-pokemon.md#Mega Evolution`
- **Quote:** "Once triggered, a Mega Evolution lasts for the rest of the Scene, even if the Pokémon is knocked out. A Mega Ring can only support one Mega Evolution at a time, meaning once a Trainer Mega Evolves a Pokémon, they can't Mega Evolve any others for the rest of the Scene. [...] Mega Stones cannot be removed from their users once Mega Evolution has been activated"
- **Dependencies:** pokemon-lifecycle-R066
- **Errata:** false

---

## Notes

### Rounding Rule (Cross-Domain)
From `core/06-playing-the-game.md#System Fundamentals`: "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher." This applies to all formulas in this domain (HP, evasion, experience, etc.).

### Starter Pokemon Guidelines
From `core/02-character-creation.md` and `core/11-running-the-game.md#Starter Pokémon`: Starter Pokemon are typically Level 5 or 10, commonly with three evolutionary stages. The GM may allow players to choose Ability, Gender, and Nature. These are GM guidelines, not mechanical rules — no formula or constraint to extract.

### Baby Template (Optional)
From `core/05-pokemon.md#Optional Rule: Baby Template`: "subtract 2, 3, or even 4 from each of the Pokémon's Base Stats, lower each of their Skills one Rank, and lower their Capabilities by 2. [...] every 5 levels, they gain +1 to each of their Base Stats." This is an explicitly optional rule and not part of the standard pokemon lifecycle.

### Fossil Pokemon
From `core/05-pokemon.md#Pokémon Fossils`: Fossil eggs hatch at Level 10 with traits determined by GM. Requires Paleontologist Edge. This is narrative/GM-discretion content rather than a mechanical rule with extractable formulas.

### Fishing
From `core/05-pokemon.md#Fishing`: Three rod types (Old: unevolved ≤L10, Good: unevolved any level, Super: any). Roll mechanics (1d20 every 5 min, 15+ = bite, Athletics DC 8 to reel in). These are encounter-generation mechanics more than pokemon-lifecycle rules.

### Poké Edges
From `core/05-pokemon.md#Poké Edges`: Multiple specific edges exist (Attack Conflict, Mixed Sweeper, Underdog's Strength, Realized Potential, Ability Mastery, Accuracy Training, etc.). These modify the Base Relations Rule, grant extra stat points, or provide ability/move flexibility. They use Tutor Points and are removed if prerequisites are lost (TP refunded). Not individually extracted as they are individual features rather than lifecycle rules, but they interact with R010 (Base Relations), R022 (Tutor Points), R013 (Abilities), and R017 (Moves).

### Capture Mechanics
Capture rules are extracted separately in the `capture` domain. The capture workflow (throwing Poké Ball, accuracy check, capture rate calculation) is cross-domain and not duplicated here.

### Errata - Capture Changes
The errata contains a revised d20-based capture system. This is extracted in the `capture` domain, not here.
