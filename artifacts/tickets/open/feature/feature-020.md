---
id: feature-020
title: Healing Item System
priority: P2
severity: MEDIUM
status: in-progress
design_spec: design-healing-items-001
domain: healing
source: matrix-gap (GAP-HEAL-2)
matrix_source: healing R039, R040, R041
created_by: master-planner
created_at: 2026-02-28
---

# feature-020: Healing Item System

## Summary

No item usage system exists for healing items. Potions, status cure items, and other consumables have no catalog, no application workflow, and no action economy tracking. 3 matrix rules (1 Partial, 2 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R039 | Basic Restorative Items | Partial — healing endpoints exist but no item catalog or application workflow |
| R040 | Status Cure Items | Missing — no cure item catalog or status removal workflow |
| R041 | Applying Items — Action Economy | Missing — no Standard Action enforcement for item use |

## PTU Rules

- Chapter 9: Items
- Potions: heal fixed HP amounts (Potion 20, Super Potion 35, Hyper Potion 70, Max Potion full)
- Status cures: Antidote (Poison), Burn Heal, Ice Heal, Parlyz Heal, Awakening, Full Heal
- Using an item: Standard Action in combat
- Trainer can use item on adjacent Pokemon (or self)

## Implementation Scope

FULL-scope feature requiring design spec. Needs item catalog, inventory tracking, and combat action integration.

## Design Spec

Design spec: `artifacts/designs/design-healing-items-001/`

| Tier | Scope |
|------|-------|
| P0 | Item catalog constants, apply-item service (HP restoration), API endpoint, store action, basic GM UI |
| P1 | Status cure items, revive items, Full Restore combined, repulsive items |
| P2 | Standard Action enforcement, target action forfeit, self-use Full-Round, adjacency requirement, inventory consumption |

## Resolution Log

- 2026-03-01: Design spec created (`design-healing-items-001`). Status set to design-complete.
- 2026-03-01: P0 implementation complete (6 commits):
  - `c0940d17` Section A: Healing item catalog constants (`app/constants/healingItems.ts`)
  - `10677a83` Section B: Healing item service (`app/server/services/healing-item.service.ts`)
  - `1f6bc2c4` Section C: Use-item API endpoint (`app/server/api/encounters/[id]/use-item.post.ts`)
  - `fa366600` Section D: Encounter store useItem action (`app/stores/encounter.ts`)
  - `3cbd84e2` Section E: useHealingItems composable (`app/composables/useHealingItems.ts`)
  - `4ecf6b19` Section E: UseItemModal component (`app/components/encounter/UseItemModal.vue`)
  - `ca6034d7` Section E: CombatantCard integration (Use Item button + modal wiring)
- 2026-03-02: code-review-267 CHANGES_REQUIRED (3H + 4M), rules-review-243 APPROVED.
- 2026-03-02: P0 fix cycle complete (5 commits, all 7 issues addressed):
  - `188a1257` H1: Remove double validation in use-item endpoint
  - `50e5a29d` H2+M1: Replace local getCombatantName with useCombatantDisplay, show effective maxHp in dropdown (decree-017)
  - `c5847923` H3+M2: Delete dead getApplicableItems stub, simplify validation ternary
  - `cae215af` M4: Replace hardcoded 3px gap with $spacing-xs in CombatantCard
  - `976d9bc6` M3: Add healing item system to app-surface.md
- 2026-03-02: code-review-271 APPROVED (0 issues). rules-review-247 APPROVED (0 issues).
- 2026-03-02: P1 implementation complete (6 commits):
  - `71b782aa` Section F: Add Awakening item to healing item catalog
  - `5539eb95` Sections F/G/H/I: P1 healing item service (resolveConditionsToCure, revive, combined, repulsive)
  - `1e15b3e9` Section F: Enable all P1 categories in use-item endpoint, sync stageModifiers
  - `7462947d` Section F-I: Category-aware getApplicableItems in useHealingItems composable
  - `0636470b` Section I/UI: UseItemModal grouped sections with repulsive badge
  - `b178d013` Tests: Comprehensive unit tests for cure resolution, revive HP, Full Restore
