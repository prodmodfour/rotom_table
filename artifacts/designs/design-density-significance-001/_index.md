---
design_id: design-density-significance-001
ticket_id: ptu-rule-058
category: PTU_INCORRECT
scope: FULL
domain: encounter-tables
status: p2-implemented
dependencies:
  - ptu-rule-055 (XP calculation system)
  - ptu-rule-060 (level-budget encounter creation)
affected_files:
  - app/types/habitat.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/server/api/encounters/[id]/significance.put.ts (new)
  - app/server/api/encounters/[id]/xp.get.ts (new)
  - app/utils/xpCalculation.ts (new)
  - app/stores/encounterTables.ts
  - app/stores/encounter.ts
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/encounter/SignificancePanel.vue (new)
  - app/components/encounter/EnvironmentSelector.vue (new, P2)
  - app/constants/environmentPresets.ts (new, P2)
  - app/server/api/encounters/[id]/environment-preset.put.ts (new, P2)
  - app/server/services/encounter.service.ts
  - app/utils/damageCalculation.ts
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/MoveTargetModal.vue
  - app/components/habitat/EncounterTableCard.vue
  - app/components/habitat/EncounterTableModal.vue
  - app/stores/terrain.ts
---


# Design: Density/Significance Separation and Environmental Modifiers

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Separate Density from Spawn Count (P0) | [spec-p0.md](spec-p0.md) |
| P1 | B. Significance Multiplier and XP Calculation (P1) | [spec-p1.md](spec-p1.md) |
| P2 | C. Environmental Modifier Framework (P2) | [spec-p2.md](spec-p2.md) |

## Summary

The current encounter table system conflates PTU "density" (a population flavor concept) with spawn count, and uses `densityMultiplier` on sub-habitat modifications as a spawn-count scaler. In PTU, encounter significance (x1 to x5+) is a post-combat XP multiplier determined by narrative importance and challenge level -- it does not control how many Pokemon spawn. Spawn count is determined by the GM's level budget and encounter design goals.

Additionally, the VTT terrain/fog systems are generic tactical tools (movement cost, visibility) that do not implement PTU-specific environmental modifier mechanics (darkness accuracy penalties, ice weight-class rules, hazard factory interactivity).

This design separates density from spawn count, introduces a significance multiplier for XP calculation, and plans environmental modifier integration for future PTU-specific terrain effects.

---

## Problem Analysis

### Problem 1: Density = Spawn Count (Incorrect)

**Current behavior:** `DensityTier` (`sparse | moderate | dense | abundant`) maps directly to `DENSITY_RANGES` spawn count ranges. The `densityMultiplier` on `TableModification` scales those ranges. The generate endpoint (`generate.post.ts:101-118`) computes `count` from density.

**PTU reality:** PTU does not define density tiers that map to spawn counts. Encounter size (number of enemies) is determined by the GM's **level budget** (R006: avg Pokemon level x 2 x number of trainers = total levels to distribute). The GM decides how to split that budget -- six L20 enemies vs two L40 + four L25 enemies. "Dense" and "sparse" are habitat flavor descriptors, not spawn formulas.

**Mapping:**
| Current Concept | PTU Concept | Correct Mapping |
|---|---|---|
| `DensityTier` | Habitat population flavor | Informational label on habitat, no mechanical effect |
| `DENSITY_RANGES` | No PTU equivalent | Replace with explicit spawn count input |
| `densityMultiplier` | No PTU equivalent (conflated with R009 difficulty modifier) | Remove; spawn count is an independent input |
| (missing) Significance Multiplier | R008: x1-x5+ XP multiplier | New field on Encounter |
| (missing) Difficulty Modifier | R009: +/- x0.5-x1.5 applied to significance | Folds into significance multiplier |

### Problem 2: No Significance Multiplier or XP System

**Current behavior:** The `Encounter` type has `defeatedEnemies: { species: string; level: number }[]` but no significance field and no XP calculation. The GM manually enters XP on each Pokemon.

**PTU formula (R005):**
1. Sum defeated enemy levels (trainers count as 2x their level)
2. Multiply by significance multiplier (x1 to x5+)
3. Divide by number of players
4. Result = XP per player (player distributes among their Pokemon)

### Problem 3: VTT Terrain is Generic, Not PTU-Specific

**Current behavior:** The terrain store defines 6 types (`normal`, `difficult`, `blocking`, `water`, `earth`, `rough`, `hazard`, `elevated`) with movement cost multipliers. These are generic tactical grid tools.

**PTU environmental modifiers (R025):** PTU describes specific mechanical effects tied to environments:
- Dark caves: -2 accuracy/perception per unilluminated meter
- Arctic: weight class 5+ breaks ice, slow terrain, acrobatics checks on injury
- Hazard factories: interactive machinery elements

The VTT terrain system is a valid foundation -- the problem is not that it exists, but that it lacks the connection to PTU-specific mechanical effects. This is a P2 enhancement, not a P0 bug.

---

## Priority Map

| # | Change | Current Status | Gap | Priority |
|---|--------|---------------|-----|----------|
| A | Separate density from spawn count | Density drives spawn count | Density should be informational; spawn count should be independent | **P0** |
| B | Explicit spawn count on generation | Derived from density | GM provides spawn count directly (or uses level-budget suggestion) | **P0** |
| C | Rename/repurpose densityMultiplier | Scales spawn count | Remove spawn-count scaling; field becomes composition modifier or is removed | **P0** |
| D | Add significance multiplier field to Encounter | Missing entirely | New field: x1.0 to x5.0+ (GM-set) | **P1** |
| E | XP calculation utility + endpoint | No XP calculation | Pure function + API (depends on ptu-rule-055) | **P1** |
| F | Significance panel in encounter UI | No UI for significance | Panel showing significance, base XP, final XP per player | **P1** |
| G | Environmental modifier framework | Generic terrain only | PTU-specific terrain effect rules (accuracy, weight-class, etc.) | **P2** |
| H | Level-budget encounter helper | No budget calculator | Suggest spawn count/levels from player party data (depends on ptu-rule-060) | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
- [implementation-log.md](implementation-log.md)
