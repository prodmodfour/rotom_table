---
review_id: rules-review-220
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - 3fdc1c21
  - 5779f595
  - 83dc7a6e
  - eb7ea9b4
mechanics_verified:
  - regular-skill-edge-rank-ups
  - bonus-skill-edge-rank-restriction
  - stacked-skill-edge-display
  - effective-skills-tracking
  - skill-rank-payload-persistence
  - trainer-hp-formula
  - milestone-choices
  - class-choice-max-four
  - branching-class-specialization
  - pathetic-skill-during-level-up
  - skill-ranks-via-edges-only
  - class-choice-informational-warning
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#page-19
  - core/02-character-creation.md#page-18
  - core/03-skills-edges-and-features.md#page-52
  - core/04-trainer-classes.md#page-65
reviewed_at: 2026-03-01T18:45:00Z
follows_up: rules-review-215
---

## Context

Re-review of feature-008 P1 fix cycle. The original P1 implementation (11 commits) was reviewed in rules-review-215 (APPROVED with MED-01) and code-review-239 (CHANGES_REQUIRED: C1 critical, H1 high, M1/M2 medium). This re-review covers the 4 code commits from the fix cycle that address those issues.

## Previous Issues Status

### code-review-239 C1 (CRITICAL): Regular Skill Edges not updating skill ranks

**Original problem:** Regular Skill Edges (stored as `"Skill Edge: <skill>"` strings in `edgeChoices`) were not reflected in `effectiveSkills`, `buildUpdatePayload()`, `skillRankUpDetails`, or cap checks. This was a data corruption bug -- the edge was recorded but the skill rank was never updated in the database.

**Fix (commit 3fdc1c21):** Three-pronged resolution:

1. **Composable (`useTrainerLevelUp.ts`):** Added `regularSkillEdgeSkills` computed that parses `"Skill Edge: <skill>"` entries from `edgeChoices`. Added `countAllSkillEdgeUps()` function that unifies bonus + regular Skill Edge counting. Updated `getEffectiveSkillRank()` and `effectiveSkills` computed to use `countAllSkillEdgeUps()` instead of only counting bonus choices. Updated `buildUpdatePayload()` to apply regular Skill Edge rank-ups to the skills record (lines 454-461), in addition to the existing bonus Skill Edge rank-ups (lines 446-452).

2. **Summary (`LevelUpSummary.vue`):** `skillRankUpDetails` computed now includes both bonus and regular Skill Edge rank-ups with source labeling ("Bonus L2", "Regular Edge"). A `runningRank` tracker ensures stacked rank-ups on the same skill display correct from/to progression.

3. **Modal (`LevelUpModal.vue`):** Added `:regular-skill-edge-skills` prop pass-through to LevelUpSummary.

**Rules verification:**

- **Rank progression correctness:** Both the bonus and regular Skill Edge rank-up paths in `buildUpdatePayload()` use `RANK_PROGRESSION.indexOf()` to find the current rank index, then advance by +1 to `RANK_PROGRESSION[currentIndex + 1]`. The rank progression is `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`, which matches PTU Core p.52: "Pathetic -> Untrained (Basic Skills), Untrained -> Novice (Basic Skills), Novice -> Adept (Adept Skills), Adept -> Expert (Expert Skills), Expert -> Master (Master Skills)".

- **Sequential application order:** Bonus Skill Edge rank-ups are applied first, then regular Skill Edge rank-ups. Both operate on `updatedSkillsWithAllEdges`, so if a bonus edge raises a skill from Untrained to Novice, a subsequent regular Skill Edge correctly starts from Novice and raises to Adept. This sequential application matches PTU RAW where each Skill Edge is a discrete +1 rank-up.

- **Cap enforcement:** `effectiveSkills` now reflects all Skill Edge rank-ups (bonus + regular), which feeds into `LevelUpEdgeSection`'s `isRegularSkillEdgeCapped()` and `isBonusSkillEdgeAtCap()` functions. These compare the effective rank against `getMaxSkillRankForLevel(targetLevel)`. A user cannot exceed the level cap (Adept at L2+, Expert at L6+, Master at L12+) through any combination of regular and bonus Skill Edges.

- **Status:** RESOLVED CORRECTLY. No rules issues.

### code-review-239 M2 (MEDIUM): Class choice warnings missing

**Original problem:** No warning when class choice levels (5/10) are crossed but no new class selected.

**Fix (commit 5779f595):** Added informational warning in `warnings` computed (lines 409-413): `"(Info) Class choice available at level ${levels} but not selected"`. The `(Info)` prefix distinguishes it from blocking allocation warnings.

**Rules verification:** Class selection is not mandatory per PTU RAW. The RAW text says classes are "gateways to groupings of related Features" (p.14) -- they are taken by spending Feature slots. The levels 5/10 prompts are a design convenience, not a PTU requirement. Making the warning informational (non-blocking) is correct. Per decree-037, skill ranks come from Edge slots only; classes are separate. No rules violation.

- **Status:** RESOLVED CORRECTLY.

### code-review-239 H1 (HIGH): app-surface.md not updated

**Fix (commit 59eed321):** Updated app-surface.md with P1 components and composable extensions. Not a rules issue -- no verification needed.

- **Status:** RESOLVED (non-rules issue).

### code-review-239 M1 (MEDIUM): Duplicated SCSS

**Fix (commit 5cae0db8):** Extracted shared SCSS into `_level-up-shared.scss` partial. Not a rules issue -- no verification needed.

- **Status:** RESOLVED (non-rules issue).

### rules-review-215 MED-01: Stacked bonus Skill Edge display

**Original problem:** When multiple bonus Skill Edges raised the same skill, each rank-up in the summary displayed from the base rank (e.g., two entries both showing "Untrained -> Novice" instead of "Untrained -> Novice" then "Novice -> Adept").

**Fix (commit 3fdc1c21, same commit as C1 fix):** The `skillRankUpDetails` computed in `LevelUpSummary.vue` (lines 218-253) now maintains a `runningRank` record per skill. Each rank-up entry starts from the running rank (or base rank for the first occurrence), advances by one step, and updates the running rank. This ensures sequential rank-ups display correct from/to values.

**Rules verification:** The display now matches the actual sequential application in `buildUpdatePayload()`. If a user applies three Skill Edges to Athletics (Untrained), the summary shows: "Untrained -> Novice (Bonus L2)", "Novice -> Adept (Bonus L6)", "Adept -> Expert (Regular Edge)". This accurately reflects the PTU skill rank progression where each Skill Edge is a discrete +1 step.

- **Status:** RESOLVED CORRECTLY.

## Mechanics Verified

### 1. Regular Skill Edge Rank-Ups (New Mechanic from Fix Cycle)

- **Rule:** "Edges are used to represent a character's training and natural talent. They Rank Up Skills." (`core/02-character-creation.md#page-14`). "Starting Trainers begin with four Edges to distribute. [...] Every even Level you gain an Edge." (`core/02-character-creation.md#pages-14,19`). There is no restriction on using regular Edge slots for Skill Edges (unlike bonus Skill Edges at L2/L6/L12).
- **Implementation:** Regular Skill Edges are entered via `LevelUpEdgeSection.vue`'s "Add Skill Edge" shortcut button, which emits `addEdge("Skill Edge: <skill>")`. The composable's `regularSkillEdgeSkills` computed parses these. `countAllSkillEdgeUps()` unifies bonus + regular counting for `effectiveSkills`, `getEffectiveSkillRank()`, and `buildUpdatePayload()`.
- **Verification:** A regular Edge slot used for a Skill Edge correctly: (a) appears in the edges list in the payload, (b) updates the skill rank in the payload, (c) is reflected in effective skills for cap checks, (d) is displayed in the summary with source attribution. No rank restriction applies (unlike bonus Skill Edges). This matches PTU RAW exactly.
- **Status:** CORRECT

### 2. Bonus Skill Edge Rank Restriction (Re-verified, No Regression)

- **Rule:** "You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." (Level 2, `core/02-character-creation.md#page-19`). Same pattern at Level 6 (Expert) and Level 12 (Master).
- **Implementation:** `addBonusSkillEdge()` (composable lines 314-332) validates that the next rank after the effective rank is NOT the restricted rank. `isBonusSkillEdgeBlocked()` in `LevelUpEdgeSection.vue` (line 240) mirrors this check for UI disabling.
- **Verification:** The fix cycle did not modify the bonus Skill Edge validation logic. The `getEffectiveSkillRank()` function now uses `countAllSkillEdgeUps()` (which includes regular Skill Edges), which means the bonus validation correctly accounts for prior regular Skill Edge rank-ups on the same skill. For example, if a regular Edge raised Athletics from Untrained to Novice, a Level 2 bonus Skill Edge correctly sees the effective rank as Novice and blocks the rank-up to Adept (the restricted rank). This is correct per RAW.
- **Status:** CORRECT (no regression)

### 3. Effective Skills Tracking (Updated in Fix Cycle)

- **Rule:** Skill ranks are cumulative from character base + all Skill Edge rank-ups. PTU RAW skill rank progression: Pathetic -> Untrained -> Novice -> Adept -> Expert -> Master (`core/03-skills-edges-and-features.md#page-52`).
- **Implementation:** `effectiveSkills` computed (composable lines 206-221) iterates over all character skills and applies `countAllSkillEdgeUps()` to each. `getEffectiveSkillRank()` (lines 192-199) does the same for a single skill. Both use `RANK_PROGRESSION` index math with `Math.min` clamping to prevent exceeding Master.
- **Verification:** The index math `Math.min(baseIndex + ups, RANK_PROGRESSION.length - 1)` correctly handles: (a) single rank-up (+1), (b) multiple rank-ups on the same skill, (c) capping at Master (index 5). The `RANK_PROGRESSION` array `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` matches PTU Core p.52.
- **Status:** CORRECT

### 4. Skill Rank Payload Persistence (Fixed in Fix Cycle)

- **Rule:** When a trainer levels up, all chosen Skill Edge rank-ups must be persisted to the character's skill record.
- **Implementation:** `buildUpdatePayload()` (composable lines 440-461) applies bonus Skill Edge rank-ups first (iterating `bonusSkillEdgeChoices`), then regular Skill Edge rank-ups (iterating `regularSkillEdgeSkills`). Both apply to `updatedSkillsWithAllEdges`, which starts as a spread copy of the character's existing skills. The final `skills` field in the returned payload contains all rank-ups.
- **Verification:** Sequential application on a shared object means stacked rank-ups on the same skill work correctly. If bonus Edge raises Athletics Untrained->Novice, then regular Edge raises Athletics Novice->Adept, the final record shows Athletics: Adept. The payload also includes `edges: allEdges` which contains both the regular edge entries (including "Skill Edge: <skill>" strings) and bonus skill edge entries. The data is consistent.
- **Status:** CORRECT

### 5. Trainer HP Formula (Re-verified, No Regression)

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (`core/02-character-creation.md#page-18`)
- **Implementation:** `updatedMaxHp` computed (composable line 381): `newLevel.value * 2 + updatedStats.value.hp * 3 + 10`
- **Verification:** Exact match to PTU formula. The fix cycle did not modify this code.
- **Status:** CORRECT (no regression)

### 6. Trainer Advancement Schedule (Re-verified, No Regression)

- **Rule:** "+1 Stat Point every level, +1 Feature every odd level (3+), +1 Edge every even level" (`core/02-character-creation.md#page-19`)
- **Implementation:** `computeTrainerLevelUp()` in `trainerAdvancement.ts` (lines 245-258). Not modified by the fix cycle.
- **Status:** CORRECT (no regression)

### 7. Milestone Choices (Re-verified, No Regression)

- **Rule:** Amateur (L5), Capable (L10), Veteran (L20), Elite (L30), Champion (L40) with correct options per PTU Core pp.19-21.
- **Implementation:** `getMilestoneAt()` in `trainerAdvancement.ts` (lines 117-239). Not modified by the fix cycle.
- **Status:** CORRECT (no regression)

### 8. Class Choice Max 4 (Re-verified, No Regression)

- **Rule:** "a Trainer can only ever take a maximum of four Classes" (`core/04-trainer-classes.md#page-65`)
- **Implementation:** `MAX_TRAINER_CLASSES = 4` in `trainerClasses.ts`. `addClass()` enforces `currentTotal >= 4` guard. Not modified by the fix cycle.
- **Status:** CORRECT (no regression)

### 9. Branching Class Specialization (decree-022, Re-verified)

- **Rule:** Per decree-022, branching classes use specialization suffix (e.g., "Type Ace: Fire"). Per decree-026, only 4 branching classes: Type Ace, Stat Ace, Style Expert, Researcher (Martial Artist excluded).
- **Implementation:** `BRANCHING_CLASS_SPECIALIZATIONS` in `trainerClasses.ts` lists exactly 4 entries. Martial Artist has no `isBranching` flag. `LevelUpClassSection.vue` `confirmBranching()` emits `"ClassName: Specialization"` format. Not modified by the fix cycle.
- **Status:** CORRECT (per decree-022, decree-026; no regression)

### 10. Pathetic Skills During Level-Up (decree-027, Re-verified)

- **Rule:** Per decree-027, Pathetic skill restriction is creation-only. During level-up, Pathetic skills CAN be raised via Skill Edges.
- **Implementation:** Neither `addBonusSkillEdge()` nor the regular Skill Edge flow blocks Pathetic skills. The fix cycle did not add any Pathetic blocking logic. A skill at Pathetic rank can be raised to Untrained via any Skill Edge during level-up.
- **Status:** CORRECT (per decree-027; no regression)

### 11. Skill Ranks via Edges Only (decree-037, Re-verified)

- **Rule:** Per decree-037, skill ranks come from Edge slots only, not automatic per-level grants.
- **Implementation:** `TrainerLevelUpInfo` has no `skillRanksGained` field. All skill rank progression is via Edge selection (bonus or regular). The fix cycle enhanced this by ensuring regular Skill Edges also apply rank-ups, but did not add any automatic grants.
- **Status:** CORRECT (per decree-037; no regression)

### 12. Evasion Preview (Spot Check)

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense" (`core/02-character-creation.md#page-15`). Same for Special Defense -> Special Evasion, Speed -> Speed Evasion.
- **Implementation:** `LevelUpStatSection.vue` lines 106-115: `Math.min(Math.floor(stat / 5), 6)` for all three evasions. Uses calculated stat values (base + allocations).
- **Verification:** The formula `floor(stat / 5)` matches PTU RAW. The cap at 6 matches "up to a maximum of +6 at 30". The "calculated stats" approach (not base stats) is correct per PTU -- evasions use the full stat value. Not modified by the fix cycle.
- **Status:** CORRECT (no regression)

## Decree Compliance

| Decree | Domain | Status | Notes |
|--------|--------|--------|-------|
| decree-022 | Branching class suffix | COMPLIANT | Not modified in fix cycle |
| decree-026 | Martial Artist not branching | COMPLIANT | Not modified in fix cycle |
| decree-027 | Pathetic creation-only block | COMPLIANT | Not modified in fix cycle |
| decree-037 | Skill ranks via edges only | COMPLIANT | Fix cycle strengthened this by correctly persisting regular Skill Edge rank-ups |

No decree violations found. No new ambiguities discovered requiring decree-need tickets.

## Regression Check

The fix cycle modified 3 source files:

1. **`useTrainerLevelUp.ts`**: Added `regularSkillEdgeSkills`, `countAllSkillEdgeUps()`. Modified `getEffectiveSkillRank()`, `effectiveSkills`, `buildUpdatePayload()`, `warnings`. All changes are additive or corrective. No existing correct behavior was altered. The bonus Skill Edge validation path is unchanged and correctly benefits from the updated effective skill tracking.

2. **`LevelUpSummary.vue`**: Added `regularSkillEdgeSkills` prop, `source` display field, `runningRank` stacking logic in `skillRankUpDetails`. All changes are additive. The existing bonus Skill Edge display was corrected (stacking), not broken.

3. **`LevelUpModal.vue`**: Added single prop pass-through `:regular-skill-edge-skills`. No behavioral change to any other part of the modal.

No regressions detected. All previously correct mechanics remain correct.

## New Issues Introduced

None. The fix cycle commits are clean and introduce no new game logic errors.

## Summary

All 4 issues from code-review-239 have been resolved. The MED-01 from rules-review-215 (stacked skill rank-up display) was also resolved as part of the C1 fix. The fix cycle introduces no regressions and no new rules issues. The regular Skill Edge rank-up handling now correctly mirrors the bonus Skill Edge handling -- both types of Skill Edges update effective skills, persist rank-ups to the database payload, display in the summary with source attribution, and are accounted for in cap checks. This matches PTU 1.05 RAW exactly.

All four applicable decrees (022, 026, 027, 037) remain fully compliant.

## Rulings

1. The ordering of rank-up application in `buildUpdatePayload()` -- bonus Skill Edges first, then regular Skill Edges -- is correct. Since both operate on the same accumulator object and each advances by exactly one rank step, the ordering produces the same final result regardless. However, the consistent ordering (bonus first) matches the UI display ordering in the summary, which reduces potential confusion.

2. The `regularSkillEdgeSkills` computed relies on the `"Skill Edge: "` prefix convention established by `LevelUpEdgeSection.vue`'s `onAddRegularSkillEdge()` function. The edge section also blocks free-text entries starting with "skill edge:" (case-insensitive) to prevent inconsistent formatting. This convention is adequate for the current implementation. If future features allow importing edge lists from external sources, the prefix parsing should be hardened.

## Verdict

**APPROVED**

No CRITICAL, HIGH, or MEDIUM issues found. All previous issues resolved correctly. All PTU 1.05 mechanics verified. All applicable decrees compliant. No regressions.

## Required Changes

None.
