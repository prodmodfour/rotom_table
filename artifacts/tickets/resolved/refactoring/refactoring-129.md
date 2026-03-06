---
id: refactoring-129
title: "Design source-tracking for applied conditions to support source-dependent clearing"
priority: P3
severity: low
status: in-progress
domain: combat
source: decree-047
created_by: decree-facilitator
created_at: 2026-03-04
affected_files:
  - app/constants/statusConditions.ts
  - app/server/services/condition.service.ts
---

## Summary

Per decree-047, whether Other category conditions clear on faint should depend on **what applied them** (move, ability, terrain, etc.), not on a static per-condition flag. This requires tracking the source of each applied condition instance at runtime.

## Required Implementation

Design and implement a source-tracking mechanism for applied conditions:

1. **Source metadata:** When a condition is applied to a Pokemon, record what applied it (move name, ability, terrain, item, etc.)
2. **Source-based clearing rules:** Define which sources produce faint-clearable conditions vs. persistent ones
3. **Integration with faint logic:** The faint-clearing code checks the source of each Other condition to decide whether to clear it

This is a design task — requires a design spec before implementation begins.

## Notes

- decree-038 established per-condition behavior flags; this extends the principle to per-instance behavior based on source.
- Low priority — the RAW default (clearsOnFaint: false) is a safe interim. Source-dependent clearing is a future enhancement.

## Resolution Log

- **da23d460** — Design spec created: `artifacts/designs/design-condition-source-tracking-129/` (5 files: _index.md, shared-specs.md, spec-p0.md, spec-p1.md, testing-strategy.md). Full-scope design with P0 (data model + faint clearing) and P1 (UI + extended clearing) tiers.

### P0 Implementation (data model + source-aware faint clearing)
- **65d55a8f** — Add ConditionSourceType, ConditionInstance types to `combat.ts`; add `conditionInstances?` to Combatant in `encounter.ts`
- **dbec2fc8** — Create `conditionSourceRules.ts` with SOURCE_CLEARING_RULES, shouldClearOnFaint(), helper factories
- **d303c57f** — Seed conditionInstances from pre-existing entity conditions in buildCombatantFromEntity()
- **10452518** — Add optional ConditionSource parameter to updateStatusConditions(), sync conditionInstances on add/remove
- **c8bd0b60** — Replace static FAINT_CLEARED_CONDITIONS with source-aware shouldClearOnFaint() in applyFaintStatus()
- **2b68cff0** — Accept optional `source` in status.post.ts request body, validate and pass through
- **9c03190f** — Update FAINT_CLEARED_CONDITIONS comment to reflect source-dependent clearing

### P1 Implementation (UI display + extended clearing + edge cases)
- **3d3dfcd8** — Add formatConditionDisplay() and show source labels in GM view (CombatantConditionsSection)
- **50bcbc59** — Add shouldClearOnRecall(), shouldClearOnEncounterEnd() with extended SOURCE_CLEARING_RULES
- **e53491a1** — Source-aware recall clearing in applyRecallSideEffects(); update recall.post.ts and switch.post.ts callers
- **937fe056** — Source-aware encounter-end clearing in clearEncounterEndConditions() in end.post.ts
- **3b6d3722** — Remove Fainted from conditionInstances on revive in applyHealingToEntity()
- **ed89b94d** — Add Dead to conditionInstances with system source in damage.post.ts death path
