---
ticket_id: ptu-rule-112
ticket_type: ptu-rule
priority: P3
status: in-progress
domain: vtt-grid
topic: naturewalk-terrain-flag-bypass
source: rules-review-162 M2
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/constants/naturewalk.ts
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
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

## Resolution Log

### Implementation (slave/5-developer-ptu-rule-112-20260227)

**Commits:**
- `d011884` feat: add Naturewalk terrain mapping constants
- `a30a2b2` feat: add Naturewalk extraction and bypass utilities
- `a61e3f4` feat: integrate Naturewalk bypass into movement cost calculation
- `381aadf` feat: bypass rough terrain accuracy penalty for Naturewalk

**Files changed:**
- `app/constants/naturewalk.ts` — NEW: PTU Naturewalk terrain names mapped to app terrain base types
- `app/utils/combatantCapabilities.ts` — getCombatantNaturewalks(), naturewalkBypassesTerrain() utilities
- `app/composables/useGridMovement.ts` — getTerrainCostForCombatant bypasses slow flag for matching Naturewalk
- `app/composables/useMoveCalculation.ts` — targetsThroughRoughTerrain bypasses painted rough for Naturewalk

**Decree compliance:**
- decree-003: Enemy-occupied rough terrain is NEVER bypassed by Naturewalk
- decree-010: Multi-tag flag system used for discrete rough/slow checks
- decree-025: Endpoint cells already excluded from rough terrain penalty

**Design decisions:**
- Naturewalk terrain names mapped to app base terrain types (NATUREWALK_TERRAIN_MAP)
- Multiple PTU terrain categories (Forest, Grassland, etc.) map to `normal` base type — known limitation since the terrain painter lacks PTU terrain categories
- Naturewalk data sourced from both capabilities.naturewalk (direct) and capabilities.otherCapabilities (parsed)
- Pathfinding automatically benefits via the combatant-bound terrain cost getter callback
