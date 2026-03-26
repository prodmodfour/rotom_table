# PTR Vault

~1,710 atomic notes describing the PTR game system. Notes link to each other with `[[wikilinks]]`. Obsidian resolves links by filename regardless of folder. The rules subfolder is self-contained — all relevant PTU 1.05 rules have been digested into PTR notes, and the deprecated PTU books are no longer needed as a reference.

## What you can't know without exploring here

- The actual PTR rules — how stats, damage, energy, capture, training, evolution, and combat work in this system (not PTU, not the video games)
- What PTR changed from PTU 1.05 and why (energy replacing frequencies, traits replacing abilities/features/edges, etc.)
- Species definitions — stats, types, and traits for ~95 Pokemon
- Trait definitions that don't exist in PTU — the full trait system is a PTR invention
- Ecological lore backing each species

The context injection (`ptr.md`) tells you this vault exists. Only exploring the subfolders tells you what's actually in it.

## Subfolders

- `rules/` — ~400 core game mechanics (combat, stats, conditions, energy, capture, training, skills, items, equipment). Self-contained — no PTU book reference needed. Has its own CLAUDE.md with prefix clusters and starting nodes.
- `ptr_moves/` — ~382 PTR move stat blocks (energy costs, no frequencies). Has its own CLAUDE.md. Philosophy doc: `move_philosophy.md`.
- `move_descriptions/` — ~378 narrative flavor texts for how moves look/feel. Has its own CLAUDE.md.
- `pokemon_ecology/` — ~225 species natural history, ecology, evolution condition design rationale. Has its own CLAUDE.md.
- `ptr_pokemon/` — ~129 Pokemon species files, split into `complete/` (77), `incomplete/` (18), and `evolution_conditions/` (32). Has its own CLAUDE.md with routing. Review procedure: `review_checklist.md`.
- `ptr_traits/` — ~197 custom trait definitions. Has its own CLAUDE.md. Philosophy doc: `trait_philosophy.md`.

## Key difference from PTU

PTR has no per-species move lists. [[moves-are-universally-available|Any Pokemon can learn any move]] if it meets the move's [[unlock-conditions]]. There are no Natural Moves, Egg Moves, or TM-compatibility lists.

## Routing

- Looking up a **move's stats**? Check `ptr_moves/`.
- Looking up a **move's flavor text**? Check `move_descriptions/`.
- Looking up a **move's unlock conditions**? Check the move's stat block in `ptr_moves/`.
- Looking up a **move keyword mechanic** (e.g. Spirit Surge)? Check `rules/`, not `ptr_moves/`.
- Looking up a **Pokemon species**? Check `ptr_pokemon/` for stats, `pokemon_ecology/` for lore.
- Looking up **evolution conditions** for a line? Check `ptr_pokemon/evolution_conditions/`.
- Looking up **why** evolution conditions were chosen? Check `pokemon_ecology/` for `*-evolution-conditions-design.md` files.
- Looking up a **trait definition**? Check `ptr_traits/`.
- Looking up **trait design rationale** (e.g. why Effect Spore works that way)? Check `rules/` for `*-design.md` files.
- Looking up a **game rule or mechanic**? Check `rules/`.
- Looking up **skills**? Start at `rules/ptr-skill-list.md` — it lists all 19 skills, each linked to its own `skill-*.md` description. For check mechanics: `skill-check-1d20-plus-modifier.md`, `skill-check-dc-table.md`. For social skill interactions (training, command): `rules/pokemon-social-skill-hierarchy.md`.
- Looking up an **item, held item, or equipment**? Check `rules/item-prices-reference.md` for prices, or the specific catalogs: `held-items-catalog.md`, `x-items-catalog.md`, `weapon-system.md`, `armor-and-shields.md`, `equipment-slots.md`.
- Looking up **type effectiveness**? Check `rules/type-effectiveness-chart.md`.
- Looking up **status conditions**? Check `rules/` for condition-specific notes: `paralysis-condition.md`, `flinch-condition.md`, `infatuation-condition.md`, `confused-three-outcome-save.md`, `burned-renamed-to-burning.md`, `poisoned-and-badly-poisoned-stack.md`, `sleep-volatile-but-persists.md`.
- **Reviewing a species**? Read `ptr_pokemon/review_checklist.md` for the full procedure.
- **Designing moves or traits**? Read `ptr_moves/move_philosophy.md` or `ptr_traits/trait_philosophy.md` first.
