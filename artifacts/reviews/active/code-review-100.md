---
review_id: code-review-100
target: refactoring-032
trigger: orchestrator-routed
reviewed_commits:
  - 9bce538
  - abfe751
  - 3a3d093
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

# Code Review: refactoring-032 — Extract shared SCSS partials (EXT-DUPLICATE)

## Scope

Three commits extracting duplicated SCSS into shared partials:

1. **9bce538** — Extract `type-color-modifiers` mixin in `_pokemon-sheet.scss`; replace hardcoded hex in `PlayerLobbyView.vue` and `CombatantDetailsPanel.vue`
2. **abfe751** — Create `_modal.scss` with 6 mixins; replace modal/btn-icon SCSS across 15 files
3. **3a3d093** — Create `_sheet.scss` with 9 mixins; replace sheet styles in `pokemon/[id].vue` and `characters/[id].vue`

20 files changed, ~600 lines removed, ~265 lines of shared mixins added.

## Findings

### ISSUE-1: CRITICAL — encounters.vue lost `h2` header styling

**File:** `app/pages/gm/encounters.vue`

The `modal-container-base` mixin defines `h3 { margin: 0; color: $color-text; }` inside `&__header`, but `encounters.vue` uses `<h2>` in all three of its modal headers (Create/Edit Template, Load Template, Delete Template). The original inline styles had:

```scss
&__header {
  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: $color-text;
  }
}
```

Post-refactor, the file only has `@include modal-container-base; background: $color-bg-primary; width: 90%;` with no local `h2` override. The `<h2>` elements will render with default browser margins and sizing.

Other files using `<h2>` (`LoadTemplateModal.vue`, `SaveTemplateModal.vue`) correctly retained local `h2` overrides. `encounters.vue` was missed.

**Fix:** Add the `h2` override to `encounters.vue`:
```scss
.modal {
  @include modal-container-base;
  background: $color-bg-primary;
  width: 90%;

  &__header {
    h2 {
      margin: 0;
      font-size: 1.25rem;
      color: $color-text;
    }
  }
}
```

Alternatively, update `modal-container-base` to style both `h2` and `h3`, which would also eliminate the local overrides in `LoadTemplateModal.vue` and `SaveTemplateModal.vue`.

### ISSUE-2: HIGH — ModificationCard.vue lost `h3` font-size override

**File:** `app/components/encounter-table/ModificationCard.vue`

The original inline styles had `h3 { margin: 0; color: $color-text; font-size: 1rem; }` in `&__header`. The mixin provides `margin: 0` and `color: $color-text` but not `font-size: 1rem`. Browser default `h3` size is typically `1.17em`, so the heading text will render slightly larger than intended.

**Fix:** Add a local override in `ModificationCard.vue`:
```scss
.modal {
  @include modal-container-base;
  max-width: 450px;

  &__header h3 {
    font-size: 1rem;
  }
}
```

### ISSUE-3: Ticket — encounters.vue overflow model changed

**File:** `app/pages/gm/encounters.vue`

The original `.modal` had `overflow: auto` (block layout, entire modal scrolls). The mixin provides `overflow: hidden; display: flex; flex-direction: column;` (flex layout, only `&__body` scrolls via `overflow-y: auto`). This changes the scrolling behavior.

In practice the flex model is the better pattern for modals. However, this is a behavioral change, not a pure refactoring. Since the encounters.vue modals are small (form + two buttons), overflow is unlikely to trigger, so the risk is low. **File a ticket** to audit all modals for consistent overflow handling rather than blocking this PR.

### ISSUE-4: Ticket — Enhanced modal mixins defined but unused

**Files:** `app/assets/scss/_modal.scss` lines 21-31 (`modal-overlay-enhanced`) and lines 87-127 (`modal-container-enhanced`)

Two of the six mixins in `_modal.scss` are dead code -- defined but never `@include`d. Meanwhile, three files (`CharacterModal.vue`, `GMActionModal.vue`, `AddCombatantModal.vue`) still inline the exact enhanced modal pattern these mixins were designed to replace.

This is not a blocker for this PR -- the "base" modal pattern was the primary deduplication target. **File a ticket** to migrate the enhanced modal consumers to use the mixins.

## What Went Well

1. **Type color extraction (9bce538)** is clean. The `type-color-modifiers` mixin correctly separates color definitions from badge styling, and `pokemon-sheet-type-badge` now composes via `@include type-color-modifiers`. Status condition colors in `CombatantDetailsPanel.vue` correctly map to `$type-*` variables (all hex values verified to match).

2. **Mixin API design** is well-structured. The base/enhanced split in `_modal.scss` and the granular sheet mixins in `_sheet.scss` provide good composability. Components can `@include` the base and override individual properties (padding, max-width, background) without fighting the mixin.

3. **`btn-icon-img` parameterized size** (`$size: 16px` default, `14px` for VTTContainer, `18px` for gm.vue) is a clean pattern for the icon size variants.

4. **`nuxt.config.ts` auto-import chain** correctly adds both new partials via `@use ... as *`, making mixins available globally without per-file imports.

5. **Resolution log** is comprehensive with per-finding file lists and accurate counts.

6. **Net line reduction** is significant (~600 lines removed for ~265 lines of shared mixins), with clear deduplication wins across 15+ consumer files.

## Verdict

**CHANGES_REQUIRED**

ISSUE-1 (encounters.vue `h2` styling lost) and ISSUE-2 (ModificationCard.vue `h3` font-size lost) are visual regressions that must be fixed before merge. ISSUE-3 and ISSUE-4 should be filed as follow-up tickets.
