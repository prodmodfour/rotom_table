---
review_id: rules-review-041
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-036
domain: pokemon-generation
commits_reviewed:
  - 742e25f
mechanics_verified:
  - rotom-appliance-base-stats
  - rotom-appliance-types
  - rotom-appliance-size-weight
  - rotom-appliance-abilities
  - rotom-appliance-capabilities
  - rotom-appliance-skills
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - books/markdown/pokedexes/gen4/rotom.md#page-608
  - books/markdown/pokedexes/gen4/rotom-normal.md#page-607
reviewed_at: 2026-02-19T00:30:00
---

## Review Scope

Review of commit `742e25f` (fix: add individual pokedex files for Rotom appliance forms) which creates 5 new pokedex files for Rotom Heat, Wash, Frost, Fan, and Mow. Each file was cross-referenced field-by-field against the original source `books/markdown/pokedexes/gen4/rotom.md` (PTU 1.05 page 608) and the Normal Form reference `rotom-normal.md` (page 607).

## Mechanics Verified

### Rotom Appliance Base Stats
- **Rule:** Page 608 shows shared appliance form stats: HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9 (`rotom.md` lines 9-25)
- **Implementation:** All 5 new files use identical stats: HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9
- **Status:** CORRECT

### Rotom Appliance Types
- **Rule:** "Heat Rotom: Electric/Fire, Wash Rotom: Electric/Water, Frost Rotom: Electric/Ice, Fan Rotom: Electric/Flying, Mow Rotom: Electric/Grass" (`rotom.md` lines 35-39)
- **Implementation:** rotom-heat.md: Electric/Fire, rotom-wash.md: Electric/Water, rotom-frost.md: Electric/Ice, rotom-fan.md: Electric/Flying, rotom-mow.md: Electric/Grass
- **Status:** CORRECT

### Rotom Appliance Size & Weight
- **Rule:** "All Appliance Form Rotoms are Medium size and have Weight Class 3." (`rotom.md` lines 40-42)
- **Implementation:** All 5 files: Height 1' 0" / 0.3m (Medium), Weight 22.0 lbs / 10.0kg (3). Size class Medium and WC 3 match source. Specific lbs/kg values are cosmetic (source only specifies size class and weight class, not exact measurements); the parser uses the parenthetical weight class number.
- **Status:** CORRECT

### Rotom Appliance Abilities
- **Rule:** "Rotoms in their Appliance Forms retain most of the same Basic Information as their Normal Form." (`rotom.md` lines 26-28). Normal Form abilities: Poltergeist, Static, Motor Drive, Volt Absorb, Sequence (`rotom-normal.md` lines 29-33)
- **Implementation:** All 5 files list: Poltergeist (Basic), Static (Adv 1), Motor Drive (Adv 2), Volt Absorb (Adv 3), Sequence (High)
- **Status:** CORRECT

### Rotom Appliance Capabilities
- **Rule:** Per-form capability lists on `rotom.md` lines 46-71, each form with distinct movement and special capabilities
- **Implementation:** Cross-referenced each form character-by-character:
  - Heat: Overland 2, Levitate 4, Jump 1/2, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Firestarter — matches source lines 47-49
  - Wash: Overland 1, Levitate 4, Swim 6, Jump 1/1, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Fountain — matches source lines 53-54
  - Frost: Overland 2, Levitate 4, Jump 1/1, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Freezer, Naturewalk (Tundra) — matches source lines 58-60
  - Fan: Overland 2, Levitate 4, Sky 6, Jump 1/1, Power 2, Glow, Invisibility, Phasing, Wired, Zapper, Guster — matches source lines 64-65
  - Mow: Overland 7, Levitate 4, Jump 1/1, Power 2, Glow, Invisibility, Phasing, Wired, Zapper, Naturewalk (Grassland, Forest) — matches source lines 69-71
- **Status:** CORRECT

### Rotom Appliance Skills
- **Rule:** Per-form skill lists on `rotom.md` lines 75-97
- **Implementation:** Cross-referenced each form:
  - Heat: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 2d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 76-77
  - Wash: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 1d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 81-82
  - Frost: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 1d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 86-87
  - Fan: Athl 2d6, Acro 5d6, Combat 3d6, Stealth 3d6-1, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 91-92
  - Mow: Athl 4d6, Acro 3d6, Combat 3d6, Stealth 1d6+2, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 96-97
- **Status:** CORRECT

## Pre-Existing Issues (untouched files)

The developer's fix log identified 4 related seed parsing issues. Two verified during this review:

1. **Oricorio** (`gen7/oricorio.md`): Line 29 reads `Type: Special / Flying (see Forme Change)`. "Special" is not a valid Pokemon type. Oricorio has 4 style forms with distinct types (Baile=Fire/Flying, Pom-Pom=Electric/Flying, Pa'u=Psychic/Flying, Sensu=Ghost/Flying). Same pattern as Rotom — needs per-form split files or parser enhancement. **Ticket:** ptu-rule-039.

2. **Type: Null** (`gen7/type-null.md`): Species name header `TYPE: NULL` on line 3 matches the type regex `/Type\s*:\s*/i`, causing the parser to extract "Null" as the type instead of the correct "Normal" from line 29. Parser name-collision bug. **Ticket:** ptu-rule-039.

3. **Pumpkaboo/Gourgeist** (`gen6/`): Developer reports Small form stats seeded instead of Average form. Not verified during this review. **Ticket:** ptu-rule-039.

4. **Darmanitan Zen Mode** (`gen5/darmanitan.md`): Zen Mode (Fire/Psychic, different base stats) embedded in same page as Standard Mode. Not seeded as separate entry. Same multi-form pattern as Rotom. **Ticket:** ptu-rule-039.

## Summary
- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

## Rulings

No ambiguous rules encountered. The source material is explicit about appliance form types, shared stats, per-form capabilities, and per-form skills. The only data not present in the source (page 608) is per-form move lists — the book states move lists "will change upon changing forms" but does not provide them on this page. This is a source material limitation, not a fix deficiency.

## Verdict

APPROVED — All 6 mechanics verified correct. Every field in the 5 new pokedex files matches the PTU 1.05 source (page 608) exactly. Seed count increase from 993 to 998 confirms all 5 forms now parse successfully.

## Required Changes

None.
