---
id: refactoring-095
title: "Guard addEdge() against Skill Edge string injection bypassing patheticSkills check"
priority: P4
severity: LOW
status: in-progress
domain: character-lifecycle
source: rules-review-188 MED-01
created_at: 2026-02-28
created_by: slave-collector (plan-20260228-020000)
---

# refactoring-095: Guard addEdge() against Skill Edge string injection

## Summary

The generic `addEdge()` function in `useCharacterCreation.ts` (line 268-270) is a raw string append with no validation. A user could type "Skill Edge: Athletics" into the text input field and it would be added to `form.edges` without checking if Athletics is in `patheticSkills`.

## Impact

LOW — the skill rank would NOT actually change (only `addSkillEdge()` modifies `form.skills`). The `validateSkillBackground()` validation warning would catch the orphaned edge entry. The string would appear in the edges list but have no mechanical effect. This is a data-naming inconsistency, not a game logic error.

## Suggested Fix

Either:
1. Add a check in `addEdge()` that rejects strings matching `^Skill Edge:` (forcing skill edges through the proper `addSkillEdge` path), OR
2. Accept as tolerable since the GM has final say and the validation layer catches it

## Affected Files

- `app/composables/useCharacterCreation.ts` — `addEdge()` function (line ~268)

## Resolution Log

Fix cycle addressing code-review-215 CHANGES_REQUIRED:

- `a922d48` fix: show error feedback when addEdge blocks Skill Edge string (MED-01)
  - `app/components/create/EdgeSelectionSection.vue` — addEdgeFn prop, error display, input preservation
  - `app/pages/gm/create.vue` — pass addEdgeFn prop instead of emit
- `8899e68` test: add addEdge guard unit tests (decree-027)
  - `app/tests/unit/composables/useCharacterCreation.test.ts` — blocks Skill Edge strings, allows normal edges
