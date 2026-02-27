---
review_id: code-review-203
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-092
domain: character-lifecycle
commits_reviewed:
  - 0374dd6
  - 3f2ede3
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/components/create/SkillBackgroundSection.vue
  - app/pages/gm/create.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T21:10:00Z
follows_up: null
---

## Review Scope

Bug fix for ptu-rule-092: Pathetic skill enforcement gap in custom background mode. The ticket reported that `setSkillRank` in custom background mode allows raising Pathetic-locked skills to higher ranks without restriction, bypassing the PTU rule that Pathetic skills can only be raised via certain Edges.

The fix introduces a `patheticSkills` tracking array in the composable form state, gates `setSkillRank` behind a Pathetic check, adds dedicated `addPatheticSkill`/`removePatheticSkill` functions, and fixes `addSkillEdge` to correctly allow Pathetic-to-Untrained progression via the Basic Skills edge.

Two commits reviewed: composable logic (0374dd6) and UI wiring (3f2ede3).

### Decree Check

- decree-022 (branching class handling): Not applicable to this change. Verified no branching class logic was touched.
- decree-026 (Martial Artist not branching): Not applicable to this change.
- No decrees exist for Pathetic skill mechanics. No new ambiguity discovered requiring a decree-need ticket.

## Issues

### MEDIUM

**M1. `alert()` for Pathetic enforcement error feedback (create.vue:449)**

`handleSetSkillRank` surfaces the composable's error string via `window.alert()`. This is a blocking browser dialog that disrupts the creation flow. The project has SCSS warning styles (`.warning-item--warning`) and inline error patterns already used in the same page (validation summary section, lines 251-264).

However, this matches the existing error handling pattern in the same file: `handleSkillEdge` (line 441), `createHumanQuick` (line 479), `createHuman` (line 493), and `createPokemon` (line 539) all use `alert()`. The fix is consistent with its surroundings. A project-wide effort to replace `alert()` with inline toast/notification feedback would be the correct fix, but that is not in scope for this ticket.

**Verdict:** Consistent with existing patterns. Not blocking. Would benefit from a refactoring ticket to replace all `alert()` calls in create.vue with proper inline feedback.

**M2. `create.vue` is exactly 800 lines (at the project max)**

The file was already 786 lines before this change and grew by 14 lines to 800, landing exactly at the project's 800-line maximum. This is technically within bounds but signals that any future addition to this page will require extracting logic. The `<script setup>` block is still manageable (160 lines), and most of the size comes from SCSS (256 lines) and template (384 lines).

**Verdict:** Not blocking. The developer should be aware that the file is at capacity. Future work on this page should extract SCSS to a shared partial or split the template into sub-components.

## What Looks Good

**Immutability discipline.** Every mutation in the composable uses spread operators or `.filter()` to create new objects/arrays. Specifically:
- `form.patheticSkills = [...form.patheticSkills, skill]` (addPatheticSkill, line 199)
- `form.patheticSkills = form.patheticSkills.filter(s => s !== skill)` (removePatheticSkill, line 212)
- `form.skills = { ...form.skills, [skill]: rank }` (all skill mutations)
- `form.patheticSkills = [...bg.patheticSkills]` (applyBackground, line 155 -- copies, doesn't alias)

No mutations detected anywhere in the changed code.

**Clean separation of concerns.** The composable owns all logic (tracking, validation, error messaging). The component (`SkillBackgroundSection.vue`) only emits events. The page (`create.vue`) wires events and surfaces errors. Each layer does exactly one thing.

**Correct `setSkillRank` return type change.** Changed from `void` to `string | null`. The only downstream consumer (`handleSetSkillRank` in `create.vue`) correctly handles both cases. The component emits events rather than calling the composable directly, so the TypeScript signature change doesn't affect it.

**Complete state lifecycle for `patheticSkills`.** The tracking array is populated on preset background apply (line 155), cleared on background clear (line 163) and custom enable (line 171), and managed via dedicated add/remove functions during custom mode. No orphan state scenarios.

**UI filter prevents cross-contamination.** `availableForAdept` excludes `customPathetics`, `availableForNovice` excludes `customPathetics`, and `availableForPathetic` excludes `customAdept` and `customNovice`. This means the user physically cannot select a skill as both Adept/Novice and Pathetic simultaneously through the UI, which prevents the `setSkillRank` guard from ever firing during normal Adept/Novice selection.

**`addSkillEdge` fix is correct.** Removed the hard block on Pathetic skills (`if (currentRank === 'Pathetic') return 'Cannot raise...'`) and now allows the rank progression to work naturally through the `rankProgression` array. Pathetic -> Untrained is the first valid step, matching PTU p. 41 Basic Skills edge behavior.

**`removeEdge` revert interacts correctly with `patheticSkills`.** When a Skill Edge on a Pathetic skill is removed, `removeEdge` decrements the rank back to Pathetic (e.g., Untrained -> Pathetic). The skill remains in `patheticSkills`, so it's correctly re-locked. No edge case here.

**Commit granularity is appropriate.** Two commits: one for composable logic, one for UI wiring. Clean separation. Messages are descriptive.

**`patheticSkills` correctly excluded from `buildCreatePayload`.** The tracking array is ephemeral form state used only during creation to enforce the Pathetic rule. The actual skill ranks (which include Pathetic) are serialized via `form.skills`. Post-creation enforcement is out of scope for this ticket.

## Verdict

**APPROVED.** The fix correctly addresses the reported gap. The Pathetic skill tracking array properly gates `setSkillRank` during character creation, while allowing the Skill Edge path to raise Pathetic skills as intended by PTU rules. Immutability is maintained throughout, component boundaries are clean, and the state lifecycle is complete. The two MEDIUM issues are consistent with existing patterns and do not introduce new risk.

## Required Changes

None. Both MEDIUM issues are non-blocking observations about pre-existing patterns (alert() usage) and file size proximity to limits. No code changes are required before this fix can proceed.
