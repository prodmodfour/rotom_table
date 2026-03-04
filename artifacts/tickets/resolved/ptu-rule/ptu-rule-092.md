---
id: ptu-rule-092
title: Pathetic skill enforcement gap in custom background mode
priority: P3
severity: MEDIUM
status: in-progress
domain: character-lifecycle
source: character-lifecycle-audit.md (R024)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-092: Pathetic skill enforcement gap in custom background mode

## Summary

In custom background mode, `setSkillRank` allows raising Pathetic skills back to higher ranks without going through the Skill Edge path. Custom mode doesn't track which skills were lowered to Pathetic during background selection, so the enforcement boundary is bypassed.

## Affected Files

- `app/composables/useCharacterCreation.ts` (`setSkillRank` function)

## PTU Rule Reference

Pathetic skills: "A Pathetic Skill cannot be raised above its Pathetic Rank except by taking certain Edges."

## Suggested Fix

Track which skills were marked as Pathetic during background selection. In `setSkillRank`, check if the skill is Pathetic before allowing rank increases.

## Impact

Custom background mode allows bypassing the Pathetic skill restriction, making characters overpowered.

## Resolution Log

### Commits
- `86c5731` — fix: enforce Pathetic skill restriction in character creation composable
- `4b306b9` — fix: wire Pathetic skill tracking through UI components

### Files Changed
- `app/composables/useCharacterCreation.ts` — Added `patheticSkills` tracking array to form state. `setSkillRank` now blocks raising Pathetic-locked skills (returns error string). Added `addPatheticSkill`/`removePatheticSkill` for custom background flow. Fixed `addSkillEdge` to allow Pathetic→Untrained via Basic Skills edge (PTU p. 41).
- `app/components/create/SkillBackgroundSection.vue` — Pathetic checkbox toggle now emits `addPatheticSkill`/`removePatheticSkill` instead of `setSkillRank`.
- `app/pages/gm/create.vue` — Wired new events; `setSkillRank` errors surfaced via `alert()`.

### Approach
1. `patheticSkills` array tracks which skills were set to Pathetic during background selection (both preset and custom modes).
2. `setSkillRank` checks against the tracking array — if the skill is Pathetic-locked and the target rank is above Pathetic, the operation is blocked.
3. Dedicated `addPatheticSkill`/`removePatheticSkill` functions manage the tracking set during custom background selection, so toggling Pathetic checkboxes correctly adds/removes from tracking.
4. `applyBackground` (preset mode) populates the tracking array from the background definition.
5. `clearBackground` and `enableCustomBackground` reset the tracking array.
6. Bonus fix: `addSkillEdge` no longer incorrectly blocks Pathetic→Untrained. Per PTU p. 41, Basic Skills edge allows this progression.

### Fix Cycle (rules-review-179 CHANGES_REQUIRED)

**CRITICAL-01 fix:**
- `19ec89c` — fix: guard removePatheticSkill against outstanding Skill Edges

**MEDIUM-01 fix:**
- `4101e1d` — fix: add informational warning for Pathetic enforcement at level > 1

**HIGH-01:** Resolved by decree-027 → implementation ticket ptu-rule-118.

#### Files Changed (fix cycle)
- `app/composables/useCharacterCreation.ts` — `removePatheticSkill` now returns `string | null` and checks for outstanding `Skill Edge: <skill>` entries in `form.edges` before allowing removal. Passes `patheticSkills` to `validateSkillBackground`.
- `app/pages/gm/create.vue` — Added `handleRemovePatheticSkill` wrapper with `alert()` for error feedback, matching `handleSetSkillRank` pattern.
- `app/utils/characterCreationValidation.ts` — `validateSkillBackground` accepts optional `patheticSkills` parameter. Emits info-severity warning when level > 1 and Pathetic skills are locked, explaining the restriction persists and how to work around it.
