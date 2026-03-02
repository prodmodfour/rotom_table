---
design_id: design-healing-items-001
ticket_id: feature-020
category: FEATURE
scope: FULL
domain: healing
status: p1-implemented
decrees:
  - decree-017
  - decree-029
matrix_source:
  - healing-R039
  - healing-R040
  - healing-R041
affected_files:
  - app/constants/healingItems.ts
  - app/server/services/combatant.service.ts
  - app/server/services/entity-update.service.ts
  - app/stores/encounter.ts
  - app/types/character.ts
  - app/types/encounter.ts
  - app/components/encounter/UseItemModal.vue
new_files:
  - app/constants/healingItems.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/services/healing-item.service.ts
  - app/composables/useHealingItems.ts
  - app/components/encounter/UseItemModal.vue
  - app/tests/unit/services/healing-item.service.test.ts
---

# Design: Healing Item System

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Healing Item Catalog Constants, B. Apply-Item Service (HP Restoration), C. Apply-Item API Endpoint, D. Encounter Store Action, E. Basic GM UI (UseItemModal) | [spec-p0.md](spec-p0.md) |
| P1 | F. Status Cure Items, G. Revive Items, H. Full Restore (Combined), I. Repulsive Items | [spec-p1.md](spec-p1.md) |
| P2 | J. Standard Action Enforcement, K. Target Forfeits Actions, L. Self-Use as Full-Round Action, M. Adjacency Requirement, N. Inventory Consumption | [spec-p2.md](spec-p2.md) |

## Summary

Implement the full PTU healing item system from Chapter 9 (Gear and Items, p.276). Currently, the app has manual HP healing via the encounter heal endpoint, but no item catalog, no item-specific application workflow, and no action economy enforcement for item use. This design covers 3 matrix rules:

| Rule | Title | Current Status | Target |
|------|-------|---------------|--------|
| R039 | Basic Restorative Items | Partial -- healing endpoints exist but no item catalog or structured workflow | Full item catalog with per-item HP amounts, apply-item endpoint |
| R040 | Status Cure Items | Missing -- no cure item catalog or status removal via items | Item-based status cure with integration to existing status condition system |
| R041 | Applying Items -- Action Economy | Missing -- no Standard Action enforcement for item use | Standard Action cost, target forfeits next Standard+Shift, adjacency check |

## Related Decrees

- **decree-017**: Pokemon Center heals to effective max HP respecting injury cap. Relevant because Potion healing is also capped at injury-reduced effective max HP.
- **decree-029**: Rest healing has minimum of 1 HP. NOT applied to items -- items heal exact PTU amounts (Potion = 20, etc.) without minimum floors.

## PTU Rules Reference

PTU Core p.276 (Using Items):
- Applying Restorative Items or X Items is a **Standard Action**
- The target **forfeits their next Standard Action and Shift Action** unless the user has the "Medic Training" Edge
- Target may refuse (item not consumed, no action forfeit)
- Using a Restorative Item on yourself is a **Full-Round Action** but does not forfeit further actions
- Items work on both Pokemon and Humans (trainers)

PTU Core p.276 (Basic Restoratives table):
- Potion: 20 HP, $200
- Super Potion: 35 HP, $380
- Hyper Potion: 70 HP, $800
- Antidote: Cures Poison, $200
- Paralyze Heal: Cures Paralysis, $200
- Burn Heal: Cures Burns, $200
- Ice Heal: Cures Freezing, $200
- Full Heal: Cures all Persistent Status Afflictions, $450
- Full Restore: Heals 80 HP + cures all Status Afflictions, $1450
- Revive: Revives fainted Pokemon, sets to 20 HP, $300
- Energy Powder: 25 HP (Repulsive), $150
- Energy Root: 70 HP (Repulsive), $500
- Heal Powder: Cures all Persistent Status (Repulsive), $350
- Revival Herb: Revives fainted Pokemon, sets to 50% HP (Repulsive), $350

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Healing item catalog constants | NOT_IMPLEMENTED | No item definitions | **P0** |
| B | Apply-item service (HP restoration) | NOT_IMPLEMENTED | No item-based healing service | **P0** |
| C | Apply-item API endpoint | NOT_IMPLEMENTED | No item application endpoint | **P0** |
| D | Encounter store action | NOT_IMPLEMENTED | No store action for item use | **P0** |
| E | Basic GM UI (UseItemModal) | NOT_IMPLEMENTED | No item selection/application UI | **P0** |
| F | Status cure items | NOT_IMPLEMENTED | No item-based status removal | **P1** |
| G | Revive items | NOT_IMPLEMENTED | No revive from Fainted via items | **P1** |
| H | Full Restore (combined HP + status) | NOT_IMPLEMENTED | No combined heal+cure item | **P1** |
| I | Repulsive items (loyalty penalty) | NOT_IMPLEMENTED | No repulsive flag or loyalty tracking | **P1** |
| J | Standard Action enforcement | NOT_IMPLEMENTED | No action cost for item use | **P2** |
| K | Target forfeits actions | NOT_IMPLEMENTED | No action forfeit on heal target | **P2** |
| L | Self-use as Full-Round Action | NOT_IMPLEMENTED | No full-round action variant | **P2** |
| M | Adjacency requirement | NOT_IMPLEMENTED | No range check for item use | **P2** |
| N | Inventory consumption | NOT_IMPLEMENTED | No inventory tracking for items | **P2** |

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
