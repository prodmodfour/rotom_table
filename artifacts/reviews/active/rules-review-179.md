---
review_id: rules-review-179
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-092
domain: character-lifecycle
commits_reviewed:
  - 0374dd6
  - 3f2ede3
mechanics_verified:
  - pathetic-skill-enforcement
  - skill-edge-pathetic-exception
  - background-skill-allocation
  - skill-rank-progression
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 1
ptu_refs:
  - core/02-character-creation.md#step-2-skills
  - core/02-character-creation.md#page-18-quick-start
  - core/03-skills-edges-and-features.md#skill-edges
reviewed_at: 2026-02-27T21:10:00Z
follows_up: null
---

## Mechanics Verified

### 1. Pathetic Skill Enforcement — Background Selection Lock

- **Rule:** "Simply choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic. These Pathetic Skills cannot be raised above Pathetic during character creation." (`core/02-character-creation.md`, p. 14)
- **Rule (Quick-Start):** "Step 3: Choose Edges. You gain four Edges to distribute. [...] You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (`core/02-character-creation.md`, p. 18)
- **Implementation:** `setSkillRank()` at line 182 checks `form.patheticSkills.includes(skill) && rank !== 'Pathetic'` and returns an error string, blocking the change. `applyBackground()` at line 155 copies `bg.patheticSkills` into the tracking array. `addPatheticSkill()`/`removePatheticSkill()` manage the tracking array for custom backgrounds.
- **Status:** CORRECT — The blocking mechanism correctly prevents raising a Pathetic-locked skill through the background/skill UI. The tracking array is properly synchronized with the skill rank map.

### 2. Skill Edge Exception for Pathetic Skills (RAW CONFLICT — see issue HIGH-01)

- **Rule (p. 14, p. 18):** "These Pathetic Skills cannot be raised above Pathetic during character creation." / "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **Rule (p. 41, Basic Skills Edge):** "You Rank Up a Skill from Pathetic to Untrained, or Untrained to Novice. You may take this Edge multiple times." (`core/03-skills-edges-and-features.md`, p. 41)
- **Ticket description:** "A Pathetic Skill cannot be raised above its Pathetic Rank except by taking certain Edges." (PTU Core)
- **Implementation:** `addSkillEdge()` at line 297 now allows Pathetic -> Untrained (the old code had an explicit `if (currentRank === 'Pathetic') return 'Cannot raise Pathetic skills'` block that was *removed* in commit 0374dd6). The function walks the rank progression `['Pathetic', 'Untrained', 'Novice', ...]` and advances by one step regardless of whether the skill is Pathetic-locked.
- **Status:** NEEDS DECREE — PTU RAW is self-contradictory here. Page 14 and the p. 18 Quick-Start explicitly say Pathetic skills "cannot be raised" during character creation and "you also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." But the Basic Skills Edge on p. 41 explicitly includes "from Pathetic to Untrained" as a valid progression. The implementation sides with p. 41, treating Skill Edges as the "certain Edges" exception. This is a reasonable interpretation but contradicts the p. 18 Quick-Start verbatim text. A decree is needed to resolve this ambiguity. See HIGH-01.

### 3. Background Skill Allocation Rules

- **Rule:** "Simply choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic." (`core/02-character-creation.md`, p. 14)
- **Implementation:** `SkillBackgroundSection.vue` provides UI for custom backgrounds: Adept dropdown, Novice dropdown, and Pathetic checkbox grid (max 3). The `availableForPathetic` computed excludes skills already assigned to Adept or Novice. The `availableForAdept` and `availableForNovice` computeds exclude each other and Pathetic selections.
- **Status:** CORRECT — The UI enforces mutual exclusion between Adept, Novice, and Pathetic selections, matching the PTU requirement that these must be different skills.

### 4. Skill Rank Progression Order

- **Rule:** Pathetic (1d6) -> Untrained (2d6) -> Novice (3d6) -> Adept (4d6) -> Expert (5d6) -> Master (6d6) (`core/03-skills-edges-and-features.md`, p. 33)
- **Implementation:** `rankProgression` array in `addSkillEdge()` (line 299) and `removeEdge()` (line 276) uses `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`.
- **Status:** CORRECT — Progression order matches PTU exactly.

### 5. Skill Rank Cap Enforcement

- **Rule:** Level 1: max Novice. Level 2: Adept unlocked. Level 6: Expert unlocked. Level 12: Master unlocked. (`core/02-character-creation.md`, p. 19)
- **Implementation:** `addSkillEdge()` at line 308 calls `isSkillRankAboveCap(nextRank, form.level)` before allowing the rank-up.
- **Status:** CORRECT — Level-based caps are properly enforced through the Skill Edge path.

### 6. Milestone Skill Edge Restrictions

- **Rule:** "Level 2 — Adept Skills: [...] You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." Level 6: "It may not be used to Rank Up a Skill to Expert Rank." Level 12: "It may not be used to Rank Up a Skill to Master Rank." (`core/02-character-creation.md`, p. 19)
- **Implementation:** The milestone Skill Edge restriction (bonus edge cannot raise to the newly unlocked rank) is NOT enforced in `addSkillEdge()`. The function allows any valid rank progression as long as it does not exceed the level cap. There is no distinction between regular Skill Edges and the free milestone Skill Edge.
- **Status:** NOT IN SCOPE — This is a pre-existing gap, not introduced by these commits. The ticket ptu-rule-092 addresses only the Pathetic enforcement gap. Noted for completeness but not blocking.

## Summary

The implementation correctly addresses the core ticket concern: custom background mode now tracks which skills are Pathetic-locked and prevents `setSkillRank` from raising them. The `patheticSkills` tracking array is properly synchronized across all background flows (preset apply, custom add/remove, clear, enable custom).

However, there is a **critical issue** with the `removeEdge` Pathetic demotion logic and a **high-severity ambiguity** requiring a decree on whether Skill Edges should be allowed to raise Pathetic skills during character creation.

## Issues

### CRITICAL-01: removeEdge can demote a Pathetic-tracked skill below Pathetic

**File:** `app/composables/useCharacterCreation.ts`, line 269-287
**Severity:** CRITICAL
**Mechanic:** Skill Edge removal + Pathetic tracking

When a Skill Edge is removed for a Pathetic-tracked skill that was raised to Untrained via `addSkillEdge`, the `removeEdge` function demotes the rank by one step (Untrained -> Pathetic), which is correct. However, consider this sequence:

1. User marks "Athletics" as Pathetic during custom background (patheticSkills = ['Athletics'], skills.Athletics = 'Pathetic')
2. User adds a Basic Skills Edge for Athletics via `addSkillEdge` (skills.Athletics = 'Untrained')
3. User adds a second Basic Skills Edge for Athletics via `addSkillEdge` (skills.Athletics = 'Novice')
4. User removes the *first* Skill Edge via `removeEdge` (skills.Athletics drops from 'Novice' to 'Untrained')
5. User removes the *second* Skill Edge via `removeEdge` (skills.Athletics drops from 'Untrained' to 'Pathetic')

This sequence works correctly. But now consider:

1. User marks "Athletics" as Pathetic
2. User adds a Basic Skills Edge for Athletics (Pathetic -> Untrained)
3. User ALSO manually removes the Pathetic tracking via `removePatheticSkill` (patheticSkills removes Athletics, rank resets to Untrained)
4. User removes the Skill Edge via `removeEdge` (Untrained -> Pathetic, but Athletics is no longer in patheticSkills)

Now Athletics is at Pathetic rank but NOT tracked in `patheticSkills`. The user cannot raise it back via `setSkillRank` because the rank is 'Pathetic', but they CAN raise it because it is not in the `patheticSkills` array (the check is `form.patheticSkills.includes(skill)`, not `form.skills[skill] === 'Pathetic'`). Actually, re-reading the guard: `if (form.patheticSkills.includes(skill) && rank !== 'Pathetic')` — since Athletics is NOT in patheticSkills after step 3, the guard passes and the user can set it to any rank. This is arguably correct (user explicitly un-Pathetic'd it), but the rank/tracking desync is still a data integrity concern.

More importantly, `removePatheticSkill` should NOT be callable while there are outstanding Skill Edges for that skill, because removing the Pathetic lock on a skill that was raised via Skill Edge creates an inconsistent state. The fix: `removePatheticSkill` should check whether any `Skill Edge: <skill>` entries exist in `form.edges` and either block removal or also remove those edges.

### HIGH-01: PTU RAW conflict on Pathetic + Skill Edges requires decree

**File:** `app/composables/useCharacterCreation.ts`, line 297 (`addSkillEdge`)
**Severity:** HIGH
**Mechanic:** Pathetic skill enforcement vs Basic Skills Edge

PTU p. 18 Quick-Start says: "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." PTU p. 41 Basic Skills Edge says: "You Rank Up a Skill from Pathetic to Untrained."

These two rules directly contradict each other. The implementation chose to allow Skill Edges to raise Pathetic skills (removing the old block in `addSkillEdge`). This aligns with the ticket description which quotes "A Pathetic Skill cannot be raised above its Pathetic Rank except by taking certain Edges" — but that exact quote does not appear verbatim in the PTU Core text I can find. The p. 14 text says "These Pathetic Skills cannot be raised above Pathetic during character creation" with no exception clause.

**Recommended action:** Create a `decree-need` ticket for the human to rule on whether Skill Edges can raise Pathetic skills during character creation. The current implementation is a defensible interpretation, but it needs an explicit decree to be authoritative.

### MEDIUM-01: Preset background patheticSkills not cleared on level-up scenario

**File:** `app/composables/useCharacterCreation.ts`
**Severity:** MEDIUM
**Mechanic:** Pathetic skill lifetime

The `patheticSkills` tracking persists for the entire character creation session. If the character is created at a higher level (e.g., level 10) where they have had many level-ups and presumably could have used Skill Edges during play to raise Pathetic skills, the creation form still enforces the Pathetic lock. PTU p. 14 specifically says "during character creation" but does not clarify whether this persists at higher levels for the creation form.

For level 1 characters, this is unambiguous. For higher-level characters being created, the GM may want to assign skills freely. The current enforcement may be overly restrictive for higher-level character creation, but this is an edge case and the GM can work around it by not marking skills as Pathetic in custom mode.

**Recommended action:** Consider adding a note or informational warning for level > 1 characters that Pathetic restrictions from background are enforced.

## Decree Compliance

- **decree-022** (branch-class-handling): Not directly affected by these commits. The `addClass` function in the same file uses specialization suffix per decree-022, which is correct context.
- **decree-026** (martial-artist-not-branching): Not directly affected. Context only.
- No existing decrees cover Pathetic skill enforcement. A new decree-need is warranted (see HIGH-01).

## Rulings

1. **Pathetic tracking mechanism:** CORRECT. The `patheticSkills` array approach properly decouples "which skills are Pathetic-locked" from "what rank the skill currently has," enabling Skill Edges to raise the rank while maintaining the lock for non-Edge paths.

2. **Custom background Pathetic flow:** CORRECT. `addPatheticSkill` and `removePatheticSkill` properly manage the tracking array and synchronize the skill rank.

3. **Preset background Pathetic flow:** CORRECT. `applyBackground` copies `bg.patheticSkills` into the tracking array with a fresh spread.

4. **Skill Edge Pathetic override:** NEEDS DECREE. The implementation allows `addSkillEdge` to raise Pathetic skills, which is one valid interpretation of PTU RAW but contradicts the p. 18 Quick-Start text.

5. **removeEdge reversion:** CORRECT for the normal case (rank drops back by one step). But has a data integrity edge case with `removePatheticSkill` interaction (CRITICAL-01).

## Verdict

**CHANGES_REQUIRED**

## Required Changes

1. **CRITICAL-01** — Guard `removePatheticSkill` against outstanding Skill Edges: either block removal while `Skill Edge: <skill>` entries exist in `form.edges`, or cascade-remove those Skill Edge entries when removing the Pathetic lock. This prevents the tracking array from desyncing with the actual skill state.

2. **HIGH-01** — File a `decree-need` ticket for the Pathetic + Skill Edge RAW conflict. The implementation's choice to allow Skill Edges on Pathetic skills is defensible but needs an explicit human ruling to be authoritative. Until decreed, the current behavior is acceptable as a provisional implementation.

3. **MEDIUM-01** — (Non-blocking) Consider adding an informational note for level > 1 characters that Pathetic restrictions are enforced from background selection.
