# Species Review Checklist

When reviewing a Pokemon species, read its species file and all linked lore notes in `../pokemon_ecology/`. Check the following:

## Trait-to-lore mapping
- Every trait should be justified by lore. If a trait has no lore backing, flag it.
- Conversely, [[lore-does-not-require-traits|not every lore detail needs a trait]]. Cosmetic features and narrative flavor are fine as lore notes only.

## Trait placement consistency
- Power under `### Body`, not Movement
- Diet traits (Carnivore, Herbivore, etc.) in one section only — don't duplicate across Body and Behavior
- Traits with bracket parameters must use correct formatting (e.g. `Sorcery [3] [4] [3]`, not `Sorcery 3 4 3`)
- Traits with definitions should link to them (e.g. `[[cute|Cute]]`, `[[hangry|Hangry]]`)

## Skill accuracy
- [[skill-bonuses-must-appear-inline]] — skills modified by traits must show the formula inline
- Cute gives +5 Charm — if a Pokemon has Cute, its Charm line must reflect this

## Evolutionary arc
- Traits should progress sensibly across the line (e.g. Violent Instincts 1 >> 2 >> 3, Shell 2 >> 3 >> 5)
- Behavioral shifts through evolution should be intentional and lore-supported

## Design principles to enforce
- [[skill-traits-must-gate-behaviors]] — skill-modifying traits must also serve as unlock conditions
- [[scary-is-visual-impression]] — Scary is about how a Pokemon looks, not its predatory role
- [[natural-weapons-are-appendages]] — Natural Weapons are physical structures, not hunting capability
- [[light-manipulation-represents-fairy-typing]] — Light Manipulation can represent fairy nature without explicit light lore
- [[ptr-removed-simple-unaware-anticipation]] — these abilities don't exist in PTR

## Data consistency
- [[hatch-rates-only-on-base-stages]] — evolved forms should have blank Hatch Rate
- [[gender-ratio-consistent-through-evolution]] — gender ratio must match across the evolution line
- [[ecology-notes-must-match-species-traits]] — ecology notes must only reference traits that exist in the species

## Template completeness
- All sections present (Body, Natural Weapons, Senses, Defenses, Behavior, Special Abilities, Movement)
- Missing fields flagged (empty Habitat, no Hatch Rate on base stages, missing frontmatter)
- Lore section links to ecology notes

## Suggest improvements that
- Make a Pokemon more accurate to its source lore
- Expand on the Pokemon's lore with new ecology notes
- Fix inconsistencies with the template or design principles above
