---
ticket_id: refactoring-075
category: EXT-GOD
priority: P4
status: resolved
source: code-review-143 H1
created_by: slave-collector (plan-20260223-095000)
created_at: 2026-02-23T10:20:00Z
---

# refactoring-075: Extract CombatantConditionsSection from GMActionModal.vue

## Summary

GMActionModal.vue is 803 lines (exceeds 800-line project maximum). The file was 781 lines before feature-001 P0 added 22 lines for trainer sprite rendering. The status conditions section is a natural SRP extraction point.

## Affected Files

- `app/components/encounter/GMActionModal.vue` (803 lines → ~670 after extraction)
- `app/components/encounter/CombatantConditionsSection.vue` (new, ~130 lines)

## Suggested Fix

Extract the status conditions section into a standalone `CombatantConditionsSection.vue` component:
- Template: lines 151-223 (condition category groups, add/remove buttons)
- Script: lines 332-348 (condition-related logic)
- Styles: lines 756-801 (condition styling)

This moves approximately 130 lines out of GMActionModal.vue, bringing it under 700 lines and improving testability of condition management.

## Impact

- **Code health:** Reduces god component, improves SRP compliance
- **Testability:** Condition management can be tested in isolation
- **Extensibility:** Easier to add new condition types (e.g., from PTU supplements) without touching the modal

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-24 | Resolved | Extracted CombatantConditionsSection.vue (206 lines) from GMActionModal.vue (809 → 674 lines). Commit `b51ad5d`. |

### Commits

| Hash | Message |
|------|---------|
| `b51ad5d` | refactor: extract CombatantConditionsSection from GMActionModal.vue |

### Files Changed

- `app/components/encounter/GMActionModal.vue` — removed condition template/script/styles, replaced with `<CombatantConditionsSection>` usage
- `app/components/encounter/CombatantConditionsSection.vue` — new component with condition toggle, category lists, add/remove handlers, scoped styles
