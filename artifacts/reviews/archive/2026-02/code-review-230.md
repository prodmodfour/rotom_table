---
review_id: code-review-230
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - cdcc7d8
  - 8c83b02
  - f40ce4a
  - da2b849
  - 33394c7
  - 16aad2d
  - 6a767e0
  - 45a1df8
  - 684e6f5
files_reviewed:
  - app/utils/trainerAdvancement.ts
  - app/composables/useTrainerLevelUp.ts
  - app/components/levelup/LevelUpModal.vue
  - app/components/levelup/LevelUpStatSection.vue
  - app/components/levelup/LevelUpSkillSection.vue
  - app/components/levelup/LevelUpSummary.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-02-28T22:15:00Z
follows_up: null
---

## Review Scope

First review of feature-008 P0 (Trainer Level-Up Milestone Workflow). 9 commits implementing a multi-step trainer level-up wizard with stat point allocation, skill rank assignment, and summary/review steps. 10 files changed (+2096/-1), 6 new files, 4 modified.

### Decree Compliance

- **decree-022 (branch-class-handling):** P1 scope. P0 does not touch class names or branching logic. No conflict.
- **decree-026 (martial-artist-not-branching):** P1 scope. P0 does not reference Martial Artist or branching classes. No conflict.
- **decree-027 (pathetic-skill-edge-block):** P1 scope for Skill Edges, but relevant to P0 skill rank allocation. The design spec (spec-p0.md Section E) explicitly states "Pathetic skills CAN be raised during level-up (not during creation per decree-027)." This is the correct interpretation: decree-027 restricts only character creation, not post-creation advancement. The composable's `canRankUpSkill()` correctly allows Pathetic-to-Untrained progression. **Compliant.**

---

## Issues

### CRITICAL

#### C-01: Level-up completion re-triggers the level watcher, causing double modal open

**Files:** `app/components/character/CharacterModal.vue` (lines 346-355, 357-363), `app/pages/gm/characters/[id].vue` (lines 332-341, 344-350)

**Problem:** Both integration points use the same pattern:
1. User types new level (e.g., 3 -> 5)
2. Watcher fires (`newVal=5, oldVal=3`), reverts to 3, opens modal
3. User completes the wizard, `onLevelUpComplete` runs
4. `editData.value = { ...editData.value, ...updatedData }` sets level to 5
5. `showLevelUpModal.value = false` hides the modal
6. Vue flushes the watcher: `newVal=5, oldVal=3` -- guard passes (`5 > 3`)
7. Watcher reverts level back to 3 and sets `showLevelUpModal = true` again
8. Modal reopens with the same parameters -- user must redo the entire wizard

This makes the level-up workflow fundamentally broken. The user completes the wizard only to have it immediately reopen.

**Fix:** Add a guard flag that the watcher checks:

```typescript
const isApplyingLevelUp = ref(false)

watch(() => editData.value.level, (newVal, oldVal) => {
  if (isApplyingLevelUp.value) return
  // ... rest of watcher
})

function onLevelUpComplete(updatedData: Partial<HumanCharacter>) {
  isApplyingLevelUp.value = true
  editData.value = { ...editData.value, ...updatedData }
  showLevelUpModal.value = false
  nextTick(() => { isApplyingLevelUp.value = false })
}
```

This must be fixed in BOTH `CharacterModal.vue` and `gm/characters/[id].vue`.

---

### HIGH

#### H-01: Evasion calculation missing cap at +6

**File:** `app/components/levelup/LevelUpStatSection.vue` (lines 112-121)

**Problem:** The evasion preview computes `Math.floor(stat / 5)` without capping at 6. PTU Core p. 15 states: "up to a maximum of +6 at 30 [stat]." A trainer with Defense 35 would show Physical Evasion of 7, which exceeds the PTU maximum.

```typescript
// Current:
physical: Math.floor(def / 5)

// Correct:
physical: Math.min(Math.floor(def / 5), 6)
```

This needs the cap applied to all three evasion calculations. This is a rules accuracy bug that will show incorrect values to the GM.

#### H-02: `buildUpdatePayload` does not increase `currentHp` when `maxHp` increases

**File:** `app/composables/useTrainerLevelUp.ts` (lines 230-240)

**Problem:** The payload clamps `currentHp` to the new max:
```typescript
currentHp: Math.min(character.value.currentHp, newMaxHp)
```

This correctly prevents `currentHp` from exceeding the new `maxHp`, but it does NOT increase `currentHp` proportionally when `maxHp` increases. If a trainer has 42/42 HP (full health) and levels up to maxHp 50, the result is 42/50 HP -- they now appear damaged after leveling up.

The intuitive behavior for a level-up is that if the trainer was at full HP before, they should be at full HP after. Suggested fix:

```typescript
const wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)
currentHp: wasAtFullHp ? newMaxHp : Math.min(character.value.currentHp, newMaxHp)
```

This is a gameplay UX issue: GMs will be confused when a healthy trainer appears damaged after a level-up and will have to manually fix it.

---

### MEDIUM

#### M-01: `RANK_PROGRESSION` array duplicated in 3 files

**Files:**
- `app/composables/useTrainerLevelUp.ts` (line 31)
- `app/components/levelup/LevelUpSkillSection.vue` (line 110)
- `app/components/levelup/LevelUpSummary.vue` (line 114)

**Problem:** The skill rank progression array `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` is independently defined in 3 locations. If the order or values ever need to change, all 3 must be updated in sync. The `SKILL_RANKS` constant in `app/constants/trainerSkills.ts` already defines the progression order.

**Fix:** Export `RANK_PROGRESSION` from `constants/trainerSkills.ts` (or `constants/trainerStats.ts` where `SKILL_RANK_ORDER` already exists as a private constant) and import it in all 3 files.

#### M-02: `statDefinitions` array duplicated in 2 new files

**Files:**
- `app/components/levelup/LevelUpStatSection.vue` (line 102)
- `app/components/levelup/LevelUpSummary.vue` (line 118)

Also duplicated in `app/components/create/StatAllocationSection.vue` (line 100).

**Problem:** The stat key-to-label mapping `[{key: 'hp', label: 'HP'}, ...]` is defined independently in 3 places across the codebase. Extract to a shared constant.

#### M-03: `app-surface.md` not updated with new files

**File:** `.claude/skills/references/app-surface.md`

**Problem:** 6 new files were added (utility, composable, 4 components) but `app-surface.md` was not updated to reflect the new level-up components, composable, or utility. The surface map is the canonical reference for skills and automated tooling. Missing entries mean future skills/reviewers won't know these files exist.

**Required additions:**
- `app/utils/trainerAdvancement.ts` in Utilities section
- `app/composables/useTrainerLevelUp.ts` in a new Trainer Level-Up section
- `app/components/levelup/LevelUpModal.vue`, `LevelUpStatSection.vue`, `LevelUpSkillSection.vue`, `LevelUpSummary.vue` in Components section

---

## What Looks Good

1. **Clean separation of concerns.** The pure utility (`trainerAdvancement.ts`), composable (`useTrainerLevelUp.ts`), and UI components follow the project's established patterns well. The utility has zero side effects and can be unit tested trivially. The composable bridges reactive state to the pure logic cleanly.

2. **Design spec compliance.** The implementation matches the P0 spec faithfully -- types, function signatures, milestone definitions, and integration patterns all align with the design document. The implementation follows the spec line-by-line.

3. **Immutability practices.** `updatedStats` and `updatedSkills` in the composable correctly create new objects via spread before modification. `addSkillRank` uses `[...array, item]` immutable append. `removeSkillRank` uses filter. The reactive `statAllocations` uses `Object.assign` for resets (acceptable for Vue `reactive()` objects).

4. **Skill rank cap enforcement.** The `canRankUpSkill` function correctly uses `isSkillRankAboveCap(nextRank, newLevel.value)`, enforcing the cap at the TARGET level, not the starting level. This handles multi-level jumps correctly (e.g., level 1->6 allows Adept since level 2 was crossed, and level 5->7 allows Expert since level 6 was crossed).

5. **Multi-level jump handling.** `computeTrainerAdvancement` correctly iterates from `fromLevel + 1` to `toLevel`, producing per-level entitlements. The summary aggregates correctly. The level cap at 50 is enforced.

6. **File sizes.** All files are within the 800-line limit. Largest is `LevelUpSkillSection.vue` at 385 lines (well under limit).

7. **P1 forward-compatibility.** The modal's step navigation is computed, with P1 steps commented out as ready-to-enable. The advancement banner shows P1 items with dimmed "(P1)" indicators. The summary shows P1 indicators clearly. This is well-thought-out for incremental delivery.

8. **Level detection guard.** The watch correctly guards against non-number values, non-increase changes, and Pokemon entities (in CharacterModal). It does NOT fire on initial mount since `watch()` with a getter only fires on changes (no `immediate: true`).

9. **Commit granularity.** 9 commits with good separation: utility -> composable -> stat section -> skill section -> summary -> modal -> standalone integration -> modal integration -> ticket update. Each commit produces a buildable state.

10. **maxHp formula.** `level * 2 + hp * 3 + 10` matches PTU Core p. 15 exactly: "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10."

---

## Verdict

**CHANGES_REQUIRED**

The CRITICAL issue (C-01: double modal open) makes the level-up workflow non-functional and must be fixed before this can be approved. The two HIGH issues (H-01: evasion cap, H-02: currentHp at full health) are rules accuracy and UX bugs that should be fixed in this pass since the developer is already in the code. The MEDIUM issues (M-01, M-02: duplicated constants; M-03: app-surface.md) are code hygiene fixes that prevent accumulating tech debt.

---

## Required Changes

### Must Fix (blocks approval)

1. **C-01:** Add `isApplyingLevelUp` guard flag to prevent the level watcher from re-triggering after `onLevelUpComplete` applies the new level. Fix in BOTH `CharacterModal.vue` and `gm/characters/[id].vue`.

### Should Fix (fix now, not later)

2. **H-01:** Add `Math.min(..., 6)` cap to all three evasion calculations in `LevelUpStatSection.vue`.

3. **H-02:** Detect "was at full HP" before level-up and set `currentHp = newMaxHp` when the trainer was at full health. Fix in `useTrainerLevelUp.ts` `buildUpdatePayload()`.

4. **M-01:** Extract `RANK_PROGRESSION` to `constants/trainerStats.ts` (where `SKILL_RANK_ORDER` already exists privately) and export it. Import in composable, LevelUpSkillSection, and LevelUpSummary.

5. **M-02:** Extract `statDefinitions` to a shared constant file (e.g., `constants/trainerStats.ts`) and import in LevelUpStatSection, LevelUpSummary, and StatAllocationSection.

6. **M-03:** Update `app-surface.md` with the 6 new files.
