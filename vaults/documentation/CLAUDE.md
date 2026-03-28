# Documentation Vault

~750 atomic notes describing how the PTR system will be implemented as the rotom_table app. Notes link to each other with `[[wikilinks]]`. Obsidian resolves links by filename regardless of folder.

## What you can't know without exploring here

- How game mechanics translate into code architecture (damage pipelines, capture formulas, turn lifecycles)
- Specific design decisions and trade-offs (combatant-as-lens, effect engine architecture, state delta model)
- The three-view authority model (GM writes, players request, group view spectates)
- The effect engine and entity model design (`@rotom/engine`)

The PTR vault tells you *what* the rules are. This vault tells you *how* they become software.

## Subfolders

- `move-implementations/` — ~369 move implementation specs (one per PTR game move). Has its own CLAUDE.md.
- `software-engineering/` — ~219 general SE reference notes (UML, design patterns, refactoring techniques, code smells, SOLID). Has its own CLAUDE.md.

## Routing

- Looking up **how a specific move should be implemented**? Check `move-implementations/`.
- Looking up a **SE concept** (pattern, smell, refactoring technique, UML)? Check `software-engineering/`.
- Looking up **how a game system is designed for the app**? Search this directory by domain prefix.

## Domain prefixes (this directory, ~160 files)

Notes in this directory are rotom_table-specific design decisions. They cluster by prefix:

- `encounter-*` (~10) — encounter lifecycle state machine, dissolution, serving, schema normalization, event sourcing, budget, grid state
- `player-*` (~3) — player identity, autonomy boundaries, grid tools
- `pokemon-*` (~8) — HP formula, stat allocation, move learning, experience, loyalty, origin, center healing
- `combatant-*` (~2) — combatant-as-lens, card visibility rules
- `trainer-*` (~5) — stat budget, skill definitions, derived stats, HP formula, capabilities field
- `scene-*` (~3) — activation lifecycle, encounter conversion, group system
- `capture-*` (~5) — rate formula, roll mechanics, accuracy gate, context toggles, difficulty labels
- `status-*` (~6) — condition categories, registry, tick automation, capture bonus hierarchy, CS auto-apply, applyStatus convention
- `combat-*` (~4) — stage system, maneuver catalog, event log schema, lens sub-interfaces
- `vtt-*` / `grid-*` / `isometric-*` / `elevation-*` / `fog-*` / `depth-*` / `path-*` / `measurement-*` / `movement-*` / `multi-cell-*` / `custom-token-*` / `size-*` / `one-distance-*` / `three-coordinate-*` (~19) — VTT rendering, grid mode, interaction, projection, camera, measurement, elevation, fog of war, pathfinding, movement atomicity, token footprint
- `websocket-*` (~1) — real-time sync
- `healing-*` / `rest-*` / `extended-rest` / `thirty-minute-rest` / `natural-injury-*` / `new-day-*` / `pokemon-center-*` (~10) — healing mechanics, healing items, rest system, extended rest, thirty-minute rest, injury healing, new day reset, Pokemon Center healing
- Engine design (~22) — effect engine, entity model, game state interface, state delta model, field state interfaces, and related notes

## Starting nodes

These high-connectivity notes branch into the major subsystems:

- `game-state-interface.md` — the three-layer state model (entity, combat lens, encounter)
- `combatant-as-lens.md` — the combatant is a combat-time view over a Pokemon/trainer, not a copy
- `combat-lens-sub-interfaces.md` — ISP decomposition of the lens into narrow sub-interfaces
- `state-delta-model.md` — how effects write to game state
- `effect-handler-contract.md` — the shared interface for all effect handlers
- `triple-view-system.md` — the three views (GM, player, group) and how they share state
- `encounter-lifecycle-state-machine.md` — encounter states from creation through dissolution
- `turn-lifecycle.md` — what happens each combat turn (declarations, resolution, advancement)
- `nine-step-damage-formula.md` — the full damage calculation pipeline
- `capture-rate-formula.md` — capture math from PTR rules translated to app logic
- `hp-injury-system.md` — HP ticks, injury thresholds, faint/revival
- `gm-delegates-authority-into-system.md` — the GM is the single writer; players request
- `information-asymmetry-by-role.md` — why different views show different information
- `domain-module-architecture.md` — how the codebase could be organized by domain

## Conventions

These notes define rules for vault maintenance, established during the triage:

- `documentation-note-content-boundary.md` — what content belongs in a documentation note vs. not
- `wikilink-cleanup-on-deletion.md` — how to handle broken links when notes are deleted
- `thin-note-threshold.md` — when a note is too thin to justify its own file
