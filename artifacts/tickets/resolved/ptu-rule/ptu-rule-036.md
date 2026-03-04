---
ticket_id: ptu-rule-036
type: ptu-rule
priority: P2
status: in-progress
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T23:30:00
domain: pokemon-generation
severity: MEDIUM
affected_files:
  - app/prisma/seed.ts
  - books/markdown/pokedexes/gen4/rotom.md
---

## Summary

Rotom appliance forms (Heat, Wash, Frost, Fan, Mow) are not individually seeded as separate SpeciesData entries. All 5 forms share a single pokedex file (`rotom.md`) that the seed parser handles as one entry named "Rotom" with shared base stats but no type data. A GM looking up "Rotom Wash" or "Rotom Heat" will not find matching species data.

## Details

The pokedex file `books/markdown/pokedexes/gen4/rotom.md` has the header `ROTOM` followed by `Appliance Forms` on a separate line. The parser creates a single "Rotom" entry with the shared appliance stats (HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9).

Per-form type information is listed inline as:
```
Heat Rotom: Electric/Fire
Wash Rotom: Electric/Water
Frost Rotom: Electric/Ice
Fan Rotom: Electric/Flying
Mow Rotom: Electric/Grass
```

The type regex (`/Type\s*:\s*/i`) does not match these lines, so the "Rotom" entry has no type parsed. The separate `rotom-normal.md` file (header `ROTOM Normal Form`, Electric/Ghost) IS correctly seeded after the ptu-rule-033 fix.

## Impact

MEDIUM — Each appliance form has a distinct type (Electric/Fire vs Electric/Water vs Electric/Ice vs Electric/Flying vs Electric/Grass), different capabilities, different skills, and different move lists. A GM spawning a Rotom appliance form via the pokemon generator gets fallback data instead of the correct form-specific type. The shared base stats (HP, Atk, etc.) are at least correct since all appliance forms share them.

Workaround: GM can manually set the type after spawning. Stats are correct without intervention.

## Suggested Fix

The seed parser needs special handling for multi-form files where one pokedex page describes multiple distinct forms. Options:

1. **Split the source file** — Create individual `rotom-heat.md`, `rotom-wash.md`, etc. files with the form-specific data extracted from `rotom.md`. Straightforward but requires maintaining split files.
2. **Parser enhancement** — Detect multi-form pages (e.g., presence of "Appliance Forms" or multiple "Type" entries) and generate separate SpeciesData entries per sub-form. More robust but higher complexity.
3. **Manual seed entries** — Add hardcoded Rotom appliance form data to the seed script for these specific 5 forms.

## Source

Discovered during rules-review-038 (ptu-rule-033 fix review). The ptu-rule-033 ticket listed Rotom appliance forms as missing, but the root cause is structural (multi-form single file), not regex-related.

## Fix Log

**Commit:** `742e25f` — fix: add individual pokedex files for Rotom appliance forms

**Approach:** Option 1 (split source files). Created 5 individual pokedex files in standard format:
- `books/markdown/pokedexes/gen4/rotom-heat.md` — Electric/Fire
- `books/markdown/pokedexes/gen4/rotom-wash.md` — Electric/Water
- `books/markdown/pokedexes/gen4/rotom-frost.md` — Electric/Ice
- `books/markdown/pokedexes/gen4/rotom-fan.md` — Electric/Flying
- `books/markdown/pokedexes/gen4/rotom-mow.md` — Electric/Grass

Each file contains: standard header (`ROTOM Heat`, etc.), shared appliance base stats (HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9), standard `Type :` format, abilities from Normal Form (Poltergeist, Static, Motor Drive, Volt Absorb, Sequence), Medium size, Weight Class 3, and per-form capabilities/skills extracted from the original `rotom.md`.

The original `rotom.md` is kept as-is — the parser already silently skips it (no type match), so it's harmless.

**Verification:** Seed run confirmed 998 parsed species (up from 993). All 6 Rotom entries present in DB:
- Rotom Normal Form: Electric/Ghost (pre-existing)
- Rotom Heat: Electric/Fire, WC 3
- Rotom Wash: Electric/Water, WC 3
- Rotom Frost: Electric/Ice, WC 3
- Rotom Fan: Electric/Flying, WC 3
- Rotom Mow: Electric/Grass, WC 3

**Review fix (code-review-044 M1):** Weight values corrected from `22.0 lbs. / 10.0kg` (WC 1 range) to `66.1 lbs. / 30.0kg` (WC 3 range) in all 5 appliance files. The parser only uses the parenthesized weight class `(3)`, so zero functional impact — this is a data consistency fix.

**Related findings (separate tickets needed):**
- Oricorio (`gen7/oricorio.md`): seeded as type "Special/Flying" instead of per-form types
- Type: Null (`gen7/type-null.md`): name `TYPE: NULL` matches type regex — seeded as type "Null" instead of "Normal"
- Pumpkaboo/Gourgeist (`gen6/`): seeded with Small form stats instead of Average
- Darmanitan Zen Mode (`gen5/darmanitan.md`): embedded in same page, not seeded separately
