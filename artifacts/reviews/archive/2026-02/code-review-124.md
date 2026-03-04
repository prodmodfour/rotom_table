---
review_id: code-review-124
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 902b518
  - 6a4f6a1
  - ca5243f
  - 171f9f5
  - 97bff99
files_reviewed:
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/components/encounter/BudgetIndicator.vue
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/scene/StartEncounterModal.vue
  - app/pages/gm/scenes/[id].vue
  - app/pages/gm/habitats/index.vue
  - app/pages/gm/habitats/[id].vue
  - app/pages/gm/encounter-tables.vue
  - app/types/encounter.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-02-21T21:15:00Z
follows_up: null
---

## Review Scope

Review of ptu-rule-060 P0 implementation: the PTU level-budget encounter creation system. Five commits adding:

1. `encounterBudget.ts` -- pure utility for PTU budget formula (avgLevel * 2 * playerCount)
2. `useEncounterBudget.ts` -- composable wrapping the utility for reactive encounter analysis
3. `BudgetIndicator.vue` -- visual bar + difficulty label component
4. `GenerateEncounterModal.vue` extension -- budget guide section with formula display + BudgetIndicator
5. `StartEncounterModal.vue` extension -- budget summary row in entity counts

Verified the budget formula against PTU Core p.473 and the XP rules against p.460. The formula implementation is correct. The significance presets align with PTU tier guidance.

## Issues

### CRITICAL

#### C1: Parent pages never pass `budgetInfo` or `partyContext` -- features are unreachable

**Files:** `app/pages/gm/scenes/[id].vue` (lines 120-127), `app/pages/gm/habitats/index.vue` (lines 78-86), `app/pages/gm/habitats/[id].vue` (lines 19-29), `app/pages/gm/encounter-tables.vue` (lines 137-147)

Both new props (`partyContext` on GenerateEncounterModal, `budgetInfo` on StartEncounterModal) are defined on the child components but **no parent page passes them**. The result is that all P0 UI features are dead code that will never render:

- `StartEncounterModal` in `pages/gm/scenes/[id].vue` (line 120-127): No `:budget-info` prop is passed. The `v-if="budgetInfo"` guard on line 23 of StartEncounterModal will never be true.
- `GenerateEncounterModal` in `pages/gm/habitats/index.vue` (line 78-86): No `:party-context` prop. The `v-if="partyContext"` guard on line 24 of GenerateEncounterModal will never be true.
- Same for `pages/gm/habitats/[id].vue` (line 19-29) and `pages/gm/encounter-tables.vue` (line 137-147).

The design spec (design-level-budget-001.md, section "Where Party Context Comes From", lines 384-392) explicitly states: "Parent page computes budgetInfo from scene characters' average Pokemon level and scene Pokemon levels. This is a computed property on `pages/gm/scenes/[id].vue` that calls `analyzeEncounterBudget()`." This wiring was not implemented.

**Required fix:** Wire the props in all parent pages. At minimum:
1. `pages/gm/scenes/[id].vue`: Compute `budgetInfo` from scene characters' Pokemon average level and scene wild Pokemon, pass it to `StartEncounterModal`.
2. At least one `GenerateEncounterModal` consumer needs `partyContext` passed (the scene habitat panel is the natural place, since the scene already has characters).

Without this fix, the entire P0 is a no-op -- the UI exists but is permanently hidden.

---

### HIGH

#### H1: `app-surface.md` not updated for 3 new files

**File:** `.claude/skills/references/app-surface.md`

Three new files were added (1 utility, 1 composable, 1 component) but `app-surface.md` was not updated. Per project checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?" This applies to utilities and composables as well. The file lists all 19 composables and all utilities; the new additions need to be recorded.

**Required fix:** Add `encounterBudget.ts` to the utils section, `useEncounterBudget.ts` to the composables section, and `BudgetIndicator.vue` to the components/encounter section of `app-surface.md`.

#### H2: Duplicate difficulty color styles across two components

**Files:** `app/components/encounter/BudgetIndicator.vue` (lines 128-153), `app/components/scene/StartEncounterModal.vue` (lines 130-153)

The exact same 5-tier difficulty color mapping (`trivial: #9e9e9e`, `easy: $color-success`, `balanced: $color-info`, `hard: $color-warning`, `deadly: $color-danger`) is duplicated verbatim across two components. Additionally, `#9e9e9e` is a hardcoded hex value that should use an SCSS variable or at minimum a shared mixin. When a third or fourth consumer of difficulty colors appears (which P1/P2 will add), each copy must be updated independently.

**Required fix:** Extract the difficulty color mapping into a shared SCSS mixin or utility class (e.g., `@mixin difficulty-color` in `_variables.scss` or a new `_difficulty.scss` partial), and use it in both components. Replace `#9e9e9e` with a named SCSS variable.

---

### MEDIUM

#### M1: `useEncounterBudget` composable counts player-side trainers, not just player characters

**File:** `app/composables/useEncounterBudget.ts` (line 25)

The composable's `analyzeCurrent()` function filters `c.side === 'players'` to get `playerCombatants` and uses `.length` as `playerCount`. However, the "players" side contains both trainer characters AND their Pokemon. In PTU, `playerCount` should be the number of player *trainers*, not the total number of player-side combatants. If a party has 3 trainers each with 2 Pokemon, the players side has 9 combatants, but `playerCount` should be 3.

The budget formula `avgLevel * 2 * playerCount` would produce wildly inflated results (e.g., 9 * 2 * avgLevel instead of 3 * 2 * avgLevel).

**Required fix:** Filter to `c.type === 'human'` as well, or filter to `c.side === 'players' && c.type === 'human'`.

Note: This composable is not currently consumed (see "What Looks Good" section), so the bug is latent. But when P1 wires it up for live encounter display, this will produce incorrect budgets.

#### M2: `BudgetCalcResult.baselineXpPerPlayer` naming is misleading

**File:** `app/utils/encounterBudget.ts` (line 31)

The field `baselineXpPerPlayer` is set to `avgLevel * 2` (the per-player budget, i.e., how many levels of enemies to allocate per player). But `baselineXpPerPlayer` implies it is an XP value, not a level-budget value. Per PTU p.473, this number represents "the number of Levels you have to work with" per player, not XP. XP only enters the picture after applying the significance multiplier.

The comment says "Baseline XP drop per player (before significance)" which matches the PTU rulebook phrasing but conflates levels-to-build-with and XP-drop. The number 40 (from avg level 20 * 2) is simultaneously the level budget per player AND the base XP drop when significance = x1, which is why the PTU rulebook uses them interchangeably. However, in the codebase context where `calculateEncounterXp` exists as a separate function, having `baselineXpPerPlayer` on a "budget" result can cause confusion.

**Required fix:** Rename to `baselineBudgetPerPlayer` or `levelBudgetPerPlayer` to distinguish from actual XP. Update the JSDoc comment accordingly.

---

## What Looks Good

1. **PTU formula correctness.** The core formula `avgLevel * 2 * playerCount = totalBudget` (p.473) is implemented correctly. The XP calculation `effectiveLevels * significanceMultiplier / playerCount` (p.460) is also correct. Trainer levels counting double is correctly applied in both budget analysis and XP calculation.

2. **Architecture follows established patterns.** The `encounterBudget.ts` utility mirrors `captureRate.ts` and `damageCalculation.ts` in structure: typed inputs, typed results with breakdowns, pure functions, zero side effects. The composable correctly wraps the utility for reactive access. The component accepts a typed `BudgetAnalysis` prop. This is clean layering.

3. **Difficulty thresholds are reasonable.** The threshold bands (trivial < 0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly > 1.8) provide useful graduated feedback. The PTU rulebook doesn't prescribe exact thresholds, so these are reasonable heuristics.

4. **Significance presets align with PTU.** The 5 tiers match the PTU p.460 guidance precisely. The multiplier ranges are well-calibrated to the rulebook examples.

5. **BudgetIndicator visual design.** The progress bar with overflow hatching pattern for over-budget encounters is a clean UX pattern. The color-coded difficulty labels use project SCSS variables consistently (except for the `#9e9e9e` noted in H2).

6. **Commit granularity.** Five commits, each touching 1-2 files, building from pure utility to composable to component to modal integrations. This follows the small-commits guideline precisely.

7. **Guard clauses on optional props.** Both `v-if="partyContext"` and `v-if="budgetInfo"` properly hide the budget sections when no context is available. The budget analysis in GenerateEncounterModal correctly gates on `generatedPokemon.value.length === 0` to avoid showing analysis before generation.

8. **Edge case handling.** `Math.max(0, ...)` on input values, `Math.max(1, playerCount)` to prevent division by zero in XP calc, and `budget.totalBudget > 0` check before ratio computation all handle degenerate inputs gracefully.

## Verdict

**CHANGES_REQUIRED**

The implementation quality of the utility, composable, and components is solid. The PTU formula is correct, the architecture follows established patterns, and the visual design is appropriate. However, the entire P0 feature set is unreachable because no parent page wires the new props (C1). This is not a "nice to have" -- it means the feature simply does not work at all. The budget guide never appears, the budget summary never appears.

## Required Changes

| ID | Severity | Fix | Files |
|----|----------|-----|-------|
| C1 | CRITICAL | Wire `budgetInfo` prop to `StartEncounterModal` in `pages/gm/scenes/[id].vue` and `partyContext` prop to at least one `GenerateEncounterModal` consumer. Compute values from existing scene/character data. | `pages/gm/scenes/[id].vue`, at least one of `pages/gm/habitats/*.vue` or `pages/gm/encounter-tables.vue` |
| H1 | HIGH | Update `app-surface.md` with new utility, composable, and component entries | `.claude/skills/references/app-surface.md` |
| H2 | HIGH | Extract difficulty color styles into shared SCSS mixin; replace `#9e9e9e` with SCSS variable | `BudgetIndicator.vue`, `StartEncounterModal.vue`, SCSS partials |
| M1 | MEDIUM | Fix `analyzeCurrent()` to count only human combatants on players side for `playerCount` | `useEncounterBudget.ts` |
| M2 | MEDIUM | Rename `baselineXpPerPlayer` to `baselineBudgetPerPlayer` or `levelBudgetPerPlayer` | `encounterBudget.ts` |
