# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Descendant CLAUDE.md files exist in 17 directories for domain-specific context: `app/`, `app/components/encounter/`, `app/components/scene/`, `app/components/vtt/`, `app/composables/`, `app/prisma/`, `app/server/`, `app/server/api/`, `app/server/services/`, `app/stores/`, `app/tests/`, `app/types/`, `artifacts/`, `books/markdown/`, `decrees/`, `scripts/`, `ux-sessions/`.

## Tech Stack
- **Framework**: Nuxt 3 (SPA mode, `ssr: false`)
- **Backend**: Nitro server with 153 REST API endpoints
- **Database**: SQLite with Prisma ORM (`app/prisma/schema.prisma`)
- **State**: 16 Pinia stores (auto-registered via `@pinia/nuxt`)
- **Real-time**: WebSocket for GM-Group synchronization
- **Styling**: SCSS with global variables
- **Testing**: Vitest (unit) + UX exploration sessions (Playwright browser automation)

## Project Structure
```
app/
├── pages/           # File-based routing (gm/, group/, player/)
├── layouts/         # Role-based layouts (gm, group, player, default)
├── components/      # 152 auto-imported components by domain
├── composables/     # 54 auto-imported composables for shared logic
├── stores/          # 16 Pinia stores for state management
├── types/           # 15 TypeScript type definition files
├── utils/           # captureRate, diceRoller, restHealing
├── constants/       # combatManeuvers, statusConditions
├── prisma/          # Schema, seeds, database
├── tests/           # Vitest (unit) + e2e artifacts (tickets, matrix, reviews)
├── server/
│   ├── api/         # REST endpoints across 14 domain categories
│   ├── services/    # 18 business logic services (see server/services/CLAUDE.md)
│   ├── routes/      # WebSocket handler (ws.ts)
│   └── utils/       # Prisma client, websocket, servedMap, wildSpawnState, pokemon-nickname
└── assets/scss/     # Global styles and variables
```

## Data Models
14 Prisma models -- see `app/prisma/CLAUDE.md` for schema relationships, origin enum, JSON field conventions, and seed sources.

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
Complete PTU 1.05 ruleset in `books/markdown/` -- see `books/markdown/CLAUDE.md` for chapter-to-topic lookup table, pokedex format, and authority chain (decrees > errata > core text).

## Feature Development Pattern

Use **incremental multi-tier delivery** for non-trivial features. Break the feature into priority tiers (P0/P1/P2), implement each tier separately, and run code review + rules review gates between tiers before proceeding. This pattern was proven effective in design-testability-001 (37 commits, 0 regressions, bugs caught early at each tier boundary).

**Pre-flight validation:** Before a design spec is assigned to a Developer, the Master Planner runs an inline pre-flight check (D3b):
1. **Dependency map** — identify cross-domain file overlaps, schema migration needs
2. **Open questions** — surface unresolved PTU rule ambiguities or UX decisions as decree-need tickets

Designs pass pre-flight (`complete` → `validated`) only when no open questions remain. This prevents mid-implementation blockers.

**Why:** Focused review at each tier catches bugs before they propagate. P0 bugs don't infect P1/P2 code. Reviewers context-switch less. Regression testing after each tier is smaller and faster.

**Reference implementation:** `captureRate.ts` (pure calculation utility) → `damageCalculation.ts` (same pattern applied to damage).

## Design Decrees

Binding human rulings on ambiguous design decisions. Skills discover ambiguity and create `decree-need` tickets. The human runs `/address_design_decrees` to make rulings, which are recorded as decree files.

- **Decrees live in:** `decrees/decree-NNN.md` (project root)
- **Decree-need tickets:** `artifacts/tickets/open/decree/decree-need-NNN.md`
- **Authority:** Decrees override all skill-level rulings. Violations are CRITICAL severity.
- **Command:** `/address_design_decrees` — scan open decree-needs, facilitate human rulings, record decrees
- **Skills affected:** All reviewers check decrees before reviewing. Implementation Auditor uses decrees to resolve ambiguity. Developer follows decrees during implementation.
