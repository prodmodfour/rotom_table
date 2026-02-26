---
ticket_id: refactoring-002
ticket_type: refactoring
priority: P3
status: open
domain: vtt-grid
topic: deprecate-legacy-terrain-types
source: code-review-185 HIGH-2
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/types/spatial.ts
  - app/stores/terrain.ts
---

## Summary

Legacy terrain types `'difficult'` and `'rough'` are still valid values in the `TerrainType` union and `TERRAIN_COSTS` map. While `migrateLegacyCell` converts them on import, nothing prevents `setTerrain()` from being called with these types directly, creating inconsistent behavior.

## Problem

If code calls `terrainStore.setTerrain(x, y, 'difficult')`:
- Cell gets `type: 'difficult'` and `flags: { rough: false, slow: false }`
- `getMovementCost` returns 2 (from `TERRAIN_COSTS['difficult']`) — correct for legacy
- But rendering shows legacy brown color without slow flag overlay — inconsistent
- The multi-tag model expects cost to come from the `slow` flag, not the base type

## Suggested Fix

Option A (preferred): Add runtime conversion in `setTerrain` — if type is `'difficult'` or `'rough'`, convert to `'normal'` + appropriate flags (same logic as `migrateLegacyCell`).

Option B: Narrow the `TerrainType` union for non-import contexts by splitting into `LegacyTerrainType` and `ActiveTerrainType`.

## Notes

- TerrainPainter UI already excludes these types from the selector
- This is a latent bug risk, not user-facing yet
