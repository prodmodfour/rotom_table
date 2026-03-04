---
review_id: rules-review-182
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-092
domain: character-lifecycle
commits_reviewed:
  - 0374dd6
  - 3f2ede3
  - 0773cf0
  - 8b2398b
mechanics_verified:
  - pathetic-skill-enforcement
  - removePatheticSkill-edge-guard
  - level-gt1-pathetic-warning
  - skill-edge-pathetic-exception-deferral
  - skill-rank-progression
  - background-skill-allocation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#step-2-skills-p14
  - core/02-character-creation.md#quick-start-p18
  - core/03-skills-edges-and-features.md#skill-edges-p41
  - errata-2.md
reviewed_at: 2026-02-27T22:30:00Z
follows_up: rules-review-179
---

## Re-Review Context

This is a re-review of the ptu-rule-092 fix cycle, following rules-review-179 (CHANGES_REQUIRED). Three issues were raised:

- **CRITICAL-01:** `removePatheticSkill` can desync with outstanding Skill Edges -- FIXED in commit 0773cf0
- **HIGH-01:** PTU RAW conflict on Pathetic + Skill Edges -- DEFERRED to decree-need-027
- **MEDIUM-01:** Add informational warning for level > 1 Pathetic enforcement -- FIXED in commit 8b2398b

Code quality was separately approved by code-review-203. This review focuses exclusively on PTU rule correctness.

## Mechanics Verified

### 1. CRITICAL-01 Fix: removePatheticSkill Edge Guard (commit 0773cf0)

- **Rule:** "These Pathetic Skills cannot be raised above Pathetic during character creation." (`core/02-character-creation.md`, p. 14)
- **Issue:** `removePatheticSkill` could be called while Skill Edge entries existed for the skill, creating a tracking desync where later edge removal would demote the skill to Pathetic rank without the `patheticSkills` array tracking it.
- **Implementation:** `removePatheticSkill()` (line 218-229 of `useCharacterCreation.ts`) now filters `form.edges` for `Skill Edge: ${skill}` entries before allowing removal. If any outstanding edges exist, returns an error string: "Cannot remove Pathetic lock from ${skill} while N Skill Edge(s) reference it. Remove the Skill Edge(s) first." The page component (`create.vue`, line 453-459) handles the error via `alert()`, matching the existing `handleSetSkillRank` pattern.
- **Trace verification (single edge):**
  1. `addPatheticSkill('Athletics')` -> patheticSkills=['Athletics'], skills.Athletics='Pathetic'
  2. `addSkillEdge('Athletics')` -> skills.Athletics='Untrained', edges=['Skill Edge: Athletics']
  3. `removePatheticSkill('Athletics')` -> BLOCKED (1 outstanding edge). Correct.
  4. `removeEdge(0)` -> skills.Athletics='Pathetic' (demoted), edges=[]
  5. `removePatheticSkill('Athletics')` -> SUCCESS (no edges). patheticSkills=[], skills.Athletics='Untrained'. Correct.
- **Trace verification (double edge):**
  1. `addPatheticSkill('Athletics')` -> patheticSkills=['Athletics'], skills.Athletics='Pathetic'
  2. `addSkillEdge('Athletics')` -> skills.Athletics='Untrained', edges=['Skill Edge: Athletics']
  3. `addSkillEdge('Athletics')` -> skills.Athletics='Novice', edges=['Skill Edge: Athletics', 'Skill Edge: Athletics']
  4. `removePatheticSkill('Athletics')` -> BLOCKED (2 outstanding edges). Correct.
  5. `removeEdge(1)` -> skills.Athletics='Untrained', edges=['Skill Edge: Athletics']
  6. `removeEdge(0)` -> skills.Athletics='Pathetic', edges=[]
  7. `removePatheticSkill('Athletics')` -> SUCCESS. Correct.
- **Status:** CORRECT -- The guard fully prevents the desync scenario identified in rules-review-179 CRITICAL-01. The error-return pattern is consistent with `setSkillRank`. The edge count check handles both single and multiple Skill Edge cases.

### 2. MEDIUM-01 Fix: Level > 1 Pathetic Warning (commit 8b2398b)

- **Rule:** "These Pathetic Skills cannot be raised above Pathetic during character creation." (`core/02-character-creation.md`, p. 14) -- no clarification for higher-level character creation.
- **Issue:** GMs creating higher-level characters (e.g., level 10 NPCs) may not expect Pathetic restrictions to still apply during creation form flow.
- **Implementation:** `validateSkillBackground()` (line 151-157 of `characterCreationValidation.ts`) now checks `level > 1 && patheticSkills.length > 0` and emits an `info`-severity warning: "Pathetic restrictions from background are still enforced at level ${level}. Skills locked: ${patheticSkills.join(', ')}. To assign these skills freely, remove the Pathetic marking in custom background mode." The composable (commit 8b2398b) passes `form.patheticSkills` as the fourth argument to `validateSkillBackground`.
- **PTU Correctness:** The `info` severity is appropriate -- PTU says "during character creation" without distinguishing level 1 from higher levels. The warning does not block the GM; it informs them. The workaround instruction (remove Pathetic marking in custom mode) is accurate and gives GMs an escape hatch.
- **Status:** CORRECT -- The warning is informational, non-blocking, and provides accurate guidance. The severity level is appropriate (info, not warning).

### 3. HIGH-01 Deferral: Pathetic + Skill Edge RAW Conflict (decree-need-027)

- **Rule (p. 14):** "These Pathetic Skills cannot be raised above Pathetic during character creation."
- **Rule (p. 18):** "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **Rule (p. 41):** "You Rank Up a Skill from Pathetic to Untrained, or Untrained to Novice. You may take this Edge multiple times." (`core/03-skills-edges-and-features.md`, Basic Skills Edge)
- **Errata check:** No errata entry for Pathetic skills in `errata-2.md`. Confirmed no override.
- **Current implementation:** `addSkillEdge()` (line 309-330) allows Pathetic -> Untrained progression. The old explicit block (`if (currentRank === 'Pathetic') return 'Cannot raise Pathetic skills'`) was removed in commit 0374dd6, siding with p. 41.
- **Decree-need-027 quality:** The ticket at `artifacts/tickets/open/decree/decree-need-027.md` correctly identifies the RAW conflict, quotes all three relevant pages, documents the current implementation choice, presents two clear options for the human ruling, and identifies the affected code location. Properly sourced from "rules-review-179 HIGH-01."
- **Status:** PROPERLY DEFERRED -- The decree-need ticket is well-written and covers the ambiguity completely. The provisional implementation (siding with p. 41) is the more defensible of the two options, since p. 41 is the most specific rule about what Basic Skills Edge does and explicitly includes "from Pathetic to Untrained." Pending human decree.

### 4. Previously Verified Mechanics (re-confirmed at HEAD f5eb984)

- **Pathetic enforcement via setSkillRank:** STILL CORRECT. Line 183 checks `form.patheticSkills.includes(skill) && rank !== 'Pathetic'`. Blocks all non-Edge rank changes for Pathetic-tracked skills.
- **Background skill allocation (preset):** STILL CORRECT. `applyBackground()` (line 146-158) copies `bg.patheticSkills` with spread, sets skill ranks, synchronizes tracking array.
- **Background skill allocation (custom):** STILL CORRECT. `addPatheticSkill()` (line 197-205) adds to tracking and sets rank. Mutual exclusion in `SkillBackgroundSection.vue` prevents same skill from being Adept/Novice/Pathetic simultaneously.
- **Skill rank progression:** STILL CORRECT. `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` matches PTU p. 33.
- **Skill rank caps:** STILL CORRECT. `isSkillRankAboveCap()` enforces Level 1 max Novice, Level 2 Adept, Level 6 Expert, Level 12 Master per PTU p. 19.
- **Background clear/reset:** STILL CORRECT. `clearBackground()` and `enableCustomBackground()` both reset `patheticSkills` to `[]`.

## Decree Compliance

- **decree-022** (branch class handling): Not affected by these commits. The `addClass` function in the same file uses specialization suffix per decree-022. Correct.
- **decree-026** (Martial Artist not branching): Not affected. Context only.
- **decree-need-027** (Pathetic + Skill Edges): Filed and pending. The current implementation is an acceptable provisional choice pending the human ruling. No decree violation.

## Rulings

1. **CRITICAL-01 fix (removePatheticSkill guard):** The edge guard at line 219-222 correctly prevents the tracking desync by blocking removal when Skill Edge entries exist. Both single-edge and multi-edge scenarios produce correct state transitions. The error message is clear and actionable. **RESOLVED.**

2. **MEDIUM-01 fix (level > 1 warning):** The info-severity warning at line 151-157 of `characterCreationValidation.ts` is PTU-appropriate -- the rules do not distinguish level 1 from higher levels for Pathetic enforcement during creation. The warning informs without blocking, and the workaround instruction is accurate. **RESOLVED.**

3. **HIGH-01 deferral (decree-need-027):** The decree-need ticket is comprehensive, quotes all relevant rule sources, and presents both options clearly. The provisional implementation (p. 41 prevails) is defensible. **PROPERLY DEFERRED.**

4. **No regressions introduced:** The fix commits (0773cf0, 8b2398b) are additive -- they add a guard and a warning respectively, without modifying any previously-verified correct behavior. All mechanics confirmed CORRECT in rules-review-179 remain intact at HEAD.

## Summary

All three issues from rules-review-179 have been addressed:
- CRITICAL-01: Fixed with a proper edge guard that prevents tracking desync in all tested scenarios.
- HIGH-01: Properly deferred via decree-need-027 with a well-documented ticket.
- MEDIUM-01: Fixed with an appropriately-scoped informational warning.

No new PTU rule issues were identified. No errata applies. No decree violations found.

## Verdict

**APPROVED**

No required changes.
