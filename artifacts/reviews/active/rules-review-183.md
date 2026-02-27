---
review_id: rules-review-183
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - a24aa84
  - bb0cfa3
  - 6cad337
  - 1313cb1
  - c2e589c
  - c76f2cb
  - cf6c2ae
mechanics_verified:
  - branching-class-specialization
  - stat-ace-specializations
  - researcher-fields-of-study
  - martial-artist-class-tag
  - type-ace-specializations
  - style-expert-specializations
  - max-class-slots-enforcement
  - prefix-matching-lookups
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/04-trainer-classes.md#stat-ace (line 2230, 2239)
  - core/04-trainer-classes.md#researcher (lines 4159-4168)
  - core/04-trainer-classes.md#researcher-fields (lines 4169, 4222, 4261, 4340, 4393, 4465, 4511, 4554, 4623)
  - core/04-trainer-classes.md#martial-artist (line 5293-5294)
  - core/04-trainer-classes.md#type-ace (line 2683-2684)
  - core/04-trainer-classes.md#style-expert (line 2479-2486)
  - core/03-skills-edges-and-features.md#branch-tag
reviewed_at: 2026-02-28T00:30:00Z
follows_up: rules-review-176
---

## Mechanics Verified

### Stat Ace Specializations (CRITICAL-001 from rules-review-176)
- **Rule:** "When you take Stat Ace, choose Attack, Defense, Special Attack, Special Defense, or Speed." (`core/04-trainer-classes.md` line 2239) -- HP is explicitly excluded from the enumerated list. The Stat Ace feature tree (Stat Link, Stat Training, Stat Maneuver, Stat Mastery, Stat Embodiment, Stat Stratagem) defines per-stat effects only for these 5 combat stats. HP has no corresponding branch effects.
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Stat Ace']` at `app/constants/trainerClasses.ts` line 110: `['Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']`. HP has been removed.
- **Status:** CORRECT -- all 5 combat stats present, HP excluded, matching PTU RAW exactly.

### Researcher Fields of Study (HIGH-001 from rules-review-176, M1 from code-review-204)
- **Rule:** "Choose two Researcher Fields of Study." (`core/04-trainer-classes.md` line 4163). The 9 Fields of Study are enumerated by their section headers: General Research Field (line 4169), Apothecary Research Field (line 4222), Artificer Research Field (line 4261), Botany Research Field (line 4340), Chemistry Research Field (line 4393), Climatology Research Field (line 4465), Occultism Research Field (line 4511), Paleontology Research Field (line 4554), Pokemon Caretaking Research Field (line 4623).
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Researcher']` at `app/constants/trainerClasses.ts` lines 115-118: `['General Research', 'Apothecary', 'Artificer', 'Botany', 'Chemistry', 'Climatology', 'Occultism', 'Paleontology', 'Pokemon Caretaking']`. All 9 fields present. The naming uses the field section header canonical source (stripped of " Research Field" suffix). Notably, "Artificer" (matching "Artificer Research Field" header) is used instead of "Crystal Artifice" (summary text at line 321), resolving M1 from code-review-204.
- **Implementation note:** A code comment at lines 112-114 documents the deliberate simplification: "PTU grants 2 Fields of Study per Researcher instance (Core p. 4163), but the tool records 1 specialization per class entry -- the GM tracks the second field outside the tool."
- **Status:** CORRECT -- all 9 fields present with consistent naming from canonical section headers. The two-field-per-instance simplification is documented and acceptable for a GM aid tool.

### Martial Artist Class Tag (HIGH-002 from rules-review-176, C1 from code-review-200)
- **Rule:** Martial Artist is tagged `[Class]` only -- NOT `[Class] [Branch]`. (`core/04-trainer-classes.md` line 5293-5294: "Martial Artist / [Class]"). The Ability choice (Guts, Inner Focus, Iron Fist, Limber, Reckless, Technician) is a one-time internal feature selection at class time, not a branching specialization. Confirmed by decree-026: "Martial Artist is NOT a branching class. Remove it from branching class handling."
- **Implementation:** `app/constants/trainerClasses.ts` line 76: `{ name: 'Martial Artist', category: 'Fighter', associatedSkills: ['Combat'], description: 'Hand-to-hand fighter' }` -- no `isBranching` property. The `BRANCHING_CLASS_SPECIALIZATIONS` map (lines 104-119) contains only 4 entries: Type Ace, Stat Ace, Style Expert, Researcher. Martial Artist has been completely removed from branching class handling. Per decree-026, this approach was ruled correct.
- **Status:** CORRECT -- Martial Artist is `[Class]` only, matching PTU RAW and decree-026.

### Type Ace Specializations
- **Rule:** "Type Ace [Class] [Branch]" -- specialization by Pokemon Type. 18 types available. (`core/04-trainer-classes.md` line 2684, with per-type feature sections for all 18 types throughout the chapter)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Type Ace']` at `app/constants/trainerClasses.ts` lines 105-109: Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.
- **Status:** CORRECT -- all 18 Pokemon types present, matching the PTU Type Chart and the Type Ace feature sections.

### Style Expert Specializations
- **Rule:** "When you take Style Expert, choose from Beauty, Cool, Cute, Smart, or Tough." (`core/04-trainer-classes.md` line 2485)
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS['Style Expert']` at `app/constants/trainerClasses.ts` line 111: `['Cool', 'Beautiful', 'Cute', 'Smart', 'Tough']`.
- **Status:** CORRECT (with pre-existing naming note) -- all 5 contest stats present. The implementation uses "Beautiful" where PTU RAW consistently uses "Beauty" as the contest stat name (lines 277, 2194, 2242, 2485). "Beautiful" only appears in the feature name "Beautiful Ballet" (line 2444). This is a pre-existing naming discrepancy from the original commit (69f53a0) that was NOT introduced by this fix cycle. See MEDIUM-001 for a ticket recommendation.

### 4-Class Maximum with Branching
- **Rule:** "you can only ever take a maximum of four Classes" -- each branching instance takes one slot. (`core/04-trainer-classes.md` lines 21-27)
- **Implementation:** `MAX_TRAINER_CLASSES = 4` (line 39). `addClass()` in `useCharacterCreation.ts` line 238: `if (form.trainerClasses.length >= MAX_TRAINER_CLASSES) return`. `isClassDisabled()` in `ClassFeatureSection.vue` lines 242-254: checks `atMaxSlots` for both branching and non-branching classes when already at 4/4, preventing the specialization picker from opening when no slots are available.
- **Status:** CORRECT -- the 4-class cap correctly applies, with each branching specialization consuming one slot. The max-slots guard on the branching button (H1 from code-review-200) is properly implemented.

### Prefix Matching for Class Lookups (decree-022)
- **Rule (decree):** "Class lookups that need to check 'does this character have Type Ace?' use startsWith('Type Ace') or similar prefix matching." (decree-022)
- **Implementation:** `hasBaseClass()` at `app/constants/trainerClasses.ts` line 137-139: `classEntry === baseName || classEntry.startsWith(\`${baseName}: \`)`. The colon-space separator prevents false positives. `getBaseClassName()` (line 148-155) only strips suffixes for known branching class names. `getSpecialization()` (line 164-172) extracts the specialization string safely.
- **Status:** CORRECT -- per decree-022, prefix matching is implemented with proper false-positive prevention.

### UI Specialization Selection (decree-022)
- **Rule (decree):** "The UI should provide a specialization selection step when adding a branching class." (decree-022)
- **Implementation:** `ClassFeatureSection.vue` lines 73-96: dropdown with `availableSpecializations` computed (line 270-275) excluding already-taken specializations. `confirmBranching()` (line 312-317) emits the correctly formatted suffix string. The branching class button displays `[Branch]` tag (line 50).
- **Status:** CORRECT -- UI specialization picker complies with decree-022.

### Dead Code Removal (M2 from code-review-200)
- **Rule:** N/A (code quality, not game logic).
- **Implementation:** `countClassInstances` function and the unused `hasBaseClass` import removed from `useCharacterCreation.ts` (commit c2e589c). Verified via grep: zero references to `countClassInstances` remain anywhere in the codebase. `hasBaseClass` is still defined in `trainerClasses.ts` and correctly used in `ClassFeatureSection.vue` (lines 174, 234, 261, 295).
- **Status:** CORRECT -- dead code removed, active usages preserved.

## Summary

Fix cycle 3 successfully re-applied ALL code changes that were reverted by the fix cycle 2 collect-slaves merge (C1 from code-review-204). All 3 data correctness issues from rules-review-176 are resolved: HP removed from Stat Ace (CRITICAL-001), Researcher Fields of Study correctly enumerated with Artificer naming (HIGH-001 + M1 from code-review-204), and Martial Artist removed from branching per decree-026 (HIGH-002). The max-slots guard from code-review-200 H1 is in place, and dead code from M2 is removed.

The collect-slaves merge at cf6c2ae preserved all code changes this time (verified via `git diff c76f2cb..cf6c2ae` showing no regressions in the three target files).

One pre-existing issue identified: Style Expert uses "Beautiful" instead of PTU's canonical "Beauty" as the contest stat name. This was present in the original specialization data (commit 69f53a0) and was not introduced or modified by this fix cycle. A ticket is recommended per lesson L2.

## Decree Compliance

- **decree-022 (branch-class-handling):** COMPLIANT. Colon-space suffix format, prefix matching via `hasBaseClass()`, `string[]` data model preserved, UI specialization picker with dropdown. All 4 canonical branching classes (Type Ace, Stat Ace, Style Expert, Researcher) have correct specialization lists.
- **decree-026 (martial-artist-not-branching):** COMPLIANT. Martial Artist has no `isBranching` flag, no entry in `BRANCHING_CLASS_SPECIALIZATIONS`. Only 4 branching classes remain, matching the decree's ruling. The decree-022 preamble was also updated to remove Martial Artist from the branching class list (noted in decree-026 implementation).

## Rulings

No new rulings required. All previous rulings from rules-review-176 have been addressed.

## Pre-Existing Issue (not blocking)

- **MEDIUM-001 (pre-existing): Style Expert "Beautiful" should be "Beauty".** PTU Core consistently names the contest stat "Beauty" (lines 277, 2194, 2242, 2485). The implementation uses "Beautiful" which only appears in PTU as a feature name ("Beautiful Ballet", line 2444). This was introduced in commit 69f53a0 (original specialization data) and was NOT modified by fix cycle 3. Per lesson L2, a ticket should be filed for this pre-existing discrepancy. It does not block approval of this fix cycle since the fix cycle did not introduce or modify this value.

**Recommended ticket:** File a LOW-severity ticket for "Style Expert specialization 'Beautiful' should be 'Beauty' to match PTU contest stat naming" in `app/constants/trainerClasses.ts` line 111.

## Verdict

**APPROVED** -- All issues from rules-review-176 (3 issues), code-review-200 (4 issues), and code-review-204 (2 issues) are fully resolved. The branching class implementation correctly reflects PTU 1.05 rules for all 4 canonical branching classes (Type Ace, Stat Ace, Style Expert, Researcher) and complies with both decree-022 and decree-026. The merge reversion from fix cycle 2 has been successfully recovered. No blocking issues remain.
