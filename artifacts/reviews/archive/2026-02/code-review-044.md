---
review_id: code-review-044
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-036
domain: pokemon-generation
commits_reviewed:
  - 742e25f
files_reviewed:
  - books/markdown/pokedexes/gen4/rotom-heat.md
  - books/markdown/pokedexes/gen4/rotom-wash.md
  - books/markdown/pokedexes/gen4/rotom-frost.md
  - books/markdown/pokedexes/gen4/rotom-fan.md
  - books/markdown/pokedexes/gen4/rotom-mow.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 1
scenarios_to_rerun:
  - pokemon-lifecycle-workflow-wild-spawn-001
reviewed_at: 2026-02-19T12:00:00
---

## Review Scope

Fix for ptu-rule-036: Rotom appliance forms (Heat, Wash, Frost, Fan, Mow) were not individually seeded because the combined `rotom.md` uses a non-standard type format (`Heat Rotom: Electric/Fire`) that the seed parser's `Type\s*:\s*` regex cannot match. The fix splits the 5 appliance forms into individual pokedex files following the standard format.

## Cross-verification performed

- **Source data accuracy:** Compared all 5 new files line-by-line against the original `books/markdown/pokedexes/gen4/rotom.md` (page 608). Base stats, capabilities, and skills are exact transcriptions for all forms.
- **Type correctness:** Heat=Electric/Fire, Wash=Electric/Water, Frost=Electric/Ice, Fan=Electric/Flying, Mow=Electric/Grass — matches source type information section.
- **Abilities:** All 5 files use Normal Form abilities (Poltergeist, Static, Motor Drive, Volt Absorb, Sequence). Source says "retain most of the same Basic Information as their Normal Form" — correct.
- **Parser safety — old rotom.md:** The `Type\s*:\s*` regex does not match `Heat Rotom: Electric/Fire` format, so `typeMatch` is null and the entry is skipped at line 413 (`if (!hpMatch || !typeMatch) continue`). No collision with new entries.
- **Parser safety — deduplication:** Names "Rotom Heat", "Rotom Wash", etc. are distinct from "Rotom" (and "Rotom" never enters `seenNames` since the old entry is skipped before name registration). No collision.
- **Parser safety — discovery:** Seed parser globs all `*.md` files in gen directories alphabetically. All 5 new files in `gen4/` will be found automatically. No lookup file or registration needed.
- **Seed count:** Fix Log reports 998 species (up from 993) — correct +5 delta.
- **Existing Rotom Normal Form:** `rotom-normal.md` (Electric/Ghost, different base stats) is unaffected.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

**M1: Fabricated weight values are inconsistent with WC 3.**

All 5 files use `Weight : 22.0 lbs. / 10.0kg (3)`. Per the PTU Weight Class table (`core/10-indices-and-reference.md:3633`):

| WC | Pounds | Kilograms |
|---|---|---|
| 1 | 0 – 25 lbs | 0 – 11 kg |
| 2 | 25 – 55 lbs | 11 – 25 kg |
| **3** | **55 – 110 lbs** | **25 – 50 kg** |

22.0 lbs / 10.0 kg falls in WC 1, not WC 3. The parser only extracts `(3)` from the parentheses, so `weightClass: 3` is correctly stored — **zero functional impact**. However, the source files contain self-contradictory data. The original `rotom.md` only specifies "Weight Class 3" without exact values, so the worker had to fabricate a weight; they should pick one in the correct range.

**Fix (same change in all 5 files):**
```
// Current (WC 1 range):
  Weight : 22.0 lbs. / 10.0kg (3)

// Fixed (WC 3 range — any value in 55-110 lbs / 25-50 kg):
  Weight : 66.1 lbs. / 30.0kg (3)
```

**Affected files:** `rotom-heat.md:41`, `rotom-wash.md:41`, `rotom-frost.md:41`, `rotom-fan.md:41`, `rotom-mow.md:41`

## What Looks Good

- **Approach follows existing patterns.** Individual files match the Deoxys precedent (`deoxys-normal.md`, `deoxys-attack.md`, etc.). Clean and maintainable.
- **Exact data transcription.** Capabilities and skills for all 5 forms are character-accurate against the source.
- **No parser collision risk.** Old `rotom.md` is harmlessly skipped. New entries use unique names.
- **Correct ability inheritance.** Source explicitly states appliance forms retain Normal Form basic information.
- **Well-scoped commit.** Single logical change, descriptive message with body explaining context.
- **Related findings documented separately.** Oricorio, Type: Null, Pumpkaboo/Gourgeist, and Darmanitan Zen issues noted in the ticket's Fix Log for separate tickets rather than scope-creeping.

## Verdict

CHANGES_REQUIRED — Fix the weight values in all 5 appliance form files to use a value in the WC 3 range (55–110 lbs / 25–50 kg). This is a 5-line change with no behavioral impact, but reference data should be internally consistent. After the fix, this is ready for Game Logic Reviewer.

## Scenarios to Re-run

- `pokemon-lifecycle-workflow-wild-spawn-001`: Verify Rotom appliance forms can be spawned with correct types from the species lookup (previously these forms did not exist in SpeciesData).
