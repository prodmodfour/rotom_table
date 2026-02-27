---
id: decree-need-022
title: Branch class handling — duplicate entries vs specialization suffix
priority: P3
status: addressed
decree_id: decree-022
domain: character-lifecycle
source: character-lifecycle-audit.md (R035)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# decree-need-022: Branch class handling

## The Ambiguity

PTU allows `[Branch]` classes (Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist) to be taken multiple times with different specializations. The codebase currently blocks duplicate class names entirely. Two valid implementation approaches exist:

**Option A: Allow duplicate class names for branching classes**
- Skip the duplicate check when `isBranching` is true
- Store multiple "Type Ace" entries in the array
- Simpler code change, but UI must disambiguate (e.g., show specialization inline)

**Option B: Require specialization suffix**
- Store as "Type Ace: Fire", "Type Ace: Water" — naturally unique
- Duplicate check passes because names differ
- Cleaner data model, but requires UI for specialization selection

## Ruling Needed

Which approach should the app use for branching trainer classes?

## Related Tickets

- ptu-rule-091 (blocked by this decree)
