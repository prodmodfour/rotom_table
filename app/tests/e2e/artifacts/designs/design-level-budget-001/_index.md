---
design_id: design-level-budget-001
ticket_id: ptu-rule-060
category: FEATURE_GAP
scope: NEW_FEATURE
domain: scenes
status: p1-complete
dependencies:
  - ptu-rule-055  # Post-combat XP calculation (significance multiplier consumed here)
  - ptu-rule-058  # Density/significance conceptual mismatch (density reinterpretation)
affected_files:
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/scene/StartEncounterModal.vue
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/stores/encounter.ts
  - app/stores/encounterTables.ts
  - app/types/encounter.ts
  - app/types/habitat.ts
  - app/prisma/schema.prisma
new_files:
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/components/encounter/BudgetIndicator.vue
---


# Design: PTU Level-Budget Encounter Creation & Significance Multiplier

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Level Budget Calculation (P0), B. Budget Display in StartEncounterModal (P0) | [spec-p0.md](spec-p0.md) |
| P1 | C. Significance Multiplier on Encounters (P1) | [spec-p1.md](spec-p1.md) |
| P2 | D. Budget Validation Warnings (P2), E. Difficulty Presets (P2) | [spec-p2.md](spec-p2.md) |

## Summary

Implement the PTU encounter creation budget system: a level-budget formula (average Pokemon level * 2 * number of players) that guides the GM in building appropriately difficult encounters, paired with a significance multiplier (x1-x5) that scales XP rewards. The current density-based spawn system controls spawn count but has no connection to PTU's level-budget difficulty scaling or significance-based XP.

### PTU Rules Reference

**Basic Encounter Creation Guidelines** (core/11-running-the-game.md, page 473):
> "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."

**Significance Multiplier** (core/11-running-the-game.md, page 460):
> "The Significance Multiplier should range from x1 to about x5"
> - x1 to x1.5: Insignificant encounters (wild Pidgeys)
> - x2 to x3: Average everyday encounters
> - x4 to x5: Significant encounters (gym leaders, rivals, tournament finals)

**XP Calculation** (core/11-running-the-game.md, page 460):
> 1. Total the Level of enemy combatants defeated (Trainer levels count as double)
> 2. Multiply by Significance Multiplier
> 3. Divide by number of players gaining XP

**Example from rulebook** (page 473):
Three Level 10 Trainers, Pokemon around Level 20. Budget = 20 * 2 * 3 = 120 levels. GM creates six Level 20 Pokemon. With significance x2, each player gets 80 XP (enough to level a Pokemon once).

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Level budget calculation formula | NOT_IMPLEMENTED | No budget computation anywhere | **P0** |
| B | Budget display in encounter creation UI | NOT_IMPLEMENTED | GM has no budget guidance | **P0** |
| C | Significance multiplier on encounters | NOT_IMPLEMENTED | No significance field on Encounter model | **P1** |
| D | Significance-aware XP calculation | NOT_IMPLEMENTED | Depends on ptu-rule-055 (XP system) | **P1** |
| E | Budget validation warnings | NOT_IMPLEMENTED | No over/under-budget feedback | **P2** |
| F | Difficulty presets | NOT_IMPLEMENTED | No quick-select difficulty levels | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
