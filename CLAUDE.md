# Tools
    - Prefer rg (ripgrep)

# Critical Principles
    - If something is unclear, lets stop and figure it out. Then we can update our vaults (our knowledge) and be better prepared next time.
    - When looking at or editing files, lets carefully read each and edit one by one.
    - This repository has many terms that have explanations in the vaults. Always look for definitions and explanations for things. 
        - The key here is that, if there is no explanation, then you should stop and ask me for one. So looking is important even if you feel sure.


# Our goal
- Our ultimate goal is to make the PTR vault, Documentation vault, and app converge.
- The PTR vault tells us what the tabletop game system is — rules, mechanics, formulas for Pokemon Tabletop Revised (a fork of PTU 1.05).
- The Documentation vault tells us how the system will be implemented as the rotom_table app.
- The App vault tells us what the app actually does right now.
- When the three are aligned — system rules fully described in documentation, documentation fully realized in app, app fully observed in the App vault — the project is complete.
- This does not mean that the file structure or contents of the vaults are similar.
    - It means that the complex connections of ideas in each vault essentially mean the same thing in different contexts.
- This is similar to how an object has a shadow that represents it.
    - By shining a light onto our system rules, we generate a shadow (the documentation) onto a surface that lets us see it (the app).
- We will do this slowly, by making adjustments to one of the three, one at a time.
- Bit by bit, we will finish the project.

## How Vaults Grow and Change
There are three processes that drive vault evolution:
- Digestion
- Maturation
- Alignment

### Digestion
- How new material enters a vault.
- Raw thoughts, notes, or observations are broken down and absorbed into structured vault content.
- Each vault has its own digestion process (e.g. digesting user notes into PTR, observing the app into the app vault).


### Alignment
- How vaults converge with each other.
- Checking that PTR rules are faithfully described in documentation, that documentation is faithfully realized in the app, and that the app vault faithfully reflects what the app actually does.
- Maturation can break alignment (e.g. a sharper system rule reveals gaps in documentation). This tension is healthy and drives the project forward.

### Priority
- PTR > Documentation > App

# Directory Guide

Every directory with a CLAUDE.md answers three questions: what can't I know without exploring here, what could I learn, and where do I start. Read a directory's CLAUDE.md before exploring its contents.

## `vaults/ptr/` — PTR Game System (~1,710 notes)
- **Can't know without exploring:** The actual PTR rules — how stats, damage, energy, capture, training, evolution, and combat work. Species definitions, trait definitions, ecological lore. None of this is inferrable from the app code or documentation vault.
- **What you'd learn:** The complete game system that everything else implements. 6 subfolders: rules (~400, self-contained), moves (~382), move descriptions (~378), traits (~198), pokemon species (~129), ecology (~225). Key difference from PTU: there are no per-species move lists — any Pokemon can learn any move if it meets the move's unlock conditions.
- **Start here:** Read `vaults/ptr/CLAUDE.md` for subfolder routing and a complete query-type routing table. For rules, start with `rules/ptr-vs-ptu-differences.md`. For a species, check `ptr_pokemon/` for stats, `pokemon_ecology/` for lore. For a move, check `ptr_moves/`.

## `vaults/documentation/` — App Design (~1,399 notes)
- **Can't know without exploring:** How game mechanics translate into code architecture. Design decisions and trade-offs. The three-view authority model. Service/store/API layer design. Also contains ~219 SE reference notes (patterns, smells, refactoring) and ~811 move implementation specs (stale, being updated to PTR).
- **What you'd learn:** The bridge between PTR rules and working software. 2 subfolders (moves, software-engineering) + ~369 app-specific design notes at root, prefixed by domain (encounter-, player-, pokemon-, trainer-, etc.).
- **Start here:** Read `vaults/documentation/CLAUDE.md` for domain prefix guide and 14 starting nodes. Key hubs: `encounter-lifecycle-state-machine.md`, `turn-lifecycle.md`, `triple-view-system.md`, `service-inventory.md`.

## `vaults/app/` — App Observations (~688 notes)
- **Can't know without exploring:** What the app actually does vs what documentation says it should do. Specific UI behaviors, component layouts, interaction flows as they exist today. Which features are missing or broken.
- **What you'd learn:** Ground truth of the running application. 1 subfolder (moves-in-combat, ~220 observations) + ~468 domain-prefixed observations at root (encounter-, player-view-, gm-, trainer-, group-view-, etc.).
- **Start here:** Read `vaults/app/CLAUDE.md` for domain prefix guide and starting nodes. Key hubs: `encounter-store-is-largest-hub-store.md`, `encounter-combat-flow.md`, `battle-grid.md`.

## `app/` — The Application (Nuxt 3 / Vue / TypeScript)
- **Can't know without exploring:** The actual implementation — components, composables, stores, server routes, Prisma schema, tests. This is the living codebase.
- **What you'd learn:** How the system actually runs. Key subdirectories: `components/`, `composables/`, `stores/`, `server/`, `prisma/`, `pages/`, `constants/`, `types/`, `tests/`.
- **Start here:** `prisma/schema.prisma` for data model. `server/` for API routes. `stores/` for client state. `pages/` for route structure. `nuxt.config.ts` for app configuration.

## `deprecated_books/markdown/` — PTU 1.05 Rulebook Reference (Fully Deprecated)
- **Fully deprecated:** All PTR-relevant rules have been digested into `vaults/ptr/rules/`. Do not consult for game rules. The digest thread at `claude_forum/ptu-to-ptr-final-digest.md` documents what was extracted.
- **What you'd learn:** Historical context only — the baseline PTU 1.05 rules that PTR forked from.
- **Start here:** Don't. Use `vaults/ptr/rules/` instead.

## `revisions/` — PTR Revision Notes (~15 files)
- **Can't know without exploring:** In-progress or completed rule revision reasoning — how specific PTR subsystems (AP, capture, injuries, stamina, etc.) were rethought from PTU.
- **What you'd learn:** The design thinking behind PTR mechanical changes, before they became vault notes.
- **Start here:** Files are named by subsystem (e.g. `capture.md`, `stamina_system.md`, `injuries.md`).

## `archive/` — Old Design Documents (~7 files)
- **Can't know without exploring:** Superseded design notes from earlier project phases.
- **What you'd learn:** Historical context only. These are not authoritative — the vaults are.

## `scripts/` — Utility Scripts
- **Can't know without exploring:** Data generation and transformation tools (move vault note generation, book splitting, data imports).
- **What you'd learn:** How raw data (CSVs, PDFs, pokedex markdown) gets transformed into vault notes and seed data.

## `claude_forum/` — Persistent Project Threads
- **Can't know without exploring:** Progress, findings, decisions, and open questions for large multi-session projects. Context gets cleared between sessions — the forum is the persistent record.
- **What you'd learn:** What was done, what was found, what's next, and what rules/decisions were established mid-project.
- **Start here:** Read the thread's CLAUDE.md, then open the relevant thread file.
- **Post frequency: max.** Post findings, decisions, approvals, and progress as they happen. Don't batch up.

# Rules References

## Vault context injections (loaded on demand)
- When considering the PTR game system (rules, mechanics, formulas): .claude/context_injections/vaults/ptr.md
- When considering how the system will be implemented as rotom_table: .claude/context_injections/vaults/documentation.md
- When considering what the app actually does: .claude/context_injections/vaults/app_vault.md
- When editing vaults or Obsidian markdown files: .claude/context_injections/vaults/zettelkasten.md
- When digesting user notes into the PTR vault: .claude/context_injections/vaults/digesting_ptr.md
- When digesting user notes into the documentation vault: .claude/context_injections/vaults/digesting_documentation.md
- When observing the app into the app vault: .claude/context_injections/vaults/observing_app.md
- When maturing a vault: .claude/context_injections/vaults/maturation.md
- When answering questions, consult one of the three vaults in vaults/

## Game Data
- When implementing or verifying PTU game rules: .claude/context_injections/game/ptu_books.md
- When implementing game mechanic calculations: .claude/context_injections/game/ptu_formulas.md
- When looking up Pokemon species data: .claude/context_injections/game/ptu_pokedex_lookup.md

## Workflow
- When committing or working with git: .claude/context_injections/workflow/git.md
- When adding icons, sprites, or visual assets to UI: .claude/context_injections/workflow/icons_and_sprites.md
- When interacting with the app in the browser via playwright-cli: .claude/context_injections/workflow/browser_audit_routes.md
- When creating or editing CLAUDE.md files or context injections: .claude/context_injections/workflow/making_and_expanding_context_injections_or_claude_md.md

