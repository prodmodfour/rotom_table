# Rules

~400 atomic notes on PTR game mechanics: combat, stats, conditions, movement, terrain, energy, capture, training, breeding, skills, items, equipment, and design principles. This vault is self-contained — all PTU rules relevant to PTR have been digested here.

## What you can't know without exploring here

- How PTR combat actually works — action economy, damage formula steps, stat calculations, type effectiveness
- The energy/stamina system that replaces PTU move frequencies
- Evolution trigger conditions and how they differ per species
- Capture workflow mechanics (two-step process, modifiers)
- Training system (dual-check: Pokemon test + Trainer test)
- Design rationale notes for specific traits (e.g. why Effect Spore works the way it does)

## Cross-folder boundaries

- Trait *definitions* live in `../ptr_traits/`, but trait *design rationale* notes (e.g. `effect-spore-design.md`, `technician-design.md`) are here.
- Move *stat blocks* live in `../ptr_moves/`, but move *keyword mechanics* (e.g. `spirit-surge.md`) are here.
- Evolution *condition files* live in `../ptr_pokemon/evolution_conditions/`, but evolution *mechanics* (triggers, BST, process) are here.

## Domain prefixes (~400 files)

Notes cluster by prefix:

- `skill-*` (~27) — 19 skill descriptions, skill list, modifiers, DCs, checks, social hierarchy
- `evolution-*` (~13) — evolution mechanics, triggers, timing, BST calibration
- `pokemon-*` (~11) — pokemon behavior, intelligence, social hierarchy, base stats
- `training-*` (~8) — training system, dual checks, bonding, obedience
- `ptr-*` (~6) — PTR vs PTU differences, system-wide design decisions
- `natural-*` (~6) — natural weapons, natural armor, appendage types
- `energy-*` (~6) — energy resource, costs, stamina, recovery
- `take-*` / `rest-*` (~8) — rest mechanics (Take a Breather, Take Five, rest healing)
- `loyalty-*` (~5) — loyalty system, thresholds, effects
- `breeding-*` (~5) — breeding mechanics, inheritance, egg groups
- `weather-*` (~4) — weather system, effects, terrain interaction
- `type-*` (~5) — type effectiveness chart, STAB, type identity, immunities
- `movement-*` (~4) — movement traits, terrain
- `encounter-*` (~4) — encounter generation, wild encounters
- `base-*` (~4) — base stats, base damage
- `capture-*` (~3) — capture workflow (1d100), modifiers, two-step process
- `disposition-*` (~3) — disposition system for wild pokemon
- `poison-*` (~3) — poison mechanics, toxic
- `action-*` (~3) — action economy per turn
- `level-*` (~3) — level-up process, experience
- `hp-*` (~3) — HP ticks, formula, injury
- Item/equipment notes — held items, equipment slots, weapons, armor, X-items, prices, Poke Balls, berries, repels, evolution stones

Remaining ~200 notes have unique prefixes covering individual mechanics (damage, accuracy, evasion, initiative, flanking, conditions, status effects, fishing, fossils, etc.).

## Starting nodes

These are high-connectivity notes that branch into the major subsystems.

- `ptr-vs-ptu-differences.md` — master index of all mechanical changes from PTU to PTR
- `trait-definition.md` — what a Trait is (unified progression mechanic)
- `unlock-conditions.md` — how traits and moves are gated
- `action-economy-per-turn.md` — what a combatant can do each turn
- `effective-stat-formula.md` — how stats become in-combat values
- `damage-formula-step-order.md` — nine-step damage calculation pipeline
- `energy-resource.md` — Energy/Stamina system replacing move frequencies
- `movement-trait-types.md` — six movement traits (Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter)
- `evolution-trigger-conditions.md` — how evolution is unlocked per species
- `individual-stats-vs-base-stats.md` — species base stats vs per-instance stats
- `sensible-ecosystems.md` — ecological design principles
- `wild-encounter-motivations.md` — why wild encounters happen
- `pokemon-intelligence-scales-with-niche.md` — intelligence follows ecological need
- `level-up-ordered-steps.md` — sequence when a Pokemon levels up
- `capture-workflow.md` — two-step capture process
- `training-dual-check-system.md` — how training works (Pokemon test + Trainer test)
- `ptr-skill-list.md` — the 19 PTR skills (each with its own `skill-*.md` description), how checks work (1d20 + Modifier vs DC), and how modifiers come from traits/circumstance. Key branches: `skill-modifier-scale.md` (0–10 scale), `skill-check-dc-table.md` (DC tiers), `skill-modifiers-from-traits-or-circumstance.md`, `pokemon-social-skill-hierarchy.md` (per-Pokemon social skill ranking), `skill-traits-must-gate-behaviors.md` (design principle), `skills-can-decrease-on-evolution.md`
- `item-prices-reference.md` — consolidated price reference for all items, linking to detailed catalogs
- `type-effectiveness-chart.md` — full 18-type matchup reference with dual-type interaction rules
- `damage-base-to-dice-table.md` — DB 1–28 → dice roll conversion table
- `paralysis-condition.md`, `flinch-condition.md`, `infatuation-condition.md` — PTR status condition definitions (playtest versions adopted)
