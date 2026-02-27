---
id: ptu-rule-091
title: Branch class blocked by duplicate check
priority: P3
severity: MEDIUM
status: open
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
