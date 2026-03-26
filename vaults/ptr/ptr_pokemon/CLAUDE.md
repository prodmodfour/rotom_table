# Pokemon Species

~129 Pokemon species files (stats, types, traits, evolution conditions) for PTR.

## What you can't know without exploring here

- A species' PTR stats, types, and trait list
- How traits progress across an evolutionary line (e.g. Violent Instincts 1 >> 2 >> 3)
- Evolution conditions (in `evolution_conditions/`)

## Subfolders

- `complete/` — 77 finalized species. Read-only unless revising.
- `incomplete/` — 18 species still in progress or awaiting review.
- `evolution_conditions/` — Per-line evolution unlock conditions (e.g. level thresholds, item use, move known). Each file covers one evolutionary line.

## Routing

- Looking up a **finalized species**? Check `complete/` first.
- Looking up a **work-in-progress species**? Check `incomplete/`.
- **Not sure which**? Check `completed.md` for the list, or just check `complete/` then `incomplete/`.
- Looking up **evolution conditions**? Check `evolution_conditions/`.

When creating or modifying species: read template.md

Template rules:
- Hub traits with multiple subtypes go on one line: `Family [Subtype1, Subtype2, ...]` (e.g. `Natural Weapon [Fangs, Claws, Feet]`)
- Skills must show trait bonuses inline: `Skill : Base + Trait Name (+X) = Total`
- If no traits modify a skill, just list the base value (e.g. `Charm : +0`)
- Conditional bonuses note the condition inline (e.g. `Perception : +4 + Apex Predator (+3) = +7`)
- Power goes under `### Body`, not `### Movement` — see [[power-is-a-body-trait]]

## Reviewing a species

See `review_checklist.md` for the full review procedure (trait-to-lore mapping, placement consistency, skill accuracy, evolutionary arc, design principles, data consistency, template completeness).
