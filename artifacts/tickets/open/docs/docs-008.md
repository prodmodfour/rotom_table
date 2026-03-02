---
id: docs-008
title: "Add CLAUDE.md for books/markdown/"
priority: P0
severity: HIGH
status: open
domain: reference
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 2
affected_files:
  - books/markdown/CLAUDE.md (new)
---

# docs-008: Add CLAUDE.md for books/markdown/

## Summary

Create a descendant CLAUDE.md in `books/markdown/` to provide a chapter→topic lookup table for the PTU 1.05 ruleset. Agents searching for specific rules waste turns scanning 12 chapter files (38,000+ lines total). A concise lookup table and format guide eliminates this exploration entirely.

## Target File

`books/markdown/CLAUDE.md` (~50 lines)

## Required Content

### Chapter Lookup Table

| Topic | File | Key Content |
|-------|------|-------------|
| Table of contents, credits | `core/00-front-matter.md` (472 lines) | Page references for all sections |
| Basic concepts | `core/01-introduction.md` (427 lines) | What is PTU, terminology |
| Character creation, stats, HP formula | `core/02-character-creation.md` (1,872 lines) | Trainer creation flow, stat allocation |
| Skills, edges, features lists | `core/03-skills-edges-and-features.md` (2,196 lines) | Full skill/edge/feature catalogs |
| All trainer class definitions | `core/04-trainer-classes.md` (6,915 lines) | Class features, branching paths (LARGEST file) |
| Pokemon stats, natures, evolution, Base Relations | `core/05-pokemon.md` (1,988 lines) | Stat points, nature table, breeding, capabilities |
| General gameplay rules | `core/06-playing-the-game.md` (564 lines) | Action economy, skill checks |
| Combat mechanics | `core/07-combat.md` (2,382 lines) | Damage formula, accuracy, status, movement, switching, maneuvers, capture |
| Contest rules | `core/08-pokemon-contests.md` (708 lines) | Contest mechanics |
| Equipment, items, Poke Balls | `core/09-gear-and-items.md` (2,470 lines) | Item catalog, ball types, gear |
| Move list, ability list, type chart | `core/10-indices-and-reference.md` (11,412 lines) | Comprehensive reference tables |
| GM guide: XP, encounter design | `core/11-running-the-game.md` (7,275 lines) | XP calculation, encounter budgets, world building |

### Quick Lookup by Common Task
- **Damage formula**: `07-combat.md` (search for "Damage")
- **Capture rate**: `07-combat.md` (search for "Capture" or "Poke Ball")
- **Movement/switching**: `07-combat.md` (search for "Shift Action" or "Switch")
- **XP/encounter budget**: `11-running-the-game.md` (search for "Experience" or "Significance")
- **Specific move data**: `10-indices-and-reference.md`
- **Specific ability data**: `10-indices-and-reference.md`
- **Specific Pokemon species**: `pokedexes/<genN>/<lowercase-name>.md`

### Pokedex Format
Per-Pokemon files in `gen1/` through `gen8/` + `hisui/` (1,009 species files total). Format documented in `pokedexes/how-to-read.md`. Each file contains:
- Base Stats (HP, Atk, Def, SpAtk, SpDef, Spd)
- Type(s), Abilities (Basic/Advanced/High)
- Evolution chain with level/item/condition triggers
- Size, weight class, capabilities, skills
- Move list (level-up, TM/HM, egg, tutor moves)

### Page Number Cross-References
Chapters use `## Page NNN` headers. To find a specific page reference (e.g., "PTU p.232"), search for `## Page 232` in the appropriate chapter file.

### Authority Chain
1. **Decrees** (`decrees/decree-NNN.md`) — HIGHEST authority, binding human rulings
2. **Errata** (`errata-2.md`) — Official PTU 1.05 corrections (Sept 2015)
3. **Core chapter text** — Base rules

Errata overrides core text. Decrees override both. When implementing game logic, always check decrees first for the relevant domain.

### Other Files
- `errata-2.md` — Playtest balance changes: capture mechanics, defensive options, Cheerleader
- `playtest-packet-2016.md` — Additional playtest content
- `useful-charts.md` — Quick reference charts

## Verification

- File is 30-80 lines
- Chapter file names and line counts verified against actual directory listing
- Page number header format verified (## Page NNN pattern exists in chapter files)
- Authority chain matches project conventions (decrees > errata > core)
