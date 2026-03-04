---
review_id: rules-review-176
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - 69f53a0
  - 572f99f
  - ef9b512
  - 57c0aee
mechanics_verified:
  - branching-class-specialization
  - branching-class-identification
  - stat-ace-specializations
  - researcher-specializations
  - martial-artist-branching-status
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 0
ptu_refs:
  - core/04-trainer-classes.md#stat-ace
  - core/04-trainer-classes.md#researcher
  - core/04-trainer-classes.md#martial-artist
  - core/04-trainer-classes.md#type-ace
  - core/04-trainer-classes.md#style-expert
  - core/03-skills-edges-and-features.md#branch-tag
reviewed_at: 2026-02-27T12:00:00Z
follows_up: null
---

## Mechanics Verified

### [Branch] Tag Mechanic (Core Mechanic)
- **Rule:** "[Branch] -- If on a [Class] Feature, this tag means that Feature may be taken multiple times using a Class slot and choosing a different specialization each time. All other Features under this class with the [Branch] tag may be taken again with other instances of the Class, and function under their new Specialization." (`core/03-skills-edges-and-features.md` lines 1722-1727)
- **Implementation:** The `addClass()` function in `useCharacterCreation.ts` now allows adding classes with different specialization suffixes (e.g., "Type Ace: Fire" and "Type Ace: Water"). Each instance consumes one of the 4 class slots. The duplicate check uses exact string matching on the suffixed name, so different specializations pass naturally. Per decree-022, the colon-space separator format is used.
- **Status:** CORRECT -- the core branching mechanic is correctly implemented per decree-022 and PTU RAW.

### Type Ace Specializations
- **Rule:** "Type Ace [Class] [Branch]" -- specialization by Pokemon Type. 18 types available. (`core/04-trainer-classes.md` line 2684)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Type Ace']` lists all 18 Pokemon types: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.
- **Status:** CORRECT -- all 18 types present, matching PTU Type Chart.

### Style Expert Specializations
- **Rule:** "Style Expert [Class] [Branch]" -- specialization by Contest Stat: Beauty, Cool, Cute, Smart, Tough. (`core/04-trainer-classes.md` line 2480)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Style Expert']` lists: Cool, Beautiful, Cute, Smart, Tough.
- **Status:** CORRECT -- all 5 contest stats present. Note: PTU uses both "Beauty" and "Beautiful" interchangeably; "Beautiful" as used here matches the contest stat name.

### Stat Ace Specializations
- **Rule:** "When you take Stat Ace, choose Attack, Defense, Special Attack, Special Defense, or Speed." (`core/04-trainer-classes.md` line 2239, emphasis mine -- HP is explicitly excluded from the list)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Stat Ace']` lists: `['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']` -- includes HP.
- **Status:** INCORRECT -- **HP is not a valid Stat Ace specialization.** PTU explicitly lists only 5 combat stats for Stat Ace. The "chosen stat" for Stat Ace features (Stat Link, Stat Training, Stat Maneuver, Stat Mastery, Stat Embodiment, Stat Stratagem) all reference Attack, Defense, Special Attack, Special Defense, or Speed with specific effects per stat. HP has no corresponding effects listed anywhere in the Stat Ace feature tree. See CRITICAL-001.

### Researcher Specializations
- **Rule:** "Choose two Researcher Fields of Study. You may take Features from those Fields with this instance of Researcher." The 9 Fields of Study are: General Research, Apothecary, Crystal Artifice (Artificer), Botany, Chemistry, Climatology, Occultism, Paleontology, and Pokemon Caretaking. (`core/04-trainer-classes.md` lines 4163-4168, field headers at lines 4169, 4222, 4261, 4340, 4393, 4465, 4511, 4554, 4623)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Researcher']` lists: `['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed']` -- these are 5 Education Skills, NOT the 9 Fields of Study.
- **Status:** INCORRECT -- The implementation confuses Education Skills with Fields of Study. Researcher's branching specialization is by Field of Study, not by Education Skill. A Researcher choosing the Apothecary field accesses Medicine Education-based features, but the specialization itself is "Apothecary", not "Medicine Ed". The correct list should be: General Research, Apothecary, Crystal Artifice, Botany, Chemistry, Climatology, Occultism, Paleontology, Pokemon Caretaking. Note: each Researcher instance chooses TWO fields, not one -- the dropdown model may also need adjustment. See HIGH-001.

### Martial Artist Branching Status
- **Rule:** Martial Artist is tagged `[Class]` only -- NOT `[Class] [Branch]`. (`core/04-trainer-classes.md` line 5294: "Martial Artist / [Class]") The errata (`errata-2.md`) does not change this. Martial Artist chooses an Ability (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) at class time, but this is a one-time choice, not a branching specialization. The Martial Artist cannot be taken multiple times.
- **Implementation:** `isBranching: true` on the Martial Artist class definition (pre-existing, line 76 of `trainerClasses.ts`), and `BRANCHING_CLASS_SPECIALIZATIONS['Martial Artist']` lists: `['Aura', 'Cover', 'Elemental', 'Focused', 'Form', 'Freestyle', 'Parkour', 'Weapons']` -- these specialization names do not appear anywhere in the PTU Core rulebook.
- **Status:** INCORRECT -- Martial Artist is NOT a branching class per PTU RAW. The `isBranching: true` flag was pre-existing dead code, but this PR activates it by adding specialization data. Additionally, the specialization values ('Aura', 'Cover', 'Elemental', etc.) are entirely fabricated -- they do not correspond to any PTU content. The actual Martial Artist ability choices (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) are a one-time selection, not a branching mechanic. See HIGH-002.

**Note on decree-022 conflict:** Decree-022 itself lists Martial Artist as a branching class: "PTU allows [Branch] classes (Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist)". This contradicts PTU RAW where Martial Artist has `[Class]` without `[Branch]`. Per review protocol, I do NOT override the decree but am filing a decree-need ticket recommending revisitation of this point. See DECREE-NEED below.

### 4-Class Maximum with Branching
- **Rule:** "you can only ever take a maximum of four Classes" -- each branching instance takes one slot. (`core/04-trainer-classes.md` lines 21-27)
- **Implementation:** `MAX_TRAINER_CLASSES = 4` enforced in `addClass()` with `form.trainerClasses.length >= MAX_TRAINER_CLASSES` guard.
- **Status:** CORRECT -- the 4-class cap applies correctly, with each branching specialization consuming one slot.

### Prefix Matching for Class Lookups (decree-022)
- **Rule (decree):** "Class lookups that need to check 'does this character have Type Ace?' use startsWith('Type Ace') or similar prefix matching." (decree-022)
- **Implementation:** `hasBaseClass()` uses `classEntry === baseName || classEntry.startsWith(\`${baseName}: \`)` -- correctly matches both bare names and suffixed names. The space after the colon prevents false positives (e.g., "Type Ace" won't match "Type Ace2" since the prefix check requires ": " after the base name).
- **Status:** CORRECT -- per decree-022, prefix matching is implemented safely.

### UI Specialization Selection
- **Rule (decree):** "The UI should provide a specialization selection step when adding a branching class." (decree-022)
- **Implementation:** `ClassFeatureSection.vue` shows a dropdown (`<select>`) with available specializations when a branching class is clicked. Already-taken specializations are filtered out via `availableSpecializations` computed. The `confirmBranching()` function emits `addClass` with the formatted suffix string.
- **Status:** CORRECT for the UI flow mechanism. The dropdown correctly filters used specializations and formats the name per decree-022. However, the dropdown content is wrong for Stat Ace (includes HP), Researcher (wrong specialization set), and Martial Artist (fabricated values).

## Summary

The core branching class mechanism is correctly implemented per decree-022: colon-space suffix format, prefix matching via `hasBaseClass()`, 4-class slot enforcement, duplicate prevention by exact string match, and UI specialization picker with already-taken filtering. Type Ace (18 types) and Style Expert (5 contest stats) specializations are correct.

However, there are 3 data correctness issues:

1. **Stat Ace includes HP** which is not a valid Stat Ace combat stat per PTU (CRITICAL -- wrong game values in dropdown)
2. **Researcher specializations use Education Skills instead of Fields of Study** -- 5 skills listed instead of the 9 actual research fields (HIGH -- incorrect game content, and Researcher's "choose 2 fields per instance" mechanic is not reflected)
3. **Martial Artist is not a branching class** in PTU RAW -- it lacks the `[Branch]` tag, and the fabricated specialization values don't exist in the rules (HIGH -- enables illegal game state)

## Rulings

- **CRITICAL-001: Remove HP from Stat Ace specializations.** PTU Core p. 112 explicitly lists only 5 combat stats: Attack, Defense, Special Attack, Special Defense, Speed. HP is not a valid Stat Ace choice. File: `app/constants/trainerClasses.ts` line 110.

- **HIGH-001: Replace Researcher specializations with actual Fields of Study.** The 9 fields are: General Research, Apothecary, Crystal Artifice, Botany, Chemistry, Climatology, Occultism, Paleontology, Pokemon Caretaking (PTU Core pp. 140-148). The current list uses Education Skills which are prerequisites for fields, not the fields themselves. File: `app/constants/trainerClasses.ts` lines 112-114. Additionally, note that each Researcher instance chooses TWO fields -- the current single-dropdown model may under-represent this, though this could be deferred as a UI enhancement.

- **HIGH-002: Remove Martial Artist from BRANCHING_CLASS_SPECIALIZATIONS and set isBranching to false.** Martial Artist has `[Class]` only (PTU Core p. 161), not `[Class] [Branch]`. The specialization values (Aura, Cover, Elemental, etc.) are fabricated. The pre-existing `isBranching: true` flag on line 76 should also be corrected to `false` (or removed). File: `app/constants/trainerClasses.ts` lines 76, 115-117. **Note:** This contradicts decree-022's preamble which lists Martial Artist as a branching class. A decree-need ticket is recommended below.

## Decree Compliance

- **decree-022 (branch-class-handling):** Storage format (colon-space suffix), prefix matching (`hasBaseClass`), and UI specialization picker all comply with the decree. The mechanism is sound. Data correctness issues (which specializations are listed) are separate from the decree's scope.
- **Decree conflict (Martial Artist):** decree-022 lists Martial Artist as a branching class, but PTU RAW disagrees. Per review protocol, the decree is not overridden, but a decree-need is recommended.

## Decree-Need Recommendation

A `decree-need` ticket should be filed for:
- **Topic:** "Is Martial Artist a branching class?" -- decree-022 says yes, PTU Core p. 161 says no (only `[Class]`, not `[Class] [Branch]`). The decree may have been written based on incorrect analysis. Recommend the human revisit this specific point.

## Verdict

**CHANGES_REQUIRED** -- The branching mechanism per decree-022 is correctly implemented, but 3 data correctness issues must be fixed before approval:

1. (CRITICAL) Remove HP from Stat Ace specializations
2. (HIGH) Replace Researcher specialization list with actual Fields of Study
3. (HIGH) Remove Martial Artist from branching classes or obtain decree clarification

## Required Changes

| # | Severity | File | Line(s) | Change |
|---|----------|------|---------|--------|
| CRITICAL-001 | CRITICAL | `app/constants/trainerClasses.ts` | 110 | Remove `'HP'` from Stat Ace specializations. Correct list: `['Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']` |
| HIGH-001 | HIGH | `app/constants/trainerClasses.ts` | 112-114 | Replace `['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed']` with `['General Research', 'Apothecary', 'Crystal Artifice', 'Botany', 'Chemistry', 'Climatology', 'Occultism', 'Paleontology', 'Pokemon Caretaking']` |
| HIGH-002 | HIGH | `app/constants/trainerClasses.ts` | 76, 115-117 | Remove `isBranching: true` from Martial Artist definition AND remove `'Martial Artist'` entry from `BRANCHING_CLASS_SPECIALIZATIONS`. Also update comment on line 102 to remove "Martial Artist" reference. (Pending decree clarification -- if decree-022 is reaffirmed for Martial Artist, replace fabricated values with correct ability choices: Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) |
