---
ticket_id: refactoring-061
priority: P4
status: resolved
category: EXT-DUPLICATE
source: code-review-121 (M2)
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Several CSS blocks are duplicated identically across 2-4 character creation components: `.warning-item`, `.counter`, `.selected-tags`, `.tag`. All are scoped so there's no runtime conflict, but the duplication creates a maintenance burden — changing the tag style requires updating 4 files.

## Affected Files

- `app/components/create/ClassFeatureSection.vue`
- `app/components/create/EdgeSelectionSection.vue`
- `app/components/create/SkillBackgroundSection.vue`
- `app/components/create/StatAllocationSection.vue`

## Suggested Fix

Extract the shared CSS blocks into a SCSS partial (e.g., `app/assets/scss/components/_create-form-shared.scss`) and import it in each component's scoped style block. Follow the same pattern used for `_xp-distribution-modal.scss`.

## Impact

No runtime impact — pure maintenance improvement. Low priority.

## Resolution Log

### Approach
Created `app/assets/scss/components/_create-form-shared.scss` containing shared base styles for `.warning-item`, `.counter`, `.selected-tags`, and `.tag` (base + `__remove`). Registered the partial in `nuxt.config.ts` css array (not `additionalData`) to ensure access to global SCSS variables — avoids the build break from refactoring-083.

Component-specific variant modifiers (`.tag--class`, `.tag--feature`, `.tag--edge`, `.tag--skill-edge`, `.counter` extra margin/flex-shrink) remain in each component's scoped styles.

### Commits
- `8533c01` — Create `_create-form-shared.scss` partial
- `0e48a79` — Register partial in `nuxt.config.ts` css array
- `5a6ee19` — Remove duplicated CSS from `ClassFeatureSection.vue`
- `aacbf4b` — Remove duplicated CSS from `EdgeSelectionSection.vue`
- `e5118e0` — Remove duplicated CSS from `SkillBackgroundSection.vue`
- `0f7acde` — Remove duplicated CSS from `StatAllocationSection.vue`

### Files Changed
- `app/assets/scss/components/_create-form-shared.scss` (new, 89 lines)
- `app/nuxt.config.ts` (added to css array)
- `app/components/create/ClassFeatureSection.vue` (-59 lines)
- `app/components/create/EdgeSelectionSection.vue` (-57 lines)
- `app/components/create/SkillBackgroundSection.vue` (-17 lines)
- `app/components/create/StatAllocationSection.vue` (-17 lines)

Net reduction: 53 lines (89 added, 151 removed + config change)
