---
review_id: rules-review-038
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-033
domain: pokemon-generation
commits_reviewed:
  - a467f14
  - 4a618db
mechanics_verified:
  - alternate-form-name-detection
  - seed-name-normalization
  - species-type-parsing
  - species-stat-parsing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - pokedexes/gen6/hoopa-confined.md
  - pokedexes/gen6/hoopa-unbound.md
  - pokedexes/gen3/deoxys-attack.md
  - pokedexes/gen4/rotom-normal.md
  - pokedexes/gen4/rotom.md
  - pokedexes/gen4/shaymin-sky.md
  - pokedexes/gen4/giratina-origin.md
  - pokedexes/gen5/meloetta-step.md
  - pokedexes/hisui/palkia-origin.md
  - pokedexes/gen7/zygarde-10.md
reviewed_at: 2026-02-18T23:30:00
---

## Review Scope

Reviewing fix for ptu-rule-033: alternate-form Pokemon seeding failure. The seed parser's name-detection regex rejected pokedex entries where the form descriptor used mixed case (e.g., `HOOPA Confined`). Two commits reviewed:

- **a467f14** — Updated regex in `parsePokedexContent()` to allow mixed-case form descriptors after ALL CAPS species name
- **4a618db** — Updated ticket with fix log

Files changed: `app/prisma/seed.ts` (1 line — regex on line 254)

## Mechanics Verified

### 1. Alternate-Form Name Detection

- **Rule:** PTU 1.05 pokedex files use ALL CAPS for the species name with mixed-case form descriptors: `HOOPA Confined`, `DEOXYS Attack Forme`, `SHAYMIN Sky Forme`, `MELOETTA Step Form`, `ZYGARDE 10% Forme`. Header format varies: some use "Forme", some use "Form", some have no suffix. Extra whitespace is common between species name and form descriptor.
- **Implementation:** New regex `/^[A-Z][A-Z0-9\-\(\).:'É\u2019]+(?:\s+[A-Za-z0-9,%\s\-\(\).:'É\u2019]+)?$/` splits detection into two parts: (1) ALL CAPS first word (species name), (2) optional mixed-case continuation (form descriptor). `\s+` between groups absorbs variable whitespace. `%` added for Zygarde percentage forms.
- **Status:** CORRECT
- **Verification:** Tested regex against 10 actual pokedex file headers:
  - `HOOPA Confined` — matches: first group `HOOPA`, optional group ` Confined`
  - `HOOPA Unbound` — matches
  - `DEOXYS   Attack Forme` — matches: `\s+` absorbs 3 spaces
  - `ROTOM Normal Form` — matches (previously rejected by old regex)
  - `SHAYMIN  Sky Forme` — matches
  - `MELOETTA  Step Form` — matches
  - `GIRATINA  Origin Forme` — matches
  - `PALKIA Origin Forme` — matches
  - `ZYGARDE 10% Forme` — matches: `%` in optional group character class
  - `ROTOM` (base, all-caps) — matches without optional group
- **False positive risk:** LOW. The first word must be ALL CAPS (`[A-Z][A-Z0-9...]` excludes Title Case words like "Basic", "Type"). The loop breaks on first match and only checks the first 10 lines of each page. Pokedex file format consistently places the name in lines 3-4. Skip list (`Contents`, `TM`, `HM`, etc.) covers common non-Pokemon headers.

### 2. Seed Name Normalization

- **Rule:** Pokemon names should be stored in Title Case for display and lookup (e.g., "Hoopa Confined", "Deoxys Attack Forme").
- **Implementation:** `.replace(/\s+/g, ' ').trim().split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')` — collapses whitespace, then Title Cases each word.
- **Status:** CORRECT
- **Verification:** Traced normalization for key cases:
  - `HOOPA Confined` → "Hoopa Confined"
  - `DEOXYS   Attack Forme` → "Deoxys Attack Forme" (triple spaces collapsed)
  - `ZYGARDE 10% Forme` → "Zygarde 10% Forme" (numeric word: `charAt(0)` = "1", `slice(1).toLowerCase()` = "0%" — correct)
  - `MELOETTA  Step Form` → "Meloetta Step Form"

### 3. Species Type Parsing

- **Rule:** Each alternate form has its own type(s) defined in its pokedex file. Types must match what the PTU source material specifies per form.
- **Implementation:** `/Type\s*:\s*([A-Za-z]+)(?:\s*\/\s*([A-Za-z]+))?/i` extracts type(s) from each page's text.
- **Status:** CORRECT
- **Verification:** Cross-referenced types from pokedex source files against fix log claims:
  | Form | Source File Type Line | Fix Log Claim | Match |
  |------|----------------------|---------------|-------|
  | Hoopa Confined | Psychic / Ghost | Psychic/Ghost | YES |
  | Hoopa Unbound | Psychic / Dark | Psychic/Dark | YES |
  | Deoxys Attack | Psychic | Psychic | YES |
  | Giratina Origin | Ghost / Dragon | Ghost/Dragon | YES |
  | Shaymin Sky | Grass / Flying | Grass/Flying | YES |
  | Meloetta Step | Normal / Fighting | Normal/Fighting | YES |
  | Palkia Origin | Water / Dragon | Water/Dragon | YES |
  | Zygarde 10% | Dragon / Ground | (not in fix log, verified from file) | YES |

### 4. Species Stat Parsing

- **Rule:** Each alternate form has distinct base stats. The parser must extract the form-specific stats from each file.
- **Implementation:** Regex-based extraction (`/HP:\s*(\d+)/i`, etc.) from the page text after the name header.
- **Status:** CORRECT
- **Verification:** Spot-checked Deoxys Attack Forme — the form is known for extreme stat distribution (Attack 18, Def 2, SpDef 2). The pokedex file confirms: HP 5, Atk 18, Def 2, SpA 18, SpD 2, Spe 15. These stats are form-specific and would have been completely missing before the fix (Deoxys Attack had no DB entry). The fix log claims "distinct stats" for all Deoxys forms — consistent with each form having its own file and its own stat block.

## Pre-Existing Issues

### Rotom Appliance Forms — Multi-Form Single File (MEDIUM)

The ticket listed "Rotom (Heat / Wash / Frost / Fan / Mow)" as missing, but these forms share a single pokedex file (`rotom.md`) with header `ROTOM` + `Appliance Forms` on separate lines. The old regex already matched `ROTOM` (all caps), so this file was always parsed — but as a single "Rotom" entry, not 5 individual "Rotom Wash", "Rotom Heat", etc. entries.

The file's type section lists per-form types inline:
```
Heat Rotom: Electric/Fire
Wash Rotom: Electric/Water
Frost Rotom: Electric/Ice
Fan Rotom: Electric/Flying
Mow Rotom: Electric/Grass
```

The type regex `/Type\s*:\s*/i` does NOT match these lines (they don't begin with "Type"), so the "Rotom" entry likely has no type data at all. The stats (shared across all appliance forms: HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9) ARE parsed correctly.

This is NOT caused by the regex fix and NOT addressable by it — it requires structural parser changes to handle multi-form files. The fix correctly addresses its stated scope (mixed-case header detection). **Ticket filed: ptu-rule-036.**

### Meloetta Naming Note

The ticket says "Meloetta (Aria / Pirouette)" but PTU 1.05 uses "Step Form" instead of "Pirouette Forme" (the mainline game name). The pokedex file is `meloetta-step.md` with header `MELOETTA  Step Form`. The seeded name "Meloetta Step Form" is correct per PTU 1.05. Not a bug — just a naming discrepancy between PTU and mainline games.

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0
- Pre-existing issues found: 1 (Rotom appliance forms — ptu-rule-036)

## Rulings

No ambiguous rules involved. The fix correctly addresses a regex limitation that prevented 104+ alternate-form Pokemon from being seeded into SpeciesData. The seeded type and stat data match the PTU source files.

## Verdict

APPROVED — The regex fix correctly identifies and parses all alternate-form pokedex headers. Types and stats verified against PTU source files for 8 representative forms. No PTU rule violations introduced. The Rotom multi-form file is a separate structural issue (ptu-rule-036), not caused by this change.

## Required Changes

(none)
