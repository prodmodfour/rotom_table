---
review_id: rules-review-132
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-078
domain: character-lifecycle
commits_reviewed:
  - 1e9c8ca
  - 2becf59
mechanics_verified:
  - trainer-class-associated-skills
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/04-trainer-classes.md#juggler
  - core/04-trainer-classes.md#dancer
reviewed_at: 2026-02-23T09:00:00Z
follows_up: rules-review-125
---

## Mechanics Verified

### Juggler Associated Skills

- **Rule:** "Associated Skills: Acrobatics, Guile" (`core/04-trainer-classes.md` p.100, detailed class description)
- **Prerequisite cross-check:** "Prerequisites: Quick Switch, Novice Acrobatics, Novice Guile" (p.101). Further features reference both skills: Round Trip requires "Adept Acrobatics or Guile" (p.101), Emergency Release requires "Expert Acrobatics or Guile" (p.101), First Blood requires "Master Acrobatics or Guile" (p.101).
- **Implementation:** `associatedSkills: ['Acrobatics', 'Guile']` (line 55 of `app/constants/trainerClasses.ts`)
- **Status:** CORRECT

The fix changed `['Acrobatics']` to `['Acrobatics', 'Guile']`. The previous value matched only the summary table (pp. 67-72) which abbreviates "Skills: Acrobatics". The detailed description on p.100 explicitly lists both Acrobatics and Guile, and the class feature prerequisite on p.101 confirms Guile is required at Novice rank to even enter the class. This is now correct.

### Dancer Associated Skills

- **Rule:** "Associated Skills: Acrobatics, Athletics, Charm" (`core/04-trainer-classes.md` p.156, detailed class description)
- **Prerequisite cross-check:** "Prerequisites: Novice Acrobatics; Novice Athletics or Charm" (p.157). The Dancer class feature itself requires Athletics or Charm at Novice rank. Further features like Choreographer reference all three skills in various combinations (Acrobatics, Athletics, Charm) as prerequisites.
- **Implementation:** `associatedSkills: ['Acrobatics', 'Athletics', 'Charm']` (line 74 of `app/constants/trainerClasses.ts`)
- **Status:** CORRECT

The fix changed `['Acrobatics', 'Charm']` to `['Acrobatics', 'Athletics', 'Charm']`. The previous value matched only the summary table which abbreviates "Skills: Acrobatics, Charm". The detailed description on p.156 explicitly lists all three skills, and the class feature prerequisite on p.157 confirms Athletics is a valid (and named) prerequisite for the class entry. This is now correct.

### Errata Check

No errata entries exist for Juggler or Dancer in `books/markdown/errata-2.md`. The errata file adds the Cheerleader and Medic classes from a playtest supplement but does not modify any existing class skill listings.

## Summary

Both HIGH issues from rules-review-125 have been resolved correctly:

1. **H1 (Juggler missing Guile):** Fixed. Code now reads `['Acrobatics', 'Guile']`, matching the authoritative detailed Associated Skills listing on p.100 and the Novice Guile prerequisite on p.101.

2. **H2 (Dancer missing Athletics):** Fixed. Code now reads `['Acrobatics', 'Athletics', 'Charm']`, matching the authoritative detailed Associated Skills listing on p.156 and the Novice Athletics prerequisite on p.157.

The skill arrays are alphabetically ordered in a way that matches the book's listing order (Acrobatics before Guile for Juggler; Acrobatics before Athletics before Charm for Dancer). No other classes were modified in this fix cycle, which is correct since rules-review-125 confirmed all other 37 classes were already accurate.

## Rulings

No new rulings required. The two rulings from rules-review-125 (Juggler must include Guile; Dancer must include Athletics) have been implemented exactly as specified.

## Verdict

**APPROVED** -- All 39 trainer class `associatedSkills` entries now match the authoritative PTU Chapter 4 detailed class descriptions. The two HIGH issues from rules-review-125 are resolved. No remaining discrepancies between code and rulebook.

## Required Changes

None.
