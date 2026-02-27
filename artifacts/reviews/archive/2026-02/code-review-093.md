---
review_id: code-review-093
trigger: orchestrator-routed
target_tickets: [refactoring-047]
reviewed_commits: [37461ba, 01a2c43, 2f9c0a2, 0abe87e, acb3c32, 3d26260, e4cbc96]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T06:00:00Z
reviewer: senior-reviewer
---

## Scope

Review of refactoring-047: Extract ~200 lines of duplicated SCSS from 5 Pokemon sheet components into a shared `_pokemon-sheet.scss` partial with 8 mixins. Originally filed as M1 in code-review-076.

7 commits reviewed:
- `37461ba` -- new partial + nuxt.config injection
- `01a2c43` -- PokemonStatsTab mixin adoption
- `2f9c0a2` -- PokemonMovesTab mixin adoption
- `0abe87e` -- PokemonSkillsTab mixin adoption
- `acb3c32` -- PokemonEditForm mixin adoption
- `3d26260` -- PokemonCapabilitiesTab mixin adoption
- `e4cbc96` -- resolution log update

## Issues Found

### CRITICAL

None.

### HIGH

**H1. `pokemon-sheet-type-badge` mixin uses hardcoded hex colors instead of `$type-*` SCSS variables**

The mixin at `_pokemon-sheet.scss:133-150` hardcodes all 18 type colors as hex literals:

```scss
&--normal { background: #A8A878; color: #fff; }
&--fire { background: #F08030; color: #fff; }
// ... 16 more
```

The project already defines `$type-normal: #A8A878`, `$type-fire: #F08030`, etc. in `_variables.scss` (lines 74-91). The global `_type-badges.scss` partial correctly uses `background-color: $type-fire` etc.

Today the hex values match. Tomorrow, if someone updates `$type-fire` in `_variables.scss` to a new shade, the pokemon-sheet type badges will silently stay on the old color while every other type badge in the app updates. This is a maintainability time bomb.

Fix: Replace all 18 hardcoded hex values with the corresponding `$type-*` variables. The `color: #fff` / `color: #000` text colors can stay hardcoded (they are not covered by the variable system). Example:

```scss
&--normal { background: $type-normal; color: #fff; }
&--fire { background: $type-fire; color: #fff; }
```

File: `/home/ashraf/pokemon_ttrpg/session_helper/app/assets/scss/_pokemon-sheet.scss`, lines 133-150.

### MEDIUM

**M1. Header comment references PokemonLevelUpPanel but it was never touched**

Line 3 of `_pokemon-sheet.scss`:

```scss
// Mixins used across PokemonStatsTab, PokemonMovesTab, PokemonSkillsTab,
// PokemonEditForm, PokemonLevelUpPanel, PokemonCapabilitiesTab
```

PokemonLevelUpPanel does not use any of these mixins. It has its own `slideDown` animation and no shared styles (confirmed by inspection -- its SCSS is entirely unique: `level-up-panel`, `level-up-icon`, `level-up-item` classes). The comment is misleading and should drop `PokemonLevelUpPanel` from the list.

File: `/home/ashraf/pokemon_ttrpg/session_helper/app/assets/scss/_pokemon-sheet.scss`, line 3.

**M2. Mixin superset pattern generates unused CSS in PokemonSkillsTab**

PokemonSkillsTab's original `.roll-result` had only 4 sub-selectors: `__header`, `__skill`, `__total`, `__breakdown`. The `pokemon-roll-result` mixin includes 9 sub-selectors (adding `__total--crit`, `__total--hit`, `__total--miss`, `__type`, `__extra`, `__row`). The extra 5 sub-selectors are generated inside PokemonSkillsTab's scoped CSS but never matched by any HTML element in that component's template.

This is not a correctness bug (the extra selectors are inert) and is an inherent tradeoff of shared mixins vs per-component styles. The original duplicated code was already slightly inconsistent between MovesTab (full roll-result) and SkillsTab (minimal roll-result). The mixin correctly uses the superset.

No fix required, but worth documenting as a known tradeoff. If the dead CSS becomes a concern at scale, consider splitting into `pokemon-roll-result-base` and `pokemon-roll-result-full` mixins.

## What Looks Good

1. **Clean commit granularity.** One commit per component, each independently reviewable and bisectable. The partial + config change is a separate commit from all consumers. This is textbook refactoring discipline.

2. **Zero behavioral change.** Every `@include` produces the exact same CSS selectors and properties as the inline SCSS it replaced. Verified by diffing the removed blocks against the mixin definitions -- property-for-property match across all 5 components.

3. **Correct `@use ... as *` injection.** The `additionalData` line in `nuxt.config.ts` uses `@use "~/assets/scss/_pokemon-sheet.scss" as *;` which makes all mixins available without a namespace prefix. Since the file contains only `@mixin` definitions (no bare selectors, no variables that collide with `_variables.scss`), this produces zero CSS output unless a component explicitly `@include`s a mixin. No global CSS bloat.

4. **Type badge naming collision correctly avoided.** The mixin is named `pokemon-sheet-type-badge` (not `type-badge`) to avoid any confusion with the global `.type-badge` class defined in `_type-badges.scss` / `main.scss`. The global version uses `type-badge-base` + `type-badge-colors` mixins with gradient/text-shadow styling, while the pokemon-sheet version is intentionally simpler (flat colors, no text-shadow). The distinction is clean.

5. **All components retain `<style lang="scss" scoped>`.** Verified across all 5 modified components. Scoping is preserved, so the mixin output is correctly scoped to each component.

6. **PokemonLevelUpPanel correctly excluded.** Its SCSS is entirely unique (`slideDown` animation, `level-up-panel`/`level-up-item`/`level-up-icon` classes) with zero overlap with any of the 8 mixins. Correct decision to skip it.

7. **Keyframes mixin used at root scope.** `@include pokemon-sheet-keyframes` is called outside any selector block in every component, which correctly emits `@keyframes fadeIn` and `@keyframes rollIn` at the top level of the scoped stylesheet. This is the correct placement -- keyframes must be at root scope, not nested inside a selector.

8. **Net reduction is real.** ~226 lines of duplicated inline SCSS removed, replaced by 170 lines of reusable mixin definitions. Future Pokemon sheet components get these styles for free with a single `@include`.

9. **Resolution log is thorough.** Lists all commits, all files changed, mixins created, net line counts, and the rationale for skipping LevelUpPanel.

## Verdict

**APPROVED_WITH_ISSUES**

The refactoring is structurally sound, correctly preserves all visual behavior, and achieves meaningful deduplication. Two issues to address:

- **H1 (hardcoded hex colors):** Fix now. Replace 18 hex literals with `$type-*` variables. This is a 5-minute change that prevents a future color-sync bug.
- **M1 (comment inaccuracy):** Fix alongside H1. Drop PokemonLevelUpPanel from the header comment.
- **M2 (superset mixin dead CSS):** No action required. Acknowledged tradeoff.
