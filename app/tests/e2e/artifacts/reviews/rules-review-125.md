---
review_id: rules-review-125
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-078
domain: character-lifecycle
commits_reviewed:
  - b56535b
  - 270e429
  - cc3f6ca
  - 6c1af5f
  - 006a8e4
mechanics_verified:
  - trainer-class-associated-skills
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 0
ptu_refs:
  - core/04-trainer-classes.md#pp67-72 (summary table)
  - core/04-trainer-classes.md#pp73-195 (detailed class descriptions)
  - core/03-skills-edges-and-features.md#p40 (Survival as Education Skill)
reviewed_at: 2026-02-23T06:30:00Z
follows_up: (none -- first review)
---

## Mechanics Verified

### Trainer Class Associated Skills (all 39 classes)

- **Rule:** "Each Trainer Class has a list of Associated Skills. These aren't necessarily all required for the Class, but they are Skills that show up somewhere in the prerequisites for the Features in the Class (or as prerequisites to its prerequisites), sometimes as the only option and sometimes as part of a large set of options." (`core/04-trainer-classes.md#p66`)
- **Implementation:** The `TRAINER_CLASSES` array in `app/constants/trainerClasses.ts` encodes `associatedSkills` for all 39 trainer classes, consumed by `ClassFeatureSection.vue` for display and search filtering.
- **Status:** NEEDS REVIEW (2 classes have incomplete skill lists)

## Detailed Verification (39 classes)

### Methodology

Two sources exist in PTU Chapter 4 for each class's skills:
1. **Summary table** (pp. 67-72): Brief one-line "Skills:" listing per class
2. **Detailed class description** (pp. 73-195): Full "Associated Skills:" listing in the class writeup, plus the actual feature prerequisites

When these two sources disagree, the **detailed description is authoritative** because:
- It appears alongside the actual feature prerequisites
- The summary table is a quick-reference abbreviation
- The detailed section's skills can be verified against feature prerequisites

The developer's fix cross-referenced against the summary table (pp. 67-72). This was correct for 37 of 39 classes where summary and detailed match. For 2 classes, the summary table omits skills that appear in both the detailed Associated Skills listing and in the actual feature prerequisites.

### Introductory Classes (6/6 CORRECT)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Ace Trainer | Command | `['Command']` | CORRECT |
| Capture Specialist | Acrobatics, Athletics, Stealth, Survival, Perception, Guile | `['Acrobatics', 'Athletics', 'Stealth', 'Survival', 'Perception', 'Guile']` | CORRECT |
| Commander | Command | `['Command']` | CORRECT |
| Coordinator | Charm, Command, Guile, Intimidate, Intuition | `['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition']` | CORRECT |
| Hobbyist | General Education, Perception | `['General Ed', 'Perception']` | CORRECT |
| Mentor | Charm, Intimidate, Intuition, Pokemon Education | `['Charm', 'Intuition', 'Intimidate', 'Pokemon Ed']` | CORRECT |

### Battling Style Classes (6/7 CORRECT, 1 INCOMPLETE)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Cheerleader | Charm | `['Charm']` | CORRECT |
| Duelist | Focus | `['Focus']` | CORRECT |
| Enduring Soul | Athletics, Focus | `['Athletics', 'Focus']` | CORRECT |
| **Juggler** | **Acrobatics, Guile** | `['Acrobatics']` | **INCOMPLETE** |
| Rider | Acrobatics, Athletics | `['Acrobatics', 'Athletics']` | CORRECT |
| Taskmaster | Intimidate | `['Intimidate']` | CORRECT |
| Trickster | Guile | `['Guile']` | CORRECT |

### Specialist Team Classes (3/3 CORRECT)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Stat Ace | Command, Focus | `['Command', 'Focus']` | CORRECT |
| Style Expert | Charm, Command, Guile, Intimidate, Intuition | `['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition']` | CORRECT |
| Type Ace | Varies by Type | `[]` with description note | CORRECT |

### Professional Classes (5/5 CORRECT)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Chef | Intuition | `['Intuition']` | CORRECT |
| Chronicler | Perception | `['Perception']` | CORRECT |
| Fashionista | Charm, Command, Guile, Intimidate, Intuition | `['Charm', 'Command', 'Guile', 'Intimidate', 'Intuition']` | CORRECT |
| Researcher | Education Skills, Survival | `['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed', 'Survival']` | CORRECT |
| Survivalist | Survival | `['Survival']` | CORRECT |

Note: Researcher correctly expands "Education Skills" to all 5 Education Skills (General, Medicine, Occult, Pokemon, Technology) per `core/03-skills-edges-and-features.md#p26-28`. Survival is listed separately by the book but also counts as an Education Skill per p.40.

### Fighter Classes (8/9 CORRECT, 1 INCOMPLETE)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Athlete | Athletics | `['Athletics']` | CORRECT |
| **Dancer** | **Acrobatics, Athletics, Charm** | `['Acrobatics', 'Charm']` | **INCOMPLETE** |
| Hunter | Stealth, Survival | `['Stealth', 'Survival']` | CORRECT |
| Martial Artist | Combat | `['Combat']` | CORRECT |
| Musician | Charm, Focus | `['Charm', 'Focus']` | CORRECT |
| Provocateur | Charm, Guile, Intimidate | `['Charm', 'Guile', 'Intimidate']` | CORRECT |
| Rogue | Acrobatics, Athletics, Stealth | `['Acrobatics', 'Athletics', 'Stealth']` | CORRECT |
| Roughneck | Intimidate | `['Intimidate']` | CORRECT |
| Tumbler | Acrobatics | `['Acrobatics']` | CORRECT |

### Supernatural Classes (9/9 CORRECT)

| Class | Canonical Skills | Code | Verdict |
|---|---|---|---|
| Aura Guardian | Intuition | `['Intuition']` | CORRECT |
| Channeler | Intuition | `['Intuition']` | CORRECT |
| Hex Maniac | Occult Education | `['Occult Ed']` | CORRECT |
| Ninja | Combat, Stealth | `['Combat', 'Stealth']` | CORRECT |
| Oracle | Intuition, Perception | `['Intuition', 'Perception']` | CORRECT |
| Sage | Occult Education | `['Occult Ed']` | CORRECT |
| Telekinetic | Focus | `['Focus']` | CORRECT |
| Telepath | Focus, Intuition | `['Focus', 'Intuition']` | CORRECT |
| Warper | Focus, Guile | `['Focus', 'Guile']` | CORRECT |

### Developer's "11 unchanged" claim

The developer claimed 11 classes were already correct before the fix. Cross-referencing the diff, the following 11 classes were NOT modified:

1. Ace Trainer -- VERIFIED CORRECT
2. Juggler -- code has `['Acrobatics']`, summary table says `Acrobatics`, but detailed section says `Acrobatics, Guile` (HIGH issue)
3. Rider -- VERIFIED CORRECT
4. Trickster -- VERIFIED CORRECT
5. Stat Ace -- VERIFIED CORRECT
6. Chronicler -- VERIFIED CORRECT
7. Musician -- VERIFIED CORRECT
8. Roughneck -- VERIFIED CORRECT
9. Tumbler -- VERIFIED CORRECT
10. Telekinetic -- VERIFIED CORRECT
11. Telepath -- VERIFIED CORRECT

Of these 11, **Juggler was NOT correct** -- it was missing Guile.

## Summary

The ptu-rule-078 fix corrected 28 classes from incorrect skill lists to match the PTU Chapter 4 canonical listings. This was a substantial and largely accurate correction. However, the developer used the summary table (pp. 67-72) as the sole reference, which is an abbreviated quick-reference. Two classes have discrepancies between the summary table and the authoritative detailed class descriptions:

1. **Juggler** (HIGH): Summary says `Acrobatics`, detailed says `Acrobatics, Guile`. The Juggler class feature itself requires "Novice Acrobatics, Novice Guile" (p.101), and multiple features reference "Acrobatics or Guile" as prerequisites (Round Trip, Tag In, Emergency Release, First Blood). Guile is unambiguously an associated skill.

2. **Dancer** (HIGH): Summary says `Acrobatics, Charm`, detailed says `Acrobatics, Athletics, Charm`. The Dancer class feature requires "Novice Acrobatics; Novice Athletics or Charm" (p.157), and multiple features reference "Acrobatics, Athletics, or Charm" as prerequisites (Choreographer, Power Pirouette, Passing Waltz). Athletics is unambiguously an associated skill.

No errata corrections exist for trainer class associated skills (`books/markdown/errata-2.md` only adds the Cheerleader and Medic classes from a playtest supplement, neither of which affects the core 39 class skill lists).

## Rulings

1. **RULING (HIGH): Juggler must include Guile.** The detailed Associated Skills listing (p.100) says "Acrobatics, Guile". The Juggler class feature prerequisite (p.101) explicitly requires "Novice Guile". The summary table omission is an abbreviation error in the book. Change `['Acrobatics']` to `['Acrobatics', 'Guile']`.

2. **RULING (HIGH): Dancer must include Athletics.** The detailed Associated Skills listing (p.156) says "Acrobatics, Athletics, Charm". The Dancer class feature prerequisite (p.157) explicitly requires "Novice Athletics or Charm", and Choreographer/Power Pirouette/Passing Waltz all list "Athletics" as a prerequisite option. Change `['Acrobatics', 'Charm']` to `['Acrobatics', 'Athletics', 'Charm']`.

## Verdict

**CHANGES_REQUIRED** -- 2 HIGH issues must be fixed before approval.

## Required Changes

1. **Juggler** (`app/constants/trainerClasses.ts` line 55): Change `associatedSkills: ['Acrobatics']` to `associatedSkills: ['Acrobatics', 'Guile']`
2. **Dancer** (`app/constants/trainerClasses.ts` line 74): Change `associatedSkills: ['Acrobatics', 'Charm']` to `associatedSkills: ['Acrobatics', 'Athletics', 'Charm']`
