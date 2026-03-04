---
review_id: rules-review-180
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-091
domain: character-lifecycle
commits_reviewed:
  - bcfb466
  - 60a1520
  - 93eb8d3
  - 558601f
  - 82dbd2e
  - ed275e5
mechanics_verified:
  - stat-ace-specializations
  - researcher-fields-of-study
  - martial-artist-branching-status
  - class-slot-limit-enforcement
verdict: BLOCKED
issues_found:
  critical: 1
  high: 0
  medium: 0
ptu_refs:
  - core/04-trainer-classes.md#stat-ace
  - core/04-trainer-classes.md#researcher
  - core/04-trainer-classes.md#martial-artist
reviewed_at: 2026-02-27T22:30:00Z
follows_up: rules-review-176
---

## Mechanics Verified

### Stat Ace Specializations (CRITICAL-001 from rules-review-176)
- **Rule:** "When you take Stat Ace, choose Attack, Defense, Special Attack, Special Defense, or Speed." (`core/04-trainer-classes.md` line 2239) -- HP is explicitly excluded. The class description (line 2189) also says "one of the five Combat Stats: Attack, Defense, Special Attack, Special Defense, and Speed." All Stat Ace features (Stat Link, Stat Training, Stat Maneuver, Stat Mastery, Stat Embodiment, Stat Stratagem) list effects only for these 5 stats -- no HP effect exists.
- **Implementation (commit bcfb466):** Changed `'Stat Ace': ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']` to `'Stat Ace': ['Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']`. This is correct -- HP removed, 5 combat stats remain.
- **Current state on master (HEAD):** The collect-slaves merge (1ff8d81) **reverted this fix**. Master currently has `['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']` -- the 6-stat list including HP.
- **Commit correctness:** CORRECT (fix was right)
- **Master state:** REVERTED -- fix not present on master

### Researcher Fields of Study (HIGH-001 from rules-review-176)
- **Rule:** "Choose two Researcher Fields of Study. You may take Features from those Fields with this instance of Researcher." (`core/04-trainer-classes.md` lines 4163-4167). The 9 Fields are: General Research Field (line 4169), Apothecary Research Field (line 4222), Artificer Research Field / Crystal Artifice (line 4261), Botany Research Field (line 4340), Chemistry Research Field (line 4393), Climatology Research Field (line 4465), Occultism Research Field (line 4511), Paleontology Research Field (line 4554), Pokemon Caretaking Research Field (line 4623). The overview (line 320-321) lists them as: "General Knowledge, Apothecary, Botany, Chemistry, Climatology, Crystal Artifice, Occultism, Paleontology, and Pokemon Caretaking."
- **Implementation (commit 60a1520):** Replaced Education Skills with the correct 9 Fields of Study: `['General Research', 'Apothecary', 'Crystal Artifice', 'Botany', 'Chemistry', 'Climatology', 'Occultism', 'Paleontology', 'Pokemon Caretaking']`. Added comment documenting the two-fields-per-instance simplification (PTU grants 2 fields but tool records 1). The name "General Research" matches the field header ("General Research Field") which is more specific than the overview's "General Knowledge."
- **Current state on master (HEAD):** The collect-slaves merge (1ff8d81) **reverted this fix**. Master currently has `['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed']` -- the old Education Skills list.
- **Commit correctness:** CORRECT (fix was right, all 9 fields match PTU RAW)
- **Master state:** REVERTED -- fix not present on master

### Martial Artist Branching Status (HIGH-002 from rules-review-176, C1 from code-review-200)
- **Rule:** Martial Artist is tagged `[Class]` only (`core/04-trainer-classes.md` line 5294: "Martial Artist / [Class]"). Compare with actual `[Branch]` classes: Stat Ace `[Class] [Branch]` (line 2230), Type Ace `[Class] [Branch]` (line 2684), Style Expert `[Class] [Branch]` (line 2480 implied), Researcher `[Class][Branch]` (line 4160). The errata does not change Martial Artist's tags. Per decree-026: "Martial Artist is NOT a branching class. Remove it from branching class handling."
- **Implementation (commit 93eb8d3):** Removed `isBranching: true` from the Martial Artist entry. Removed `'Martial Artist'` key and its fabricated specialization values from `BRANCHING_CLASS_SPECIALIZATIONS`. Updated comment to note only 4 canonical branching classes and that Martial Artist is not branching per decree-026.
- **Current state on master (HEAD):** The collect-slaves merge (1ff8d81) **reverted this fix**. Master currently has `isBranching: true` on Martial Artist and `'Martial Artist': ['Aura', 'Cover', 'Elemental', 'Focused', 'Form', 'Freestyle', 'Parkour', 'Weapons']` in `BRANCHING_CLASS_SPECIALIZATIONS`. This directly **violates decree-026** (active decree, ruled 2026-02-27).
- **Commit correctness:** CORRECT (fix was right, complies with decree-026)
- **Master state:** REVERTED -- fix not present on master. **DECREE VIOLATION** (decree-026).

### Class Slot Limit Enforcement (H1 from code-review-200)
- **Rule:** "a Trainer can only ever take a maximum of four Classes" (`core/04-trainer-classes.md` lines 20-21). Each branching instance consumes one class slot.
- **Implementation (commit 558601f):** Updated `isClassDisabled()` in `ClassFeatureSection.vue` to factor in max slots for branching classes. When a branching class is already selected and the trainer is at max slots, the button is now disabled, preventing the picker from opening for a slot that cannot be filled.
- **Current state on master (HEAD):** The collect-slaves merge (1ff8d81) **reverted this fix**. Master uses the old `isClassDisabled` logic that only checks `isFullySpecialized` for selected branching classes, ignoring the max slot limit.
- **Commit correctness:** CORRECT (fix properly prevents the UX issue of a silently-failing picker)
- **Master state:** REVERTED -- fix not present on master

### Dead Code Removal (M2 from code-review-200)
- **Implementation (commit 82dbd2e):** Removed `countClassInstances` function and its `hasBaseClass` import from `useCharacterCreation.ts`. No PTU rule implications -- this is a code quality fix.
- **Current state on master (HEAD):** The collect-slaves merge (1ff8d81) **reverted this fix**. Master still has `countClassInstances` and the `hasBaseClass` import.
- **Commit correctness:** CORRECT
- **Master state:** REVERTED

## Merge Regression Analysis

**All 6 fix cycle 2 commits (bcfb466 through ed275e5) are present in the git history** on both the slave branch and master. However, the `collect-slaves` merge (commit 1ff8d81, "orchestrator: collect-slaves for plan-20260227-210000") overwrote the fix cycle 2 changes to `trainerClasses.ts`, `useCharacterCreation.ts`, and `ClassFeatureSection.vue` with their pre-fix versions. This appears to be a merge conflict resolution error during the slave collection process where another slave's branch had the old version of these files, and the merge chose the wrong side.

The result is that master contains the fix cycle 2 commits in its history (so `git log` shows them), but the working tree state of these three files has been reverted to the state before fix cycle 2 started. **Every issue from rules-review-176 and code-review-200 remains unfixed on master.**

## Decree Compliance

- **decree-022 (branch-class-handling):** The core mechanism (suffix format, prefix matching, UI picker) is correctly implemented and was NOT reverted. The data correctness issues that were supposed to be fixed are reverted.
- **decree-026 (martial-artist-not-branching):** **VIOLATED on master.** Martial Artist still has `isBranching: true` and a fabricated specialization list. The fix commit (93eb8d3) was correct but was undone by the merge.

## Summary

The developer's 6 fix cycle 2 commits correctly addressed ALL issues from both previous reviews:
1. (CRITICAL-001) Stat Ace HP removal -- commit bcfb466: CORRECT
2. (HIGH-001) Researcher Fields of Study -- commit 60a1520: CORRECT
3. (HIGH-002/C1) Martial Artist removal from branching -- commit 93eb8d3: CORRECT, per decree-026
4. (H1) Max slots guard for branching picker -- commit 558601f: CORRECT
5. (M1) Two-fields simplification documented -- commit 60a1520 (in comment): CORRECT
6. (M2) Dead code removal -- commit 82dbd2e: CORRECT

However, the slave collector merge (1ff8d81) reverted ALL source code changes across all three affected files. The current master state is identical to the pre-fix-cycle-2 state for these files. This means:
- Stat Ace still incorrectly includes HP (PTU rules violation)
- Researcher still uses Education Skills instead of 9 Fields of Study (PTU rules violation)
- Martial Artist still marked as branching (PTU rules violation AND decree-026 violation)
- Branching picker still opens at max slots without feedback
- countClassInstances dead code still present

## Rulings

- **CRITICAL-001: Merge reversion undid all fix cycle 2 work.** The 6 commits are in the history but their effects are not present in the working tree on master. All issues from rules-review-176 (CRITICAL-001, HIGH-001, HIGH-002) and code-review-200 (C1, H1, M1, M2) remain unfixed. The decree-026 violation (Martial Artist branching) is CRITICAL severity per the decree system.

## Verdict

**BLOCKED** -- The fix cycle 2 commits themselves are PTU-correct and decree-compliant. I would APPROVE the commits' content. However, the collect-slaves merge (1ff8d81) reverted all source code changes, so master does not reflect the fixes. This review cannot approve the current state of master. The merge regression must be resolved first by re-applying the fix cycle 2 changes, then this review should be re-run.

## Required Changes

| # | Severity | Description |
|---|----------|-------------|
| CRITICAL-001 | CRITICAL | **Re-apply fix cycle 2 changes.** The collect-slaves merge (1ff8d81) reverted commits bcfb466, 60a1520, 93eb8d3, 558601f, and 82dbd2e across `app/constants/trainerClasses.ts`, `app/composables/useCharacterCreation.ts`, and `app/components/create/ClassFeatureSection.vue`. All changes must be re-applied. Cherry-picking or manually re-applying the diffs would resolve this. Note: decree-026 is actively violated on master until this is resolved. |
