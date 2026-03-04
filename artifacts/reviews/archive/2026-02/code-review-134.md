---
review_id: code-review-134
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 3f362c7
  - e0d2e23
  - d613c6d
  - da0f7da
files_reviewed:
  - app/assets/scss/_difficulty.scss
  - app/components/encounter/BudgetIndicator.vue
  - app/components/habitat/BudgetGuide.vue
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/scene/StartEncounterModal.vue
  - app/pages/gm/scenes/[id].vue
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/types/character.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-23T07:30:00Z
follows_up: code-review-130
---

## Review Scope

Re-review of 4 commits addressing 3 issues from code-review-130:
- **C2:** SCSS `difficulty-bg-colors` mixin selector direction failed in ancestor context
- **M3:** `GenerateEncounterModal.vue` exceeded 800-line limit
- **M4:** `budgetInfo` playerCount included NPC trainers instead of PC-only

## Issues

### CRITICAL

#### C1: M4 fix uses wrong `characterType` value -- budget display is permanently broken

**File:** `app/pages/gm/scenes/[id].vue` (line 223)
**Commit:** `d613c6d`

The fix filters characters by `characterType === 'pc'`, but this value does not exist anywhere in the codebase. The `CharacterType` union type (`app/types/character.ts:12`) is `'player' | 'npc' | 'trainer'`. The Prisma schema defaults to `'npc'`. Player characters use `'player'`, never `'pc'`.

```typescript
// Line 223 -- CURRENT (broken)
allCharacters.value.find(c => c.id === id)?.characterType === 'pc'

// CORRECT
allCharacters.value.find(c => c.id === id)?.characterType === 'player'
```

Because `'pc'` never matches, `playerCharIds` is always empty, `playerCount` is always 0, and the function returns `undefined` on line 226. This means the budget indicator in `StartEncounterModal` never displays, and the budget formula in the scene page is completely non-functional.

This is a regression from the original code: the M4 issue was about over-counting (including NPCs), but now the fix under-counts to zero. The budget display is entirely broken for all scenes.

**Note:** The previous review (code-review-130) suggested `'pc'` in its example fix. That suggestion was incorrect. The developer followed the suggestion faithfully but the underlying value was wrong. The correct value is `'player'`.

**Required fix:** Change `'pc'` to `'player'` on line 223.

---

## What Looks Good

1. **C2 fix is correct and well-structured.** The new `difficulty-bg-colors-ancestor` mixin generates `#{$prefix}--trivial & { ... }` selectors, which correctly produce `.budget-indicator--trivial .budget-bar__fill[data-v-xxx]` in Vue scoped CSS. The ancestor class is on the root `<div>` of `BudgetIndicator.vue` (line 2: `:class="\`budget-indicator--${analysis.difficulty}\`"`), and the `&` resolves to `.budget-bar__fill` (the styled child). The original `difficulty-bg-colors` mixin is preserved for direct-class use cases, and both mixins are well-documented with JSDoc comments explaining when to use which variant.

2. **M3 extraction is clean.** `BudgetGuide.vue` (160 lines) is a proper extraction -- it takes the template, script logic (manual inputs, effective party context, budget calculations), and SCSS styles as a cohesive unit. `GenerateEncounterModal.vue` dropped from ~800+ lines to 690 lines. The parent passes two props (`partyContext`, `generatedPokemon`) and the child component is fully self-contained. No logic duplication, no prop drilling issues. Import cleanup was done correctly (removed `PhScales`, `calculateEncounterBudget`, `analyzeEncounterBudget`, `BudgetAnalysis`).

3. **M4 fix structure is correct (aside from the wrong string value).** The approach of filtering `sceneCharIds` against `allCharacters` by `characterType`, using the filtered `playerCharIds` for both `playerCount` and the `ownedPokemonLevels` lookup, and returning `undefined` when `playerCount === 0`, is the right design. Only the comparison value is wrong.

4. **Commit granularity is appropriate.** Each of the 3 fixes is a separate commit with a clear message. The ticket update is a 4th commit. This follows project conventions.

## Verdict

**CHANGES_REQUIRED** -- One critical issue (C1) must be fixed before approval. The `characterType === 'pc'` comparison on line 223 of `[id].vue` must be changed to `characterType === 'player'` to match the project's `CharacterType` union type. This is a one-character fix (`'pc'` to `'player'`).

## Required Changes

| ID | Severity | Description | File(s) |
|----|----------|-------------|---------|
| C1 | CRITICAL | Change `characterType === 'pc'` to `characterType === 'player'` -- `'pc'` is not a valid `CharacterType` value. Budget display is broken for all scenes. | `app/pages/gm/scenes/[id].vue` (line 223) |
