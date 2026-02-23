---
ticket_id: ptu-rule-078
priority: P3
status: in-progress
domain: character-lifecycle
source: rules-review-111
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Approximately 25+ of the 39 trainer class entries in `app/constants/trainerClasses.ts` have `associatedSkills` arrays that do not match the canonical "Skills:" listings from PTU Chapter 4 detailed class descriptions.

## Expected Behavior (PTU Rules)

Each trainer class in PTU Chapter 4 (pp. 65-160) lists specific "Skills:" associated with that class. These should be accurately reflected in the constants file.

## Actual Behavior

The implementation appears to have used a mixture of the concise "Skills:" summary listing and the detailed "Associated Skills:" entries, and in some cases added skills that appear in neither PTU source.

## Examples

Per the Game Logic Reviewer (rules-review-111):
- **Coordinator**: PTU lists `Charm, Command, Guile, Intimidate, Intuition` but implementation has `['Charm', 'Focus']`
- **Capture Specialist**: PTU lists `Acrobatics, Athletics, Stealth, Survival, Perception, Guile` but implementation has `['Survival', 'Pokemon Ed']`

## Affected Files

- `app/constants/trainerClasses.ts` — `associatedSkills` arrays for ~25 class entries

## Impact

Medium — these are informational hints displayed in the class picker UI, not enforcement logic. However, incorrect skill hints could mislead GMs about which skills to invest in for a class they want.

## Suggested Fix

Cross-reference every class entry's `associatedSkills` against the canonical "Skills:" line from PTU Chapter 4 (`books/markdown/core/04-trainer-classes.md`). The reviewer extracted all canonical Skills listings in rules-review-111.

## Resolution Log

**Branch:** `slave/5-dev-078-20260222-214423`
**File changed:** `app/constants/trainerClasses.ts`

**28 of 39 classes had incorrect `associatedSkills`** (worse than the ~25 estimate). All corrected against canonical "Skills:" listings from PTU Chapter 4 (pp. 67-72 summary section, verified against detailed class descriptions).

### Commits

1. `57c6f27` — fix: correct associatedSkills for Introductory trainer classes
   - Capture Specialist: `[Survival, Pokemon Ed]` -> `[Acrobatics, Athletics, Stealth, Survival, Perception, Guile]`
   - Commander: `[Command, Intuition]` -> `[Command]`
   - Coordinator: `[Charm, Focus]` -> `[Charm, Command, Guile, Intimidate, Intuition]`
   - Hobbyist: `[]` -> `[General Ed, Perception]`
   - Mentor: `[Intuition, Pokemon Ed]` -> `[Charm, Intuition, Intimidate, Pokemon Ed]`

2. `8a0703b` — fix: correct associatedSkills for Battling Style trainer classes
   - Cheerleader: `[Charm, Command]` -> `[Charm]`
   - Duelist: `[Command, Focus]` -> `[Focus]`
   - Enduring Soul: `[Focus, Intuition]` -> `[Athletics, Focus]`
   - Taskmaster: `[Command, Intimidate]` -> `[Intimidate]`

3. `84345df` — fix: correct associatedSkills for Specialist Team and Professional classes
   - Style Expert: `[Charm, Intuition]` -> `[Charm, Command, Guile, Intimidate, Intuition]`
   - Type Ace: `[Command, Pokemon Ed]` -> `[]` (skills vary by chosen type per PTU p.99)
   - Chef: `[Intuition, Survival]` -> `[Intuition]`
   - Fashionista: `[Charm]` -> `[Charm, Command, Guile, Intimidate, Intuition]`
   - Researcher: added `Occult Ed` and `Survival` (PTU says "Education Skills, Survival")
   - Survivalist: `[Athletics, Survival]` -> `[Survival]`

4. `082000f` — fix: correct associatedSkills for Fighter trainer classes
   - Athlete: `[Athletics, Acrobatics]` -> `[Athletics]`
   - Dancer: `[Acrobatics, Combat]` -> `[Acrobatics, Charm]`
   - Hunter: `[Perception, Stealth]` -> `[Stealth, Survival]`
   - Martial Artist: `[Combat, Athletics]` -> `[Combat]`
   - Provocateur: `[Charm, Guile]` -> `[Charm, Guile, Intimidate]`
   - Rogue: `[Guile, Stealth]` -> `[Acrobatics, Athletics, Stealth]`

5. `703d7e4` — fix: correct associatedSkills for Supernatural trainer classes
   - Aura Guardian: `[Intuition, Focus]` -> `[Intuition]`
   - Channeler: `[Intuition, Charm]` -> `[Intuition]`
   - Hex Maniac: `[Occult Ed, Focus]` -> `[Occult Ed]`
   - Ninja: `[Stealth, Acrobatics]` -> `[Combat, Stealth]`
   - Oracle: `[Occult Ed, Intuition]` -> `[Intuition, Perception]`
   - Sage: `[Occult Ed, Focus]` -> `[Occult Ed]`
   - Warper: `[Occult Ed, Focus]` -> `[Focus, Guile]`

### Classes confirmed correct (9 of 39, unchanged)
Ace Trainer, Rider, Trickster, Stat Ace, Chronicler, Musician, Roughneck, Tumbler, Telekinetic, Telepath

### Code path check
Grepped for all references to `associatedSkills` and `trainerClass` across the app. Only `ClassFeatureSection.vue` consumes `associatedSkills` (for display and search). No other code paths hardcode trainer class skill data.

### Fix cycle (rules-review-125 CHANGES_REQUIRED)

**Branch:** `slave/4-dev-078-fix-20260223-083000`

6. `1e9c8ca` — fix: add missing Guile to Juggler and Athletics to Dancer associatedSkills
   - Juggler: `['Acrobatics']` -> `['Acrobatics', 'Guile']` (PTU p.100 detailed listing, p.101 prerequisite requires Novice Guile)
   - Dancer: `['Acrobatics', 'Charm']` -> `['Acrobatics', 'Athletics', 'Charm']` (PTU p.156 detailed listing, p.157 prerequisite requires Novice Athletics or Charm)
   - Resolves H1 and H2 from rules-review-125
