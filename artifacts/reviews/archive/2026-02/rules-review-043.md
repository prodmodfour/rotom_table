---
review_id: rules-review-043
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-039
domain: pokemon-generation
commits_reviewed:
  - 38daeeb
  - d5319a8
  - 08e2d6e
  - 8427c18
mechanics_verified:
  - oricorio-form-types
  - type-null-type-parsing
  - pumpkaboo-average-form-stats
  - gourgeist-average-form-stats
  - darmanitan-zen-mode-stats-and-type
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - books/markdown/pokedexes/gen7/oricorio.md#Forme-Change
  - books/markdown/pokedexes/gen7/type-null.md#Basic-Information
  - books/markdown/pokedexes/gen6/pumpkaboo.md#Base-Stats
  - books/markdown/pokedexes/gen6/gourgeist.md#Base-Stats
  - books/markdown/pokedexes/gen5/darmanitan.md#Zen-Mode
reviewed_at: 2026-02-19T15:00:00
---

## Review Scope

Reviewed 4 commits fixing ptu-rule-039 (seed parsing issues for Oricorio, Type: Null, Pumpkaboo, Gourgeist, Darmanitan Zen Mode). Cross-referenced all seeded types and stats against PTU 1.05 pokedex source files. Verified parser logic change does not regress other species.

## Mechanics Verified

### 1. Oricorio Form Types (commit d5319a8)

- **Rule:** Oricorio has 4 style forms with distinct primary types: "Red Nectar: Baille (Fire), Yellow Nectar: Pom Pom (Electric), Pink Nectar: Pa'u (Psychic), Purple Nectar: Sensu (Ghost)" — all Flying secondary. Base stats identical across forms: HP 8, Atk 7, Def 7, SpA 10, SpD 7, Spd 9. (`gen7/oricorio.md` lines 99-111)
- **Implementation:** Base `oricorio.md` type changed from "Special / Flying" to "Fire / Flying" (Baile default). Three new split files created with correct form types: `oricorio-pompom.md` (Electric/Flying), `oricorio-pau.md` (Psychic/Flying), `oricorio-sensu.md` (Ghost/Flying). All four files share identical base stats.
- **Status:** CORRECT
- **Verification:** Stats confirmed identical across all 4 files (HP 8, Atk 7, Def 7, SpA 10, SpD 7, Spd 9). Types match PTU Forme Change table. Abilities (Dancer, Adaptability, Spinning Dance, Revelation, Competitive) correctly replicated across all forms.

### 2. Type: Null Type Parsing (commit 38daeeb)

- **Rule:** Type: Null is a Normal-type Pokemon. (`gen7/type-null.md` line 29: "Type: Normal")
- **Implementation:** Parser now extracts a "Basic Information" section via regex `/Basic Information[\s\S]*?(?=Evolution:|Size Information|Breeding|$)/i` before matching the Type line. Falls back to full page text if no Basic Information header found. This prevents the species name header "TYPE: NULL" (line 3) from matching before the actual type declaration on line 29.
- **Status:** CORRECT
- **Verification:** Traced regex through Type: Null's file structure. "Basic Information" starts at line 28, Type: Normal at line 29, "Evolution:" at line 36. The scoped section correctly contains only the real type. Fallback to full text for species without "Basic Information" headers preserves backward compatibility. No other species are adversely affected — all standard pokedex files have a "Basic Information" section containing their Type line.

### 3. Pumpkaboo Average Form Stats (commit 08e2d6e)

- **Rule:** Pumpkaboo has 4 size forms. PTU source lists stats as Small (HP 4, Atk 7, Def 7, SpA 4, SpD 6, Spd 6), Average (HP 5, Atk 7, Def 7, SpA 4, SpD 5, Spd 5), Large (HP 5, Atk 7, Def 7, SpA 4, SpD 6, Spd 5), Super Size (HP 6, Atk 7, Def 7, SpA 4, SpD 6, Spd 4). (`gen6/pumpkaboo.md` original form stats section)
- **Implementation:** Base `pumpkaboo.md` restructured with Average stats inline (HP 5, Atk 7, Def 7, SpA 4, SpD 5, Spd 5). Old form stats block removed from base file. Three split files created: `pumpkaboo-small.md` (HP 4, SpD 6, Spd 6), `pumpkaboo-large.md` (HP 5, SpD 6, Spd 5), `pumpkaboo-super.md` (HP 6, SpD 6, Spd 4).
- **Status:** CORRECT
- **Verification:** All 4 stat spreads match the original PTU source data exactly. Notable: Average form uniquely has SpD 5 while all other sizes have SpD 6 — confirmed correct per source. Type (Ghost/Grass), abilities, and breeding info consistent across all files.

### 4. Gourgeist Average Form Stats (commit 08e2d6e)

- **Rule:** Gourgeist has 4 size forms. PTU source: Small (HP 6, Atk 9, Def 12, SpA 6, SpD 8, Spd 10), Average (HP 7, Atk 9, Def 12, SpA 6, SpD 8, Spd 8), Large (HP 8, Atk 10, Def 12, SpA 6, SpD 8, Spd 7), Super Size (HP 9, Atk 10, Def 12, SpA 6, SpD 8, Spd 5). (`gen6/gourgeist.md` original form stats section)
- **Implementation:** Base `gourgeist.md` restructured with Average stats inline (HP 7, Atk 9, Def 12, SpA 6, SpD 8, Spd 8). Three split files: `gourgeist-small.md` (HP 6, Spd 10), `gourgeist-large.md` (HP 8, Atk 10, Spd 7), `gourgeist-super.md` (HP 9, Atk 10, Spd 5).
- **Status:** CORRECT
- **Verification:** All 4 stat spreads match PTU source. Large and Super forms have Atk 10 (vs 9 for Small/Average) — confirmed correct. Defense (12), SpA (6), SpD (8) constant across all forms — confirmed. Type (Ghost/Grass) and abilities consistent.

### 5. Darmanitan Zen Mode Stats and Type (commit 8427c18)

- **Rule:** Darmanitan Zen Mode has type Fire/Psychic and stats HP 11, Atk 3, Def 11, SpA 14, SpD 11, Spd 6. Capabilities: "Overland 4, Levitate 6, Swim 2, Jump 1/1, Power 2, Telekinetic, Telepath, Firestarter". (`gen5/darmanitan.md` lines 100-126)
- **Implementation:** New `darmanitan-zen.md` created with Fire/Psychic type, stats HP 11, Atk 3, Def 11, SpA 14, SpD 11, Spd 6, and Zen Mode capabilities. Abilities carried over from Standard Mode (Sheer Force, Flame Body, Inner Focus, Flash Fire, Zen Mode) since PTU source only lists abilities on the standard form page. Skills also carried from Standard Mode (no separate Zen Mode skills listed in source).
- **Status:** CORRECT
- **Verification:** Type, all 6 base stats, and all capabilities match the PTU source exactly. Carrying standard mode abilities/skills is correct — PTU doesn't list separate abilities for Zen Mode (it's a form change triggered by the Zen Mode High Ability, not a separate evolution).

## Summary

- Mechanics checked: 5
- Correct: 5
- Incorrect: 0
- Needs review: 0

## Parser Safety Check

Verified the Basic Information section scoping (commit 38daeeb) does not regress other species:
- All standard pokedex files contain a "Basic Information" section with the Type line — scoping there is correct
- Species without "Basic Information" fall back to full text search (original behavior preserved)
- Darmanitan base file's Zen Mode type ("Fire / Psychic" at line 121) is outside the Basic Information section (lines 27-36) and won't interfere

## File Discovery Check

New split files are auto-discovered by `seedSpecies()` which reads all `.md` files from generation directories (`gen5/`, `gen6/`, `gen7/`). No registration in lookup files required. Name extraction regex handles all new form descriptors: "Pom-Pom" (hyphen in character class), "Pa'u" (apostrophe in character class), "Zen Mode" / "Super Size" / "Small" / "Large" (standard mixed-case descriptors).

## Verdict

APPROVED — All 5 mechanics verified correct against PTU 1.05 source data. Types, base stats, abilities, and capabilities match exactly. Parser fix is safely scoped with backward-compatible fallback.

## Required Changes

None.
