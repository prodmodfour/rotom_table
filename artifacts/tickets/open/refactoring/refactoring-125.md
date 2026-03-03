---
ticket_id: refactoring-125
title: "CombatantCard.vue exceeds 800-line file size limit (999 lines)"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: code-review-295 C1
created_by: slave-collector (plan-20260303-065350)
created_at: 2026-03-03
affected_files:
  - app/components/encounter/CombatantCard.vue
---

# refactoring-125: CombatantCard.vue exceeds 800-line file size limit (999 lines)

## Summary

CombatantCard.vue has grown to 999 lines after feature-017 P2 additions. It was already at 891 lines before P2. The capture section added ~108 lines (trainer selector, CapturePanel integration, capture-related computed properties, SCSS).

## Problem

The file contains multiple distinct concerns:
- Initiative list item rendering
- Damage/healing controls
- Status condition management
- Mount relationship display
- Capture workflow (trainer selector + CapturePanel)
- SCSS for all of the above

## Suggested Fix

Extract self-contained sections into sub-components:
1. **CombatantCaptureSection.vue** — trainer selector + CapturePanel (~60 lines reduction). This is part of the code-review-295 fix cycle.
2. **CombatantDamageControls.vue** — damage/heal buttons and modals (~80 lines reduction)
3. **CombatantStatusSection.vue** — status condition toggles (~50 lines reduction)

Extractions 2-3 are optional and can be done incrementally. Extraction 1 is required as part of the feature-017 P2 fix cycle.

## Notes

- The file was already over 800 lines before P2 (891 lines pre-P2)
- The P2 fix cycle (code-review-295 C1) will address the capture section extraction
- This ticket tracks the broader refactoring need beyond the fix cycle scope
