# Rules Review 111 -- P1 Character Creation: Class/Feature/Edge Selection

**Ticket:** ptu-rule-056
**Design Spec:** design-char-creation-001
**Scope:** P1 implementation (7 commits: 1ed7df6..b340aeb)
**Reviewer:** Game Logic Reviewer
**Date:** 2026-02-20

---

## Verdict: PASS (with MEDIUM findings)

The P1 implementation correctly enforces all critical PTU character creation rules for classes, features, and edges. The core game mechanics -- max 4 classes, 4+1 features, 4 starting edges, Skill Edge restrictions on Pathetic skills and level 1 Novice cap, stat allocation base values and pools -- are all implemented faithfully per PTU Core Chapter 2 (pp. 12-18) and Chapter 4 (pp. 65-66).

No CRITICAL or HIGH severity rule violations found. Several MEDIUM findings regarding associated skill data accuracy in the class constants file.

---

## Findings

### 1. Background Mechanics (PTU p. 12-13)

**Status: CORRECT**

- PTU Rule: "Choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic." (p. 13)
- Implementation: `applyBackground()` in `useCharacterCreation.ts` (line 112-124) correctly sets exactly 1 Adept, 1 Novice, 3 Pathetic, with remaining skills staying Untrained.
- Validation: `validateSkillBackground()` warns if counts deviate from 1/1/3.
- All 11 sample backgrounds verified correct after rules-review-108 fixes (Hermit: Occult Ed Adept, Perception Novice per PTU p.14).
- Background presets with choice options (e.g., "At Least He's Pretty" has Novice "Command or Intuition") encode one default. This is documented as a known simplification in the design spec and flagged for future P1 enhancement. Acceptable.

### 2. Starting Edges (PTU p. 13-14)

**Status: CORRECT**

- PTU Rule: "Starting Trainers begin with four Edges to distribute." (p. 13)
- PTU Rule: "You cannot use Edges to raise other Skills up to Adept until you are at least Level 2." (p. 18 quick-start)
- PTU Rule: "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (p. 18)
- Implementation:
  - `STARTING_EDGES = 4` (useCharacterCreation.ts line 23)
  - Edge counter displays `4` as the target (EdgeSelectionSection.vue line 9)
  - `addSkillEdge()` (line 194-218) correctly blocks Pathetic skills: `if (currentRank === 'Pathetic') return error`
  - Level 1 cap enforced: line 209 blocks promotion to Adept/Expert/Master at level 1. This means at level 1, only Untrained->Novice promotions are allowed. This is CORRECT per PTU: "you cannot use Edges to raise other Skills up to Adept until you are at least Level 2" and "Keep in mind you cannot raise Skills above Novice at your starting level!" (p. 13).
  - The EdgeSelectionSection.vue `isSkillCapped()` (line 144-153) mirrors this logic in the UI, disabling already-Novice-or-higher skills at level 1.

### 3. Starting Features (PTU p. 13-14)

**Status: CORRECT**

- PTU Rule: "Starting Trainers begin with four Features to distribute. They also choose one Training Feature to gain, regardless of prerequisites." (p. 13)
- Implementation:
  - `MAX_FEATURES = 4` for class features (line 21)
  - Separate `trainingFeature` slot with "(free, no prerequisites)" label (ClassFeatureSection.vue line 136-147)
  - `allFeatures` computed combines both: `[...form.features, form.trainingFeature]` (line 161-164)
  - Validation checks for 5 total features at level 1 (characterCreationValidation.ts line 114-115)
  - Feature input is free-text, which is correct per the design spec rationale (PTU has hundreds of features across supplements)

### 4. Trainer Classes -- Max 4 Rule (PTU p. 65)

**Status: CORRECT**

- PTU Rule: "a Trainer can only ever take a maximum of four Classes" (Chapter 4, p. 65)
- Implementation: `MAX_TRAINER_CLASSES = 4` (trainerClasses.ts line 40), `addClass()` blocks at 4 (useCharacterCreation.ts line 150)
- UI disables class buttons when 4 are selected (ClassFeatureSection.vue line 43-45)
- Validation warns if >4 classes (characterCreationValidation.ts line 121)

### 5. Branching Classes (PTU p. 65)

**Status: CORRECT**

- PTU Rule: "Some Classes are known as Branching Classes, and you can take them multiple times (each time taking up one of your four Class slots), choosing different specialties each time" (p. 65)
- Implementation correctly marks these as branching:
  - **Stat Ace** (`isBranching: true`) -- Confirmed: "You may take Stat Ace multiple times, choosing different Stats each time" (p. 113)
  - **Style Expert** (`isBranching: true`) -- Confirmed: "You may take Style Expert multiple times, each time choosing a different Contest Stat" (p. 116)
  - **Type Ace** (`isBranching: true`) -- Confirmed: "You may take Type Ace multiple times" (p. 122)
  - **Researcher** (`isBranching: true`) -- Confirmed: "You may take Researcher any number of times" (p. 133)
  - **Martial Artist** (`isBranching: true`) -- Confirmed: archetype text references "multiple instances of Martial Artist" (p. 28), and class feature says "Choose one of the abilities listed below" implying style selection on each take
- Branching specialization prompts with appropriate placeholders (ClassFeatureSection.vue lines 252-261)
- Non-branching classes correctly block duplicate selection via `isClassSelected()` (line 221-223) which checks both exact name and `startsWith` for specialization variants

### 6. Skill Edge Rules (PTU p. 13-14)

**Status: CORRECT**

Already covered in Finding 2 above. The two key restrictions are properly enforced:
- Cannot raise Pathetic skills via Skill Edges
- Cannot exceed Novice at level 1

The rank progression in `addSkillEdge()` (line 200) correctly orders: Pathetic -> Untrained -> Novice -> Adept -> Expert -> Master.

### 7. Stat Allocation (PTU p. 15)

**Status: CORRECT**

- PTU Rule: "Starting Trainers begin with 10 HP and 5 points each in the rest of their Combat Stats. You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat." (p. 15)
- Implementation: `BASE_HP = 10`, `BASE_OTHER = 5`, `TOTAL_STAT_POINTS = 10`, `MAX_POINTS_PER_STAT = 5` (trainerStats.ts)
- `computedStats` correctly adds base values: `hp: 10 + statPoints.hp`, `attack: 5 + statPoints.attack`, etc.
- `incrementStat()` blocks at `MAX_POINTS_PER_STAT` and when `statPointsRemaining <= 0`
- Max HP formula: `level * 2 + computedStats.value.hp * 3 + 10` -- matches PTU: "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (p. 16)
- Evasions capped at +6 per PTU p. 16 (fixed in rules-review-108)

### 8. Trainer Class Constants -- Associated Skills Accuracy

**Status: MEDIUM -- Multiple discrepancies with PTU source material**

The `trainerClasses.ts` file encodes `associatedSkills` for each class. Comparing against PTU Core Chapter 4 detailed "Associated Skills" entries and the concise "Skills" listings reveals several discrepancies. While the design spec explicitly states these are informational hints (not rule enforcement), incorrect hints could mislead GMs making skill investment decisions.

Note: PTU Chapter 4 has TWO skill references per class -- the concise "Skills:" line in the class summary table (pp. 67-72) and the "Associated Skills:" line in each class's detailed description. These sometimes differ. The detailed "Associated Skills" is the canonical reference. The implementation appears to have used a mixture of both sources, and in some cases neither.

| Class | Implementation | PTU Concise (pp. 67-72) | PTU Detailed "Associated Skills" | Match? |
|---|---|---|---|---|
| Capture Specialist | `['Survival', 'Pokemon Ed']` | Acrobatics, Athletics, Stealth, Survival, Perception, Guile | Acrobatics, Athletics, Stealth, Survival, Perception, Guile | NO -- missing 4 skills |
| Commander | `['Command', 'Intuition']` | Command | Command | NO -- Intuition not listed |
| Coordinator | `['Charm', 'Focus']` | Charm, Command, Guile, Intimidate, Intuition | Charm, Command, Guile, Intimidate, Intuition | NO -- Focus not listed, missing 4 skills |
| Hobbyist | `[]` | General Education, Perception | General Education, Perception | NO -- missing 2 skills |
| Mentor | `['Intuition', 'Pokemon Ed']` | Charm, Intuition, Intimidate, Pokemon Education | Charm, Intimidate, Intuition, Pokemon Education | PARTIAL -- missing Charm, Intimidate |
| Cheerleader | `['Charm', 'Command']` | Charm | Charm | NO -- Command not listed |
| Duelist | `['Command', 'Focus']` | Focus | Focus | NO -- Command not listed |
| Enduring Soul | `['Focus', 'Intuition']` | Athletics, Focus | Athletics, Focus | NO -- Intuition not listed, missing Athletics |
| Taskmaster | `['Command', 'Intimidate']` | Intimidate | Intimidate | NO -- Command not listed |
| Style Expert | `['Charm', 'Intuition']` | Charm, Command, Guile, Intimidate, Intuition | Intuition, Command, Charm, Guile, Intimidate | PARTIAL -- missing Command, Guile, Intimidate |
| Type Ace | `['Command', 'Pokemon Ed']` | Varies by Type | Varies By Type | APPROXIMATE -- PTU varies by type |
| Chef | `['Intuition', 'Survival']` | Intuition | Intuition | NO -- Survival not listed |
| Fashionista | `['Charm']` | Charm, Command, Guile, Intimidate, Intuition | Charm, Command, Guile, Intimidate, Intuition | NO -- missing 4 skills |
| Researcher | `['General Ed', 'Medicine Ed', 'Technology Ed', 'Pokemon Ed']` | Education Skills, Survival | Education Skills, Survival | PARTIAL -- missing Survival |
| Survivalist | `['Athletics', 'Survival']` | Survival | Survival | NO -- Athletics not listed |
| Athlete | `['Athletics', 'Acrobatics']` | Athletics | Athletics | NO -- Acrobatics not listed |
| Dancer | `['Acrobatics', 'Combat']` | Acrobatics, Charm | Acrobatics, Athletics, Charm | NO -- Combat not listed, missing Charm/Athletics |
| Hunter | `['Perception', 'Stealth']` | Perception, Stealth | Survival, Stealth | MIXED -- matches concise, not detailed |
| Martial Artist | `['Combat', 'Athletics']` | Combat | Combat | NO -- Athletics not listed |
| Provocateur | `['Charm', 'Guile']` | Charm, Guile, Intimidate | Charm, Guile, Intimidate | NO -- missing Intimidate |
| Rogue | `['Guile', 'Stealth']` | Acrobatics, Athletics, Stealth | Acrobatics, Athletics, Stealth | NO -- wrong skills |
| Aura Guardian | `['Intuition', 'Focus']` | Intuition | Intuition | NO -- Focus not listed |
| Channeler | `['Intuition', 'Charm']` | Intuition | Intuition | NO -- Charm not listed (Charm is in concise) |
| Ninja | `['Stealth', 'Acrobatics']` | Combat, Stealth | Stealth, Combat | REORDERED but correct skills |
| Oracle | `['Occult Ed', 'Intuition']` | Intuition, Perception | Intuition, Perception | NO -- Occult Ed not listed, missing Perception |
| Sage | `['Occult Ed', 'Focus']` | Occult Education | Occult Education | NO -- Focus not listed |
| Warper | `['Occult Ed', 'Focus']` | Focus, Guile | Focus, Guile | NO -- Occult Ed not listed, missing Guile |

**Impact:** MEDIUM. The associated skills are displayed in the class picker UI as informational hints. Incorrect associations could lead GMs to invest in the wrong skills for a class they want. However, per the design spec scope note, these are explicitly not enforcement data -- the GM is expected to know the rules. A future data correction pass would improve UX.

**Recommendation:** File a data-correctness ticket to align `associatedSkills` with PTU Core Chapter 4 detailed "Associated Skills" entries. This is a data-only fix (no logic changes).

### 9. Class Categories

**Status: CORRECT**

All 6 categories match PTU Core p. 65:
- Introductory: Ace Trainer, Capture Specialist, Commander, Coordinator, Hobbyist, Mentor -- MATCHES
- Battling Style: Cheerleader, Duelist, Enduring Soul, Juggler, Rider, Taskmaster, Trickster -- MATCHES
- Specialist Team: Stat Ace, Style Expert, Type Ace -- MATCHES
- Professional: Chef, Chronicler, Fashionista, Researcher, Survivalist -- MATCHES
- Fighter: Athlete, Dancer, Hunter, Martial Artist, Musician, Provocateur, Rogue, Roughneck, Tumbler -- MATCHES
- Supernatural: Aura Guardian, Channeler, Hex Maniac, Ninja, Oracle, Sage, Telekinetic, Telepath, Warper -- MATCHES

All 39 classes are present with correct category assignments.

### 10. Immutability and State Correctness

**Status: CORRECT**

All state mutations in the composable use immutable spread patterns:
- `applyBackground()` (line 113-123): Creates new skills object via spread
- `incrementStat()`/`decrementStat()`: Uses `{ ...form.statPoints, [stat]: newValue }`
- `addClass()`: Uses `[...form.trainerClasses, className]`
- `addFeature()`: Uses `[...form.features, featureName]`
- `addEdge()`: Uses `[...form.edges, edgeName]`
- `addSkillEdge()`: Uses `{ ...form.skills, [skill]: nextRank }` and `[...form.edges, ...]`
- `removeFeature()`/`removeEdge()`/`removeClass()`: Uses `.filter()` (returns new array)

This was explicitly addressed in commit 1ed7df6 after code-review-118 flagged the immutability issue.

### 11. Build Payload Correctness

**Status: CORRECT**

`buildCreatePayload()` (line 241-257) correctly:
- Computes stats as `BASE_HP + statPoints.hp` etc.
- Includes `maxHp` and `currentHp` set to the same computed max
- Passes `allFeatures` (4 class features + 1 training feature combined)
- Passes `trainerClasses`, `edges`, `skills`
- Uses `undefined` for empty optional fields (won't create null DB entries)

---

## Summary

| Category | Severity | Finding |
|---|---|---|
| Background mechanics | -- | CORRECT per PTU p. 12-13 |
| Starting edges (4) | -- | CORRECT per PTU p. 13-14 |
| Starting features (4+1 Training) | -- | CORRECT per PTU p. 13-14 |
| Max 4 classes | -- | CORRECT per PTU p. 65 |
| Branching classes | -- | CORRECT -- all 5 branching classes properly identified |
| Skill Edge restrictions | -- | CORRECT -- Pathetic block + Novice cap at level 1 |
| Stat allocation (10 HP, 5 base, +10 pool, max 5) | -- | CORRECT per PTU p. 15 |
| Associated skills data | MEDIUM | 25+ discrepancies with PTU Chapter 4 source data |
| Class categories | -- | CORRECT -- all 39 classes in 6 categories match PTU |
| Immutability patterns | -- | CORRECT -- all state changes use spreads/filters |
| Payload construction | -- | CORRECT -- proper API shape with computed stats |

---

## Actionable Items

1. **[MEDIUM] File a data-correctness ticket** for `app/constants/trainerClasses.ts` to align `associatedSkills` arrays with PTU Core Chapter 4 detailed "Associated Skills" entries. This is ~25 data corrections, no logic changes. The detailed entry (not the concise "Skills:" summary) is the canonical source.

---

## Files Reviewed

- `/home/ashraf/pokemon_ttrpg/session_helper/app/constants/trainerStats.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/constants/trainerClasses.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/constants/trainerSkills.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/constants/trainerBackgrounds.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/composables/useCharacterCreation.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/components/create/ClassFeatureSection.vue`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/components/create/EdgeSelectionSection.vue`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/utils/characterCreationValidation.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/app/pages/gm/create.vue`

## PTU Sources Referenced

- `books/markdown/core/02-character-creation.md` (pp. 12-22)
- `books/markdown/core/04-trainer-classes.md` (pp. 65-166, detailed class entries)
