---
rule_id: encounter-tables-R027
name: Giant Pokemon Encounter Modifier
category: modifier
scope: edge-case
domain: encounter-tables
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
