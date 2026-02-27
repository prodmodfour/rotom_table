---
ticket_id: ptu-rule-033
type: ptu-rule
priority: P1
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: ptu-session-helper-dev
created_at: 2026-02-18T23:00:00
domain: pokemon-generation
severity: HIGH
affected_files:
  - app/prisma/seed.ts
---

## Summary

Alternate-form Pokemon (hyphenated filenames like `hoopa-confined.md`, `rotom-wash.md`, `deoxys-attack.md`) are never seeded into the database. The seed parser fails to match their name/header format, so their entire species data (stats, types, abilities, capabilities, learnsets) is missing from SpeciesData.

## Details

The seed parser reads all `.md` files from `books/markdown/pokedexes/gen*/` and `hisui/`, but `parsePokedexContent()` apparently does not match alternate-form entries. Tested the following — all return zero rows:

- **Hoopa** (Confined / Unbound) — gen6
- **Deoxys** (Normal / Attack / Defense / Speed) — gen3
- **Rotom** (Heat / Wash / Frost / Fan / Mow) — gen4
- **Giratina** (Altered / Origin) — gen4
- **Shaymin** (Land / Sky) — gen4
- **Meloetta** (Aria / Pirouette) — gen5
- **Palkia Origin** — hisui

This affects any system that looks up species by name for these forms: wild spawning, encounter tables, Pokemon generation, CSV import fallback to species data.

## Impact

HIGH — alternate forms are competitively distinct (different stats, types, abilities). A GM cannot spawn Rotom-Wash, Deoxys-Attack, or Hoopa-Unbound with correct data. The generator falls back to defaults (all 5s, Normal type) for these species.

## Suggested Investigation

1. Check how `parsePokedexContent()` extracts the Pokemon name from each page — likely regex expects a format that alternate-form files don't match
2. Check how many total alternate-form files exist vs how many species are seeded (889 seeded vs 994 files reported)
3. Fix the name extraction to handle hyphenated/multi-word form names

## Source

Discovered during ptu-rule-031 fix (teleport parsing). Noticed Hoopa Confined (Teleporter 10) and Hoopa Unbound (Teleporter 8) were absent from seed results despite having valid pokedex files.

## Fix Log

- **Commit:** `a467f14`
- **File changed:** `app/prisma/seed.ts` (line 254)
- **Root cause:** The name-detection regex in `parsePokedexContent()` required the ENTIRE header line to be ALL CAPS (`/^[A-Z][A-Z0-9\s\-\(\).:'É\u2019]+$/`). Alternate-form pokedex entries use ALL CAPS for the species name but Title Case for the form descriptor (e.g. `HOOPA Confined`, `DEOXYS Attack Forme`, `RAICHU Alola`). The lowercase letters in form descriptors caused the regex to reject these lines entirely.
- **Fix:** Split the regex into two parts — the first word group requires ALL CAPS (`[A-Z][A-Z0-9\-\(\).:'É\u2019]+`), and an optional second group allows mixed-case form descriptors (`[A-Za-z0-9,%\s\-\(\).:'É\u2019]+`). Added `%` to support `ZYGARDE 10% Forme` / `ZYGARDE 50% Forme`.
- **Result:** Species count 889 → 993 parsed (107 new alternate forms). All ticket examples verified present with correct types and stats:
  - Hoopa Confined (Psychic/Ghost), Hoopa Unbound (Psychic/Dark)
  - Deoxys Normal/Attack/Defense/Speed Forme (all Psychic, distinct stats)
  - Giratina Altered/Origin Forme (Ghost/Dragon)
  - Shaymin Land (Grass), Shaymin Sky (Grass/Flying)
  - Meloetta Aria (Normal/Psychic), Meloetta Step (Normal/Fighting)
  - Palkia Origin Forme (Water/Dragon)
  - All Alola, Galar, Hisuian regional forms
  - Edge cases: Zygarde 10%/50%/Complete, Darmanitan Galar Zen/Standard Mode, Farfetch'd Galar
