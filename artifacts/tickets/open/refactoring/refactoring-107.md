---
ticket_id: refactoring-107
category: EXT-DUPLICATE
priority: P4
severity: LOW
domain: character-lifecycle
source: code-review-239 M1
created_by: slave-collector (plan-20260301-110550)
created_at: 2026-03-01
---

# refactoring-107: Extract duplicated SCSS from level-up P1 components

## Summary

Four level-up P1 components duplicate approximately 40-50 lines of SCSS each for `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--sm` styles. Additionally, `.counter`, `.tag`, `.selected-tags` patterns are duplicated across three of the four components.

## Affected Files

- `app/components/levelup/LevelUpEdgeSection.vue` (lines 505-548)
- `app/components/levelup/LevelUpFeatureSection.vue` (lines 249-276)
- `app/components/levelup/LevelUpClassSection.vue` (lines 467-505)
- `app/components/levelup/LevelUpModal.vue` (lines 412-448)

## Suggested Fix

Extract shared `.btn` styles into a SCSS partial (e.g., `_level-up-shared.scss`) or use existing global button/tag classes. Similarly extract `.counter`, `.tag`, and `.selected-tags` into shared styles.

## Impact

Maintenance burden — if button or tag styling needs to change, 4 files must be updated. No functional impact.
