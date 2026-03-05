---
design_id: design-condition-source-tracking-129
ticket_id: refactoring-129
category: REFACTORING
scope: FULL
domain: combat
status: complete
decrees:
  - decree-038
  - decree-047
  - decree-005
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/types/character.ts
  - app/constants/statusConditions.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/server/services/switching.service.ts
  - app/server/services/healing-item.service.ts
  - app/server/services/entity-update.service.ts
  - app/prisma/schema.prisma
new_files:
  - app/constants/conditionSourceRules.ts
---

# Design: Source-Tracking for Applied Conditions

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. ConditionSource type + ConditionInstance model, B. Dual-format storage (statusConditions backward compat), C. Source-aware faint clearing, D. Migration of all condition application paths | [spec-p0.md](spec-p0.md) |
| P1 | E. UI display of condition sources, F. Source-based encounter-end / recall / breather clearing, G. Source-dependent clearing rule expansion | [spec-p1.md](spec-p1.md) |

## Summary

Per decree-047, whether an Other category condition (Stuck, Slowed, Trapped, Tripped, Vulnerable) clears on faint should depend on what applied it (move, ability, terrain, item, etc.), not on a static per-condition flag. The current system stores conditions as a flat `StatusCondition[]` string array with no source metadata. This design adds source tracking to each applied condition instance so that clearing logic can consult the source.

**What is already implemented** (NOT in scope):
- Per-condition behavior flags (clearsOnRecall, clearsOnEncounterEnd, clearsOnFaint) per decree-038
- Static `clearsOnFaint: false` for all Other conditions per decree-047 interim behavior
- CS auto-apply with source tracking (StageSource[]) per decree-005
- Type-based status immunity enforcement per decree-012

**What this design adds:**
- **P0:** Runtime source metadata on each applied condition instance; source-aware faint clearing for Other conditions; backward-compatible dual storage
- **P1:** UI display of condition sources in GM view; source-based clearing for encounter-end/recall/breather; extensible source-to-clearing-rule mapping

---

## PTU Rules Reference

### Faint Clearing (PTU p.248)
"When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."

Other conditions are **not** mentioned. Per decree-047:
- Other conditions do NOT clear on faint by default
- Whether an Other condition clears on faint is **source-dependent**
- Move-inflicted Other conditions SHOULD clear (the move effect is over)
- Terrain-based Other conditions should NOT clear (the terrain persists)
- Ability-based Other conditions depend on the ability's duration semantics

### Decree Compliance

- **decree-038:** Condition behaviors decoupled from categories. This design extends the decoupling: for Other conditions, even per-condition flags are insufficient; per-instance source determines behavior.
- **decree-047:** The motivating decree. Establishes source-dependent clearing as the correct model. Interim `clearsOnFaint: false` is the RAW-safe default until source tracking exists.
- **decree-005:** Existing CS source tracking (StageSource[]) provides a pattern. This design uses a similar per-instance source annotation approach.

---

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | ConditionSource type definition | NOT_IMPLEMENTED | No source metadata model | **P0** |
| B | ConditionInstance model | NOT_IMPLEMENTED | Conditions stored as bare strings | **P0** |
| C | Dual-format storage (backward compat) | NOT_IMPLEMENTED | All consumers expect string[] | **P0** |
| D | Source-aware faint clearing | NOT_IMPLEMENTED | Static clearsOnFaint flags only | **P0** |
| E | Migrate status.post.ts | NOT_IMPLEMENTED | No source passed on apply | **P0** |
| F | Migrate damage.post.ts faint path | NOT_IMPLEMENTED | Uses flat FAINT_CLEARED_CONDITIONS | **P0** |
| G | Migrate all other condition application paths | NOT_IMPLEMENTED | 5+ endpoints create conditions | **P0** |
| H | UI display of condition sources | NOT_IMPLEMENTED | UI shows condition names only | **P1** |
| I | Source-based recall/encounter-end clearing | NOT_IMPLEMENTED | Uses static flags only | **P1** |
| J | Extensible source-to-rule mapping | NOT_IMPLEMENTED | No clearing rule lookup | **P1** |

---

## Architecture Overview

```
conditionSourceRules.ts (NEW)
+-- ConditionSource type (discriminated union)
+-- SOURCE_CLEARING_RULES: source -> { clearsOnFaint, clearsOnRecall, ... }
+-- getSourceClearingBehavior(source) -> clearing flags
+-- Default rule: unknown sources use static condition def flags

combat.ts (MODIFIED)
+-- ConditionInstance interface (condition + source + appliedAt)

combatant.service.ts (MODIFIED)
+-- applyFaintStatus(): consult per-instance source for Other conditions
+-- updateStatusConditions(): accept optional source parameter
+-- New helpers: addConditionInstance(), removeConditionInstance()

status.post.ts (MODIFIED)
+-- Accept optional `source` in request body
+-- Pass source through to updateStatusConditions()

Entity storage (MODIFIED)
+-- statusConditions remains StatusCondition[] for DB and backward compat
+-- conditionInstances: ConditionInstance[] added to Combatant (combat-scoped)
+-- On encounter entry: seed conditionInstances from statusConditions with 'unknown' source
```

---

## Key Design Decisions

### Decision 1: Combatant-scoped ConditionInstance[] vs DB-level change

**Decision: Store ConditionInstance[] on Combatant only (combat-scoped). Entity DB records keep flat StatusCondition[].**

**Rationale:**
- Source tracking matters primarily during combat (faint clearing, recall, breather)
- Outside combat, conditions are managed by the GM directly and source is irrelevant
- Avoids a schema migration or JSON format change on Pokemon/HumanCharacter DB rows
- Matches the pattern of stageSources[] (combat-scoped, on Combatant, not on entity)
- When a Pokemon enters combat, existing conditions get source='unknown' (safe default)

### Decision 2: Dual-format backward compatibility

**Decision: Keep entity.statusConditions as the canonical string array. Combatant.conditionInstances is the enriched view.**

**Rationale:**
- 31+ files reference `entity.statusConditions` as `StatusCondition[]`
- Rewriting all consumers to use ConditionInstance[] would be a massive change with high regression risk
- Instead, conditionInstances is the authoritative source during combat, and is synced back to the flat array for persistence
- Helper functions keep both in sync: adding a ConditionInstance also pushes to statusConditions

### Decision 3: Source-to-clearing-rule mapping

**Decision: Centralized SOURCE_CLEARING_RULES constant maps source types to clearing behavior overrides.**

**Rationale:**
- Per decree-047: "move-inflicted Stuck should clear on faint, terrain-based Stuck should not"
- The mapping is the single place to define these rules
- For Persistent/Volatile conditions, source doesn't matter (they always clear on faint per RAW)
- For Other conditions, source overrides the static `clearsOnFaint: false` default

---

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [testing-strategy.md](testing-strategy.md)
