# 2026-03-25 — Movement capabilities → movement traits (PTR + doc)

**Ashraf clarification:** PTR does not have "movement capabilities." Movement uses traits: Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter.

**PTR vault changes:**
- Renamed `movement-capability-types.md` → `movement-trait-types.md`, rewrote content with trait names
- Updated 8 wikilinks across PTR vault (CLAUDE.md, ptr-vs-ptu-differences, typical-movement-profile, phaser, phasing-ignores-terrain, base-terrain-types, teleporter-movement-constraints, intercept-as-bodyguard-positioning)
- `base-terrain-types.md` — "PTU defines" → no attribution, "Burrow-capable" → "Burrower trait", "Swim-capable" → "Swimmer trait"
- `take-a-breather-action-cost.md` — "movement capability" → "movement trait"
- `roar-has-own-recall-mechanics.md` — "PTU p.406" removed, "movement capability" → "movement trait"
- `phantom-force.md` — "Movement Capabilities" → "movement traits", "Dodge Ability" → "Dodge trait"
- `mountable.md` — "movement capabilities" → "movement traits"
- `roar.md` — "movement capability" → "movement trait"
- CLAUDE.md domain prefix — "movement types, capabilities, terrain" → "movement traits, terrain"

**Documentation vault changes:**
- `combatant-movement-capabilities.md` — rewritten: "Sky" → "Flier", "Swim" → "Swimmer", "Burrow" → "Burrower", linked to [[movement-trait-types]]
- `combatant-capabilities-utility.md` — rewritten: "capabilities" → "traits", linked to [[movement-trait-types]], [[naturewalk]] trait
- `pokemon-sheet-page.md` — Tabs: "Abilities, Capabilities" → "Traits". PokemonCapabilitiesTab → PokemonTraitsTab. Removed nature indicators, tutor points.
- `species-data-model.md` — "abilities, learnset, movement capabilities" → "traits, movement traits". Removed learnset, ability count.
- `phantom-force.md` — "Movement Capabilities" → "movement traits"
- `roar.md` — "movement capability" → "movement trait"
- `conditional-ball-modifier-rules.md` — "movement capability" → "movement trait"
- `elevation-system.md` — "Sky capability" → "Flier trait", "Sky speed" → "Flier speed"
- `pathfinding-algorithm.md` — "Sky > 0" → "Flier > 0", "Sky speed" → "Flier speed"
- `movement-is-atomic-per-shift.md` — updated link descriptions
- `ghost-type-ignores-movement-restrictions.md` — updated link description
- `ptu-movement-rules-in-vtt.md` — "capability queries" → "movement trait queries"
- `trait-composed-domain-model.md` — `movementCapabilities` → `movementTraits`
