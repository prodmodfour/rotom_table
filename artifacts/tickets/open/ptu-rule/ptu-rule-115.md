---
id: ptu-rule-115
title: Remove Martial Artist from branching classes
priority: P2
severity: MEDIUM
status: open
domain: character-lifecycle
source: decree-026
created_at: 2026-02-27
---

# ptu-rule-115: Remove Martial Artist from branching classes

## Summary

Per decree-026, Martial Artist is `[Class]` only (PTU Core p.161) and should NOT be treated as a branching class. The current code incorrectly marks it as branching with wrong specialization values.

## Required Changes

1. **`app/constants/trainerClasses.ts`**:
   - Remove `isBranching: true` from the Martial Artist entry (line ~76)
   - Remove `'Martial Artist'` key from `BRANCHING_CLASS_SPECIALIZATIONS` (lines ~115-117)
   - Update comment at line ~102 to remove Martial Artist reference

2. **`decrees/decree-022.md`**:
   - Update preamble text (line 20) to remove Martial Artist from the branching classes list
   - Change: "Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist" → "Type Ace, Stat Ace, Style Expert, Researcher"

## Verification

- Martial Artist should behave like any other non-branching Fighter class
- The 4 remaining branching classes (Type Ace, Stat Ace, Style Expert, Researcher) should be unaffected
- Character creation UI should not show specialization picker for Martial Artist

## PTU Reference

PTU Core p.161: Martial Artist `[Class]` — no `[Branch]` tag.
