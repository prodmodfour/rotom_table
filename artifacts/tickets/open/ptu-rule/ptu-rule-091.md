---
id: ptu-rule-091
title: Branch class blocked by duplicate check
priority: P3
severity: MEDIUM
status: in-progress
domain: character-lifecycle
source: character-lifecycle-audit.md (R035)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-091: Branch class blocked by duplicate check

## Summary

The `addClass` function in `useCharacterCreation.ts:183` blocks adding the same class name twice (`if (form.trainerClasses.includes(className)) return`). This prevents branching classes (Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist) from being taken multiple times with different specializations, which PTU explicitly allows via the `[Branch]` tag. The `isBranching` flag exists in `trainerClasses.ts` but is dead code.

## Affected Files

- `app/composables/useCharacterCreation.ts` (line 183, `addClass` function)
- `app/constants/trainerClasses.ts` (`isBranching` flag)

## PTU Rule Reference

`[Branch]` tag: "This Feature may be taken multiple times, each time with a different specialization."

## Suggested Fix

Requires decree-need-022 to determine implementation approach (see decree ticket). Two options: (a) skip duplicate check when `isBranching` is true, (b) require specialization suffix (e.g., "Type Ace: Fire") so names are naturally unique.

## Impact

Players cannot take branching classes multiple times with different specializations during character creation.

## Resolution Log

Implementation follows decree-022: specialization suffix approach (e.g., 'Type Ace: Fire').

### Commits

- `69f53a0` feat: add branching class specialization constants and helpers
  - `app/constants/trainerClasses.ts` — Added `BRANCHING_CLASS_SPECIALIZATIONS` with valid options per class, `getBranchingSpecializations()`, `hasBaseClass()`, `getBaseClassName()`, `getSpecialization()` helpers
- `572f99f` fix: allow branching classes with different specializations in addClass
  - `app/composables/useCharacterCreation.ts` — Updated duplicate check to block exact duplicates only (not different specializations). Added `countClassInstances()` helper.
- `ef9b512` feat: add specialization selection dropdown for branching classes
  - `app/components/create/ClassFeatureSection.vue` — Replaced free-text input with select dropdown. Fixed toggle behavior so branching classes always open picker. Added `isClassDisabled()` and `availableSpecializations` computed.
- `57c0aee` chore: remove unused getBaseClassName import from useCharacterCreation

### Files Changed

- `app/constants/trainerClasses.ts` — specialization data + helper functions
- `app/composables/useCharacterCreation.ts` — addClass fix + countClassInstances
- `app/components/create/ClassFeatureSection.vue` — UI specialization picker

### Verification Approach

No existing class lookup code in the server or display components required changes for prefix matching — all display code simply renders the stored string array, and server code only does JSON serialize/deserialize. The `ClassFeatureSection.vue` was the only component performing class name matching, and it already had partial `startsWith` logic that was extended.
