---
review_id: code-review-118
target: ptu-rule-056
trigger: design-implementation
verdict: APPROVED
reviewed_commits: [5922d6b, d8c2c47, 9a81d53, c1daaad, 24668f6, 98fb85d]
reviewed_files:
  - app/constants/trainerSkills.ts
  - app/constants/trainerBackgrounds.ts
  - app/utils/characterCreationValidation.ts
  - app/composables/useCharacterCreation.ts
  - app/components/create/StatAllocationSection.vue
  - app/components/create/SkillBackgroundSection.vue
  - app/pages/gm/create.vue
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

P0 implementation of design-char-creation-001 (ptu-rule-056): expanded character creation form with PTU-compliant stat allocation and skill background selection. 6 new files created, 1 file modified across 6 commits.

The implementation is solid. Constants are correct, the composable follows immutable patterns, components use proper props/emits architecture, validation is soft (warnings only, never blocking), and the Pokemon form is completely untouched. The `buildCreatePayload()` output matches the API endpoint's expected body shape. All SCSS variables reference valid project tokens. File sizes are well within limits (largest is 498 lines).

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

**M1. Duplicated PTU constants in StatAllocationSection.vue**

`StatAllocationSection.vue` lines 81-84 re-declare `BASE_HP`, `BASE_OTHER`, `TOTAL_STAT_POINTS`, and `MAX_POINTS_PER_STAT` as local constants. These same values are defined in `useCharacterCreation.ts` lines 28-31. The component correctly does not call the composable (it uses props/emits), but the values should live in a shared constants file (e.g., `trainerSkills.ts` or a new `trainerStats.ts`) to eliminate the duplication risk.

Currently the two copies are in sync. If a future developer changes the composable constant without updating the component constant, the stat display ("Points Remaining: X / 10") will show a different pool size than what the composable actually enforces.

**Fix:** Either (a) extract these 4 constants to a shared constants file and import in both places, or (b) pass `TOTAL_STAT_POINTS` and `MAX_POINTS_PER_STAT` as additional props from the parent (the parent already has access via the composable return). Option (a) is cleaner.

**M2. `applyBackground` mutates local object before assignment**

In `useCharacterCreation.ts` lines 107-112, `applyBackground` creates a new object via `getDefaultSkills()` then mutates it via bracket assignment (`skills[bg.adeptSkill] = 'Adept'`) before assigning to `form.skills`. This is pragmatically safe because the object is freshly created and not yet referenced anywhere. However, it is inconsistent with `setSkillRank` (line 135) which uses the spread pattern `{ ...form.skills, [skill]: rank }`.

For consistency with the project's immutability guidelines, consider building the final skills object immutably:

```typescript
const defaults = getDefaultSkills()
const skills = {
  ...defaults,
  [bg.adeptSkill]: 'Adept' as SkillRank,
  [bg.noviceSkill]: 'Novice' as SkillRank,
  ...Object.fromEntries(bg.patheticSkills.map(s => [s, 'Pathetic' as SkillRank]))
}
form.skills = skills
```

This is a style consistency issue, not a correctness bug.

## New Tickets Filed

None. Both medium issues are addressable in the current feature's P1 tier without separate tickets.

## What Looks Good

1. **Clean separation of concerns.** Constants, validation, composable, and UI components are each in their own file with clear responsibilities. The composable owns all state and logic; components are purely presentational via props/emits.

2. **Immutability in stat modification.** `incrementStat` and `decrementStat` (composable lines 88-103) use spread assignment `{ ...form.statPoints, [stat]: newValue }` rather than mutating in place. `setSkillRank` follows the same pattern.

3. **Validation is soft, never blocking.** `CreationWarning` with `severity: 'info' | 'warning'` is shown in the summary section but never disables the Create button. This matches the design spec requirement that the GM has final say.

4. **No prop mutation.** Both `StatAllocationSection.vue` and `SkillBackgroundSection.vue` receive data as props and communicate changes via emits only. The parent (`create.vue`) handles all state changes through the composable.

5. **`buildCreatePayload()` produces correct API body shape.** The payload sends `stats` (object with hp/attack/defense/specialAttack/specialDefense/speed), `maxHp`, `currentHp`, `skills`, and `background` -- all of which map directly to what `index.post.ts` reads. The `stats.hp` value is the total stat (base 10 + added), which matches `body.stats?.hp` on line 10 of the API endpoint.

6. **Pokemon form unchanged.** Lines 121-335 of `create.vue` are completely untouched. The `pokemonForm` ref and `createPokemon` function remain as they were.

7. **File sizes within limits.** Largest file is 498 lines (`SkillBackgroundSection.vue` and `create.vue`), well under the 800-line cap.

8. **No console.log statements.** All 7 files verified clean.

9. **All SCSS variables valid.** Every referenced variable (`$spacing-*`, `$font-size-*`, `$color-*`, `$border-radius-*`, `$glass-*`, `$shadow-*`, `$gradient-*`, `$transition-*`) exists in `_variables.scss`. No undefined variables used.

10. **No Phosphor icon misuse.** The new components do not introduce any icon imports -- the existing `create.vue` icons (`user.svg`, `circle.svg`) remain unchanged.

11. **11 backgrounds match design spec exactly.** Each background has exactly 1 adeptSkill, 1 noviceSkill, and 3 patheticSkills. The `TrainerBackground` interface enforces the tuple type `[PtuSkillName, PtuSkillName, PtuSkillName]` for pathetic skills.

12. **Custom background mode is well-implemented.** The `SkillBackgroundSection` provides Adept/Novice dropdowns and Pathetic checkboxes with proper mutual exclusion (available pools filter out skills already selected for other slots). The checkbox count is capped at 3 with visual disabled state.

13. **Derived stats displayed correctly.** Evasions use `Math.floor(stat / 5)` which matches PTU rules. Max HP formula `Level * 2 + HP * 3 + 10` is consistent across the composable, the design spec, and the API endpoint.

## Verdict

**APPROVED.** The P0 implementation is correct, well-structured, and follows project patterns. The two MEDIUM issues (constant duplication, local mutation style) are non-blocking and should be addressed opportunistically during P1 development.
