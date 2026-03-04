---
review_id: code-review-224
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-096
domain: character-lifecycle
commits_reviewed:
  - 5c8bec7
  - 8a3ea3c
  - 29cf8a9
  - da9e584
  - 14034d6
  - 63a9ee5
files_reviewed:
  - app/assets/scss/components/_tags.scss
  - app/nuxt.config.ts
  - app/pages/gm/characters/[id].vue
  - app/components/character/tabs/HumanClassesTab.vue
  - app/components/create/ClassFeatureSection.vue
  - app/components/create/EdgeSelectionSection.vue
  - app/assets/scss/components/_player-character-sheet.scss
  - app/assets/scss/components/_create-form-shared.scss
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-02-28T15:30:00Z
follows_up: null
---

## Review Scope

Reviewing refactoring-096: Harmonize tag color styling. 6 commits by slave-5 (plan-20260228-131955). The ticket (sourced from code-review-215 MED-03) identified duplicated tag variant styles with inconsistent colors across 5 locations. The fix extracted a shared `_tags.scss` partial with a canonical color scheme and removed the duplicated scoped styles.

**Decree compliance checked:**
- decree-022 (specialization suffix for branching classes): Contextual only. No tag styling changes affect branching logic. Compliant.
- decree-027 (block Skill Edges from raising Pathetic skills): Contextual only. The `tag--skill-edge` styling is purely cosmetic. Compliant.

**Commits reviewed:**
1. `5c8bec7` -- Created `_tags.scss` partial with 5 variant selectors, registered in `nuxt.config.ts` css array.
2. `8a3ea3c` -- Removed 28 lines of scoped tag styles from `pages/gm/characters/[id].vue`.
3. `29cf8a9` -- Removed 31 lines of scoped tag styles from `HumanClassesTab.vue`.
4. `da9e584` -- Removed 15 lines of scoped tag styles from `ClassFeatureSection.vue`.
5. `14034d6` -- Removed 14 lines of scoped tag styles from `EdgeSelectionSection.vue`.
6. `63a9ee5` -- Removed `tag--edge` color override from `_player-character-sheet.scss`.

## Issues

### HIGH

**H1: CSS specificity regression for tag variants in player character sheet**

**File:** `app/assets/scss/components/_player-character-sheet.scss` (line 277)

The `.player-sheet .tag` selector has specificity (0,2,0), which beats every variant selector in `_tags.scss` at (0,1,0). This means `.tag--edge`, `.tag--class`, `.tag--feature`, and `.tag--capability` colors are all overridden by `.player-sheet .tag`'s `background: $color-bg-tertiary; border: 1px solid $border-color-default; color: $color-text;` within the player view.

Before this refactoring, the player sheet had `.player-sheet .tag--edge` (specificity 0,3,0) which correctly overrode the base `.player-sheet .tag`. That scoped override was removed in commit `63a9ee5` without compensating for the specificity gap. The result is that edge tags in the player view will now display with neutral colors instead of the warning-colored edge styling.

Note: class/feature/capability tags also lose their variant colors in the player view for the same specificity reason, but they were ALREADY neutral-colored before this refactoring (only `--edge` had a player-sheet-specific override). So the net regression is specifically on edge tags.

**Fix:** Add `.player-sheet` scoped overrides for the variants that should be visible in the player view. The simplest approach is to add higher-specificity selectors in `_player-character-sheet.scss`:

```scss
.player-sheet .tag--class { color: $color-accent-violet; }
.player-sheet .tag--feature { color: $color-accent-teal; }
.player-sheet .tag--edge { color: $color-warning; }
.player-sheet .tag--capability { color: $color-success; }
```

Or alternatively, restructure `.player-sheet .tag` to only set sizing properties (padding, font-size, border-radius) and let the variant colors from `_tags.scss` apply. This is the cleaner approach since the intent of `.player-sheet .tag` is a sizing override, not a color override.

### MEDIUM

**M1: Stale comment in `_create-form-shared.scss`**

**File:** `app/assets/scss/components/_create-form-shared.scss` (lines 64-65)

The comment reads: "Variant modifiers (--class, --feature, --edge, --skill-edge) remain in each component's scoped styles." This is now incorrect -- the variants have been moved to the global `_tags.scss` partial. The comment should be updated to reference `_tags.scss`.

## What Looks Good

1. **Correct extraction pattern.** The `_tags.scss` partial is well-structured: clear header comment documenting the source locations, a note about where base `.tag` styles live, and clean flat selectors for each variant. The comment "Components should NOT re-declare these variants in scoped styles" is a good guard against future duplication.

2. **Canonical color scheme is sensible.** The unified colors (violet for class, teal for feature, warning for edge, success for capability) are visually distinct and semantically appropriate. The choice to standardize on the HumanClassesTab's colors (which had the most consistent set) was the right call.

3. **Color unification addresses the original bug.** The character detail page previously used `$color-accent-scarlet` for features and `$color-info` for edges, while HumanClassesTab used `$color-accent-teal` and `$color-warning` respectively. Users seeing different colors for the same tag type in different views was the core issue, and it is now resolved.

4. **CSS array ordering is correct.** `_tags.scss` is loaded after `_create-form-shared.scss` (which defines the base `.tag`) and before `_player-character-sheet.scss` (which overrides sizing). This ordering allows the variant colors to layer on top of the base layout properties correctly -- except for the specificity issue noted in H1.

5. **Commit granularity is good.** Each commit addresses a single file, producing a working state at each step. The first commit creates the partial and registers it, then subsequent commits remove the duplicated styles one-by-one.

6. **No template changes.** All modifications are purely SCSS. No component templates, scripts, or logic were altered. The tag class names (`tag--class`, `tag--feature`, etc.) remain identical, so the HTML structure is untouched.

## Verdict

**CHANGES_REQUIRED**

The extraction is well-executed with one blocking issue: the CSS specificity regression in the player character sheet (H1) causes edge tags to lose their colored styling. This must be fixed before merge. The stale comment (M1) should also be updated in the same pass.

## Required Changes

| ID | Severity | File | Required Change |
|---|---|---|---|
| H1 | HIGH | `app/assets/scss/components/_player-character-sheet.scss` | Fix CSS specificity so tag variant colors from `_tags.scss` are visible within `.player-sheet`. Either add `.player-sheet .tag--variant` overrides or restructure `.player-sheet .tag` to avoid overriding colors. |
| M1 | MEDIUM | `app/assets/scss/components/_create-form-shared.scss` | Update comment on lines 64-65 to reference `_tags.scss` instead of claiming variants "remain in each component's scoped styles." |
