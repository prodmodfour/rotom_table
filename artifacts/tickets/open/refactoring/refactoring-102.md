---
ticket_id: refactoring-102
category: EXT-DUPLICATE
priority: P4
severity: LOW
status: open
domain: pokemon-lifecycle
source: code-review-231 M2
created_by: slave-collector (plan-20260228-233710)
created_at: 2026-03-01
---

# Extract EvolutionSelectionModal from duplicated branching evolution UI

## Summary

The branching evolution selection modal (template + script logic) is duplicated verbatim between two locations. ~90 lines of template + ~50 lines of script duplicated in each. Should be extracted to a shared `EvolutionSelectionModal.vue` component.

## Affected Files

- `app/pages/gm/pokemon/[id].vue` (lines 145-187 template, 313-342 script)
- `app/components/encounter/XpDistributionResults.vue` (lines 36-75 template, 136-182 script)

## Suggested Fix

Create `app/components/pokemon/EvolutionSelectionModal.vue` that accepts evolution options as props and emits a `selected` event. Both locations import and use it.

## Impact

Code hygiene, maintainability. Any future fix to the branching evolution UI would need to be applied in two places without this extraction.
