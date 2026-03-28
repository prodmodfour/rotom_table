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
- When the two are aligned — system rules fully described in documentation, documentation fully realized in app — the project is complete.
- This does not mean that the file structure or contents of the vaults are similar.
    - It means that the complex connections of ideas in each vault essentially mean the same thing in different contexts.
- This is similar to how an object has a shadow that represents it.
    - By shining a light onto our system rules, we generate a shadow (the documentation) onto a surface that lets us see it (the app).
- We will do this slowly, by making adjustments to one of the two, one at a time.
- Bit by bit, we will finish the project.

## How Vaults Grow and Change
There are three processes that drive vault evolution:
- Digestion
- Maturation
- Alignment

### Digestion
- How new material enters a vault.
- Raw thoughts, notes, or observations are broken down and absorbed into structured vault content.
- Each vault has its own digestion process (e.g. digesting user notes into PTR, digesting design decisions into documentation).


### Alignment
- How vaults converge with each other.
- Checking that PTR rules are faithfully described in documentation, and that documentation is faithfully realized in the app.
- Maturation can break alignment (e.g. a sharper system rule reveals gaps in documentation). This tension is healthy and drives the project forward.

### Priority
- PTR > Documentation > App

# Directory Guide

Every directory with a CLAUDE.md answers three questions: what can't I know without exploring here, what could I learn, and where do I start. Read a directory's CLAUDE.md before exploring its contents.

## `vaults/ptr/` — PTR Game System (~1,710 notes)
- **Can't know without exploring:** The actual PTR rules — how stats, damage, energy, capture, training, evolution, and combat work. Species definitions, trait definitions, ecological lore. None of this is inferrable from the app code or documentation vault.
- **What you'd learn:** The complete game system that everything else implements. 6 subfolders: rules (~400, self-contained), moves (~382), move descriptions (~378), traits (~198), pokemon species (~129), ecology (~225). Key difference from PTU: there are no per-species move lists — any Pokemon can learn any move if it meets the move's unlock conditions.
- **Start here:** Read `vaults/ptr/CLAUDE.md` for subfolder routing and a complete query-type routing table. For rules, start with `rules/ptr-vs-ptu-differences.md`. For a species, check `ptr_pokemon/` for stats, `pokemon_ecology/` for lore. For a move, check `ptr_moves/`.

## `vaults/documentation/` — App Design (~740 notes)
- **Can't know without exploring:** How game mechanics translate into code architecture. Design decisions and trade-offs. The three-view authority model. The effect engine and entity model design. Also contains ~219 SE reference notes (patterns, smells, refactoring) and ~369 move implementation specs.
- **What you'd learn:** The bridge between PTR rules and working software. 2 subfolders (moves, software-engineering) + ~152 app-specific design notes at root, covering engine design, game mechanics, views, and conventions.
- **Start here:** Read `vaults/documentation/CLAUDE.md` for domain prefix guide and starting nodes. Key hubs: `game-state-interface.md`, `combatant-as-lens.md`, `combat-lens-sub-interfaces.md`, `triple-view-system.md`.

## `packages/engine/` — The Game Engine (@rotom/engine)
- **Can't know without exploring:** The effect engine implementation, entity model types, combat lens sub-interfaces, state delta types, and game constants. This is the foundation for all game logic.
- **What you'd learn:** How PTR rules are encoded as TypeScript types and pure functions. Types for combat lens, state deltas, effect handlers, field state. Constants for stage multipliers, damage base table, type chart, HP/energy formulas.
- **Start here:** `src/types/` for the type system. `src/constants.ts` for game constants. `tests/` for verified behavior.

## `deprecated_books/markdown/` — PTU 1.05 Rulebook Reference (Fully Deprecated)
- **Fully deprecated:** All PTR-relevant rules have been digested into `vaults/ptr/rules/`. Do not consult for game rules. The digest thread at `claude_forum/closed/ptu-to-ptr-final-digest/` documents what was extracted.
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
- **Can't know without exploring:** Data generation and transformation tools (move vault note generation, book splitting, data imports). Also the graph index generator for vault navigation.
- **What you'd learn:** How raw data (CSVs, PDFs, pokedex markdown) gets transformed into vault notes and seed data. How `generate-graph-index.py` builds wikilink topology maps for vault directories.
- **Graph indexes:** Run `python3 scripts/generate-graph-index.py --all` to regenerate `GRAPH-INDEX.md` files in vault directories. These map every note's outgoing and incoming wikilinks, sorted by connectivity. Read a directory's GRAPH-INDEX.md before exploring its notes — it lets you plan which notes to read instead of exploring blind.

## `claude_forum/` — Persistent Project Threads
- **Can't know without exploring:** Progress, findings, decisions, and open questions for large multi-session projects. Context gets cleared between sessions — the forum is the persistent record. Also contains the **5-phase development workflow** that all tasks follow.
- **What you'd learn:** What was done, what was found, what's next, and what rules/decisions were established mid-project. The workflow defines phases (Context Gather → Plan → Pre-docs → Code → Vault Update) with review loops.
- **Start here:** Read the thread's `CURRENT-TASK.md` for the active task and phase. Read the thread's `CLAUDE.md` for rules. Read `claude_forum/CLAUDE.md` for the workflow definition.
- **Post frequency: max.** Post findings, decisions, approvals, and progress as they happen. Don't batch up.

# Rules References

## Vault context injections (loaded on demand)
- When considering the PTR game system (rules, mechanics, formulas): .claude/context_injections/vaults/ptr.md
- When considering how the system will be implemented as rotom_table: .claude/context_injections/vaults/documentation.md
- When editing vaults or Obsidian markdown files: .claude/context_injections/vaults/zettelkasten.md
- When digesting user notes into the PTR vault: .claude/context_injections/vaults/digesting_ptr.md
- When digesting user notes into the documentation vault: .claude/context_injections/vaults/digesting_documentation.md
- When maturing a vault: .claude/context_injections/vaults/maturation.md
- When answering questions, consult one of the two vaults in vaults/

## Game Data
- When implementing or verifying PTU game rules: .claude/context_injections/game/ptu_books.md
- When implementing game mechanic calculations: .claude/context_injections/game/ptu_formulas.md
- When looking up Pokemon species data: .claude/context_injections/game/ptu_pokedex_lookup.md

## Workflow
- When committing or working with git: .claude/context_injections/workflow/git.md
- When adding icons, sprites, or visual assets to UI: .claude/context_injections/workflow/icons_and_sprites.md
- When interacting with the app in the browser via playwright-cli: .claude/context_injections/workflow/browser_audit_routes.md
- When creating or editing CLAUDE.md files or context injections: .claude/context_injections/workflow/making_and_expanding_context_injections_or_claude_md.md

