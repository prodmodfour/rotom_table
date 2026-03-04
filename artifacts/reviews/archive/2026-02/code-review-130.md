---
review_id: code-review-130
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 9f43e79
  - 107cc67
  - 1c4a6cc
  - 6fcd1d7
  - 65e5b77
  - 05f5847
  - 2b887de
files_reviewed:
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/components/encounter/BudgetIndicator.vue
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/scene/StartEncounterModal.vue
  - app/pages/gm/scenes/[id].vue
  - app/assets/scss/_difficulty.scss
  - app/assets/scss/_variables.scss
  - app/nuxt.config.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 2
reviewed_at: 2026-02-22T03:45:00Z
follows_up: code-review-124
---

## Review Scope

Re-review of 7 fix commits (9f43e79..2b887de) addressing all 5 issues from code-review-124 (CHANGES_REQUIRED) on the ptu-rule-060 P0 level-budget encounter system. Verified each original issue resolution and checked for regressions.

### Original Issue Resolution Status

| ID | Original Severity | Status | Notes |
|----|-------------------|--------|-------|
| C1 | CRITICAL | RESOLVED | `budgetInfo` wired to `StartEncounterModal` via scene page computed. `GenerateEncounterModal` gets manual party input fallback instead of requiring `partyContext` prop -- better UX. |
| H1 | HIGH | RESOLVED | `app-surface.md` updated with `encounterBudget.ts`, `useEncounterBudget.ts`, and `BudgetIndicator.vue`. |
| H2 | HIGH | REGRESSION | Shared `_difficulty.scss` partial created with `$color-neutral` variable. Text color mixin works. Background color mixin has a selector direction bug (see C2 below). |
| M1 | MEDIUM | RESOLVED | Filter now uses `c.side === 'players' && c.type === 'human'`. Comment correctly cites PTU p.460. |
| M2 | MEDIUM | RESOLVED | Renamed to `levelBudgetPerPlayer` with accurate JSDoc. No consumers broke (field was only set, never read externally). |

## Issues

### CRITICAL

#### C2: `difficulty-bg-colors` mixin generates wrong selector direction in BudgetIndicator fill bar

**Files:** `app/assets/scss/_difficulty.scss` (lines 31-50), `app/components/encounter/BudgetIndicator.vue` (line 73)

The original code in `BudgetIndicator.vue` used **ancestor selectors** to color the fill bar based on the parent's modifier class:

```scss
// ORIGINAL (correct): ancestor & pattern
.budget-bar {
  &__fill {
    .budget-indicator--trivial & {
      background: rgba(158, 158, 158, 0.6);
    }
  }
}
// Compiles to: .budget-indicator--trivial .budget-bar__fill { background: ... }
```

The new `difficulty-bg-colors` mixin generates **descendant selectors** instead:

```scss
// NEW (broken): descendant pattern
@mixin difficulty-bg-colors($prefix) {
  #{$prefix}--trivial {
    background: rgba($color-neutral, 0.6);
  }
}

// When used at line 73: @include difficulty-bg-colors('.budget-indicator');
// Inside &__fill context, compiles to:
// .budget-bar__fill .budget-indicator--trivial { background: ... }
```

The DOM structure is:
```html
<div class="budget-indicator budget-indicator--deadly">  <!-- modifier on ancestor -->
  <div class="budget-bar">
    <div class="budget-bar__fill" />  <!-- needs to be styled -->
  </div>
</div>
```

The mixin looks for `.budget-indicator--trivial` as a **descendant** of `.budget-bar__fill`, but the modifier class is on the **ancestor** `.budget-indicator` div. The fill bar will have no background color applied -- the progress bar is visually broken.

**Required fix:** The `difficulty-bg-colors` mixin needs to generate ancestor selectors when used inside child elements. Options:

1. Add a separate mixin `difficulty-bg-colors-ancestor($prefix)` that generates `#{$prefix}--trivial & { ... }` (note `&` at the end).
2. Change `BudgetIndicator.vue` to not use the mixin for fill bars and instead apply the background color directly on the parent `.budget-indicator--*` modifier classes.
3. Restructure the mixin to accept a `$mode: 'self' | 'ancestor'` parameter.

Option 1 is cleanest -- keep the current mixin for direct-class usage and add a variant for ancestor-based styling.

---

### MEDIUM

#### M3: `GenerateEncounterModal.vue` exceeds 800-line limit (834 lines)

**File:** `app/components/habitat/GenerateEncounterModal.vue`

Before the fix commits, this file was 749 lines. The manual party input feature (commit 65e5b77) added ~85 lines of template, script, and SCSS, pushing it to 834 lines. Per project guidelines, files should not exceed 800 lines.

**Required fix:** Extract the budget guide section (template + script + styles, approximately lines 24-70 template, 337-400 script, 590-654 styles) into a dedicated `BudgetGuide.vue` component. This component would accept `partyContext` as an optional prop, manage the manual input fallback internally, and emit the `effectivePartyContext` for the parent to use in budget calculations. This extraction also improves reusability -- other modals could use the same budget guide.

#### M4: Scene page `budgetInfo` counts all characters as players, including NPCs

**File:** `app/pages/gm/scenes/[id].vue` (lines 220-222)

The `budgetInfo` computed uses `scene.value.characters.length` as `playerCount`, treating every scene character as a player trainer. However, scenes can include NPC characters (allies or enemies with character sheets). The PTU budget formula on p.473 specifies the number of **player trainers**, not all characters.

The `allCharacters` ref on the scene page already carries `characterType` (line 174). The fix would be to cross-reference scene character IDs against `allCharacters` to filter only those with `characterType === 'pc'` (or the equivalent value).

Code in question:
```typescript
// Line 220-222
const sceneCharIds = scene.value.characters.map(c => c.characterId)
const playerCount = sceneCharIds.length  // <-- counts ALL characters, not just PCs
```

**Required fix:** Filter by character type:
```typescript
const sceneCharIds = scene.value.characters.map(c => c.characterId)
const playerCharIds = sceneCharIds.filter(id =>
  allCharacters.value.find(c => c.id === id)?.characterType === 'pc'
)
const playerCount = playerCharIds.length
```

Use `playerCharIds` instead of `sceneCharIds` for the `ownedPokemonLevels` calculation too, since only player-owned Pokemon levels should factor into the average.

---

## What Looks Good

1. **C1 fix approach is creative and pragmatic.** Rather than forcing all `GenerateEncounterModal` consumers to compute and pass `partyContext`, the fix adds manual input fields that appear when no prop is provided. This means the budget guide is always accessible from habitat/encounter-table pages (which have no scene context) and auto-filled when opened from a scene with `partyContext`. The `effectivePartyContext` computed with prop-then-manual fallback is clean.

2. **M1 fix is precise and well-documented.** The `c.type === 'human'` filter is the correct PTU-aligned fix. The inline comment quoting "Divide by the number of Players -- not the number of Pokemon" from PTU p.460 makes the intent immediately clear to future readers.

3. **M2 rename is thorough.** Both the field name and the JSDoc comment were updated. The old name only appears in artifact docs (reviews, tickets, design specs), not in source code.

4. **H1 app-surface.md update is accurate.** The budget system section correctly describes the utility, composable, and component with appropriate one-line summaries.

5. **H2 partial extraction was well-structured.** The `_difficulty.scss` partial is properly placed, properly imported via `nuxt.config.ts`, and the `$color-neutral` variable follows the existing semantic color naming convention. The `difficulty-text-colors` mixin works correctly in both `BudgetIndicator.vue` and `StartEncounterModal.vue`.

6. **Commit granularity is appropriate.** Seven focused commits, each addressing one or two related issues, with clear conventional-commit messages.

7. **Scene page `budgetInfo` computed has good guard clauses.** Returns `undefined` when scene is null, when there are no Pokemon or characters, or when no owned Pokemon levels can be determined. The `Math.round()` on average level is appropriate for a display value.

## Verdict

**CHANGES_REQUIRED**

Four of five original issues are fully resolved (C1, H1, M1, M2). H2 introduced a regression: the `difficulty-bg-colors` mixin generates descendant selectors instead of the ancestor selectors that the original code used, causing the budget bar fill to have no visible color. This is a visual break in the primary P0 UI element.

## Required Changes

| ID | Severity | Fix | Files |
|----|----------|-----|-------|
| C2 | CRITICAL | Fix `difficulty-bg-colors` mixin selector direction -- must generate ancestor selectors (`.budget-indicator--X .budget-bar__fill`) not descendant selectors (`.budget-bar__fill .budget-indicator--X`). Add ancestor-mode mixin or restructure approach. | `_difficulty.scss`, `BudgetIndicator.vue` |
| M3 | MEDIUM | Extract budget guide section from `GenerateEncounterModal.vue` into a `BudgetGuide.vue` component to bring file under 800-line limit (currently 834). | `GenerateEncounterModal.vue`, new `BudgetGuide.vue` |
| M4 | MEDIUM | Filter `budgetInfo` playerCount to only PC-type characters by cross-referencing `allCharacters` characterType. Also filter owned Pokemon levels to only PC trainers. | `pages/gm/scenes/[id].vue` |
