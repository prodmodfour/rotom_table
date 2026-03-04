---
review_id: rules-review-188
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-118
domain: character-lifecycle
commits_reviewed:
  - 58d7ef7
  - 5657695
  - 231af39
  - 2afa9c8
mechanics_verified:
  - pathetic-skill-edge-blocking
  - pathetic-skill-validation-warning
  - pathetic-skill-comment-accuracy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/02-character-creation.md#pathetic-skills (p.14)
  - core/02-character-creation.md#step-3-choose-edges (p.18)
  - core/03-skills-edges-and-features.md#basic-skills (p.41)
  - errata-2.md (no relevant errata)
reviewed_at: 2026-02-28T02:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Pathetic Skill Edge Blocking (addSkillEdge guard)

- **Rule:** "These Pathetic Skills cannot be raised above Pathetic during character creation." (`core/02-character-creation.md`, p.14) and "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (`core/02-character-creation.md`, p.18)
- **Decree:** decree-027 (ACTIVE) rules that pp. 14/18 control, and p.41's Basic Skills Edge description ("Pathetic to Untrained") applies only post-creation during leveling.
- **Implementation:** `addSkillEdge()` in `app/composables/useCharacterCreation.ts` (line 304-330) checks `form.patheticSkills.includes(skill)` at the top of the function, before any rank progression logic. If the skill is in the Pathetic tracking set, it returns an error string immediately without modifying `form.skills` or `form.edges`. The guard is the first check in the function, correctly prioritized above the rank-cap check and the max-rank check.
- **Status:** CORRECT

### 2. Validation Warning for Existing Pathetic Skill Edges

- **Rule:** Same as above (pp. 14, 18; decree-027).
- **Implementation:** `validateSkillBackground()` in `app/utils/characterCreationValidation.ts` (lines 124-138) scans `edges` for entries matching `^Skill Edge: (.+)$`, then filters those against the `patheticSkills` array. If any match, a warning is emitted with severity `'warning'` citing PTU pp. 14, 18 and decree-027. The function receives `patheticSkills` as a parameter (line 90) and the composable passes `form.patheticSkills` (line 343).
- **Status:** CORRECT

### 3. patheticSkills Field Comment Accuracy

- **Rule:** decree-027 ruling: "Pathetic skills chosen during character creation are permanent at creation time. No mechanism -- including Skill Edges -- can raise them during the creation process."
- **Implementation:** The `patheticSkills` field comment (line 67) now reads: "Skills marked Pathetic during background selection -- cannot be raised by any means during creation (PTU pp. 14, 18; decree-027)". The previous comment incorrectly stated "cannot be raised except via Skill Edges (PTU p. 41)".
- **Status:** CORRECT

### 4. setSkillRank Error Message Accuracy

- **Rule:** Same as above.
- **Implementation:** `setSkillRank()` (line 182-191) error message updated from "cannot be raised except through Skill Edges (PTU p. 41)" to "cannot be raised during character creation (PTU pp. 14, 18; decree-027)". Correctly reflects the new ruling.
- **Status:** CORRECT

### 5. addSkillEdge JSDoc Accuracy

- **Rule:** p.41 Basic Skills Edge describes Pathetic-to-Untrained as one of its progressions. decree-027 rules this applies only post-creation.
- **Implementation:** JSDoc for `addSkillEdge()` (lines 293-303) now lists "Untrained -> Novice" for Basic Skills (removing the Pathetic -> Untrained reference from the creation context) and adds a decree-027 note explaining the post-creation limitation. This accurately represents the ruling.
- **Status:** CORRECT

### 6. UI-Level Blocking (EdgeSelectionSection.vue)

- **Rule:** Same as above.
- **Implementation:** `app/components/create/EdgeSelectionSection.vue` (line 61) disables the skill edge button when `skills[skill] === 'Pathetic'`. Line 151 provides a tooltip: "Cannot raise Pathetic skills with Skill Edges". Line 43 includes hint text: "Cannot raise Pathetic skills or exceed Novice at level 1." The UI layer correctly prevents the user from clicking Pathetic skill buttons.
- **Status:** CORRECT (no changes needed -- pre-existing UI guard was already sound)

### 7. removePatheticSkill Defensive Guard

- **Rule:** decree-027 makes this guard defensive-only (should never fire).
- **Implementation:** `removePatheticSkill()` (lines 217-228) still checks for outstanding Skill Edge entries referencing the skill being un-Pathetic'd. The JSDoc (commit 231af39) now correctly explains this is a defensive check since addSkillEdge blocks Pathetic skills. The guard itself is still mechanically correct -- it prevents data desync if edges somehow got into the array through a code path bypass.
- **Status:** CORRECT

## Decree Compliance

**decree-027 (ACTIVE, character-lifecycle):** Implementation fully complies. The addSkillEdge guard at line 306 directly enforces the decree's ruling. The error message cites "PTU pp. 14, 18; decree-027" for traceability. The validation warning provides a second layer of defense. Comments throughout reference the decree by number.

No other active decrees in the character-lifecycle domain conflict with this implementation.

## Errata Check

No entries in `books/markdown/errata-2.md` relate to Pathetic skills, Basic Skills Edge, or character creation skill restrictions. The errata does not modify the pp. 14/18 prohibition.

## Issues

### MED-01: Generic addEdge bypass (cosmetic data integrity)

**Severity:** MEDIUM

**Description:** The `addEdge()` function (`useCharacterCreation.ts`, line 268-270) is a raw string append with no validation. A user could type "Skill Edge: Athletics" into the text input field (which wires to `creation.addEdge` on `create.vue` line 186) and it would be added to `form.edges` without checking if Athletics is in `patheticSkills`.

**Impact:** LOW -- the skill rank would NOT actually change, because only `addSkillEdge()` modifies `form.skills`. The validation warning in `validateSkillBackground()` would catch the orphaned edge entry and flag it. The string would appear in the edges list but have no mechanical effect. This is a data-naming inconsistency, not a game logic error.

**Recommendation:** Consider either (a) adding a check in `addEdge()` that rejects strings matching `^Skill Edge:` (forcing skill edges through the proper `addSkillEdge` path), or (b) accepting this as tolerable since the GM has final say and the validation catches it. Not blocking approval on this.

## Summary

The implementation correctly enforces decree-027 at three levels:

1. **Composable guard** (`addSkillEdge`): Blocks Pathetic skill progression before any state mutation occurs.
2. **Validation warning** (`validateSkillBackground`): Catches any data integrity issues where a Skill Edge entry references a Pathetic-locked skill.
3. **UI blocking** (`EdgeSelectionSection.vue`): Disables Pathetic skill buttons in the dropdown with visual feedback (red border, tooltip).

The PTU rule text is clear and unambiguous on this point -- pp. 14 and 18 both prohibit raising Pathetic skills during character creation, with p.18 specifically calling out Edges by name. The p.41 Basic Skills Edge description lists Pathetic-to-Untrained as a general mechanic, which per decree-027 applies only during leveling. The implementation correctly distinguishes between creation-time and post-creation progression.

All four commits are well-scoped: the core guard (58d7ef7), the validation layer (5657695), the documentation update (231af39), and the ticket update (2afa9c8).

## Rulings

- **Pathetic skill edge blocking:** Implementation is CORRECT per PTU pp. 14, 18 and decree-027. The guard in `addSkillEdge()` fires before any rank progression logic and returns a descriptive error.
- **Basic Skills Edge progression list:** The updated JSDoc correctly removes Pathetic-to-Untrained from the creation-context description. This matches decree-027's ruling that p.41's Pathetic progression applies only post-creation.
- **Validation layer:** The warning in `validateSkillBackground()` serves as a correct secondary defense. Using `'warning'` severity (not `'info'`) is appropriate since the condition represents a rule violation.

## Verdict

**APPROVED**

All three mechanics are correctly implemented per PTU RAW and decree-027. The one MEDIUM issue (MED-01: generic addEdge bypass) is a minor data integrity concern with no mechanical impact, mitigated by the existing validation layer. It does not block approval.

## Required Changes

None. MED-01 is advisory only.
