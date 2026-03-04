---
review_id: code-review-291
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - 3fdc1c21
  - 5779f595
  - 59eed321
  - 5cae0db8
files_reviewed:
  - app/composables/useTrainerLevelUp.ts
  - app/components/levelup/LevelUpSummary.vue
  - app/components/levelup/LevelUpEdgeSection.vue
  - app/components/levelup/LevelUpFeatureSection.vue
  - app/components/levelup/LevelUpClassSection.vue
  - app/components/levelup/LevelUpMilestoneSection.vue
  - app/components/levelup/LevelUpModal.vue
  - app/assets/scss/_level-up-shared.scss
  - app/nuxt.config.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T21:00:00Z
follows_up: code-review-239
---

## Review Scope

Re-review of the P1 fix cycle for feature-008 (Trainer Level-Up Milestone Workflow). Verified that all 4 issues from code-review-239 (1 CRITICAL, 1 HIGH, 2 MEDIUM) have been resolved by the 4 fix commits. Also verified the 3 issues from rules-review-206 (1 HIGH, 2 MEDIUM) are addressed. Read all 10 source files in full, examined each fix commit diff, and traced data flow through the composable, modal, and child components.

Decree compliance verified against: decree-022 (branching class suffix), decree-026 (Martial Artist not branching), decree-027 (Pathetic skill edge block), decree-037 (skill ranks via edges only).

## Previous Issue Resolution

### C1 (CRITICAL): Regular Skill Edge rank-ups not applied — RESOLVED

**Fix commit:** `3fdc1c21`

The fix correctly addresses all four sub-problems identified in code-review-239:

1. **`regularSkillEdgeSkills` computed** (composable line 173-177): Parses `"Skill Edge: <skill>"` entries from `edgeChoices` using a `SKILL_EDGE_PREFIX` constant. Clean string slicing with a well-named constant.

2. **`countAllSkillEdgeUps()` function** (composable line 182-186): Unifies bonus + regular Skill Edge counting for a given skill. Used by `getEffectiveSkillRank()` and `effectiveSkills` computed. Both now call `countAllSkillEdgeUps()` instead of only counting `bonusSkillEdgeChoices`.

3. **`buildUpdatePayload()` skill application** (composable lines 445-461): Applies bonus Skill Edge rank-ups first, then regular Skill Edge rank-ups, using the `updatedSkillsWithAllEdges` accumulator. The sequential application correctly handles stacking (same skill raised by both bonus and regular Skill Edges).

4. **`skillRankUpDetails` in LevelUpSummary** (lines 218-254): Now processes both bonus and regular Skill Edges with a `runningRank` tracker for correct stacked display. Each entry includes a `source` field (`"Bonus L2"`, `"Regular Edge"`) for user clarity.

5. **`isRegularSkillEdgeCapped` in LevelUpEdgeSection** (line 213-219): Uses `effectiveSkills` prop, which now includes regular Skill Edge rank-ups via the composable fix. Cap checks are correct.

Verified the data flow: `edgeChoices` -> `regularSkillEdgeSkills` (computed, parsed) -> `countAllSkillEdgeUps` -> `effectiveSkills` / `getEffectiveSkillRank` / `buildUpdatePayload` / `skillRankUpDetails`. All paths account for both bonus and regular Skill Edges.

The `regularSkillEdgeSkills` computed is passed as a prop to `LevelUpSummary` via `LevelUpModal` (line 106), and the summary correctly receives and uses it.

### H1 (HIGH): app-surface.md not updated — RESOLVED

**Fix commit:** `59eed321`

The app-surface.md trainer level-up entry has been fully rewritten. The old "P1 will add edges/features/classes" placeholder is replaced with a complete listing of:
- All 4 P1 components: `LevelUpMilestoneSection.vue`, `LevelUpEdgeSection.vue`, `LevelUpFeatureSection.vue`, `LevelUpClassSection.vue`
- Updated composable description: edge/feature/class selection, milestone choices, effective skills tracking with bonus + regular Skill Edge rank-ups
- Updated modal step navigation: milestones -> stats -> skills -> edges -> features -> classes -> summary
- Updated summary capabilities: skill rank-ups from all Skill Edges
- Decree references: decree-022, decree-026, decree-037

The `LevelUpSkillSection.vue` reference was separately cleaned up (commit `6f11d3fa` from the decree-037 cleanup) and no longer appears in app-surface.md.

### M1 (MEDIUM): Duplicated SCSS patterns — RESOLVED

**Fix commit:** `5cae0db8`

A new shared SCSS partial `app/assets/scss/_level-up-shared.scss` (100 lines) contains 9 mixins:
- `levelup-btn`, `levelup-btn-primary`, `levelup-btn-secondary`, `levelup-btn-sm` (button styles)
- `levelup-counter`, `levelup-counter-full` (counter badge)
- `levelup-selected-tags`, `levelup-tag`, `levelup-tag-remove` (tag patterns)

The partial is registered in `nuxt.config.ts` `additionalData` (line 73), making the mixins available in all scoped SCSS blocks without explicit imports.

All 4 target components now use `@include` directives:
- **LevelUpEdgeSection.vue**: `.counter`, `.selected-tags`, `.tag`, `.btn` all use mixins with component-specific overrides (e.g., `tag--edge`, `tag--skill-edge` color variants)
- **LevelUpFeatureSection.vue**: Same pattern, with `tag--feature` override
- **LevelUpClassSection.vue**: Same pattern, with `tag--class` overrides
- **LevelUpModal.vue**: `.btn` uses mixin with footer-specific larger padding and `translateY` hover override

The approach is well-chosen: `@include` inside scoped styles avoids global style leakage while eliminating duplication. Component-specific overrides are kept alongside the `@include` calls, maintaining readability.

### M2 (MEDIUM): Missing class choice warning — RESOLVED

**Fix commit:** `5779f595`

The `warnings` computed (composable lines 409-413) now adds an informational warning when class choice levels are crossed but no class is selected:
```
(Info) Class choice available at level 5 but not selected
```

The `(Info)` prefix distinguishes it from blocking warnings (unallocated stat points, unfilled edges, etc.). The warning correctly checks `classChoiceLevels.value.length > 0` (levels crossed) AND `newClassChoices.value.length === 0` (no selection made). The level numbers are joined for multi-level jumps (e.g., `"level 5, 10"`).

### rules-review-206 HIGH-01: Automatic Skill Rank Per Level — RESOLVED

Resolved by decree-037. The `skillRanksGained` per-level field was removed from `trainerAdvancement.ts`, and the `LevelUpSkillSection.vue` component was deleted (commit `0d69883c`). Skill rank progression is now exclusively handled through Edge selection (both bonus Skill Edges at L2/6/12 and regular Skill Edges via the "Add Skill Edge" shortcut). The composable correctly implements this approach.

### rules-review-206 MEDIUM-01: currentHp not increased on level-up — RESOLVED

The `buildUpdatePayload()` now uses a `wasAtFullHp` check (composable lines 464-467): if the trainer was at full HP before level-up, currentHp is set to the new max. If not at full, currentHp is clamped to the new max (not reduced, not increased). This is a reasonable conservative approach that handles the most common case (trainer at full HP during level-up) while preserving in-combat HP state.

### rules-review-206 MEDIUM-02: Level-up watch fragile revert pattern — RESOLVED

Both integration points (`CharacterModal.vue` and `gm/characters/[id].vue`) use an `isApplyingLevelUp` ref guard. The watch checks `if (isApplyingLevelUp.value) return` at the top, preventing re-triggering when the level-up payload is applied back to editData. This eliminates the revert-and-reassign race condition concern.

## What Looks Good

**Fix granularity is correct.** Each of the 4 fix commits addresses exactly one issue from the previous review. Commit messages reference the issue ID (C1, M2, H1, M1) for traceability.

**Stacking logic is properly handled.** Both `skillRankUpDetails` (display) and `buildUpdatePayload()` (persistence) process bonus Skill Edges before regular Skill Edges and use a running accumulator to handle same-skill stacking correctly. The `runningRank` tracker in the summary ensures "Athletics: Untrained -> Novice (Bonus L2)" followed by "Athletics: Novice -> Adept (Regular Edge)" displays the correct progression.

**SCSS extraction preserves all existing behavior.** The mixin approach means component styles compile to the same CSS output as before. The `LevelUpModal.vue` correctly overrides padding and font-weight after `@include levelup-btn`, maintaining the modal footer's distinct button sizing.

**No file exceeds the 800-line limit.** Largest file is `useTrainerLevelUp.ts` at 538 lines. All components are well under the limit.

**Immutability patterns remain clean.** The new `regularSkillEdgeSkills` is a computed ref (inherently read-only). The `buildUpdatePayload()` uses a spread copy of `character.value.skills` before mutating the local copy. No reactive objects are directly mutated.

**Decree compliance remains intact.** All four applicable decrees are correctly implemented:
- decree-022: Branching classes use `": "` suffix format in `confirmBranching()` (LevelUpClassSection line 240)
- decree-026: Martial Artist non-branching is enforced by `isBranching: false` in constants
- decree-027: Pathetic skills can be raised during level-up (no creation-only block in composable)
- decree-037: Skill ranks come exclusively from Edge slots. No automatic `skillRanksGained` per level. Both bonus Skill Edges (structured data) and regular Skill Edges (parsed from edge choice strings) raise skill ranks.

## Verdict

**APPROVED**

All 4 issues from code-review-239 have been resolved correctly. All 3 issues from rules-review-206 have been addressed (HIGH-01 via decree-037, MEDIUM-01 via wasAtFullHp logic, MEDIUM-02 via isApplyingLevelUp guard). The fix commits are well-scoped, correctly implemented, and introduce no new issues. The P1 implementation of feature-008 is ready to proceed.

## Required Changes

None.
