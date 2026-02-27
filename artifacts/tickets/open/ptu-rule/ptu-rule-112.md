---
ticket_id: ptu-rule-112
ticket_type: ptu-rule
priority: P3
status: open
domain: vtt-grid
topic: naturewalk-terrain-flag-bypass
source: rules-review-162 M2
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/stores/terrain.ts
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
---

## Summary

Pokemon with Naturewalk capabilities should treat listed terrains as Basic Terrain, bypassing rough/slow penalties. The movement system does not check Naturewalk capabilities.

## PTU Rule

PTU p.209: "Pokemon with Naturewalk treat all listed terrains as Basic Terrain."
Errata p.479-480: Clarifications on Naturewalk for specific terrain types (Forest, Grassland, etc.)

## Current Behavior

Movement cost calculation in `getMovementCost` and pathfinding do not check the moving combatant's Naturewalk capabilities. All Pokemon pay the same terrain costs regardless of their abilities.

## Required Behavior

1. Check the moving combatant's Naturewalk capabilities (from ability data)
2. If the combatant has a relevant Naturewalk, bypass the slow flag cost doubling and rough accuracy penalty for matching terrain types
3. This requires mapping terrain painter base types to PTU terrain categories that Naturewalk references

## Notes

- Pre-existing limitation, tracked as R017 in VTT grid matrix
- The multi-tag refactoring makes future implementation easier (flags are discrete and checkable)
- Needs Naturewalk data from ability/species data to be available at movement calculation time
