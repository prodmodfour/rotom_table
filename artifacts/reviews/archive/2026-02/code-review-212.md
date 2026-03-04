---
review_id: code-review-212
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-118
domain: character-lifecycle
commits_reviewed:
  - 58d7ef7
  - 5657695
  - 231af39
  - 2afa9c8
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/utils/characterCreationValidation.ts
  - app/components/create/EdgeSelectionSection.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T02:30:00Z
follows_up: null
---

## Review Scope

First code review of ptu-rule-118 (P3, character-lifecycle). The ticket implements decree-027: blocking Skill Edges from raising Pathetic-locked skills during character creation. Three implementation commits and one docs commit, touching two files (`useCharacterCreation.ts` and `characterCreationValidation.ts`). The UI component (`EdgeSelectionSection.vue`) was verified unchanged -- it already had UI-level blocking.

### Decree Compliance

Verified against decree-027 (ACTIVE, character-lifecycle). The decree rules that PTU pp. 14 and 18 both explicitly prohibit raising Pathetic skills during character creation, and this prohibition includes Skill Edges. The p.41 Basic Skills Edge description is read as documenting post-creation progression only. Per decree-027, all three implementation points are satisfied.

### PTU Source Verification

Confirmed both PTU references in the source text:
- **PTU p.14** (markdown line 94): "These Pathetic Skills cannot be raised above Pathetic during character creation."
- **PTU p.18** (markdown line 468-469): "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."

Both statements are in the character creation chapter (Chapter 2), and the p.18 text is specifically in Step 3 (Choose Edges), directly addressing the scenario this fix handles.

## Issues

No issues found. The implementation is clean, minimal, and correctly scoped.

## What Looks Good

### 1. Correct guard placement in addSkillEdge (58d7ef7)

The Pathetic check is placed at the top of `addSkillEdge()`, before any rank progression logic runs. This is the right position -- early return prevents any state mutation. The guard checks `form.patheticSkills.includes(skill)` which is the authoritative tracking array, not the current skill rank (a skill could theoretically be at Pathetic rank without being in the patheticSkills array if set manually in custom mode). This distinction matters and is handled correctly.

The error message is clear and cites the decree and PTU page references: `"${skill} is Pathetic and cannot be raised during character creation -- not even by Skill Edges (PTU pp. 14, 18; decree-027)"`. The "not even by Skill Edges" phrasing is helpful because it directly addresses the p.41 ambiguity that prompted the decree.

### 2. Three-layer defense

The implementation provides defense in depth across three layers:

1. **UI layer** (`EdgeSelectionSection.vue` line 61): `:disabled="skills[skill] === 'Pathetic' || isSkillCapped(skill)"` -- buttons for Pathetic skills are disabled and visually marked with a red left border (`--pathetic` class). Tooltip reads "Cannot raise Pathetic skills with Skill Edges" (line 151). This was pre-existing and correctly prevents casual UI interaction.

2. **Composable layer** (`useCharacterCreation.ts` line 306): `addSkillEdge()` guard returns an error string and does not modify state. The parent page (`gm/create.vue` line 446-449) catches this error and displays it via `errorMessage.value`. This catches programmatic calls or any edge case where the UI guard could be bypassed.

3. **Validation layer** (`characterCreationValidation.ts` line 124-138): `validateSkillBackground()` scans existing edges for Pathetic references, producing a warning. This catches legacy data or import scenarios where Skill Edges on Pathetic skills might already exist from before the fix. The warning surfaces in the SkillBackgroundSection (via `skillWarnings`), which is contextually appropriate.

### 3. Immutability preserved

All state mutations use spread patterns (`form.skills = { ...form.skills, [skill]: nextRank }`, `form.edges = [...form.edges, ...]`). No direct mutation of reactive objects anywhere in the changed code. Consistent with project coding standards.

### 4. Comment updates are accurate (231af39)

The `patheticSkills` field comment (line 67) now reads: "cannot be raised by any means during creation (PTU pp. 14, 18; decree-027)" -- correctly replacing the old "except via Skill Edges (PTU p. 41)" clause that was the exact behavior being fixed.

The `removePatheticSkill` JSDoc (lines 211-213) honestly acknowledges the guard is now defensive-only ("should never happen now that addSkillEdge blocks Pathetic skills per decree-027, but kept as a defensive check"). Keeping the guard is the right call -- removing it would create a gap if future code introduces another path to add Skill Edges.

The `setSkillRank` comment (line 179) was also updated to match: "Blocks raising a Pathetic-locked skill above Pathetic during creation (PTU pp. 14, 18; decree-027)." Previously it said "use Skill Edges instead (PTU p. 41)" which would now be misleading.

### 5. Validation regex is robust (5657695)

The regex `/^Skill Edge: (.+)$/` correctly matches the exact format used by `addSkillEdge()` (line 328: `Skill Edge: ${skill}`). The `[...new Set(patheticEdgeSkills)]` deduplication handles the case where multiple Skill Edges reference the same Pathetic skill (which should never happen with the guard, but the validation is defensive). The `filter((s): s is string => s != null && patheticSkills.includes(s))` type narrowing is clean.

### 6. Commit granularity

Four commits at appropriate granularity: guard logic, validation warning, comment update, and ticket resolution log. Each commit produces a working state and has a descriptive message with the correct conventional commit prefix.

### 7. Ticket documentation

The resolution log in ptu-rule-118 (commit 2afa9c8) accurately documents all commits, files changed, and notes about EdgeSelectionSection.vue being pre-existing. The status was correctly updated to `in-progress`.

## Verdict

**APPROVED.** The implementation correctly enforces decree-027 at three layers (UI, composable, validation), with accurate PTU citations, clean immutable patterns, and good defensive coding. All three acceptance criteria from the ticket are met:

1. `addSkillEdge('SomePatheticSkill')` returns an error string and does NOT modify the skill rank -- confirmed via guard at line 306.
2. Validation warns if any existing Skill Edge entry references a Pathetic-locked skill -- confirmed via `validateSkillBackground()` lines 124-138.
3. Comment on `patheticSkills` field accurately reflects the new ruling -- confirmed at line 67.

No unit tests exist for `useCharacterCreation.ts` (pre-existing gap, not introduced by this fix). This is noted but not blocking for a P3 bug fix that is a 3-line guard addition with pre-existing UI coverage.

## Required Changes

None.
