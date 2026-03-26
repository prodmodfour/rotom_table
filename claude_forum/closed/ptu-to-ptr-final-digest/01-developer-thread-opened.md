# 2026-03-24 — Thread opened

## Approach
1. Work chapter by chapter through `deprecated_books/markdown/core/`
2. For each chapter: read the chapter, search the PTR vault for existing coverage of its topics, identify gaps
3. Digest gaps into new atomic vault notes following `digesting_ptr.md` rules
4. Also process `errata-2.md`, `playtest-packet-2016.md`, and `useful-charts.md`
5. Track progress per-chapter in this thread

## Key question for Ashraf
PTR diverges significantly from PTU. For each chapter, we need to decide:
- **Which rules carried over to PTR unchanged** (digest as-is)
- **Which rules PTR modified** (may already be in vault as PTR versions — verify, don't duplicate)
- **Which rules PTR dropped entirely** (skip — e.g. Abilities, Features, Edges replaced by Traits; Frequencies replaced by Energy)

This means each chapter is a conversation, not a batch job. We read, discuss what's still relevant, then digest.

## Chapter inventory

| # | File | Key Content | Status |
|---|---|---|---|
| 00 | `00-front-matter.md` | Credits, TOC | Skip — not rules |
| 01 | `01-introduction.md` | System overview, dice, core concepts | Done — fully covered, no new notes needed |
| 02 | `02-character-creation.md` | Trainer stats, backgrounds, starters | Done — cleaned up 4 deprecated notes, no new notes needed |
| 03 | `03-skills-edges-and-features.md` | Skills, edges, general features | Done — 19 skill descriptions created, Persuasion added to skill list |
| 04 | `04-trainer-classes.md` | All trainer classes | Skip — replaced in PTR |
| 05 | `05-pokemon.md` | Stats, natures, XP, evolution, capture | Done — natures removed, cleaned up 3 stale notes, 1 new note |
| 06 | `06-playing-the-game.md` | Rounding, skill checks, capabilities, movement | Done — 3 stale notes updated, 2 new notes |
| 07 | `07-combat.md` | Initiative, turns, damage, type chart, switching | Done — 4 new notes, 1 stale note fixed |
| 08 | `08-pokemon-contests.md` | Contests | Skip — removed in PTR |
| 09 | `09-gear-and-items.md` | Balls, items, equipment, TMs, berries | Done — 9 new reference notes |
| 10 | `10-indices-and-reference.md` | Capabilities, abilities, moves | Skip — superseded by ptr_moves/ and ptr_traits/ |
| 11 | `11-running-the-game.md` | GM advice, encounters, XP, habitats, weather | Done — 3 stale notes fixed, no new notes needed |
| — | `errata-2.md` | Rule corrections, experimental content | Done — armor/shield errata adopted, 3 status conditions updated |
| — | `playtest-packet-2016.md` | Experimental rules | Done — Paralysis/Flinch/Infatuation playtest adopted, Suppression removed |
| — | `useful-charts.md` | XP chart, nature chart, reference tables | Done — all content already in vault |

## Decisions from Ashraf
- **Ch 04 (trainer classes):** Skip — PTR replaced the class system entirely
- **Ch 08 (contests):** Skip — removed from PTR
- **Ch 10 (abilities/moves):** Skip — superseded by `ptr_moves/` and `ptr_traits/`

## Remaining chapters (7 + 3 supplements)
03, 05, 06, 07, 09, 11, errata, playtest packet, useful-charts

