# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Descendant CLAUDE.md files exist in `app/`, `app/server/`, `scripts/`, and `ux-sessions/` for domain-specific context.

## Tech Stack
- **Framework**: Nuxt 3 (SPA mode, `ssr: false`)
- **Backend**: Nitro server with 106 REST API endpoints
- **Database**: SQLite with Prisma ORM (`app/prisma/schema.prisma`)
- **State**: 13 Pinia stores (auto-registered via `@pinia/nuxt`)
- **Real-time**: WebSocket for GM-Group synchronization
- **Styling**: SCSS with global variables
- **Testing**: Vitest (unit) + UX exploration sessions (Playwright browser automation)

## Project Structure
```
app/
├── pages/           # File-based routing (gm/, group/, player/)
├── layouts/         # Role-based layouts (gm, group, player, default)
├── components/      # 73 auto-imported components by domain
├── composables/     # 19 auto-imported composables for shared logic
├── stores/          # 13 Pinia stores for state management
├── types/           # 11 TypeScript type definition files
├── utils/           # captureRate, diceRoller, restHealing
├── constants/       # combatManeuvers, statusConditions
├── prisma/          # Schema, seeds, database
├── tests/           # Vitest (unit) + e2e artifacts (tickets, matrix, reviews)
├── server/
│   ├── api/         # REST endpoints across 10 domain categories
│   ├── services/    # Business logic (combatant, encounter, entity-update, pokemon-generator)
│   ├── routes/      # WebSocket handler (ws.ts)
│   └── utils/       # Prisma client, websocket, servedMap, wildSpawnState, pokemon-nickname
└── assets/scss/     # Global styles and variables
```

## Data Models (14 Prisma models)
- **HumanCharacter**: Players or NPCs with stats, rest/healing tracking, linked to their Pokemon
- **Pokemon**: Separate sheets with stats, moves, abilities, origin field, linked to owning character
- **Encounter**: Three-sided combat (Players, Allies, Enemies) with initiative, VTT grid config, fog/terrain state
- **MoveData / AbilityData / SpeciesData**: Reference data for game mechanics
- **EncounterTable / EncounterTableEntry / TableModification / ModificationEntry**: Weighted spawn tables
- **EncounterTemplate**: Saved encounter setups for reuse
- **Scene**: Narrative scenes with characters, Pokemon, groups, weather, habitat link
- **GroupViewState**: Singleton tracking active tab and scene
- **AppSettings**: Damage mode, VTT defaults

## Icons & Sprites
- **Use Phosphor Icons** instead of emojis for UI elements (installed at project root)
- Gen 5 and below: Pokemon Black 2/White 2 sprites
- Gen 6+: Latest 3D game sprites

## Git & Attribution Rules

- **Never push commits as Claude** - Do not use Claude or any AI identity as the commit author
- **Never include AI attribution** - Do not add "Co-Authored-By: Claude" or similar AI attribution lines
- **No AI-generated mentions** - Do not mention that code was AI-generated in commits, comments, or documentation
- Commits should appear as if written by the human developer

## Commit Guidelines

### CRITICAL: Small, Frequent Commits

**Commit early and often. Do NOT batch multiple changes into one commit.**

- After completing ANY single logical change, commit immediately
- One file changed? Commit it
- One function added? Commit it
- One bug fixed? Commit it
- Do NOT wait until "everything is done" to commit
- Do NOT combine unrelated changes in one commit

**Examples of correct granularity:**
- `fix: correct damage calculation for steel types` (1 file)
- `refactor: extract useGridMovement composable` (2-3 files)
- `feat: add fog of war toggle button` (1 component)

**Examples of commits that are TOO LARGE:**
- "feat: add fog of war system" (10+ files - should be 3-5 commits)
- "refactor: improve encounter system" (vague, too broad)

### Other Guidelines

- **Conventional commits** - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Descriptive messages** - Include what changed and why
- **Only commit relevant files** - Don't include unrelated changes, test artifacts, or logs
- **Don't wait to be asked** - Proactively commit after completing meaningful work

## PTU Rules Reference

The `books/markdown/` directory contains the complete PTU 1.05 ruleset. When implementing game logic, reference:
- `core/` for mechanics and rules (12 chapter files: `01-introduction.md` through `11-running-the-game.md`)
- `pokedexes/` for Pokemon stats and data (per-Pokemon files in `gen1/` through `gen8/` + `hisui/`)
- `errata-2.md` for rule corrections

## Feature Development Pattern

Use **incremental multi-tier delivery** for non-trivial features. Break the feature into priority tiers (P0/P1/P2), implement each tier separately, and run code review + rules review gates between tiers before proceeding. This pattern was proven effective in design-testability-001 (37 commits, 0 regressions, bugs caught early at each tier boundary).

**Why:** Focused review at each tier catches bugs before they propagate. P0 bugs don't infect P1/P2 code. Reviewers context-switch less. Regression testing after each tier is smaller and faster.

**Reference implementation:** `captureRate.ts` (pure calculation utility) → `damageCalculation.ts` (same pattern applied to damage).

## Design Decrees

Binding human rulings on ambiguous design decisions. Skills discover ambiguity and create `decree-need` tickets. The human runs `/address_design_decrees` to make rulings, which are recorded as decree files.

- **Decrees live in:** `decrees/decree-NNN.md` (project root)
- **Decree-need tickets:** `artifacts/tickets/open/decree/decree-need-NNN.md`
- **Authority:** Decrees override all skill-level rulings. Violations are CRITICAL severity.
- **Command:** `/address_design_decrees` — scan open decree-needs, facilitate human rulings, record decrees
- **Skills affected:** All reviewers check decrees before reviewing. Implementation Auditor uses decrees to resolve ambiguity. Developer follows decrees during implementation.
