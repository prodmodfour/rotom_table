# App Vault

~688 atomic notes recording what the rotom_table app actually does right now — observed through the browser and the codebase. Notes link to each other with `[[wikilinks]]`. Obsidian resolves links by filename regardless of folder.

## What you can't know without exploring here

- What the app actually does vs what the documentation says it should do (gaps, quirks, bugs)
- Specific UI behaviors, component layouts, and interaction flows as they exist today
- How stores, services, APIs, and websocket events actually work in practice
- Which features are missing, broken, or partially implemented

The documentation vault tells you *how it should work*. This vault tells you *how it does work*.

## Subfolders

- `moves-in-combat/` — ~220 observations of individual moves and combat maneuvers as they appear in the encounter target panel. Has its own CLAUDE.md.

## Routing

- Looking up **how a specific move behaves in the app**? Check `moves-in-combat/`.
- Looking up **how an encounter feature works**? Search this directory for `encounter-*`.
- Looking up **what a player sees**? Search for `player-view-*` or `player-*`.
- Looking up **what the GM sees**? Search for `gm-*`.
- Looking up **what the group/TV view shows**? Search for `group-view-*`.

## Domain prefixes (this directory, ~468 files)

- `encounter-*` (~77) — encounter lifecycle, combatant cards, action panels, combat flow, templates, tables, XP
- `player-view-*` / `player-*` (~47) — player view tabs, character display, encounter spectating, websocket
- `gm-*` (~40) — GM pages (character detail, pokemon detail, moves tab, navigation, encounter actions)
- `trainer-*` (~36) — level-up wizard, stat allocation, skill ranks, XP system, sprite chooser, creation
- `pokemon-*` (~20) — creation, HP formula, stat allocation, level-up, moves, sprite resolution
- `group-view-*` (~20) — lobby, encounter tab, map tab, initiative tracker, websocket sync
- `scene-*` (~18) — editor, manager, canvas, panels, encounter conversion, real-time sync
- `capture-*` (~17) — ball selector, context conditions, rate display, throw flow, trainer selector
- `habitat-*` (~11) — detail page, sub-habitats, pokemon entries, settings, modifications
- `battle-grid-*` (~11) — settings panel, toolbar, zoom, fog of war, token sprites, measurement
- `species-*` (~10) — data model, API, autocomplete, learnset, evolution triggers
- `full-create-*` (~9) — full character creation mode sections (stats, skills, classes, edges)
- `equipment-*` (~9) — catalog browser, slot display, stat labels, combat bonuses
- `move-*` (~8) — move seed pipeline, frequency utility, interface, learning panel (non-combat)
- `websocket-*` (~5) — event types, handler routing, reconnection, peer map
- `vtt-*` / `isometric-*` / `grid-*` (~11) — VTT rendering, isometric projection, grid movement

## Starting nodes

These notes are high-connectivity hubs:

- `encounter-store-is-largest-hub-store.md` — the encounter store as the central combat state hub
- `encounter-combat-flow.md` — how a combat turn flows through the encounter
- `encounter-combatant-card.md` — the primary UI element for viewing a combatant in combat
- `player-view-encounter-tab.md` — what players see during encounters
- `gm-pokemon-detail-page.md` — the GM's primary Pokemon management surface
- `gm-character-detail-page.md` — the GM's primary trainer management surface
- `group-view-page.md` — the TV/spectator view hub
- `encounter-serve-toggles-between-serve-and-unserve.md` — how encounters appear on the group view
- `websocket-event-types-defined-as-discriminated-union.md` — the real-time communication protocol
- `battle-grid.md` — the VTT grid component hub
- `server-runs-as-spa-with-api-backend.md` — the app's fundamental architecture
- `no-store-imports-another-store.md` — key architectural constraint
