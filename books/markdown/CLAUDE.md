# PTU 1.05 Rules Reference

Chapter-to-topic lookup for the Pokemon Tabletop United 1.05 ruleset. All files are markdown conversions of the original PDFs.

## Chapter Lookup Table

| File | Pages | Lines | Key Content |
|---|---|---|---|
| `core/00-front-matter.md` | 2-6 | 472 | Credits, table of contents, page index |
| `core/01-introduction.md` | 7-11 | 427 | System overview, dice conventions, core concepts |
| `core/02-character-creation.md` | 12-32 | 1,872 | Trainer stats, backgrounds, starter Pokemon selection |
| `core/03-skills-edges-and-features.md` | 33-64 | 2,196 | Skill ranks, edges, general features, Skill Edges at 2/6/12 |
| `core/04-trainer-classes.md` | 65-195 | 6,915 | All trainer classes and class features (largest class file) |
| `core/05-pokemon.md` | 196-218 | 1,988 | Pokemon stats, natures, experience chart, evolution, **capture rate formula** (p.214), level-up |
| `core/06-playing-the-game.md` | 219-225 | 564 | Rounding rules, skill checks, basic capabilities, movement |
| `core/07-combat.md` | 226-260 | 2,382 | Initiative, turn structure, actions, **damage formula** (p.236), type chart (p.238), switching (p.229), maneuvers, League vs Full Contact |
| `core/08-pokemon-contests.md` | 261-270 | 708 | Contest rules, appeals, scoring |
| `core/09-gear-and-items.md` | 271-302 | 2,470 | Poke Balls, healing items, held items, equipment, TMs, berries |
| `core/10-indices-and-reference.md` | 303-436 | 11,412 | Capabilities (p.303), **ability list** (p.311-335), **move list** (p.338+), move data format |
| `core/11-running-the-game.md` | 437-500+ | 7,275 | GM advice, encounter building, **XP rewards**, habitats, wild Pokemon, weather, terrain |

## Quick Lookup by Task

- **Damage formula**: `07-combat.md` p.236 (DB chart, STAB +2, attack - defense, type effectiveness)
- **Capture rate**: `05-pokemon.md` p.214 (base 100, HP/level/evolution/status modifiers)
- **Movement / switching**: `07-combat.md` p.229-230 (switch = Standard Action, fainted switch = Shift, 8m recall range)
- **XP and leveling**: `05-pokemon.md` p.200-202 (Pokemon EXP chart) + `11-running-the-game.md` (encounter XP rewards)
- **Move data**: `10-indices-and-reference.md` p.338+ (all moves with type, DB, AC, class, range, effects)
- **Ability data**: `10-indices-and-reference.md` p.311-335 (alphabetical, A-E / F-K / L-P / Q-U / V-Z sections)
- **Species data**: `pokedexes/` per-species files (base stats, types, abilities, learnsets, evolution)
- **Type effectiveness chart**: `07-combat.md` p.238

## Pokedex Format

1,009 species files across `pokedexes/gen1/` through `pokedexes/gen8/` + `pokedexes/hisui/`. Each file contains one evolutionary line. See `pokedexes/how-to-read.md` for the entry format: base stats, types, basic/advanced/high abilities, evolution stages, size, weight, capabilities, learnset, TM list.

## Page Number Cross-References

Chapters use `## Page NNN` headers corresponding to original PDF page numbers. Use these headers to navigate directly to specific rules. Example: search for `## Page 236` in `07-combat.md` to find the damage formula.

## Authority Chain

When resolving rule ambiguities: **Decrees** (`decrees/decree-NNN.md`) > **Errata** (`errata-2.md`) > **Core chapter text**. Decrees are binding human rulings that override all other sources. The errata corrects specific rules in the 1.05 release.

## Other Files

- `errata-2.md` (513 lines) — Sept 2015 errata/playtest supplement with rule corrections and experimental content
- `playtest-packet-2016.md` (1,145 lines) — Feb 2016 playtest packet with additional experimental rules
- `useful-charts.md` (979 lines) — Pokemon experience chart, nature chart, and other quick-reference tables
