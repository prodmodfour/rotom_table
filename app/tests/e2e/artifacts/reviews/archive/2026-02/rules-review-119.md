---
review_id: rules-review-119
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - cffaade
  - bdc5530
  - 16de370
  - dd23791
  - 8b23bac
mechanics_verified:
  - default-starting-money
  - trainer-weight-class
  - biography-fields
  - quick-vs-full-create
  - trainer-hp-formula
verdict: PASS WITH ISSUES
issues_found:
  critical: 0
  high: 1
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Step-9-Money-and-Items
  - core/02-character-creation.md#Step-6-Find-Derived-Stats
  - core/02-character-creation.md#Step-7-Basic-Descriptions
reviewed_at: 2026-02-21T22:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Default Starting Money

- **Rule:** "we recommend all starting Trainers begin with a Pokedex and $5000 to split between spending on supplies and keeping as cash." (`core/02-character-creation.md#Page 17`, Step 9)
- **Implementation:** `DEFAULT_STARTING_MONEY = 5000` in `useCharacterCreation.ts` (line 25). The BiographySection money field defaults to this value and displays the hint "(default 5,000 for level 1, PTU p. 17)".
- **Status:** CORRECT

The composable initializes `form.money = DEFAULT_STARTING_MONEY` (line 80). The `buildCreatePayload()` always includes `money: form.money` (line 347), so the default propagates through to the API. The `parseIntOrDefault` function in BiographySection.vue (line 173-178) ensures that clearing the money input reverts to the default rather than setting it to 0 or null.

### 2. Trainer Weight Class Computation

- **Rule:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5." (`core/02-character-creation.md#Page 16`, Step 6: Find Derived Stats)
- **Also confirmed in Quick-Start:** "Weight Class is 3 if you are between 55 and 110 pounds, 4 if you are between 111 and 220 pounds, and 5 if higher than that." (`core/02-character-creation.md#Page 18`)
- **Implementation:** `computeWeightClass()` in BiographySection.vue (lines 199-206) uses the **Pokemon** weight class scale (WC 1-6 in kg), NOT the PTU Trainer weight class scale.
- **Status:** INCORRECT -- uses wrong weight class scale for trainers

**Detailed analysis:**

The implementation computes:
```
WC 1: 0-10 kg, WC 2: 10-25 kg, WC 3: 25-50 kg,
WC 4: 50-100 kg, WC 5: 100-200 kg, WC 6: 200+ kg
```

PTU defines trainer weight classes as (converting pounds to kg):
```
WC 3: 55-110 lbs (~24.9-49.9 kg)
WC 4: 111-220 lbs (~50.3-99.8 kg)
WC 5: >220 lbs (>99.8 kg)
```

Key differences:
1. **PTU trainers do not have WC 1, WC 2, or WC 6.** A lightweight trainer (e.g., a child at 20 kg / 44 lbs) would display as "WC 2" in the implementation, but PTU does not define a trainer WC below 3. The rulebook simply doesn't give weight class assignments for trainers under 55 lbs.
2. **PTU trainers cap at WC 5.** A 300 kg trainer would display as "WC 6" in the implementation, but PTU caps trainers at WC 5.
3. The **WC 3/4/5 boundaries are approximately aligned** between the Pokemon scale (25/50/100/200 kg) and the trainer scale (~25/50/100 kg), so for "normal" adult trainers in the 25-100 kg range, the result is often the same. The divergence is at the extremes (very light or very heavy trainers).

The Pokemon weight class scale comes from the Pokedex entries (verified: Bulbasaur 6.9kg = WC 1, Kabuto 11.5kg = WC 2, Mankey 28kg = WC 3, Pinsir 55kg = WC 4, Graveler 105kg = WC 5, Snorlax 460kg = WC 6). This is the correct scale for Pokemon but not for trainers.

**Impact:** HIGH. This function is displayed in the trainer character creation biography section. For typical adult trainers (50-100 kg), the result happens to be the same as the PTU trainer scale, but edge cases (child characters, extremely light or heavy NPCs) will show an incorrect weight class. Since weight class affects game mechanics (grapple movement reduction, falling damage, Heavy Ball capture rate modifier), displaying the wrong WC during creation could propagate incorrect data.

**Fix:** Replace `computeWeightClass` with the PTU trainer weight class formula. Convert kg to lbs (`kg * 2.20462`) then apply: under 55 lbs = no WC defined (display "N/A" or omit), 55-110 lbs = WC 3, 111-220 lbs = WC 4, over 220 lbs = WC 5. Alternatively, keep kg thresholds directly: under ~24.9 kg = below WC range, 24.9-49.9 kg = WC 3, 50.0-99.8 kg = WC 4, over 99.8 kg = WC 5.

### 3. Biographical Fields Alignment with PTU Character Sheet

- **Rule:** Step 7 (p. 17): "Now's the time when you should take care to flesh out your character's appearance, their personality, and anything else that isn't covered by the game mechanics but is important to defining a person. Choose a name!" and "you may want to talk to your GM and the other players about developing a more detailed history for your character."
- **Implementation:** BiographySection.vue provides: age, gender, height (cm with ft/in conversion), weight (kg with lbs conversion), background story, personality, goals, money.
- **Status:** CORRECT

PTU p.17 Step 7 describes these as free-form biographical details. The implementation correctly makes all biography fields optional/nullable. The PTU character sheet (referenced in p.12: "you'll want a blank character sheet to fill out") includes fields for name, age, gender, height, weight, and background. The implementation covers all these fields plus personality and goals, which aligns with PTU's guidance to flesh out the character.

The `HumanCharacter` type in `character.ts` (lines 207-210) correctly types these as optional: `age?: number`, `gender?: string`, `height?: number`, `weight?: number`. The `background?: string`, `personality?: string`, and `goals?: string` fields (lines 254-256) are also properly optional.

### 4. Quick Create vs Full Create Mode

- **Rule:** PTU supports abbreviated character creation for NPCs. The GM chapter (`core/11-running-the-game.md`) discusses creating NPCs with less detail. The Quick-Start Steps on p.18 provide an abbreviated process. The full 9-step process (pp. 12-17) is for complete player characters.
- **Implementation:** `CreateMode = 'quick' | 'full'` (useCharacterCreation.ts line 27). Quick Create provides only name, type, level, raw stats, and notes. Full Create uses the complete multi-section form with all PTU steps.
- **Status:** CORRECT

The Quick Create mode (create.vue lines 63-134) correctly allows direct raw stat entry, bypassing the structured allocation system. This is appropriate for GM-created NPCs where the GM knows the final stats. It still computes the Trainer HP formula correctly: `maxHp = level * 2 + hpStat * 3 + 10` (line 509).

The Full Create mode (create.vue lines 137-306) uses the `useCharacterCreation` composable with all P0/P1/P2 sections, section completion tracking, and validation summary. This maps to the full 9-step PTU creation process.

### 5. Trainer HP Formula (Quick Create)

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (`core/02-character-creation.md#Page 16`)
- **Implementation:** Quick Create computes `maxHp = level * 2 + hpStat * 3 + 10` (create.vue line 509). Full Create uses the composable's `maxHp = form.level * 2 + computedStats.value.hp * 3 + 10` (useCharacterCreation.ts line 103).
- **Status:** CORRECT

Both code paths produce the same formula. Verified against PTU p.16 and the Quick-Start box on p.18: "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10."

### 6. Biography Auto-Expand Behavior

- **Rule:** PTU p.17 Step 7 notes "This is optional and doesn't need to happen in every campaign" for detailed history, but "Choose a name!" and basic descriptions are expected for PCs.
- **Implementation:** `biographyExpanded` starts `false` (create.vue line 444). A watcher on `creation.form.characterType` auto-expands for 'player' and collapses for 'npc' (lines 456-458).
- **Status:** CORRECT

This matches PTU's guidance that player characters should have fleshed-out biographies while NPCs are often created with minimal detail. The GM can always manually expand the section for NPCs when desired.

### 7. Section Completion Tracking

- **Rule:** PTU character creation has 9 steps. The sectionCompletion interface tracks progress across sections relevant to the implemented tiers (P0: basic info + stats, P1: background + edges + classes, P2: biography).
- **Implementation:** `sectionCompletion` computed (useCharacterCreation.ts lines 277-319) tracks 6 sections: basicInfo, background, edges, classes, stats, biography.
- **Status:** CORRECT (no PTU rule impact)

The section completion is purely a UX feature with no game logic implications. The biography section is marked complete when any of backgroundStory, personality, or goals is filled -- this is a reasonable heuristic since PTU p.17 says the level of detail "doesn't need to happen in every campaign."

## Summary

| Mechanic | Severity | Finding |
|---|---|---|
| Default starting money ($5000) | -- | CORRECT per PTU p.17 |
| Trainer weight class computation | HIGH | Uses Pokemon WC scale (1-6 in kg) instead of PTU Trainer WC scale (3-5 in lbs). WC 1, 2, 6 should not exist for trainers. |
| Biography fields | -- | CORRECT -- all PTU character sheet fields covered |
| Quick vs Full Create modes | -- | CORRECT -- Quick for NPCs, Full for PCs per PTU guidance |
| Trainer HP formula | -- | CORRECT in both Quick and Full Create paths |
| Auto-expand behavior | -- | CORRECT -- PCs get biography section, NPCs collapse it |
| Section completion tracking | -- | CORRECT (UX only, no rule impact) |

## Rulings

1. **Trainer Weight Class != Pokemon Weight Class.** PTU defines separate weight class systems for trainers (p.16: WC 3/4/5 in pounds) and Pokemon (Pokedex entries: WC 1-6 in kg). The current `computeWeightClass()` function uses the Pokemon scale. For trainer character creation, the trainer scale must be used. The WC 3/4 boundary (~50 kg / 110 lbs) and WC 4/5 boundary (~100 kg / 220 lbs) happen to approximately align between the two systems, but the absence of WC 1/2/6 for trainers is a definitive difference.

2. **Money default is correct.** The $5000 recommendation on p.17 is clearly stated and correctly implemented. Note this is a recommendation, not a hard rule -- "While it is ultimately up to your GM how much money Trainers start with" -- so the editable field is appropriate.

## Verdict

**PASS WITH ISSUES**

The P2 implementation correctly handles the majority of PTU mechanics: default starting money, biographical fields, Trainer HP formula in both create modes, and the Quick/Full Create mode split. One HIGH severity issue found: the weight class computation uses the Pokemon weight class scale instead of the PTU Trainer weight class scale. This produces incorrect results for edge-case characters (children, very heavy NPCs) and should be corrected.

No CRITICAL issues. No MEDIUM issues.

## Required Changes

1. **[HIGH] Fix `computeWeightClass()` in BiographySection.vue** to use the PTU Trainer weight class scale:
   - WC 3: 55-110 lbs (roughly 24.9-49.9 kg)
   - WC 4: 111-220 lbs (roughly 50.3-99.8 kg)
   - WC 5: >220 lbs (roughly >99.8 kg)
   - Below 55 lbs: no defined WC for trainers (display "N/A" or "< WC 3")
   - Reference: `core/02-character-creation.md`, Page 16, Step 6: Find Derived Stats

## Files Reviewed

- `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-5-reviewers-ptu-rule-056-p2-review/app/components/create/BiographySection.vue`
- `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-5-reviewers-ptu-rule-056-p2-review/app/composables/useCharacterCreation.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-5-reviewers-ptu-rule-056-p2-review/app/pages/gm/create.vue`
- `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-5-reviewers-ptu-rule-056-p2-review/app/types/character.ts`
- `/home/ashraf/pokemon_ttrpg/session_helper/.worktrees/slave-5-reviewers-ptu-rule-056-p2-review/app/constants/trainerStats.ts`

## PTU Sources Referenced

- `books/markdown/core/02-character-creation.md` (pp. 12-18, especially Step 6 p.16 and Step 9 p.17)
- `books/markdown/pokedexes/how-to-read.md` (Weight Class definition for Pokemon)
- `books/markdown/pokedexes/gen1/` (multiple entries for WC boundary verification)
- `books/markdown/errata-2.md` (checked -- no errata for trainer weight classes or starting money)
