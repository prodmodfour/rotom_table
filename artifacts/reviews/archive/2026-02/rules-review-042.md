---
review_id: rules-review-042
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-036
domain: pokemon-generation
commits_reviewed:
  - 742e25f
  - acaffe7
mechanics_verified:
  - rotom-appliance-base-stats
  - rotom-appliance-types
  - rotom-appliance-size-weight
  - rotom-appliance-abilities
  - rotom-appliance-capabilities
  - rotom-appliance-skills
  - weight-class-range-consistency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - books/markdown/pokedexes/gen4/rotom.md#page-608
  - books/markdown/pokedexes/gen4/rotom-normal.md#page-607
  - books/markdown/core/10-indices-and-reference.md#weight-class-table
reviewed_at: 2026-02-19T14:00:00
supersedes: rules-review-041
---

## Review Scope

Re-review of ptu-rule-036 fix covering both commits:
- `742e25f` — fix: add individual pokedex files for Rotom appliance forms (5 new files)
- `acaffe7` — fix: correct Rotom appliance form weights to match WC 3 range (weight value correction in all 5 files)

Previous review `rules-review-041` approved commit `742e25f` only. This review covers both commits including the new weight correction, and supersedes rules-review-041.

## Delta from Previous Review

The only change between `742e25f` and `acaffe7` is the weight line in all 5 appliance files:
- **Before:** `Weight : 22.0 lbs. / 10.0kg (3)` — 22.0 lbs falls in WC 1 range (0–25 lbs)
- **After:** `Weight : 66.1 lbs. / 30.0kg (3)` — 66.1 lbs falls in WC 3 range (55–110 lbs)

The parenthesized weight class `(3)` was already correct in both versions. The fix aligns the cosmetic lbs/kg values with the declared weight class.

## Mechanics Verified

### Rotom Appliance Base Stats
- **Rule:** Page 608 shows shared appliance form stats: HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9 (`rotom.md` lines 9-25)
- **Implementation:** All 5 files use identical stats: HP 5, Atk 7, Def 11, SpA 11, SpD 11, Spe 9
- **Status:** CORRECT

### Rotom Appliance Types
- **Rule:** "Heat Rotom: Electric/Fire, Wash Rotom: Electric/Water, Frost Rotom: Electric/Ice, Fan Rotom: Electric/Flying, Mow Rotom: Electric/Grass" (`rotom.md` lines 35-39)
- **Implementation:** rotom-heat.md: Electric/Fire, rotom-wash.md: Electric/Water, rotom-frost.md: Electric/Ice, rotom-fan.md: Electric/Flying, rotom-mow.md: Electric/Grass
- **Status:** CORRECT

### Rotom Appliance Size & Weight
- **Rule:** "All Appliance Form Rotoms are Medium size and have Weight Class 3." (`rotom.md` lines 40-42)
- **Implementation:** All 5 files: Height 1' 0" / 0.3m (Medium), Weight 66.1 lbs. / 30.0kg (3)
- **Status:** CORRECT

### Weight Class Range Consistency (new mechanic — acaffe7)
- **Rule:** Weight Class table (`10-indices-and-reference.md` lines 3635-3641): WC 1 = 0–25 lbs / 0–11 kg, WC 2 = 25–55 lbs / 11–25 kg, **WC 3 = 55–110 lbs / 25–50 kg**
- **Implementation:** 66.1 lbs / 30.0 kg — both values fall within WC 3 range (55–110 lbs, 25–50 kg)
- **Previous value:** 22.0 lbs / 10.0 kg — fell within WC 1 range (0–25 lbs, 0–11 kg), contradicting the parenthesized `(3)`
- **Parser behavior:** Confirmed seed parser regex `/Weight\s*:\s*[^(]*\((\d+)\)/i` (`seed.ts` line 342) extracts only the parenthesized number. The lbs/kg values are not parsed into the database.
- **Status:** CORRECT — no functional impact on seeded data, but data source files are now internally consistent
- **Note:** The PTU source (page 608) specifies "Medium size and Weight Class 3" without giving exact lbs/kg measurements for appliance forms. The Normal Form (page 607) is 0.7 lbs / 0.3 kg (WC 1, Small). The chosen 66.1 lbs / 30.0 kg is a reasonable representative value near the midpoint of the WC 3 range.

### Rotom Appliance Abilities
- **Rule:** "Rotoms in their Appliance Forms retain most of the same Basic Information as their Normal Form." (`rotom.md` lines 26-28). Normal Form abilities: Poltergeist, Static, Motor Drive, Volt Absorb, Sequence (`rotom-normal.md` lines 29-33)
- **Implementation:** All 5 files list: Poltergeist (Basic), Static (Adv 1), Motor Drive (Adv 2), Volt Absorb (Adv 3), Sequence (High)
- **Status:** CORRECT

### Rotom Appliance Capabilities
- **Rule:** Per-form capability lists on `rotom.md` lines 46-71
- **Implementation:** Cross-referenced each form against source:
  - Heat: Overland 2, Levitate 4, Jump 1/2, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Firestarter — matches source lines 47-49
  - Wash: Overland 1, Levitate 4, Swim 6, Jump 1/1, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Fountain — matches source lines 53-54
  - Frost: Overland 2, Levitate 4, Jump 1/1, Power 3, Glow, Invisibility, Phasing, Wired, Zapper, Freezer, Naturewalk (Tundra) — matches source lines 58-60
  - Fan: Overland 2, Levitate 4, Sky 6, Jump 1/1, Power 2, Glow, Invisibility, Phasing, Wired, Zapper, Guster — matches source lines 64-65
  - Mow: Overland 7, Levitate 4, Jump 1/1, Power 2, Glow, Invisibility, Phasing, Wired, Zapper, Naturewalk (Grassland, Forest) — matches source lines 69-71
- **Status:** CORRECT

### Rotom Appliance Skills
- **Rule:** Per-form skill lists on `rotom.md` lines 75-97
- **Implementation:** Cross-referenced each form against source:
  - Heat: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 2d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 76-77
  - Wash: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 1d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 81-82
  - Frost: Athl 4d6, Acro 2d6, Combat 3d6, Stealth 1d6, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 86-87
  - Fan: Athl 2d6, Acro 5d6, Combat 3d6, Stealth 3d6-1, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 91-92
  - Mow: Athl 4d6, Acro 3d6, Combat 3d6, Stealth 1d6+2, Percep 2d6+2, Focus 2d6, Edu: Tech 4d6+4 — matches source lines 96-97
- **Status:** CORRECT

## Summary
- Mechanics checked: 7
- Correct: 7
- Incorrect: 0
- Needs review: 0

## Rulings

No ambiguous rules encountered. The weight class range table is unambiguous (WC 3 = 55–110 lbs / 25–50 kg), and the corrected values (66.1 lbs / 30.0 kg) fall cleanly within range.

## Verdict

APPROVED — All 7 mechanics verified correct across both commits. The weight correction in `acaffe7` resolves the internal inconsistency where lbs/kg values contradicted the declared weight class. While the parser only uses the parenthesized WC number (no functional impact on seeded data), the source files are now self-consistent — a reader looking at the file sees lbs/kg values that match WC 3.

## Required Changes

None.
