---
ticket_id: ptu-rule-039
type: ptu-rule
priority: P2
status: in-progress
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-19T00:30:00
domain: pokemon-generation
severity: MEDIUM
affected_files:
  - app/prisma/seed.ts
  - books/markdown/pokedexes/gen7/oricorio.md
  - books/markdown/pokedexes/gen7/type-null.md
  - books/markdown/pokedexes/gen6/pumpkaboo.md
  - books/markdown/pokedexes/gen6/gourgeist.md
  - books/markdown/pokedexes/gen5/darmanitan.md
---

## Summary

Four additional seed parsing issues discovered during the ptu-rule-036 fix (Rotom appliance forms). Each produces incorrect or missing SpeciesData entries. Grouped here because all are pre-existing pokedex parsing edge cases in the same domain.

## Details

### 1. Oricorio — "Special/Flying" seeded instead of per-form types

**File:** `books/markdown/pokedexes/gen7/oricorio.md`, line 29
**Problem:** `Type: Special / Flying (see Forme Change)` — "Special" is not a valid Pokemon type. The parser seeds Oricorio as type Special/Flying.
**Correct data:** Oricorio has 4 style forms with distinct secondary types:
- Baile Style: Fire/Flying
- Pom-Pom Style: Electric/Flying
- Pa'u Style: Psychic/Flying
- Sensu Style: Ghost/Flying

**Fix pattern:** Same as ptu-rule-036 (Rotom). Create per-form split files (`oricorio-baile.md`, `oricorio-pompom.md`, `oricorio-pau.md`, `oricorio-sensu.md`) with correct types. Base stats, abilities, breeding info shared across forms; capabilities, skills, and move lists may differ per form (verify against source).

### 2. Type: Null — name collision seeds type as "Null" instead of "Normal"

**File:** `books/markdown/pokedexes/gen7/type-null.md`, line 3
**Problem:** Species name header `TYPE: NULL` matches the type regex `/Type\s*:\s*/i`. If the parser encounters this line before the actual `Type: Normal` on line 29, it extracts "Null" as the type.
**Correct data:** Type: Null is a Normal-type Pokemon (line 29: `Type: Normal`).
**Fix pattern:** Either adjust the parser to skip name-header lines when matching types, or rename the header to avoid the collision (e.g., `TYPE-NULL` or add the name to a parser exception list). The simplest fix may be ensuring the parser only matches `Type:` within the "Basic Information" section.

### 3. Pumpkaboo/Gourgeist — Small form stats seeded instead of Average

**Files:** `books/markdown/pokedexes/gen6/pumpkaboo.md`, `gen6/gourgeist.md`
**Problem:** Both species have 4 size forms (Small, Average, Large, Super Size) with different base stats. The parser seeds only the first set of stats encountered (Small form).
**Correct data:** PTU uses Average as the default form. Average Pumpkaboo stats and Average Gourgeist stats should be the primary seeded entries.
**Fix pattern:** Verify which stats the source file lists first. If Small is listed first, either reorder the source or create per-form split files. At minimum, ensure the default "Pumpkaboo" and "Gourgeist" entries use Average form stats.

### 4. Darmanitan Zen Mode — not seeded as separate entry

**File:** `books/markdown/pokedexes/gen5/darmanitan.md`
**Problem:** Darmanitan Standard Mode (Fire, HP 11/Atk 14/Def 6/SpA 3/SpD 6/Spe 10) is seeded correctly. Zen Mode (Fire/Psychic, HP 11/Atk 3/Def 11/SpA 14/SpD 11/Spe 6) is embedded on the same page but not parsed as a separate SpeciesData entry.
**Correct data:** Zen Mode has dramatically different stats and typing. A GM spawning "Darmanitan Zen Mode" should get Fire/Psychic with the defensive stat spread, not the Standard Mode's offensive spread.
**Fix pattern:** Same as ptu-rule-036 (Rotom). Create `darmanitan-zen.md` with Zen Mode stats extracted from the source page.

## Impact

MEDIUM — Each issue causes incorrect type and/or stat data for the affected species. Types affect damage calculations (type effectiveness), capture rate modifiers, and move STAB. Stats affect HP calculations, evasion, damage output, and combat stages. Workaround: GM can manually correct after spawning.

## Source

Discovered by Developer during ptu-rule-036 fix work. Verified by Game Logic Reviewer during rules-review-041.

## Fix Log

**Fixed 2026-02-19** — 4 commits:

1. `38daeeb` — **Type: Null parser fix**: Restricted type regex matching to the "Basic Information" section in `seed.ts` to avoid name header collision. Type: Null now correctly seeds as Normal instead of "Null".

2. `d5319a8` — **Oricorio form files**: Fixed base `oricorio.md` type from "Special/Flying" to "Fire/Flying" (Baile default). Created `oricorio-pompom.md` (Electric/Flying), `oricorio-pau.md` (Psychic/Flying), `oricorio-sensu.md` (Ghost/Flying).

3. `08e2d6e` — **Pumpkaboo/Gourgeist Average stats**: Restructured base files to use Average form stats (Pumpkaboo HP 5, Gourgeist HP 7) instead of Small. Created per-size split files (Small, Large, Super Size) for both species.

4. `8427c18` — **Darmanitan Zen Mode**: Created `darmanitan-zen.md` with Fire/Psychic typing and defensive stat spread (HP 11, Atk 3, Def 11, SpA 14, SpD 11, Spd 6).

**Files changed:**
- `app/prisma/seed.ts` (parser fix)
- `books/markdown/pokedexes/gen7/oricorio.md` (type fix)
- `books/markdown/pokedexes/gen7/oricorio-pompom.md` (new)
- `books/markdown/pokedexes/gen7/oricorio-pau.md` (new)
- `books/markdown/pokedexes/gen7/oricorio-sensu.md` (new)
- `books/markdown/pokedexes/gen6/pumpkaboo.md` (stats restructured)
- `books/markdown/pokedexes/gen6/pumpkaboo-small.md` (new)
- `books/markdown/pokedexes/gen6/pumpkaboo-large.md` (new)
- `books/markdown/pokedexes/gen6/pumpkaboo-super.md` (new)
- `books/markdown/pokedexes/gen6/gourgeist.md` (stats restructured)
- `books/markdown/pokedexes/gen6/gourgeist-small.md` (new)
- `books/markdown/pokedexes/gen6/gourgeist-large.md` (new)
- `books/markdown/pokedexes/gen6/gourgeist-super.md` (new)
- `books/markdown/pokedexes/gen5/darmanitan-zen.md` (new)

**Verification:** All 15 entries parse correctly with expected types and stats.
