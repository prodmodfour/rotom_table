# Documentation Vault

~1,399 atomic notes describing how the PTR system will be implemented as the rotom_table app. Notes link to each other with `[[wikilinks]]`. Obsidian resolves links by filename regardless of folder.

## What you can't know without exploring here

- How game mechanics translate into code architecture (damage pipelines, capture formulas, turn lifecycles)
- Specific design decisions and trade-offs (why CQRS, why combatant-as-lens, why denormalized encounters)
- The three-view authority model (GM writes, players request, group view spectates)
- What the app's service layer, store layer, and API layer look like as designed

The PTR vault tells you *what* the rules are. This vault tells you *how* they become software.

## Subfolders

- `move-implementations/` — ~371 move implementation specs (one per PTR game move). Updated to PTR. Has its own CLAUDE.md.
- `software-engineering/` — ~219 general SE reference notes (UML, design patterns, refactoring techniques, code smells, SOLID). Has its own CLAUDE.md.

## Routing

- Looking up **how a specific move should be implemented**? Check `move-implementations/`.
- Looking up a **SE concept** (pattern, smell, refactoring technique, UML)? Check `software-engineering/`.
- Looking up **how a game system is designed for the app**? Search this directory by domain prefix.

## Domain prefixes (this directory, ~369 files)

Notes in this directory are rotom_table-specific design decisions. They cluster by prefix:

- `encounter-*` (~21) — encounter lifecycle, state machine, schema, store design, templates, tables
- `player-*` (~20) — player view architecture, websocket events, action panels, reconnection
- `pokemon-*` (~19) — species data model, HP formula, evolution, stat allocation, move learning
- `combatant-*` (~11) — type hierarchy, interface design, card components, service decomposition
- `trainer-*` (~11) — stat budget, XP system, level-up wizard, skill definitions, classes
- `scene-*` (~10) — activation lifecycle, data model, encounter conversion, websocket events
- `capture-*` (~7) — rate formula, roll mechanics, context toggles, API endpoints
- `character-*` (~7) — creation page, validation, API, import/export
- `status-*` (~6) — condition categories, registry, source tracking, tick automation
- `service-*` (~6) — inventory, dependency map, delegation rules, pattern classification
- `vtt-*` / `grid-*` / `isometric-*` (~12) — VTT rendering, grid distance, projection math, camera system
- `websocket-*` (~5) — event union, real-time sync, store sync
- `healing-*` / `rest-*` (~7) — HP injury system, healing mechanics, rest healing, Pokemon Center
- `store-*` / `composable-*` (~10) — Pinia classification, domain mapping, dependency patterns

## Starting nodes

These high-connectivity notes branch into the major subsystems:

- `triple-view-system.md` — the three views (GM, player, group) and how they share state
- `encounter-lifecycle-state-machine.md` — encounter states from creation through dissolution
- `turn-lifecycle.md` — what happens each combat turn (declarations, resolution, advancement)
- `nine-step-damage-formula.md` — the full damage calculation pipeline
- `capture-rate-formula.md` — capture math from PTR rules translated to app logic
- `hp-injury-system.md` — HP ticks, injury thresholds, faint/revival
- `service-inventory.md` — map of all backend services
- `service-dependency-map.md` — how services relate to each other
- `prisma-schema-overview.md` — the database schema
- `domain-module-architecture.md` — how the codebase is organized by domain
- `combatant-as-lens.md` — the combatant is a combat-time view over a Pokemon/trainer, not a copy
- `gm-delegates-authority-into-system.md` — the GM is the single writer; players request
- `move-frequency-system.md` — how move usage limits work in the app
- `information-asymmetry-by-role.md` — why different views show different information
