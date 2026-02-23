---
ticket_id: refactoring-070
priority: P4
status: open
category: CODE-HYGIENE
source: code-review-137 (M1)
created_at: 2026-02-23
created_by: slave-collector (plan-20260223-061421)
---

## Summary

Unused `props` variable assignment in `StatAllocationSection.vue`. The component changed `defineProps<Props>()` to `const props = defineProps<Props>()`, but `props` is never referenced — the template accesses prop values directly in `<script setup>`. This is a linter-flaggable unused variable.

## Affected Files

- `app/components/create/StatAllocationSection.vue` (line 93)

## Suggested Fix

Revert to `defineProps<Props>()` without the assignment.

## Impact

No runtime impact — linter cleanliness only.
